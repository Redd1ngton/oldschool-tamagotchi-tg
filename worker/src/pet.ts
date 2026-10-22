import type { Pet, Race, Trait, Stage, ActionResult } from './types';
import { getMessage } from './dialogues';

const RACES: Race[] = ['pig', 'cat', 'chicken', 'dino', 'bunny', 'dog', 'bear', 'frog'];
const TRAITS: Trait[] = ['toxic', 'loving', 'tsundere', 'lazy', 'chaotic', 'nostalgic'];

function randomTraits(): Trait[] {
  const shuffled = [...TRAITS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 1 + Math.floor(Math.random() * 2)); // 1-2 риси
}

export function createPet(userId: string, name?: string): Pet {
  const now = Math.floor(Date.now() / 1000);
  return {
    id: userId,
    name: name || 'Безіменний',
    race: RACES[Math.floor(Math.random() * RACES.length)],
    traits: randomTraits(),
    stage: 'egg',
    hunger: 20,
    mood: 70,
    health: 100,
    affection: 50,
    ageHours: 0,
    lastActionAt: now,
    bornAt: now,
    deaths: 0,
    lastMessage: 'Яйце тихенько стукає...',
    history: ['Народилося яйце']
  };
}

export function tick(pet: Pet): Pet {
  const now = Math.floor(Date.now() / 1000);
  const hoursPassed = (now - pet.lastActionAt) / 3600;

  if (hoursPassed < 0.1) return pet; // занадто рано

  const p = { ...pet };
  p.ageHours += hoursPassed;
  p.hunger = Math.min(100, p.hunger + hoursPassed * 8);
  p.mood = Math.max(0, p.mood - hoursPassed * 3);
  p.affection = Math.max(0, p.affection - hoursPassed * 1.5);

  if (p.hunger > 85) p.health = Math.max(0, p.health - hoursPassed * 5);
  if (p.mood < 20) p.health = Math.max(0, p.health - hoursPassed * 2);

  // Смерть
  if (p.health <= 0 || (p.hunger >= 100 && p.mood <= 5)) {
    p.stage = 'dead';
    p.lastMessage = getMessage(p.traits, 'death');
    p.deaths += 1;
    p.history.push('Помер');
  }

  // Еволюція
  if (p.stage === 'egg' && p.ageHours > 0.05) { // для тесту швидко
    p.stage = 'baby';
    p.lastMessage = `Вилупився ${p.race}!`;
    p.history.push('Вилупився');
  } else if (p.stage === 'baby' && p.ageHours > 12) {
    p.stage = 'child';
  } else if (p.stage === 'child' && p.ageHours > 36) {
    p.stage = 'teen';
  } else if (p.stage === 'teen' && p.ageHours > 72) {
    p.stage = 'adult';
  }

  p.lastActionAt = now;
  return p;
}

export function doAction(pet: Pet, action: 'feed' | 'play' | 'clean' | 'talk'): ActionResult {
  let p = tick(pet);
  if (p.stage === 'dead') {
    return { pet: p, message: p.lastMessage, animation: 'dead' };
  }

  const now = Math.floor(Date.now() / 1000);
  const hour = new Date().getHours();

  switch (action) {
    case 'feed':
      p.hunger = Math.max(0, p.hunger - 35);
      p.mood = Math.min(100, p.mood + 10);
      p.affection = Math.min(100, p.affection + 5);
      p.lastMessage = getMessage(p.traits, p.hunger > 50 ? 'hungry' : 'happy');
      break;
    case 'play':
      p.mood = Math.min(100, p.mood + 25);
      p.hunger = Math.min(100, p.hunger + 10);
      p.affection = Math.min(100, p.affection + 12);
      p.lastMessage = getMessage(p.traits, 'play');
      break;
    case 'clean':
      p.health = Math.min(100, p.health + 15);
      p.mood = Math.min(100, p.mood + 8);
      p.lastMessage = getMessage(p.traits, 'happy');
      break;
    case 'talk':
      p.affection = Math.min(100, p.affection + 15);
      p.mood = Math.min(100, p.mood + 12);
      if (hour >= 0 && hour < 6) {
        p.lastMessage = getMessage(p.traits, 'night');
      } else if (p.affection > 70) {
        p.lastMessage = getMessage(p.traits, 'happy');
      } else {
        p.lastMessage = getMessage(p.traits, 'ignored');
      }
      break;
  }

  p.lastActionAt = now;
  p.history = [p.lastMessage, ...p.history].slice(0, 10);

  return {
    pet: p,
    message: p.lastMessage,
    animation: action
  };
}
