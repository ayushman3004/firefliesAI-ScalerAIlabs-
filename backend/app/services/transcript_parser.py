"""
app/services/transcript_parser.py

Converts uploaded transcript files into a list of segment dicts:
  {text, start_time_seconds, end_time_seconds, order_index}

Supported formats:
  .txt  — plain text (one paragraph per segment, no timestamps)
  .vtt  — WebVTT (parses cue timestamps)
  .json — expected: list of {text, start, end, speaker_id?}
"""
from __future__ import annotations

import json
import re
from typing import Any, Dict, List


def parse_transcript(content: str, filename: str) -> List[Dict[str, Any]]:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "txt"

    if ext == "vtt":
        return _parse_vtt(content)
    elif ext == "json":
        return _parse_json(content)
    else:
        return _parse_txt(content)


# ── Plain text ────────────────────────────────────────────────────────────────
def _parse_txt(content: str) -> List[Dict[str, Any]]:
    paragraphs = [p.strip() for p in re.split(r"\n{2,}", content) if p.strip()]
    segments = []
    for i, para in enumerate(paragraphs):
        segments.append(
            {
                "text": para,
                "start_time_seconds": float(i * 30),
                "end_time_seconds": float(i * 30 + 29),
                "order_index": i,
            }
        )
    return segments


# ── WebVTT ────────────────────────────────────────────────────────────────────
_VTT_TIMESTAMP = re.compile(
    r"(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s+-->\s+(\d{2}):(\d{2}):(\d{2})\.(\d{3})"
)


def _vtt_to_seconds(h: str, m: str, s: str, ms: str) -> float:
    return int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000


def _parse_vtt(content: str) -> List[Dict[str, Any]]:
    segments = []
    idx = 0
    lines = content.splitlines()
    i = 0
    while i < len(lines):
        match = _VTT_TIMESTAMP.match(lines[i])
        if match:
            start = _vtt_to_seconds(match[1], match[2], match[3], match[4])
            end = _vtt_to_seconds(match[5], match[6], match[7], match[8])
            i += 1
            text_lines = []
            while i < len(lines) and lines[i].strip():
                text_lines.append(lines[i].strip())
                i += 1
            text = " ".join(text_lines)
            if text:
                segments.append(
                    {
                        "text": text,
                        "start_time_seconds": start,
                        "end_time_seconds": end,
                        "order_index": idx,
                    }
                )
                idx += 1
        else:
            i += 1
    return segments


# ── JSON ──────────────────────────────────────────────────────────────────────
def _parse_json(content: str) -> List[Dict[str, Any]]:
    data = json.loads(content)
    if not isinstance(data, list):
        raise ValueError("JSON transcript must be a list of segment objects")

    segments = []
    for i, item in enumerate(data):
        segments.append(
            {
                "text": str(item.get("text", "")),
                "start_time_seconds": float(item.get("start", item.get("start_time_seconds", i * 10))),
                "end_time_seconds": float(item.get("end", item.get("end_time_seconds", i * 10 + 9))),
                "order_index": int(item.get("order_index", i)),
                "speaker_id": item.get("speaker_id"),
            }
        )
    return segments
