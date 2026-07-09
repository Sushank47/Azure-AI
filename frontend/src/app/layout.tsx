import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MainLayout from "../components/MainLayout";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FAQ Search Bot",
  description: "AI Search Assistant powered by Azure OpenAI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-200">
        <Suspense fallback={
          <div className="flex-1 flex items-center justify-center bg-background min-h-screen">
            <div className="flex flex-col items-center gap-3">
              <span className="h-8 w-8 rounded-lg bg-indigo-600 animate-bounce" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest animate-pulse">Loading Workspace</span>
            </div>
          </div>
        }>
          <MainLayout>{children}</MainLayout>
        </Suspense>
      </body>
    </html>
  );
}
