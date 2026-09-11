import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import SmartAssistant from "@/components/common/SmartAssistant";
import NotificationToast from "@/components/common/NotificationToast";
import PwaRegistration from "@/components/common/PwaRegistration";
import PwaLanguageModal from "@/components/common/PwaLanguageModal";
import GlobalLanguageBridge from "@/components/common/GlobalLanguageBridge";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  themeColor: "#136B3B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "ScrapMax - Eco-Waste & Circular Recycling System",
    template: "%s | ScrapMax",
  },
  description: "Connect households with local scrap collectors for honest waste pickups, real-time smart alerts, and circular recycling.",
  applicationName: "ScrapMax",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ScrapMax",
  },
  openGraph: {
    title: "ScrapMax - Eco-Waste & Circular Recycling System",
    description: "Turn household recyclables into value with ScrapMax circular scrap pickups.",
    siteName: "ScrapMax",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} font-sans h-full antialiased selection:bg-[#E6F4EA] selection:text-[#136B3B]`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full flex flex-col bg-[#F7F9FA] text-[#191C1E] font-sans">
        {children}
        <NotificationToast />
        <SmartAssistant />
        <PwaRegistration />
        <PwaLanguageModal />
        <GlobalLanguageBridge />
      </body>
    </html>
  );
}
