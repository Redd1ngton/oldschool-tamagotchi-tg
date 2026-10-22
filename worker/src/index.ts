import { validateInitData } from './auth';
import { createPet, doAction, tick } from './pet';
import type { Pet } from './types';

export interface Env {
  PETS: KVNamespace;
  BOT_TOKEN: string;
}

async function getPet(env: Env, userId: string): Promise<Pet | null> {
  const raw = await env.PETS.get(`pet:${userId}`);
  return raw ? JSON.parse(raw) : null;
}

async function savePet(env: Env, pet: Pet) {
  await env.PETS.put(`pet:${pet.id}`, JSON.stringify(pet));
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// ========== STATIC FRONTEND ==========
const HTML = `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Oldschool Tamagotchi</title>
  <script src="https://telegram.org/js/telegram-web-app.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    body {
      background: #000;
      color: #cfc;
      font-family: 'Courier New', monospace;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      overflow: hidden;
    }
    #app { width: 100%; max-width: 360px; padding: 12px; }
    #screen {
      background: #000;
      border: 3px solid #333;
      border-radius: 4px;
      padding: 20px 12px;
      text-align: center;
      margin-bottom: 16px;
      min-height: 300px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      image-rendering: pixelated;
    }
    #pet-sprite {
      font-size: 72px;
      line-height: 1;
      margin: 16px 0;
      image-rendering: pixelated;
      filter: contrast(1.2);
      transition: transform 0.12s steps(2);
    }
    #pet-sprite.bounce { animation: bounce 0.35s steps(3); }
    @keyframes bounce {
      0%, 100% { transform: scale(1) translateY(0); }
      50% { transform: scale(1.12) translateY(-6px); }
    }
    #message {
      font-size: 13px;
      line-height: 1.35;
      min-height: 58px;
      padding: 0 6px;
      color: #8f8;
      word-break: break-word;
    }
    #stats {
      display: flex;
      justify-content: space-around;
      font-size: 11px;
      color: #666;
      margin-top: 10px;
    }
    #buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    button {
      background: #111;
      color: #ddd;
      border: 2px solid #333;
      border-radius: 3px;
      padding: 13px 8px;
      font-size: 14px;
      font-family: inherit;
      cursor: pointer;
    }
    button:active { background: #222; }
    button:disabled { opacity: 0.35; }
  </style>
</head>
<body>
  <div id="app">
    <div id="screen">
      <div id="pet-sprite">\u{1F95A}</div>
      <div id="message">Завантаження...</div>
      <div id="stats">
        <div>Голод: <span id="hunger">—</span></div>
        <div>Настрій: <span id="mood">—</span></div>
        <div>Любов: <span id="affection">—</span></div>
      </div>
    </div>
    <div id="buttons">
      <button data-action="feed">Годувати</button>
      <button data-action="play">Грати</button>
      <button data-action="clean">Чистити</button>
      <button data-action="talk">Поговорити</button>
    </div>
  </div>
  <script>
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#000000');
      tg.setBackgroundColor('#000000');
    }

    // API на тому ж домені
    const API = '';

    const raceEmoji = {
      pig: '🐷', cat: '🐱', chicken: '🐥', dino: '🦖',
      bunny: '🐰', dog: '🐶', bear: '🐻', frog: '🐸',
      egg: '🥚', dead: '💀'
    };

    let currentPet = null;

    async function api(path, method = 'GET', body = null) {
      const initData = tg?.initData || '';
      const opts = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      if (method === 'GET') {
        path += (path.includes('?') ? '&' : '?') + 'initData=' + encodeURIComponent(initData);
      } else {
        opts.body = JSON.stringify({ ...body, initData });
      }
      const res = await fetch(API + path, opts);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || res.statusText);
      }
      return res.json();
    }

    function render(pet) {
      currentPet = pet;
      const sprite = document.getElementById('pet-sprite');
      const msg = document.getElementById('message');

      if (pet.stage === 'egg') sprite.textContent = '🥚';
      else if (pet.stage === 'dead') sprite.textContent = '💀';
      else sprite.textContent = raceEmoji[pet.race] || '❓';

      msg.textContent = pet.lastMessage || '...';
      document.getElementById('hunger').textContent = Math.round(pet.hunger);
      document.getElementById('mood').textContent = Math.round(pet.mood);
      document.getElementById('affection').textContent = Math.round(pet.affection);

      if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
    }

    async function init() {
      try {
        const data = await api('/api/init', 'POST', {});
        render(data.pet);
      } catch (e) {
        document.getElementById('message').textContent = 'Помилка: ' + e.message;
        console.error(e);
      }
    }

    async function doAction(action) {
      const buttons = document.querySelectorAll('button');
      buttons.forEach(b => b.disabled = true);
      try {
        const data = await api('/api/action', 'POST', { action });
        const sprite = document.getElementById('pet-sprite');
        sprite.classList.add('bounce');
        setTimeout(() => sprite.classList.remove('bounce'), 350);
        render(data.pet);
      } catch (e) {
        document.getElementById('message').textContent = 'Помилка: ' + e.message;
      } finally {
        buttons.forEach(b => b.disabled = false);
      }
    }

    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => doAction(btn.dataset.action));
    });

    init();
  </script>
</body>
</html>`;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Віддаємо фронт з кореня
    if (path === '/' || path === '/index.html') {
      return new Response(HTML, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      });
    }

    try {
      // --- /api/init ---
      if (path === '/api/init' && request.method === 'POST') {
        const body = await request.json() as { initData: string; name?: string };
        const validation = await validateInitData(body.initData || '', env.BOT_TOKEN);
        if (!validation.ok) {
          return Response.json({ error: validation.error }, { status: 401, headers: corsHeaders() });
        }

        let pet = await getPet(env, validation.userId);
        if (!pet) {
          pet = createPet(validation.userId, body.name);
          await savePet(env, pet);
        } else {
          pet = tick(pet);
          await savePet(env, pet);
        }

        return Response.json({ pet }, { headers: corsHeaders() });
      }

      // --- /api/pet ---
      if (path === '/api/pet' && request.method === 'GET') {
        const initData = url.searchParams.get('initData') || '';
        const validation = await validateInitData(initData, env.BOT_TOKEN);
        if (!validation.ok) {
          return Response.json({ error: validation.error }, { status: 401, headers: corsHeaders() });
        }

        let pet = await getPet(env, validation.userId);
        if (!pet) {
          return Response.json({ error: 'No pet' }, { status: 404, headers: corsHeaders() });
        }
        pet = tick(pet);
        await savePet(env, pet);
        return Response.json({ pet }, { headers: corsHeaders() });
      }

      // --- /api/action ---
      if (path === '/api/action' && request.method === 'POST') {
        const body = await request.json() as { initData: string; action: 'feed' | 'play' | 'clean' | 'talk' };
        const validation = await validateInitData(body.initData || '', env.BOT_TOKEN);
        if (!validation.ok) {
          return Response.json({ error: validation.error }, { status: 401, headers: corsHeaders() });
        }

        let pet = await getPet(env, validation.userId);
        if (!pet) {
          return Response.json({ error: 'No pet' }, { status: 404, headers: corsHeaders() });
        }

        const result = doAction(pet, body.action);
        await savePet(env, result.pet);

        return Response.json(result, { headers: corsHeaders() });
      }

      // --- /api/graveyard ---
      if (path === '/api/graveyard' && request.method === 'GET') {
        return Response.json({ message: 'Кладовище поки порожнє.' }, { headers: corsHeaders() });
      }

      return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders() });
    } catch (e: any) {
      return Response.json({ error: e.message || 'Server error' }, { status: 500, headers: corsHeaders() });
    }
  },
};
