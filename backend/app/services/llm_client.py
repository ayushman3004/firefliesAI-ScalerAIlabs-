"""
app/services/llm_client.py

Thin wrapper around the OpenAI SDK configured to hit Google Gemini API.
Uses base_url override — no extra libraries needed beyond `openai`.

Set GEMINI_API_KEY in your .env file.
Optionally override LLM_MODEL (default: gemini-1.5-flash).
"""
from __future__ import annotations

import os
import textwrap

from dotenv import load_dotenv

load_dotenv()

_API_KEY = os.getenv("GEMINI_API_KEY", "")
_MODEL = os.getenv("LLM_MODEL", "gemini-1.5-flash")

# Gemini's OpenAI-compatible endpoint
_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"


def _get_client():
    """Lazily create the OpenAI client configured for Gemini."""
    try:
        from openai import OpenAI
    except ImportError:
        raise RuntimeError("openai package not installed. Run: pip install openai")

    if not _API_KEY:
        raise RuntimeError(
            "GEMINI_API_KEY is not set. Add it to your .env file."
        )

    return OpenAI(api_key=_API_KEY, base_url=_BASE_URL)


def _execute_completion(prompt: str, max_tokens: int, temperature: float = 0.3) -> str:
    """Helper to execute chat completions and map OpenAI SDK errors to FastAPI HTTPExceptions."""
    from fastapi import HTTPException
    import openai

    try:
        client = _get_client()
        response = client.chat.completions.create(
            model=_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return (response.choices[0].message.content or "").strip()
    except openai.AuthenticationError as e:
        raise HTTPException(
            status_code=401,
            detail="Invalid Gemini API key. Please check the GEMINI_API_KEY in your backend .env file."
        )
    except openai.RateLimitError as e:
        raise HTTPException(
            status_code=429,
            detail="Gemini API rate limit or quota exceeded. Please try again later."
        )
    except openai.APITimeoutError as e:
        raise HTTPException(
            status_code=504,
            detail="Request to Gemini API timed out. Please try again."
        )
    except openai.APIConnectionError as e:
        raise HTTPException(
            status_code=502,
            detail="Failed to connect to the Gemini API server. Please check your network connection."
        )
    except openai.APIError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gemini API error: {e.message}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred during LLM generation: {str(e)}"
        )


def generate_summary(transcript_text: str, meeting_title: str) -> str:
    """
    Generate a meeting summary from the full transcript text.
    Entire transcript is context-stuffed (no RAG needed at this scale).
    """
    prompt = textwrap.dedent(f"""
        You are an advanced meeting notes assistant. Given the full transcript of a meeting titled "{meeting_title}", generate a structured summary with the following sections:

        ### Executive Summary
        Provide a concise overview (2-4 sentences) summarizing the main purpose and overall outcome of the meeting.

        ### Key Decisions
        List any key decisions confirmed or agreed upon during the meeting as bullet points using "•". If no decisions were made, state "None".

        ### Risks
        List any risks, blockers, challenges, or incomplete items mentioned during the meeting as bullet points using "•". If no risks were identified, state "None".

        ### Action Items
        List all action items assigned to participants as bullet points using "• [Assignee Name]: [Task Description]". If no action items were assigned, state "None".

        Be professional, structured, and factual. Do not add information not present in the transcript.

        TRANSCRIPT:
        {transcript_text[:50000]}

        STRUCTURED SUMMARY:
    """).strip()

    return _execute_completion(prompt, max_tokens=1024, temperature=0.3)


def answer_question(transcript_text: str, question: str, meeting_title: str) -> str:
    """
    Answer a question about a specific meeting using the full transcript as context.
    """
    prompt = textwrap.dedent(f"""
        You are a helpful assistant with access to the full transcript of a meeting
        titled "{meeting_title}". Answer the following question based ONLY on what
        was discussed in this transcript. If the answer is not in the transcript,
        say so clearly.

        TRANSCRIPT:
        {transcript_text[:50000]}

        QUESTION: {question}

        ANSWER:
    """).strip()

    return _execute_completion(prompt, max_tokens=512, temperature=0.3)
