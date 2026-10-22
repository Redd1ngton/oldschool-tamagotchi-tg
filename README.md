# Oldschool Tamagotchi — Telegram Mini App

Олдскульне Тамагочі. Класичні тваринки, що матюкаються, сваряться і люблять.

**Все на одному Cloudflare Worker.**

## Швидкий деплой

```bash
cd worker
npm install
npx wrangler secret put BOT_TOKEN     # вставити токен від BotFather
# у wrangler.toml вказати id свого KV namespace (binding PETS)
npx wrangler deploy
```

Після деплою відкрий `https://твій-воркер.workers.dev` — там і фронт, і API.

У BotFather вкажи цей самий URL як Web App URL.

## Персонажі
Свинка · Котик · Курочка · Динозаврик · Зайчик · Песик · Ведмедик · Жабка

Риси: toxic / loving / tsundere / lazy / chaotic / nostalgic  
(всі матюкаються, стиль залежить від рис)

## Фічі
- Голод / настрій / affection
- Еволюція (яйце → baby → child → teen → adult)
- Смерть і перезапуск
- Нічний режим (00:00–06:00)
- Haptic feedback
