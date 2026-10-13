# AI Agency Setup

This repository is a working scaffold for a local-first autonomous AI agency focused on:
- trend research
- script generation
- thumbnail and image generation
- short-form video rendering
- voice-over / TTS
- scheduling and social publishing

## Why this project exists

The goal is to keep the expensive GPU work on a desktop PC and the orchestration, approval workflow, and publishing on a laptop or VPS. This keeps cost low and works well with a Windows 10 desktop + Windows 11 laptop + VPS architecture.

## Core architecture

- Desktop PC (Windows 10): heavy local generation only during allowed windows.
- Laptop or VPS: orchestration, approvals, monitoring, publishing, and fallback routing.
- Reverse tunnel: desktop is not directly reachable from the internet; access is proxied via a secure SSH tunnel.
- Local-first model routing: local model and local tools first, cloud fallback second.

## Included pieces

- `docker-compose.yml` — service stack for n8n + model proxy + orchestrator + Remotion worker
- `model-proxy/` — lightweight local-first proxy with cloud fallback logic
- `orchestrator/` — FastAPI-based orchestrator for jobs and outputs
- `remotion/` — minimal Remotion render template
- `web-ui/` — simple React + Three.js interface skeleton
- `n8n/workflow.json` — basic n8n pipeline starter
- `.env.example` — environment template

## Recommended stack

- Local models: text-generation-webui or llama.cpp based model on the desktop GPU
- Visual generation: Automatic1111 / Stable Diffusion
- Video: Remotion + FFmpeg
- TTS: Coqui TTS or VoiceStudio
- Orchestration: Hermes-inspired agent runner + n8n
- Fallback: free-tier model APIs such as Hugging Face or a small cloud provider

## Quick start

1. Copy `.env.example` to `.env` and fill values.
2. Start the core stack:

   docker compose up --build

3. Test the orchestrator:

   curl -X POST http://localhost:4000/create_video_from_prompt \
     -H "Content-Type: application/json" \
     -d '{"prompt":"Create a short YouTube video about AI workflow automation", "style":"youtube-short"}'

4. Open n8n at http://localhost:5678
5. Import `n8n/workflow.json`
6. Open the web UI in `web-ui` and run the basic dashboard skeleton

## Production windows

This project assumes the heavy local desktop tasks run only during approved windows, for example:
- 09:00–12:00
- 23:00–07:00

This schedule should be enforced by the orchestration layer and job scheduling policy.

## Production notes

This is intentionally a proof-of-concept and starting scaffold. In a real deployment, you will need to:
- add proper user approvals before publishing
- restrict or validate model inputs
- store secrets outside the repository
- add moderation and compliance checks
- add a real reverse tunnel / firewall setup for the desktop PC

## Next recommended steps

1. Install local GPU model for text generation
2. Connect AUTOMATIC1111 for image generation
3. Replace the minimal Remotion template with your real brand templates
4. Implement real publishing nodes for YouTube / Reddit / GitHub
5. Add moderation and analytics agents

## Folder map

- `docker-compose.yml`
- `.env.example`
- `README.md`
- `orchestrator/`
- `model-proxy/`
- `remotion/`
- `web-ui/`
- `n8n/`

## License

MIT
