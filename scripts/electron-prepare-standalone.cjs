/**
 * После `next build` с output: "standalone" копирует public и .next/static
 * в .next/standalone (требование Next.js для автономного сервера).
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const standalone = path.join(root, ".next", "standalone");
const publicSrc = path.join(root, "public");
const staticSrc = path.join(root, ".next", "static");
const staticDest = path.join(standalone, ".next", "static");

if (!fs.existsSync(standalone)) {
  console.error(
    "Ошибка: нет .next/standalone. Сначала выполните: npm run build (с output: standalone в next.config)."
  );
  process.exit(1);
}

if (fs.existsSync(publicSrc)) {
  const publicDest = path.join(standalone, "public");
  fs.cpSync(publicSrc, publicDest, { recursive: true });
  console.log("electron-prepare: public → standalone/public");
}

if (fs.existsSync(staticSrc)) {
  fs.mkdirSync(path.dirname(staticDest), { recursive: true });
  fs.cpSync(staticSrc, staticDest, { recursive: true });
  console.log("electron-prepare: .next/static → standalone/.next/static");
} else {
  console.warn("electron-prepare: .next/static не найден (возможно пустая сборка)");
}
