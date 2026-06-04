import type { Metadata, Viewport } from "next";
import OfflineModeGate from "@/components/OfflineModeGate";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import { GamificationProvider } from "@/contexts/GamificationContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "QingVoca - Chinese Vocabulary",
  description: "Chinese HSK4 vocabulary learning with Step-based quizzes",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <GamificationProvider>
          <ServiceWorkerRegistrar />
          <OfflineModeGate />
          {children}
        </GamificationProvider>
      </body>
    </html>
  );
}
