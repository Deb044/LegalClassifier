import math
from dataclasses import dataclass

import torch
import torch.nn as nn
import torch.nn.functional as F


@dataclass
class BDHConfig:
    n_layer: int = 6
    n_embd: int = 256
    n_head: int = 4
    mlp_internal_dim_multiplier: int = 64
    dropout: float = 0.0
    vocab_size: int = 30522
    num_labels: int = 7


def get_freqs(n: int, theta: int, dtype) -> torch.Tensor:
    def quantize(t, q=2):
        return (t / q).floor() * q

    return (
        1.0 / (theta ** (quantize(torch.arange(0, n, 1, dtype=dtype)) / n))
        / (2 * math.pi)
    )


class BDHAttention(nn.Module):
    def __init__(self, config: BDHConfig):
        super().__init__()
        nh, D = config.n_head, config.n_embd
        N = config.mlp_internal_dim_multiplier * D // nh
        self.N = N
        self.register_buffer(
            "freqs",
            get_freqs(N, theta=2**16, dtype=torch.float32).view(1, 1, 1, N),
        )

    @staticmethod
    def _rope(phases: torch.Tensor, v: torch.Tensor) -> torch.Tensor:
        v_rot = torch.stack((-v[..., 1::2], v[..., ::2]), dim=-1).view(*v.shape)
        ph = (phases % 1) * (2 * math.pi)
        return v * torch.cos(ph) + v_rot * torch.sin(ph)

    def forward(self, Q: torch.Tensor, K: torch.Tensor, V: torch.Tensor) -> torch.Tensor:
        _, _, T, _ = Q.shape
        Q32, V32 = Q.float(), V.float()
        r_phases = (
            torch.arange(T, device=self.freqs.device, dtype=torch.float32)
            .view(1, 1, -1, 1)
        ) * self.freqs
        QR = self._rope(r_phases, Q32)
        scale = 1.0 / math.sqrt(self.N)
        scores = (QR @ QR.mT) * scale
        return (scores @ V32).to(Q.dtype)


class BDHBackbone(nn.Module):
    def __init__(self, config: BDHConfig):
        super().__init__()
        self.config = config
        nh, D = config.n_head, config.n_embd
        N = config.mlp_internal_dim_multiplier * D // nh

        self.encoder = nn.Parameter(torch.empty(nh, D, N).normal_(std=0.02))
        self.encoder_v = nn.Parameter(torch.empty(nh, D, N).normal_(std=0.02))
        self.decoder = nn.Parameter(torch.empty(nh * N, D).normal_(std=0.02))
        self.attn = BDHAttention(config)
        self.ln = nn.LayerNorm(D, elementwise_affine=False, bias=False)
        self.embed = nn.Embedding(config.vocab_size, D)
        self.drop = nn.Dropout(config.dropout)
        nn.init.normal_(self.embed.weight, std=0.02)

    def forward(self, idx: torch.Tensor) -> torch.Tensor:
        C = self.config
        B, T = idx.shape
        nh = C.n_head
        N = C.mlp_internal_dim_multiplier * C.n_embd // nh

        x = self.ln(self.embed(idx).unsqueeze(1))

        for layer_idx in range(C.n_layer):
            x_sparse = F.relu(x @ self.encoder)

            if layer_idx == C.n_layer - 1:
                self._last_x_sparse = x_sparse.detach()

            yKV = self.ln(self.attn(Q=x_sparse, K=x_sparse, V=x))
            y_sparse = F.relu(yKV @ self.encoder_v)

            if layer_idx == C.n_layer - 1:
                self._last_y_sparse = y_sparse.detach()
                self._last_xy_sparse = (x_sparse * y_sparse).detach()

            xy = self.drop(x_sparse * y_sparse)
            yMLP = self.ln(xy.transpose(1, 2).reshape(B, 1, T, nh * N) @ self.decoder)
            x = self.ln(x + yMLP)

        return x.squeeze(1)


class BDHClassifier(nn.Module):
    def __init__(self, config: BDHConfig):
        super().__init__()
        self.backbone = BDHBackbone(config)
        self.ln_post = nn.LayerNorm(config.n_embd, elementwise_affine=False, bias=False)
        self.head = nn.Sequential(
            nn.Linear(config.n_embd, config.n_embd),
            nn.GELU(),
            nn.Dropout(config.dropout),
            nn.Linear(config.n_embd, config.num_labels),
        )

    @staticmethod
    def _token_pool(hidden: torch.Tensor, mask: torch.Tensor) -> torch.Tensor:
        m = mask.unsqueeze(-1).float()
        return (hidden * m).sum(1) / m.sum(1).clamp(min=1e-9)

    def forward(
        self,
        chunk_ids: torch.Tensor,
        chunk_masks: torch.Tensor,
        doc_masks: torch.Tensor,
    ) -> torch.Tensor:
        B, n_chunks, T = chunk_ids.shape
        hidden = self.backbone(chunk_ids.view(B * n_chunks, T))
        chunk_repr = self._token_pool(hidden, chunk_masks.view(B * n_chunks, T))
        chunk_repr = chunk_repr.view(B, n_chunks, -1)
        dm = doc_masks.unsqueeze(-1).float()
        doc_repr = (chunk_repr * dm).sum(1) / dm.sum(1).clamp(min=1e-9)
        return self.head(self.ln_post(doc_repr))

    def count_parameters(self):
        total = sum(p.numel() for p in self.parameters())
        trainable = sum(p.numel() for p in self.parameters() if p.requires_grad)
        return total, trainable
