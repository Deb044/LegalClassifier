from typing import List

import torch
import torch.nn.functional as F


def extract_sparse_activations(model) -> dict:
    """Extract neuron activation statistics from the last BDH layer."""
    backbone = model.backbone
    xy = backbone._last_xy_sparse

    token_sparsity = (xy > 0).float().mean().item()
    pooled = xy.mean(dim=(0, 2))
    flat = pooled.reshape(-1)

    active_mask = flat > 0
    active_indices = torch.where(active_mask)[0].cpu().tolist()
    active_values = flat[active_mask].cpu().tolist()

    sorted_pairs = sorted(zip(active_indices, active_values), key=lambda x: -x[1])
    top_n = sorted_pairs[:50]
    total_neurons = flat.numel()

    per_head = []
    N = pooled.shape[1]
    for h in range(pooled.shape[0]):
        head_flat = pooled[h]
        head_active = (head_flat > 0).sum().item()
        per_head.append({
            "head_id": h,
            "active_neurons": head_active,
            "total_neurons": N,
            "sparsity": head_active / N,
            "top_5": sorted(
                [(i + h * N, head_flat[i].item()) for i in range(N) if head_flat[i] > 0],
                key=lambda x: -x[1],
            )[:5],
        })

    return {
        "active_neurons": [p[0] for p in top_n],
        "neuron_act_values": [round(p[1], 6) for p in top_n],
        "sparsity": round(token_sparsity, 10),
        "total_active": len(active_indices),
        "total_neurons": total_neurons,
        "per_head": per_head,
    }


def extract_per_layer_activations(
    model, chunk_ids: torch.Tensor, chunk_masks: torch.Tensor, doc_masks: torch.Tensor
) -> List[dict]:
    """Extract activation statistics for each BDH layer."""
    backbone = model.backbone
    C = backbone.config
    B_flat = chunk_ids.shape[0] * chunk_ids.shape[1]
    T = chunk_ids.shape[2]
    nh = C.n_head
    N = C.mlp_internal_dim_multiplier * C.n_embd // nh

    ids_flat = chunk_ids.view(B_flat, T)
    x = backbone.ln(backbone.embed(ids_flat).unsqueeze(1))

    layer_activations = []
    for layer_idx in range(C.n_layer):
        x_sparse = F.relu(x @ backbone.encoder)
        yKV = backbone.ln(backbone.attn(Q=x_sparse, K=x_sparse, V=x))
        y_sparse = F.relu(yKV @ backbone.encoder_v)
        xy_sparse = x_sparse * y_sparse

        token_sparsity = (xy_sparse > 0).float().mean().item()

        pooled = xy_sparse.detach().mean(dim=(0, 2)).reshape(-1)
        active_mask = pooled > 0
        active_indices = torch.where(active_mask)[0].cpu().tolist()
        active_values = pooled[active_mask].cpu().tolist()
        sorted_pairs = sorted(zip(active_indices, active_values), key=lambda x: -x[1])[:50]

        layer_activations.append({
            "layer": layer_idx,
            "active_neurons": [p[0] for p in sorted_pairs],
            "neuron_act_values": [round(p[1], 6) for p in sorted_pairs],
            "sparsity": round(token_sparsity, 10),
            "total_active": len(active_indices),
        })

        xy = backbone.drop(xy_sparse)
        yMLP = backbone.ln(xy.transpose(1, 2).reshape(B_flat, 1, T, nh * N) @ backbone.decoder)
        x = backbone.ln(x + yMLP)

    return layer_activations
