import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import SmartAssistant from "@/components/common/SmartAssistant";
import NotificationToast from "@/components/common/NotificationToast";
import PwaRegistration from "@/components/common/PwaRegistration";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Sampah Jujur - Eco-Waste & Circular Recycling System",
  description: "Connect households with local scrap collectors for honest waste pickups, real-time push alerts, and circular recycling.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ScrapMax",
  },
};

export const viewport: Viewport = {
  themeColor: "#136B3B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
      </body>
    </html>
  );
}

