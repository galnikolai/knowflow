# Исправление стилей и i18n

## Проблемы и решения

### 1. Стили Tailwind CSS не работают

**Проблема:** Tailwind CSS v4 использует новый синтаксис `@import "tailwindcss"`, который может не работать правильно с Turbopack в Next.js 16.

**Решение:**
- ✅ Импорт стилей в `layout.tsx`: `import "./index.css"`
- ✅ Использование синтаксиса Tailwind v4: `@import "tailwindcss"`
- ✅ Очистка кеша Next.js: `rm -rf .next`

**Если стили все еще не работают:**

1. Проверьте, что файл `src/app/index.css` импортируется в `layout.tsx`
2. Убедитесь, что используется Tailwind CSS v4 (`@import "tailwindcss"`)
3. Перезапустите сервер после изменений

### 2. i18n не работает

**Проблема:** i18n не инициализировался, так как конфигурация не импортировалась.

**Решение:**
- ✅ Добавлен импорт в `Providers.tsx`: `import "@/shared/i18n/config"`
- ✅ i18n теперь инициализируется при загрузке приложения

**Проверка работы i18n:**

```tsx
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()
  return <div>{t('sidebar.collection')}</div>
}
```

## Текущая конфигурация

### Стили
- **Tailwind CSS v4.1.13** - используется новый синтаксис
- **Файл стилей:** `src/app/index.css`
- **Импорт:** в `src/app/layout.tsx`

### i18n
- **Конфигурация:** `src/shared/i18n/config.ts`
- **Инициализация:** в `src/app/components/Providers.tsx`
- **Языки:** ru (по умолчанию), en

## Если проблемы сохраняются

1. **Очистите кеш:**
   ```bash
   rm -rf .next
   npm run dev
   ```

2. **Проверьте консоль браузера** на наличие ошибок

3. **Проверьте, что файлы существуют:**
   - `src/app/index.css`
   - `src/shared/i18n/config.ts`
   - `src/shared/i18n/locales/ru.json`
   - `src/shared/i18n/locales/en.json`

4. **Перезапустите сервер разработки**

