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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // --- /api/init ---
      if (path === '/api/init' && request.method === 'POST') {
        const body = await request.json() as { initData: string; name?: string };
        const validation = await validateInitData(body.initData, env.BOT_TOKEN);
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
        const validation = await validateInitData(body.initData, env.BOT_TOKEN);
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

      // --- /api/graveyard (публічний) ---
      if (path === '/api/graveyard' && request.method === 'GET') {
        // Простий варіант — можна розширити пізніше
        return Response.json({ message: 'Кладовище поки порожнє. Помри красиво.' }, { headers: corsHeaders() });
      }

      return Response.json({ error: 'Not found' }, { status: 404, headers: corsHeaders() });
    } catch (e: any) {
      return Response.json({ error: e.message || 'Server error' }, { status: 500, headers: corsHeaders() });
    }
  },
};
