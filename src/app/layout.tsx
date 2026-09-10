import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import SmartAssistant from "@/components/common/SmartAssistant";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  themeColor: "#136B3B",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "AiCLE - Eco-Waste & Circular Recycling System",
    template: "%s | AiCLE",
  },
  description: "Connect households with local scrap collectors for honest waste pickups and circular recycling with AiCLE.",
  applicationName: "AiCLE",
  manifest: "/manifest.webmanifest",
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
    title: "AiCLE",
  },
  openGraph: {
    title: "AiCLE - Eco-Waste & Circular Recycling System",
    description: "Turn household recyclables into value with AiCLE circular scrap pickups.",
    siteName: "AiCLE",
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
      <body className="min-h-full flex flex-col bg-[#F7F9FA] text-[#191C1E] font-sans">
        {children}
        <SmartAssistant />
      </body>
    </html>
  );
}
