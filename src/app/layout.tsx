import type { Metadata, Viewport } from "next";
import OfflineModeGate from "@/components/OfflineModeGate";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import { GamificationProvider } from "@/contexts/GamificationContext";
import { BASE_PATH } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  title: "QingVoca - Chinese Vocabulary",
  description: "Chinese HSK4 vocabulary learning with Step-based quizzes",
  icons: {
    icon: [
      { url: `${BASE_PATH}/favicon.svg`, type: "image/svg+xml" },
      { url: `${BASE_PATH}/favicon-32x32.png`, sizes: "32x32", type: "image/png" },
      { url: `${BASE_PATH}/favicon-16x16.png`, sizes: "16x16", type: "image/png" },
      { url: `${BASE_PATH}/favicon.ico`, sizes: "32x32" },
    ],
    apple: {
      url: `${BASE_PATH}/apple-touch-icon.png`,
      sizes: "180x180",
      type: "image/png",
    },
  },
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
    <html lang="ko" suppressHydrationWarning>
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
