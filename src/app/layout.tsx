import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import SmartAssistant from "@/components/common/SmartAssistant";
import NotificationToast from "@/components/common/NotificationToast";
import PwaRegistration from "@/components/common/PwaRegistration";
import GovFooter from "@/components/gov/GovFooter";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  themeColor: "#046A38",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "ScrapMax | National Circular Economy & Digital Scrap Logistics Portal",
    template: "%s | ScrapMax · Government of India / SIH",
  },
  description: "Official Smart India Hackathon (SIH) portal for doorstep recyclable scrap collection, authorized kabadiwala formalization, direct UPI DBT, and CPCB Extended Producer Responsibility (EPR) compliance.",
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
    title: "ScrapMax | National Circular Economy & Digital Scrap Logistics Portal",
    description: "Official Government of India / SIH platform for transparent doorstep recyclable scrap pickups and EPR circularity.",
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
      className={`${plusJakartaSans.variable} font-sans h-full antialiased selection:bg-[#E6F4EA] selection:text-[#046A38]`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full flex flex-col bg-[#F7F9FA] text-[#191C1E] font-sans">
        <div className="flex-1 flex flex-col">
          {children}
        </div>
        <GovFooter />
        <NotificationToast />
        <SmartAssistant />
        <PwaRegistration />
      </body>
    </html>
  );
}
