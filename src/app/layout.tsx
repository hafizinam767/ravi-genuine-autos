import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const defaultUrl = process.env.NEXT_PUBLIC_APP_URL
  ? new URL(process.env.NEXT_PUBLIC_APP_URL)
  : new URL(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: defaultUrl,
  title: "Genuine Autos Legacy - Quality Auto Parts in Pakistan",
  description:
    "Genuine Parts for Suzuki, Toyota, Honda, KIA, MG, CHANGAN & ALL Wheel Drive Models. Near Ali Town Orange Line Station & Pizza Online Basement, Faisal Zaman Plaza, Thokar Niaz Baig, Raiwind Road Lahore, Pakistan. Contact: Mehar Zulfeqar Ali +92-332-4131636 / +92-326-4748635. Mon-Sat: 9AM-10PM, Sun: 10AM-10PM",
  keywords: [
    "auto parts Pakistan",
    "genuine car parts",
    "Suzuki parts",
    "Toyota parts",
    "Honda parts",
    "KIA parts",
    "MG parts",
    "CHANGAN parts",
    "used auto parts",
    "new auto parts",
    "Genuine Autos Legacy",
    "vehicle parts Lahore",
  ],
  authors: [{ name: "Genuine Autos Legacy" }],
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Genuine Autos Legacy - Quality Auto Parts in Pakistan",
    description:
      "Genuine Parts for Suzuki, Toyota, Honda, KIA, MG, CHANGAN & ALL Wheel Drive Models. Near Ali Town Orange Line Station & Pizza Online Basement, Faisal Zaman Plaza, Thokar Niaz Baig, Raiwind Road Lahore, Pakistan. Call: Mehar Zulfeqar Ali +92-332-4131636 / +92-326-4748635",
    siteName: "Genuine Autos Legacy",
    type: "website",
    images: [{ url: "/logo.png", width: 1024, height: 529, alt: "Genuine Autos Legacy Logo" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
