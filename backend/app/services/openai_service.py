import json
import os
import re
from typing import Any
from pathlib import Path
from math import gcd

import requests


OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions"
OPENAI_SPEECH_URL = "https://api.openai.com/v1/audio/speech"
OPENAI_IMAGE_URL = "https://api.openai.com/v1/images/generations"
ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1/text-to-speech"
NVIDIA_IMAGE_URL = "https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-3-medium"


def _extract_text(payload: dict[str, Any]) -> str:
    if payload.get("output_text"):
        return str(payload["output_text"]).strip()

    text_parts: list[str] = []
    for item in payload.get("output", []):
        for content in item.get("content", []):
            if content.get("type") in {"output_text", "text"} and content.get("text"):
                text_parts.append(content["text"])
    return "\n".join(text_parts).strip()


def _extract_json(text: str) -> dict[str, Any] | None:
    text = text.strip()
    if not text:
        return None

    # Handle markdown code fences.
    fenced = re.search(r"```(?:json)?\s*(\{[\s\S]*\})\s*```", text)
    if fenced:
        text = fenced.group(1)

    try:
        parsed = json.loads(text)
        return parsed if isinstance(parsed, dict) else None
    except json.JSONDecodeError:
        pass

    # Best-effort extraction of the first JSON object.
    direct = re.search(r"\{[\s\S]*\}", text)
    if not direct:
        return None
    try:
        parsed = json.loads(direct.group(0))
        return parsed if isinstance(parsed, dict) else None
    except json.JSONDecodeError:
        return None


def chatgpt_json(system_prompt: str, user_prompt: str, temperature: float = 0.3) -> dict[str, Any] | None:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()
    if not api_key:
        return None

    try:
        response = requests.post(
            OPENAI_CHAT_COMPLETIONS_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "temperature": temperature,
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            },
            timeout=25,
        )
        response.raise_for_status()
        data = response.json()
        content = ((data.get("choices") or [{}])[0].get("message") or {}).get("content", "")
        return _extract_json(content)
    except Exception:
        return None


def chatgpt_text(system_prompt: str, user_prompt: str, temperature: float = 0.4) -> str | None:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini").strip()
    if not api_key:
        return None

    try:
        response = requests.post(
            OPENAI_CHAT_COMPLETIONS_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "temperature": temperature,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            },
            timeout=25,
        )
        response.raise_for_status()
        data = response.json()
        text = ((data.get("choices") or [{}])[0].get("message") or {}).get("content", "")
        return text or None
    except Exception:
        return None


def generate_tts_mp3(text: str, output_path: str) -> bool:
    if not text.strip():
        return False

    # Prefer ElevenLabs when key is available.
    eleven_api_key = os.getenv("ELEVENLABS_API_KEY", "").strip()
    eleven_voice_id = os.getenv("ELEVENLABS_VOICE_ID", "EXAVITQu4vr4xnSDxMaL").strip()
    eleven_model_id = os.getenv("ELEVENLABS_MODEL_ID", "eleven_multilingual_v2").strip()
    if eleven_api_key and eleven_voice_id:
        try:
            response = requests.post(
                f"{ELEVENLABS_BASE_URL}/{eleven_voice_id}",
                headers={
                    "xi-api-key": eleven_api_key,
                    "Content-Type": "application/json",
                    "Accept": "audio/mpeg",
                },
                json={
                    "text": text[:3500],
                    "model_id": eleven_model_id,
                    "voice_settings": {
                        "stability": 0.45,
                        "similarity_boost": 0.75,
                    },
                },
                timeout=25,
            )
            response.raise_for_status()
            out = Path(output_path)
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_bytes(response.content)
            return True
        except Exception:
            # fall back to OpenAI TTS
            pass

    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return False

    tts_model = os.getenv("OPENAI_TTS_MODEL", "gpt-4o-mini-tts").strip()
    voice = os.getenv("OPENAI_TTS_VOICE", "alloy").strip()

    try:
        response = requests.post(
            OPENAI_SPEECH_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": tts_model,
                "voice": voice,
                "input": text[:4000],
                "format": "mp3",
            },
            timeout=20,
        )
        response.raise_for_status()
        out = Path(output_path)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_bytes(response.content)
        return True
    except Exception:
        return False


def generate_image_data_url(prompt: str, size: str = "1024x1024") -> str | None:
    if not prompt.strip():
        return None

    nvidia_key = os.getenv("NVIDIA_IMAGE_API_KEY", "").strip()
    nvidia_url = os.getenv("NVIDIA_IMAGE_URL", NVIDIA_IMAGE_URL).strip()
    if not nvidia_key or not nvidia_url:
        return None

    try:
        width = 1024
        height = 1024
        if "x" in size:
            w_raw, h_raw = size.lower().split("x", 1)
            width = max(256, min(1568, int(w_raw)))
            height = max(256, min(1568, int(h_raw)))
        ratio_gcd = gcd(width, height) or 1
        aspect_ratio = f"{width // ratio_gcd}:{height // ratio_gcd}"

        response = requests.post(
            nvidia_url,
            headers={
                "Authorization": f"Bearer {nvidia_key}",
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
            json={
                "prompt": prompt[:3200],
                "cfg_scale": float(os.getenv("NVIDIA_IMAGE_CFG_SCALE", "5")),
                "aspect_ratio": os.getenv("NVIDIA_IMAGE_ASPECT_RATIO", aspect_ratio).strip() or aspect_ratio,
                "seed": int(os.getenv("NVIDIA_IMAGE_SEED", "0")),
                "steps": int(os.getenv("NVIDIA_IMAGE_STEPS", "50")),
                "negative_prompt": os.getenv("NVIDIA_IMAGE_NEGATIVE_PROMPT", ""),
            },
            timeout=35,
        )
        response.raise_for_status()
        payload = response.json()

        artifacts = payload.get("artifacts") or []
        if artifacts and isinstance(artifacts[0], dict):
            b64 = artifacts[0].get("base64")
            if b64:
                return f"data:image/png;base64,{b64}"

        data = payload.get("data") or []
        if data and isinstance(data[0], dict):
            b64 = data[0].get("b64_json")
            if b64:
                return f"data:image/png;base64,{b64}"
            url = data[0].get("url")
            if url:
                return str(url)

        if payload.get("image"):
            image_value = str(payload["image"])
            if image_value.startswith("data:image/"):
                return image_value
            return f"data:image/png;base64,{image_value}"
    except Exception:
        return None

    return None
