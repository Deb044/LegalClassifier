import json
from typing import List


class ConceptMapper:
    """Maps active neuron IDs to legal concepts using co-activation statistics."""

    def __init__(self, coactivation_path: str, occurrence_path: str):
        with open(coactivation_path) as f:
            self.coactivation = json.load(f)
        with open(occurrence_path) as f:
            self.occurrence = json.load(f)

        self.neuron_to_concepts = {}
        for concept, neurons in self.coactivation.items():
            for nid, count in neurons.items():
                if nid not in self.neuron_to_concepts:
                    self.neuron_to_concepts[nid] = []
                self.neuron_to_concepts[nid].append((concept, count))

    def map_neurons_to_concepts(
        self, active_neurons: List[int], top_k: int = 10
    ) -> List[dict]:
        """Return the top-k concepts most aligned with the given active neurons."""
        concept_scores = {}
        concept_neuron_evidence = {}

        for nid in active_neurons:
            nid_str = str(nid)
            if nid_str in self.neuron_to_concepts:
                for concept, count in self.neuron_to_concepts[nid_str]:
                    concept_scores[concept] = concept_scores.get(concept, 0) + count
                    if concept not in concept_neuron_evidence:
                        concept_neuron_evidence[concept] = []
                    concept_neuron_evidence[concept].append(
                        {"neuron": nid, "coact_count": count}
                    )

        for concept in concept_scores:
            freq = self.occurrence.get(concept, 1)
            concept_scores[concept] /= freq

        ranked = sorted(concept_scores.items(), key=lambda x: -x[1])[:top_k]

        return [
            {
                "concept": concept,
                "score": round(score, 4),
                "evidence_neurons": concept_neuron_evidence.get(concept, [])[:5],
                "corpus_frequency": self.occurrence.get(concept, 0),
            }
            for concept, score in ranked
        ]
