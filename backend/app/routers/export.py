"""
app/routers/export.py — Export meeting transcript/summary as PDF, Markdown, or TXT
"""
from __future__ import annotations

import io
import textwrap
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import Meeting, Summary, TranscriptSegment

router = APIRouter(prefix="/meetings", tags=["export"])


def _build_markdown(meeting: Meeting, segments: list, summary: Summary | None) -> str:
    lines = [f"# {meeting.title}", ""]
    lines.append(f"**Date:** {meeting.date.strftime('%B %d, %Y')}")
    lines.append(
        f"**Duration:** {meeting.duration_seconds // 60}m {meeting.duration_seconds % 60}s"
    )
    participants = ", ".join(p.name for p in meeting.participants)
    if participants:
        lines.append(f"**Participants:** {participants}")
    lines.append("")

    if summary:
        lines.append("## Summary")
        lines.append("")
        lines.append(summary.overview_text)
        lines.append("")

    if meeting.key_topics:
        lines.append("## Key Topics")
        lines.append("")
        for t in meeting.key_topics:
            lines.append(f"- {t.topic}")
        lines.append("")

    if meeting.action_items:
        lines.append("## Action Items")
        lines.append("")
        for ai in meeting.action_items:
            check = "x" if ai.is_completed else " "
            assignee = f" ({ai.assignee.name})" if ai.assignee else ""
            lines.append(f"- [{check}] {ai.text}{assignee}")
        lines.append("")

    if segments:
        lines.append("## Transcript")
        lines.append("")
        for seg in segments:
            speaker = seg.speaker.name if seg.speaker else "Unknown"
            ts = f"[{int(seg.start_time_seconds // 60):02d}:{int(seg.start_time_seconds % 60):02d}]"
            lines.append(f"**{speaker}** {ts}")
            lines.append(seg.text)
            lines.append("")

    return "\n".join(lines)


@router.get("/{meeting_id}/export")
def export_meeting(
    meeting_id: int,
    format: Literal["pdf", "md", "txt"] = Query("txt"),
    db: Session = Depends(get_db),
):
    stmt = (
        select(Meeting)
        .where(Meeting.id == meeting_id)
        .options(
            selectinload(Meeting.participants),
            selectinload(Meeting.summary),
            selectinload(Meeting.key_topics),
            selectinload(Meeting.action_items).selectinload(
                Meeting.action_items.property.mapper.class_.assignee  # type: ignore[attr-defined]
            ),
        )
    )
    meeting = db.scalar(stmt)
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    segments = db.scalars(
        select(TranscriptSegment)
        .where(TranscriptSegment.meeting_id == meeting_id)
        .options(selectinload(TranscriptSegment.speaker))
        .order_by(TranscriptSegment.order_index)
    ).all()

    summary = meeting.summary

    if format == "md":
        content = _build_markdown(meeting, segments, summary)
        return Response(
            content=content,
            media_type="text/markdown",
            headers={
                "Content-Disposition": f'attachment; filename="{meeting.title}.md"'
            },
        )

    elif format == "txt":
        # Strip markdown formatting for plain text
        md = _build_markdown(meeting, segments, summary)
        # Basic markdown stripping
        txt = md.replace("**", "").replace("##", "").replace("#", "").replace("- [x]", "[✓]").replace("- [ ]", "[ ]").replace("- ", "• ")
        return Response(
            content=txt,
            media_type="text/plain",
            headers={
                "Content-Disposition": f'attachment; filename="{meeting.title}.txt"'
            },
        )

    elif format == "pdf":
        try:
            import markdown as md_lib
            from weasyprint import HTML
        except ImportError:
            raise HTTPException(
                status_code=501,
                detail="PDF export requires weasyprint. Install it with: pip install weasyprint",
            )

        md_content = _build_markdown(meeting, segments, summary)
        html_content = md_lib.markdown(md_content, extensions=["tables", "fenced_code"])
        styled_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; line-height: 1.6; color: #333; }}
                h1 {{ color: #1a1a2e; border-bottom: 2px solid #6c63ff; padding-bottom: 10px; }}
                h2 {{ color: #4a4a8a; margin-top: 30px; }}
                code {{ background: #f4f4f8; padding: 2px 6px; border-radius: 3px; }}
                ul {{ padding-left: 20px; }}
                li {{ margin: 5px 0; }}
            </style>
        </head>
        <body>
        {html_content}
        </body>
        </html>
        """
        pdf_bytes = HTML(string=styled_html).write_pdf()
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{meeting.title}.pdf"'
            },
        )
