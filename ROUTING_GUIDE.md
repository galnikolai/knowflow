# Роутинг в Next.js - Руководство

## Как работает роутинг в Next.js App Router

### 1. Файловая система = маршруты

В Next.js маршруты создаются автоматически на основе структуры папок в директории `app/`:

```
app/
  page.tsx              → /
  login/
    page.tsx            → /login
  collection/
    page.tsx            → /collection
  trainer/
    page.tsx            → /trainer
    challenges/
      page.tsx          → /trainer/challenges
    graph/
      page.tsx          → /trainer/graph
    cards/
      page.tsx          → /trainer/cards
    study/
      page.tsx          → /trainer/study
  graph/
    page.tsx            → /graph
  settings/
    page.tsx            → /settings
```

### 2. Специальные файлы

- **`layout.tsx`** - общий layout для всех дочерних роутов
- **`page.tsx`** - страница роута (обязателен для маршрута)
- **`loading.tsx`** - компонент загрузки
- **`error.tsx`** - обработка ошибок
- **`not-found.tsx`** - страница 404
- **`route.ts`** - API endpoints

### 3. Навигация

Вместо `react-router-dom` используйте `next/link` и `next/navigation`:

```tsx
// Вместо <Link to="/login">
import Link from 'next/link'
<Link href="/login">Войти</Link>

// Вместо useNavigate()
import { useRouter } from 'next/navigation'
const router = useRouter()
router.push('/login')
```

### 4. Защита роутов (Middleware)

Используйте `middleware.ts` в корне проекта для защиты роутов:

```ts
// middleware.ts
export function middleware(request: NextRequest) {
  // Проверка аутентификации
}
```

### 5. Преимущества Next.js роутинга

- ✅ Автоматическая маршрутизация
- ✅ Server Components (по умолчанию)
- ✅ Оптимизация производительности
- ✅ SEO-friendly
- ✅ Code splitting автоматически
- ✅ Prefetching ссылок

