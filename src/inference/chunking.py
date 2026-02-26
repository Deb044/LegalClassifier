from typing import List, Tuple

import torch


CHUNK_SIZE = 512
CHUNK_OVERLAP = 64
MAX_CHUNKS = 8


def text_to_chunks(
    text: str,
    tokenizer,
    chunk_size: int = CHUNK_SIZE,
    overlap: int = CHUNK_OVERLAP,
    max_chunks: int = MAX_CHUNKS,
) -> Tuple[torch.Tensor, torch.Tensor]:
    """Tokenise text and split into overlapping fixed-size chunks.

    Returns:
        input_ids:   (n_chunks, chunk_size) LongTensor
        attention_mask: (n_chunks, chunk_size) LongTensor
    """
    tokens = tokenizer(
        text,
        add_special_tokens=True,
        truncation=False,
        return_attention_mask=False,
    )["input_ids"]

    stride = chunk_size - overlap
    chunks_ids, chunks_mask = [], []

    start = 0
    while start < len(tokens) and len(chunks_ids) < max_chunks:
        end = min(start + chunk_size, len(tokens))
        chunk = tokens[start:end]
        pad_len = chunk_size - len(chunk)
        chunks_ids.append(chunk + [tokenizer.pad_token_id] * pad_len)
        chunks_mask.append([1] * len(chunk) + [0] * pad_len)
        start += stride

    if not chunks_ids:
        chunks_ids = [[tokenizer.pad_token_id] * chunk_size]
        chunks_mask = [[0] * chunk_size]

    return (
        torch.tensor(chunks_ids, dtype=torch.long),
        torch.tensor(chunks_mask, dtype=torch.long),
    )
