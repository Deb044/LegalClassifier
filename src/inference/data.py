import json
import re
from pathlib import Path
from typing import List, Dict


def load_jsonl(path) -> List[dict]:
    rows = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def get_paragraphs(rec: dict) -> List[str]:
    for key in ("facts", "text", "case_text", "content"):
        val = rec.get(key)
        if val is None:
            continue
        if isinstance(val, list):
            return [str(p) for p in val if str(p).strip()]
        return [p.strip() for p in re.split(r"\n\s*\n", val) if p.strip()]
    return []


def get_full_text(rec: dict) -> str:
    return " ".join(get_paragraphs(rec))


def get_silver_paragraphs(rec: dict) -> Dict[str, List[str]]:
    """Return {article: [paragraph_text, ...]} from silver_rationales field."""
    paras = get_paragraphs(rec)
    sr = rec.get("silver_rationales")
    result = {}

    if sr is None:
        return result

    if isinstance(sr, dict):
        for art, indices in sr.items():
            if not isinstance(indices, list):
                indices = [indices]
            texts = [paras[i] for i in indices if isinstance(i, int) and 0 <= i < len(paras)]
            if texts:
                result[str(art)] = texts
    elif isinstance(sr, list):
        texts = [paras[i] for i in sr if isinstance(i, int) and 0 <= i < len(paras)]
        for art in rec.get("violated_articles", ["unknown"]):
            result[str(art)] = texts

    return result


def find_test_file(data_root: str) -> Path:
    paths = list(Path(data_root).rglob("test.jsonl"))
    if not paths:
        raise FileNotFoundError(f"test.jsonl not found under {data_root}")
    return paths[0]
