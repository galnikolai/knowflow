# KnowFlow

Приложение для управления знаниями с поддержкой заметок, карточек для изучения и графа знаний.

## Архитектура проекта

Проект построен на основе методологии **Feature-Sliced Design (FSD)** - современного подхода к организации фронтенд-приложений, который обеспечивает масштабируемость, переиспользование кода и понятную структуру.

### Принципы FSD

1. **Слои** - вертикальное разделение по уровню абстракции
2. **Слайсы** - горизонтальное разделение по бизнес-логике
3. **Сегменты** - техническое разделение внутри слайса

### Структура проекта

```
src/
├── app/                    # Инициализация приложения
│   ├── App.tsx            # Корневой компонент
│   ├── main.tsx           # Точка входа
│   └── router/            # Конфигурация роутинга
├── pages/                 # Страницы приложения
│   ├── login/             # Страница авторизации
│   ├── notes/             # Страница заметок
│   ├── graph/             # Страница графа знаний
│   ├── study/             # Страница изучения
│   └── settings/          # Страница настроек
├── widgets/               # Крупные UI блоки
│   └── sidebar/           # Боковая панель навигации
├── features/              # Бизнес-функциональность
│   ├── auth/              # Авторизация
│   └── graph/             # Работа с графом знаний
├── entities/              # Бизнес-сущности
│   ├── card/              # Карточки для изучения
│   ├── login-form/        # Форма авторизации
│   ├── nav-user/          # Навигация пользователя
│   └── note/              # Заметки и редактор
├── shared/                # Переиспользуемые ресурсы
│   ├── api/               # API клиенты
│   ├── store/             # Глобальное состояние
│   ├── ui/                # UI компоненты
│   ├── hooks/             # Переиспользуемые хуки
│   └── config/            # Конфигурация
├── lib/                   # Утилиты
├── hooks/                 # Локальные хуки
electron/                   # Electron конфигурация
├── main.cjs              # Главный процесс Electron (CommonJS: при type:module .js был бы ESM)
scripts/                    # Скрипты для разработки
└── dev-electron.sh        # Скрипт запуска Electron
```

## Описание слоев

### 🚀 App (Приложение)
**Назначение**: Инициализация приложения, провайдеры, роутинг

**Содержимое**:
- `App.tsx` - корневой компонент с провайдерами
- `main.tsx` - точка входа в приложение
- `router/` - конфигурация React Router

**Особенности**:
- Инициализация Supabase клиента
- Настройка глобальных провайдеров (SidebarProvider)
- Обработка состояния аутентификации

### 📄 Pages (Страницы)
**Назначение**: Композиция страниц из виджетов и фич

**Содержимое**:
- `Login` - страница авторизации
- `Notes` - страница управления заметками
- `Graph` - страница графа знаний
- `Study` - страница изучения с карточками
- `Settings` - страница настроек

**Особенности**:
- Каждая страница композирует виджеты и фичи
- Минимальная бизнес-логика
- Фокус на композиции UI

### 🧩 Widgets (Виджеты)
**Назначение**: Крупные UI блоки, композирующие фичи и сущности

**Содержимое**:
- `sidebar/` - боковая панель навигации
  - `Sidebar` - основной компонент сайдбара
  - `NotesSidebar` - сайдбар для заметок
  - `GraphSidebar` - сайдбар для графа
  - `StudySidebar` - сайдбар для изучения
  - `SettingsSidebar` - сайдбар настроек

**Особенности**:
- Композируют фичи и сущности
- Содержат сложную UI логику
- Могут иметь собственное состояние

### ⚡ Features (Фичи)
**Назначение**: Бизнес-функциональность, пользовательские сценарии

**Содержимое**:
- `auth/` - функциональность авторизации
- `graph/` - работа с графом знаний

**Особенности**:
- Инкапсулируют пользовательские сценарии
- Могут использовать сущности и shared ресурсы
- Содержат бизнес-логику фичи

### 🏗️ Entities (Сущности)
**Назначение**: Бизнес-сущности приложения

**Содержимое**:
- `card/` - карточки для изучения
  - `Card.tsx` - компонент карточки
  - `CreateCardForm.tsx` - форма создания карточки
- `login-form/` - форма авторизации
- `nav-user/` - навигация пользователя
- `note/` - заметки и редактор
  - `NoteEditor.tsx` - редактор заметок (TipTap)
  - `FileTree.tsx` - дерево файлов
  - `Node.ts`, `Edge.ts` - типы для графа

**Особенности**:
- Представляют бизнес-объекты
- Содержат минимальную бизнес-логику
- Переиспользуются в фичах и виджетах

### 🔧 Shared (Общие ресурсы)
**Назначение**: Переиспользуемые ресурсы по всему приложению

**Содержимое**:
- `api/` - API клиенты
  - `supabase.ts` - клиент Supabase
  - `notes.ts` - API для заметок
  - `flashcards.ts` - API для карточек
- `store/` - глобальное состояние (Zustand)
  - `useUserStore.ts` - состояние пользователя
  - `useNotesStore.ts` - состояние заметок
  - `useFlashcardsStore.ts` - состояние карточек
  - `useGraphStore.ts` - состояние графа
- `ui/` - UI компоненты (shadcn/ui)
- `hooks/` - переиспользуемые хуки
- `config/` - конфигурация

**Особенности**:
- Используются во всех слоях
- Не содержат бизнес-логики
- Максимально переиспользуемы

## Технологический стек

- **Frontend**: React 19, TypeScript, Next.js 16 (Turbopack)
- **Desktop**: Electron
- **UI**: Tailwind CSS, shadcn/ui, Radix UI
- **Роутинг**: React Router v7
- **Состояние**: Zustand
- **Backend**: Supabase
- **Редактор**: TipTap
- **Граф**: React Force Graph, Three.js
- **Стилизация**: Tailwind CSS
- **Сборка**: electron-builder

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
- **`npm run electron:dist:signed`** — подпись сертификатом **Apple Development: galitskynikolai@yandex.ru (SG27MJ9RV2)** (смените в `package.json` в скрипте `electron:dist:signed`, если сертификат другой).
- **`npm run electron:dist:unsigned`** — **без подписи** (`CSC_IDENTITY_AUTO_DISCOVERY=false` + `env`, без `mac.identity`). DMG соберётся; при первом запуске — **ПКМ → Открыть** в Gatekeeper.

Если окно связки ключей **не принимает пароль** при подписи — это пароль связки «login» / доступ к ключу; для локальной сборки используйте **`electron:dist:unsigned`**.

Вручную: `CSC_NAME="Apple Development: …" npm run electron:dist` (после `build` и `electron:prepare`).

**Доступные команды:**
- `npm run electron:dev` — разработка (Next dev + Electron)
- `npm run electron:dist` — DMG для macOS (`electron-builder`, публикация отключена)
- `npm run electron:build` — то же, что `electron:dist` в этом проекте

## Переменные окружения

Создайте файл `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

*Данная архитектура обеспечивает чистый, масштабируемый и поддерживаемый код, следуя принципам Feature-Sliced Design.*