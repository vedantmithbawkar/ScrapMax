import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { I18nProvider } from "@/i18n/context";
import AIAssistant from "@/components/ai/AIAssistant";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Sampah Jujur - Eco-Waste & Circular Recycling System",
  description: "Connect households with local scrap collectors for honest waste pickups and circular recycling.",
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
        <I18nProvider>
          {children}
          <AIAssistant />
        </I18nProvider>
      </body>
    </html>
  );
}

