import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";

import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: "grade · monte seu semestre", template: "%s · grade" },
  description:
    "Veja as disciplinas que você pode cursar e monte grades sem choque de horário com os dados públicos da UFOP.",
};

export const viewport: Viewport = {
  themeColor: "#962038",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-ground font-sans text-ink">{children}</body>
    </html>
  );
}
