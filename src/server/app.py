import json
import os
from pathlib import Path
from typing import List, Optional

import torch
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from transformers import AutoTokenizer

from src.model.architecture import BDHClassifier, BDHConfig
from src.inference.chunking import text_to_chunks
from src.inference.activations import extract_sparse_activations, extract_per_layer_activations
from src.inference.concepts import ConceptMapper
from src.inference.data import load_jsonl, get_full_text, get_silver_paragraphs


CHECKPOINT_PATH = os.environ.get("BDH_CHECKPOINT", "./best_model (1).pt")
COACTIVATION_PATH = os.environ.get("BDH_COACT", "./data/coactivation_raw.json")
OCCURRENCE_PATH = os.environ.get("BDH_OCCUR", "./data/concept_occurrence.json")
DATA_ROOT = os.environ.get("DATA_ROOT", ".")
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

LABEL2IDX = {"10": 0, "2": 1, "3": 2, "5": 3, "6": 4, "8": 5, "P1-1": 6}
IDX2LABEL = {v: k for k, v in LABEL2IDX.items()}
ARTICLE_NAMES = {
    "2": "Right to Life",
    "3": "Prohibition of Torture",
    "5": "Right to Liberty",
    "6": "Right to Fair Trial",
    "8": "Right to Private Life",
    "10": "Freedom of Expression",
    "P1-1": "Protection of Property",
}

app = FastAPI(title="BDH ECHR Interpretability API", version="1.0.0")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)


@app.get("/")
def serve_frontend():
    return FileResponse("web/index.html")


model: BDHClassifier = None
tokenizer = None
concept_mapper: ConceptMapper = None
thresholds: dict = None
raw_test_data = []


@app.on_event("startup")
def load_model():
    global model, tokenizer, concept_mapper, thresholds, LABEL2IDX, IDX2LABEL, raw_test_data

    tokenizer = AutoTokenizer.from_pretrained("bert-base-uncased")

    try:
        ckpt = torch.load(CHECKPOINT_PATH, map_location=DEVICE, weights_only=False)
        cfg = ckpt.get("config", BDHConfig())
        cfg.dropout = 0.0

        model = BDHClassifier(cfg).to(DEVICE)
        state = ckpt.get("model_state", ckpt.get("model_state_dict", ckpt))
        state = {k.replace("module.", ""): v for k, v in state.items()}
        model.load_state_dict(state, strict=False)
        model.eval()

        if "label2idx" in ckpt:
            LABEL2IDX = ckpt["label2idx"]
            IDX2LABEL = {v: k for k, v in LABEL2IDX.items()}

        thresholds = ckpt.get("thresholds", {i: 0.5 for i in range(cfg.num_labels)})
    except Exception:
        pass

    try:
        concept_mapper = ConceptMapper(COACTIVATION_PATH, OCCURRENCE_PATH)
    except Exception:
        pass

    try:
        test_paths = list(Path(DATA_ROOT).rglob("test.jsonl"))
        if test_paths:
            raw_test_data = load_jsonl(test_paths[0])
    except Exception:
        pass


class PredictRequest(BaseModel):
    text: str
    return_activations: bool = True
    return_concepts: bool = True
    return_per_layer: bool = False


class PredictResponse(BaseModel):
    case_text_preview: str
    predicted_articles: List[dict]
    activations: Optional[dict] = None
    concepts: Optional[List[dict]] = None
    per_layer: Optional[list] = None


class BatchRequest(BaseModel):
    texts: List[str]


@app.post("/api/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    chunk_ids, chunk_masks = text_to_chunks(req.text, tokenizer)
    n_chunks = chunk_ids.shape[0]

    chunk_ids = chunk_ids.unsqueeze(0).to(DEVICE)
    chunk_masks = chunk_masks.unsqueeze(0).to(DEVICE)
    doc_masks = torch.ones(1, n_chunks, dtype=torch.bool, device=DEVICE)

    with torch.no_grad():
        logits = model(chunk_ids, chunk_masks, doc_masks)

    probs = torch.sigmoid(logits).squeeze(0).cpu().numpy()

    predicted = []
    for idx in range(len(probs)):
        thr = thresholds.get(idx, 0.5) if isinstance(thresholds, dict) else 0.5
        article = IDX2LABEL[idx]
        predicted.append({
            "article": article,
            "name": ARTICLE_NAMES.get(article, ""),
            "probability": round(float(probs[idx]), 4),
            "predicted": bool(probs[idx] >= thr),
            "threshold": round(float(thr), 4),
        })

    predicted.sort(key=lambda x: -x["probability"])

    result = PredictResponse(
        case_text_preview=req.text[:500] + ("..." if len(req.text) > 500 else ""),
        predicted_articles=predicted,
    )

    if req.return_activations:
        result.activations = extract_sparse_activations(model)

    if req.return_concepts and result.activations and concept_mapper:
        result.concepts = concept_mapper.map_neurons_to_concepts(
            result.activations["active_neurons"]
        )

    if req.return_per_layer:
        result.per_layer = extract_per_layer_activations(
            model, chunk_ids, chunk_masks, doc_masks
        )

    return result


@app.get("/api/generate-examples")
def generate_examples(limit: int = 40):
    if not raw_test_data:
        return {"error": "test.jsonl not loaded"}

    examples = []
    for i, rec in enumerate(raw_test_data[:limit]):
        text = get_full_text(rec)
        silver = get_silver_paragraphs(rec)
        violated = rec.get("violated_articles", [])

        chunk_ids, chunk_masks = text_to_chunks(text, tokenizer)
        n_chunks = chunk_ids.shape[0]
        chunk_ids = chunk_ids.unsqueeze(0).to(DEVICE)
        chunk_masks = chunk_masks.unsqueeze(0).to(DEVICE)
        doc_masks = torch.ones(1, n_chunks, dtype=torch.bool, device=DEVICE)

        with torch.no_grad():
            logits = model(chunk_ids, chunk_masks, doc_masks)

        probs = torch.sigmoid(logits).squeeze(0).cpu().numpy()
        predicted_labels = []
        for idx in range(len(probs)):
            thr = thresholds.get(idx, 0.5) if isinstance(thresholds, dict) else 0.5
            if probs[idx] >= thr:
                predicted_labels.append(IDX2LABEL[idx])

        acts = extract_sparse_activations(model)
        concepts_mapped = (
            concept_mapper.map_neurons_to_concepts(acts["active_neurons"][:10])
            if concept_mapper
            else []
        )

        examples.append({
            "id": str(rec.get("itemid", i)),
            "case_id": str(rec.get("itemid", i)),
            "text": text,
            "violated_articles": violated,
            "predicted_labels": predicted_labels,
            "silver_rationales": silver,
            "active_neurons": acts["active_neurons"],
            "neuron_act_values": acts["neuron_act_values"],
            "sparsity": acts["sparsity"],
            "concepts": [c["concept"] for c in concepts_mapped],
        })

    with open("data/example_records.json", "w", encoding="utf-8") as f:
        json.dump(examples, f, indent=2)

    return {"status": "success", "count": len(examples), "message": "example_records.json generated in data/"}


@app.post("/api/batch-compare")
def batch_compare(req: BatchRequest):
    results = []
    for text in req.texts[:20]:
        chunk_ids, chunk_masks = text_to_chunks(text, tokenizer)
        n_chunks = chunk_ids.shape[0]
        chunk_ids = chunk_ids.unsqueeze(0).to(DEVICE)
        chunk_masks = chunk_masks.unsqueeze(0).to(DEVICE)
        doc_masks = torch.ones(1, n_chunks, dtype=torch.bool, device=DEVICE)

        with torch.no_grad():
            logits = model(chunk_ids, chunk_masks, doc_masks)

        probs = torch.sigmoid(logits).squeeze(0).cpu().numpy()
        acts = extract_sparse_activations(model)

        results.append({
            "text_preview": text[:200],
            "predictions": {IDX2LABEL[i]: round(float(probs[i]), 4) for i in range(len(probs))},
            "activations_summary": {
                "total_active": acts["total_active"],
                "sparsity": acts["sparsity"],
                "top_5_neurons": acts["active_neurons"][:5],
                "top_5_values": acts["neuron_act_values"][:5],
            },
        })

    return {"cases": results, "count": len(results)}


@app.get("/api/concept-index")
def concept_index():
    return {
        "coactivation": concept_mapper.coactivation if concept_mapper else {},
        "occurrence": concept_mapper.occurrence if concept_mapper else {},
        "total_concepts": len(concept_mapper.coactivation) if concept_mapper else 0,
    }


@app.get("/api/model-info")
def model_info():
    return {
        "architecture": "BDH (Baby Dragon Hatchling)",
        "n_layers": 6,
        "n_embd": 256,
        "n_head": 4,
        "sparse_dim": 4096,
        "total_neurons": 16384,
        "vocab_size": 30522,
        "num_labels": 7,
        "total_params": "20.5M",
        "chunk_size": 512,
        "max_chunks": 8,
        "labels": LABEL2IDX,
        "article_names": ARTICLE_NAMES,
    }


@app.get("/api/health")
def health():
    return {"status": "ok", "device": DEVICE, "model_loaded": model is not None}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.server.app:app", host="0.0.0.0", port=7860, reload=False)
