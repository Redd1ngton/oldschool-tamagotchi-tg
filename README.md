# Oldschool Tamagotchi — Telegram Mini App

Олдскульне Тамагочі з класичними тваринками, які матюкаються, сваряться, ображаються і люблять.

## Стек
- **Frontend**: Vanilla HTML/JS/CSS (Telegram Mini App)
- **Backend**: Cloudflare Workers + KV
- **Auth**: Telegram `initData` validation

## Персонажі (класичні)
1. Свинка
2. Котик
3. Курочка
4. Динозаврик
5. Зайчик
6. Песик
7. Ведмедик
8. Жабка

Кожен має риси характеру (`toxic`, `loving`, `tsundere`, `lazy`, `chaotic`), які впливають на стиль матюків і ніжність.

## Як запустити

### 1. BotFather
1. `/newbot` → створи бота
2. `/newapp` → створи Mini App
3. Скопіюй токен

### 2. Cloudflare
1. Створи Worker
2. Створи KV Namespace `PETS`
3. Додай Secret `BOT_TOKEN`
4. Прив’яжи KV binding `PETS`

### 3. Деплой
```bash
cd worker
npm install
npx wrangler deploy
```

Frontend можна залити на Cloudflare Pages або віддавати прямо з Worker.

## Структура
```
frontend/          # Mini App
worker/            # Cloudflare Worker
  src/
    index.ts
    auth.ts
    pet.ts
    dialogues.ts
    types.ts
sprites/           # сюди кидай 32x32 png
```

## Фічі
- Різні раси + випадкові риси при вилупленні
- Голод / настрій / affection
- Матюки залежно від рис (ніжні / грубі)
- Еволюція від стилю догляду
- Нічний режим
- Кладовище
- Випадкові події
- Анімації + звуки (Web Audio + Haptic)
