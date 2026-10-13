from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Literal
import httpx
import os
import subprocess
from pathlib import Path

app = FastAPI(title="AI Agency Orchestrator")

MODEL_PROXY_URL = os.getenv("MODEL_PROXY_URL", "http://localhost:4010")
ARTIFACTS_DIR = Path(os.getenv("ARTIFACTS_DIR", "./artifacts"))
ARTIFACTS_DIR.mkdir(exist_ok=True, parents=True)


class PromptRequest(BaseModel):
    prompt: str
    style: str = "youtube-short"
    render_mode: Literal["local", "fallback"] = "local"


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "model_proxy": MODEL_PROXY_URL}


@app.post("/create_video_from_prompt")
def create_video(payload: PromptRequest):
    try:
        # 1) Generate a script via the model proxy
        async def call_model_proxy() -> dict:
            async with httpx.AsyncClient() as client:
                r = await client.post(
                    f"{MODEL_PROXY_URL}/generate",
                    json={
                        "prompt": payload.prompt,
                        "style": payload.style,
                    },
                    timeout=120,
                )
                if r.status_code != 200:
                    raise HTTPException(status_code=500, detail=f"Model proxy error: {r.text}")
                return r.json()

        import asyncio
        model_result = asyncio.run(call_model_proxy())

        script = model_result.get("text") or model_result.get("script") or "Generic short-form video script"
        title = (payload.prompt[:40] or "AI video")
        safe_title = "".join(ch if ch.isalnum() or ch in ("-", "_") else "_" for ch in title)

        # 2) Create a prompt file for the video render step
        output_dir = ARTIFACTS_DIR / safe_title
        output_dir.mkdir(exist_ok=True, parents=True)

        script_path = output_dir / "script.txt"
        script_path.write_text(script, encoding="utf-8")

        # 3) Call Remotion render via CLI if installed; otherwise return script metadata
        render_target = output_dir / "video.mp4"
        render_prompt = f"Generate a video with title '{safe_title}' and script: {script[:500]}"

        try:
            subprocess.run(
                [
                    "npx",
                    "remotion",
                    "render",
                    "src/index.tsx",
                    "Main",
                    str(render_target),
                    "--props",
                    '{"title":"' + safe_title + '","script":"' + script.replace('"', '\\"') + '"}',
                ],
                cwd=str(Path(__file__).resolve().parent.parent / "remotion"),
                check=True,
                timeout=180,
                capture_output=True,
                text=True,
            )
        except Exception as exc:
            return {
                "status": "render-deferred",
                "title": safe_title,
                "script_path": str(script_path),
                "note": "Remotion render not available yet; placeholder job created.",
                "error": str(exc),
            }

        return {
            "status": "ok",
            "title": safe_title,
            "script_path": str(script_path),
            "output": str(render_target),
            "prompt": payload.prompt,
            "script": script,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=4000)
