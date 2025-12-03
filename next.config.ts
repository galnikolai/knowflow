import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Используем только App Router, игнорируем Pages Router
  pageExtensions: ["tsx", "ts", "jsx", "js"],
  transpilePackages: [
    "@radix-ui/react-avatar",
    "@radix-ui/react-collapsible",
    "@radix-ui/react-context-menu",
    "@radix-ui/react-dialog",
    "@radix-ui/react-dropdown-menu",
    "@radix-ui/react-label",
    "@radix-ui/react-popover",
    "@radix-ui/react-progress",
    "@radix-ui/react-separator",
    "@radix-ui/react-slot",
    "@radix-ui/react-switch",
    "@radix-ui/react-tooltip",
  ],
  // Конфигурация Turbopack для Next.js 16
  turbopack: {
    root: __dirname,
    resolveAlias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Экспериментальные функции для поддержки Tailwind CSS v4
  experimental: {
    optimizePackageImports: ["tailwindcss"],
  },
  // Для Docker деплоя (опционально)
  // output: 'standalone',
};

export default nextConfig;
