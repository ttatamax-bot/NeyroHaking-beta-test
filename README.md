# НейроХакинг

Статическое веб-приложение (React + Vite + TypeScript + Tailwind CSS).

## Локальная разработка

```bash
pnpm install
pnpm --filter @workspace/neurohacking run dev
```

## Сборка

```bash
pnpm --filter @workspace/neurohacking run build
```

## GitHub

1. Распакуйте архив в папку репозитория.
2. Выполните:

```bash
git init
git add .
git commit -m "Initial commit: НейроХакинг"
git remote add origin https://github.com/ВАШ_ЛОГИН/ВАШ_РЕПО.git
git push -u origin main
```

## Vercel

1. Импортируйте репозиторий на [vercel.com](https://vercel.com).
2. **Root Directory** — корень репозитория.
3. Настройки подхватываются из `vercel.json`.
4. Deploy.

## Структура

```
artifacts/neurohacking/   ← основное веб-приложение
artifacts/api-server/     ← API-сервер
lib/                     ← общие библиотеки
scripts/                 ← скрипты
```

## Иконка

Иконка приложения добавлена как:
- `favicon.ico` — во вкладке браузера
- `favicon.svg` — векторная иконка
- `apple-touch-icon.png` — для iOS/айфона
- `icon-192x192.png` / `icon-512x512.png` — для PWA/manifest
- `manifest.json` — поддержка добавления на рабочий стол

## Технологии

- React 19 + Vite + TypeScript
- Tailwind CSS 4
- shadcn/ui компоненты
- Framer Motion
- Recharts
