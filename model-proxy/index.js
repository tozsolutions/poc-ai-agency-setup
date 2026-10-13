require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.json());

const PORT = process.env.PORT || 4010;
const LOCAL_LLM_BASE_URL = process.env.LOCAL_LLM_BASE_URL || 'http://host.docker.internal:7860';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const HF_API_KEY = process.env.HF_API_KEY || '';

app.get('/health', (req, res) => {
  res.json({ status: 'ok', local_llm: LOCAL_LLM_BASE_URL });
});

app.post('/generate', async (req, res) => {
  const { prompt, style = 'youtube-short' } = req.body || {};

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  try {
    // Try local LLM first
    const localResp = await fetch(`${LOCAL_LLM_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `You are a scriptwriter for a YouTube video. ${style}. Generate a concise but high-value script based on this prompt: ${prompt}`,
        max_new_tokens: 400,
        temperature: 0.8,
      }),
    });

    if (localResp.ok) {
      const localData = await localResp.json();
      let generated = localData?.results?.[0]?.text || localData?.text || localData?.generated_text || null;

      if (generated) {
        return res.json({ text: generated, source: 'local' });
      }
    }

    // Fallback to a free cloud model or a deterministic placeholder if no services are available.
    if (OPENAI_API_KEY) {
      const cloudResp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: `Write a short-form script for a YouTube video aimed at a smart audience. Prompt: ${prompt}` }],
        }),
      });

      if (cloudResp.ok) {
        const cloudData = await cloudResp.json();
        const message = cloudData?.choices?.[0]?.message?.content;
        if (message) {
          return res.json({ text: message, source: 'cloud-openai' });
        }
      }
    }

    const fallbackText = `Title: ${prompt.slice(0, 40)}\n\nHook: This video explains how to solve the problem in a practical and efficient way.\n\nBody: Start with the core pain point, explain the context, reveal the process, show the best options, and finish with a crisp action step.\n\nCTA: Follow for more practical systems and automation workflows.`;
    return res.json({ text: fallbackText, source: 'fallback-local-template' });
  } catch (error) {
    return res.status(500).json({ error: String(error) });
  }
});

app.listen(PORT, () => {
  console.log(`Model proxy listening on http://0.0.0.0:${PORT}`);
});
