// app/layout.tsx
import "./globals.css";
import { Roboto } from "next/font/google";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import { StudentProvider } from "./context/StudentContext";
import Header from "./components/Header";
import React from "react";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700"],
});

export const metadata = {
  title: "GradeUFOP",
  description: "Generated by create next app",
};

const HeaderWrapper = () => {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Header />
    </React.Suspense>
  );
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${roboto.className} min-h-screen`} suppressHydrationWarning={true}>
        <ThemeRegistry>
          <StudentProvider>
            <HeaderWrapper />
            <main className="pt-16 pb-8 px-4">{children}</main>
          </StudentProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}