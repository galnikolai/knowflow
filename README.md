# KnowFlow

Приложение для управления знаниями с поддержкой заметок, карточек для изучения и графа знаний.

## Архитектура проекта

Веб-приложение построено на **Next.js 16 (Pages Router)** с организацией UI по принципам **Feature-Sliced Design (FSD)**.

### Структура проекта

```
pages/                      # Next.js Pages Router (маршруты)
├── _app.tsx               # Провайдеры, инициализация auth
├── collection.tsx         # Коллекция заметок
├── graph.tsx              # Граф знаний
├── trainer/               # Тренировки (карточки, квиз, study)
└── api/                   # Serverless API routes

src/
├── views/                 # UI-страницы (композиция виджетов)
├── widgets/               # Крупные UI-блоки (sidebar и др.)
├── entities/              # Бизнес-сущности (card, note, login-form)
├── shared/                # API, store, ui, hooks, i18n
├── lib/                   # Утилиты
└── __tests__/             # Тесты Vitest

middleware.ts              # Защита маршрутов (Supabase session cookies)
mobile/                    # Expo React Native приложение
electron/                  # Electron desktop
supabase/migrations/       # SQL-миграции с RLS
```

### Маршрутизация

- `/` → редирект на `/collection`
- `/login` — публичная страница входа
- `/collection`, `/graph`, `/settings`, `/analytics`, `/trainer/*` — защищены `middleware.ts` и `RequireAuth`

### API routes

| Endpoint | Назначение | Защита |
|----------|------------|--------|
| `/api/generate-flashcards` | AI-генерация карточек | JWT + rate limit |
| `/api/generate-quiz` | AI-генерация квиза | JWT + rate limit |
| `/api/telegram/generate-link` | Код привязки Telegram | JWT |
| `/api/telegram/webhook` | Webhook бота | Secret token |
| `/api/telegram/send-cards` | Cron-рассылка карточек | `TELEGRAM_CRON_SECRET` |

## Технологический стек

- **Frontend**: React 19, TypeScript, Next.js 16 (Pages Router, Turbopack)
- **Mobile**: Expo 55, React Native
- **Desktop**: Electron
- **UI**: Tailwind CSS 4, shadcn/ui, Radix UI
- **Auth**: Supabase Auth (`@supabase/ssr` cookies + middleware)
- **Состояние**: Zustand
- **Backend**: Supabase (Postgres + RLS)
- **Редактор**: TipTap
- **Граф**: react-force-graph-2d
- **Тесты**: Vitest
- **Сборка desktop**: electron-builder

## Правила импортов FSD

### ✅ Разрешенные импорты

1. **App** может импортировать из всех слоев
2. **Pages** может импортировать из widgets, features, entities, shared
3. **Widgets** может импортировать из features, entities, shared
4. **Features** может импортировать из entities, shared
5. **Entities** может импортировать только из shared
6. **Shared** не может импортировать из других слоев

### ❌ Запрещенные импорты

- Импорты из верхних слоев в нижние
- Циклические зависимости между слайсами
- Прямые импорты между фичами

## Примеры использования

### Создание новой фичи

```typescript
// features/new-feature/ui/NewFeature.tsx
import { Button } from "@/shared/ui/button";
import { useNewFeatureStore } from "@/shared/store/useNewFeatureStore";

export const NewFeature = () => {
  const { data, isLoading } = useNewFeatureStore();
  
  return (
    <div>
      <Button onClick={handleAction}>
        {isLoading ? "Loading..." : "Action"}
      </Button>
    </div>
  );
};
```

### Создание новой сущности

```typescript
// entities/new-entity/NewEntity.tsx
import { Card } from "@/shared/ui/card";

interface NewEntityProps {
  data: EntityData;
  onAction: () => void;
}

export const NewEntity = ({ data, onAction }: NewEntityProps) => {
  return (
    <Card>
      <h3>{data.title}</h3>
      <button onClick={onAction}>Action</button>
    </Card>
  );
};
```

## Преимущества архитектуры

1. **Масштабируемость** - легко добавлять новые фичи и сущности
2. **Переиспользование** - shared ресурсы используются везде
3. **Понятность** - четкое разделение ответственности
4. **Тестируемость** - изолированные модули легко тестировать
5. **Командная работа** - разные разработчики могут работать над разными слоями

## Запуск проекта

### Веб-версия

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Сборка для продакшена
npm run build

# Линтинг
npm run lint
```

### Десктоп-версия (Electron)

**Разработка** (окно Electron + Next на `localhost:3000`):

```bash
npm install
npm run electron:dev
```

**Установка на Mac без отдельного `npm start`** (внутри приложения поднимается Next.js `standalone` на `127.0.0.1:30443`):

```bash
npm install
npm run electron:dist
```

В каталоге `dist-electron/` появится **DMG** (например `KnowFlow-*.dmg`). Откройте его и перетащите KnowFlow в **Программы**. Запуск не требует терминала и внешнего localhost.

Перед сборкой нужен успешный `next build` с `output: "standalone"` (уже в `next.config.ts`). Скрипт `npm run electron:prepare` копирует `public` и `.next/static` в standalone для корректной работы статики.

**Переменная порта** (редко нужно): `KNOWFLOW_PORT=30444 npm run electron:dist` — порт вшит в собранное приложение через окружение на этапе **запуска**; по умолчанию используется `30443`.

**Если при запуске приложения пишет, что сервер не поднялся:** чаще всего порт **30443** уже занят (вторая копия KnowFlow, старый процесс) — закройте лишние экземпляры или задайте другой порт: `KNOWFLOW_PORT=30444 open -a KnowFlow` (путь к `.app` подставьте свой). Перед пересборкой DMG выполните `npm run build && npm run electron:prepare`. Диагностика встроенного Next: из терминала  
`KNOWFLOW_DEBUG=1 /Applications/KnowFlow.app/Contents/MacOS/KnowFlow`  
(в лог пойдёт stdout/stderr процесса `server.js`).

**Если сборка падает с таймаутом при скачивании Electron** (`github.com/electron/...: connect: operation timed out`):

- В `package.json` для `electron-builder` задано зеркало **`https://npmmirror.com/mirrors/electron/`** — повторите `npm run electron:dist`.
- Если нужен именно GitHub (VPN, другая сеть):  
  `npm run electron:dist:github`
- Вручную:  
  `ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ npm run electron:dist`  
  или любое другое зеркало в формате `@electron/get` / `electron-builder`.
- Заранее подтянуть бинарник в кэш: `npx electron --version` (иногда помогает, если доступен реестр npm).

**Подпись на macOS:** в `package.json` **не** задан жёсткий `mac.identity` — иначе `electron-builder` подписывает даже при `CSC_IDENTITY_AUTO_DISCOVERY=false`, и скрипт «без подписи» не срабатывает.

- **`npm run electron:dist`** — подпись **автовыбором** (первый подходящий сертификат на машине).
- **`npm run electron:dist:signed`** — подпись через переменную `CSC_NAME` (задайте сертификат в окружении).
- **`npm run electron:dist:unsigned`** — **без подписи** (`CSC_IDENTITY_AUTO_DISCOVERY=false` + `env`, без `mac.identity`). DMG соберётся; при первом запуске — **ПКМ → Открыть** в Gatekeeper.

Если окно связки ключей **не принимает пароль** при подписи — это пароль связки «login» / доступ к ключу; для локальной сборки используйте **`electron:dist:unsigned`**.

Вручную: `CSC_NAME="Apple Development: …" npm run electron:dist` (после `build` и `electron:prepare`).

**Доступные команды:**
- `npm run electron:dev` — разработка (Next dev + Electron)
- `npm run electron:dist` — DMG для macOS (`electron-builder`, публикация отключена)
- `npm run electron:build` — то же, что `electron:dist` в этом проекте

## Переменные окружения

Скопируйте `.env.example` в `.env.local` и заполните значения:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Telegram (опционально)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CRON_SECRET=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_LINK_SECRET=
TELEGRAM_ADMIN_SECRET=

# AI (опционально)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

**Важно:** не коммитьте `.env` и `.env.local` в Git. Файлы `.env` и `mobile/.env` должны оставаться только локально.

---

*Данная архитектура обеспечивает чистый, масштабируемый и поддерживаемый код, следуя принципам Feature-Sliced Design.*