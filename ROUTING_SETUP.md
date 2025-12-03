# Настройка роутинга Next.js - Итоги

## ✅ Что было сделано:

### 1. Создана структура роутов Next.js

```
src/app/
  ├── page.tsx                    → / (редирект на /collection)
  ├── layout.tsx                  → Корневой layout с провайдерами
  ├── login/
  │   └── page.tsx                → /login
  ├── collection/
  │   └── page.tsx                → /collection
  ├── trainer/
  │   ├── layout.tsx              → Layout для всех trainer роутов
  │   ├── page.tsx                → /trainer (редирект на /trainer/challenges)
  │   ├── challenges/
  │   │   └── page.tsx            → /trainer/challenges
  │   ├── graph/
  │   │   └── page.tsx            → /trainer/graph
  │   ├── cards/
  │   │   └── page.tsx            → /trainer/cards
  │   └── study/
  │       └── page.tsx            → /trainer/study
  ├── graph/
  │   └── page.tsx                → /graph
  └── settings/
      └── page.tsx                → /settings
```

### 2. Обновлены компоненты для Next.js

- ✅ `ThemeContext.tsx` - использует `usePathname` вместо `useLocation`
- ✅ `Sidebar.tsx` - использует `Link` из `next/link` и `usePathname`
- ✅ `LoginForm.tsx` - использует `useRouter` из `next/navigation`
- ✅ `Trainer.tsx` - использует `children` вместо `Outlet`

### 3. Созданы компоненты

- ✅ `Providers.tsx` - обертка с провайдерами (Theme, Sidebar, Auth)
- ✅ `RequireAuth.tsx` - защита роутов (аналог старого RequireAuth)

## 📝 Как использовать:

### Навигация

```tsx
// Вместо react-router-dom
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Ссылки
<Link href="/collection">Коллекция</Link>

// Программная навигация
const router = useRouter()
router.push('/login')
router.replace('/collection')
```

### Получение текущего пути

```tsx
import { usePathname } from 'next/navigation'

const pathname = usePathname() // '/collection'
```

### Защита роутов

Используйте компонент `RequireAuth`:

```tsx
import { RequireAuth } from '../components/RequireAuth'

export default function ProtectedPage() {
  return (
    <RequireAuth>
      <YourComponent />
    </RequireAuth>
  )
}
```

## 🔄 Что нужно обновить в компонентах:

Если в других компонентах используется `react-router-dom`, замените:

| React Router | Next.js |
|-------------|---------|
| `import { Link } from 'react-router-dom'` | `import Link from 'next/link'` |
| `<Link to="/path">` | `<Link href="/path">` |
| `useNavigate()` | `useRouter()` из `next/navigation` |
| `navigate('/path')` | `router.push('/path')` |
| `useLocation()` | `usePathname()` из `next/navigation` |
| `<Outlet />` | `{children}` в layout |

## 🚀 Преимущества Next.js роутинга:

1. **Автоматическая маршрутизация** - не нужно настраивать routes
2. **Server Components** - лучшая производительность
3. **Code Splitting** - автоматически
4. **SEO** - лучше для поисковых систем
5. **Prefetching** - ссылки предзагружаются автоматически

## ⚠️ Важно:

- Все страницы должны быть в папке `app/`
- Каждый роут должен иметь `page.tsx`
- Layout применяется ко всем дочерним роутам
- Используйте `"use client"` для клиентских компонентов

