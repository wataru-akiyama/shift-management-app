import type { Metadata } from "next";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "シフト管理・出勤退勤管理アプリ",
  description: "町民向けアプリテストの仕事を依頼する際のシフト管理・出退勤記録・給与計算システム",
  manifest: "/manifest.json",
  themeColor: "#3b82f6",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
