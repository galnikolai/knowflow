import type { Metadata } from "next";
import "./index.css";
import { Providers } from "./components/Providers";
import { Geist } from "next/font/google";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});
export const metadata: Metadata = {
  title: "KnowFlow",
  description: "KnowFlow Application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={geistSans.className}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
