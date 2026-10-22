const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  tg.setHeaderColor('#000000');
  tg.setBackgroundColor('#111111');
}

const API = 'https://YOUR_WORKER.workers.dev'; // ← заміни на свій Worker URL

const raceEmoji = {
  pig: '🐷',
  cat: '🐱',
  chicken: '🐥',
  dino: '🦖',
  bunny: '🐰',
  dog: '🐶',
  bear: '🐻',
  frog: '🐸',
  egg: '🥚',
  dead: '💀'
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

  if (pet.stage === 'egg') {
    sprite.textContent = '🥚';
  } else if (pet.stage === 'dead') {
    sprite.textContent = '💀';
  } else {
    sprite.textContent = raceEmoji[pet.race] || '❓';
  }

  msg.textContent = pet.lastMessage || '...';
  document.getElementById('hunger').textContent = Math.round(pet.hunger);
  document.getElementById('mood').textContent = Math.round(pet.mood);
  document.getElementById('affection').textContent = Math.round(pet.affection);

  // haptic
  if (tg?.HapticFeedback) {
    tg.HapticFeedback.impactOccurred('light');
  }
}

async function init() {
  try {
    const data = await api('/api/init', 'POST', {});
    render(data.pet);
  } catch (e) {
    document.getElementById('message').textContent = 'Помилка: ' + e.message;
  }
}

async function doAction(action) {
  const buttons = document.querySelectorAll('button');
  buttons.forEach(b => b.disabled = true);

  try {
    const data = await api('/api/action', 'POST', { action });
    const sprite = document.getElementById('pet-sprite');
    sprite.classList.add('bounce');
    setTimeout(() => sprite.classList.remove('bounce'), 400);
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
