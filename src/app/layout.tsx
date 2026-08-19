import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { AppShell } from "@/components/AppShell";
import { MonetizationFooter } from "@/components/monetization";
import { DomainMigrationBanner } from "@/components/DomainMigrationBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "S2 개척 가이드 | 삼국지 천하결전",
  description:
    "삼국지 천하결전 / 삼국:모정천하 S3 시즌(글로벌 S2) 개척 초보용 튜토리얼 오버레이",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <AuthProvider>
            <DomainMigrationBanner />
            <AppShell>
              <div className="flex-1">{children}</div>
              <MonetizationFooter />
            </AppShell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
