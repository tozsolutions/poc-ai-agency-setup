# PoC AI Agency Setup

This repository contains a minimal end-to-end proof-of-concept for an autonomous AI social/video agency running in a hybrid local + cloud setup.

The system aims to:
- run local-heavy production jobs on a desktop PC with an RTX 4070
- keep orchestration, approvals, and integrations on a laptop or VPS
- schedule production jobs only during approved windows
- support local model inference with free-tier cloud fallbacks when needed

## Goal

Create a practical pipeline for:
- content ideation and trend research
- script generation
- image generation for thumbnails/assets
- programmatic video rendering
- TTS / voice-over generation
- review queue and publishing automation

## Architecture summary

- Local production machine (Windows 10 desktop): runs heavy workloads only during allowed hours.
- Control plane (Windows 11 laptop or VPS): orchestrator and workflow automation.
- Reverse tunnel: desktop is not directly exposed to the internet; access goes through a secure tunnel.
- Fallback model routing: local model first, then free-tier cloud inference if local models are unavailable or insufficient.

## Included quick-start files

- `docker-compose.yml` — local services for n8n + orchestrator + proxy + rendering worker
- `orchestrator/app.py` — minimal FastAPI orchestrator
- `model-proxy/index.js` — model proxy with local-first and HF fallback logic
- `remotion/` — minimal programmatic video render template
- `.env.example` — environment variables template
- `README.md` — setup guide

## Recommended stack

- Local generation: text-generation-webui, AUTOMATIC1111, Remotion, Coqui TTS
- Orchestration: Hermes-inspired agent runner + n8n + FastAPI
- Infrastructure: SSH reverse tunnel (autossh), Docker Compose, GitHub Actions optional

## Planned workflow

1. Research and trending topic discovery
2. Script generation
3. Thumbnail generation
4. Video render
5. Voiceover rendering
6. Quality review
7. Publish to YouTube / Reddit / social channels via n8n

## Notes

This repository is intentionally a proof-of-concept scaffold, designed to help a new builder get from zero to a working local-first AI agency workflow without paying large up-front costs.
