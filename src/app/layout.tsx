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

export const metadata: Metadata = {
  title: "Ravi Genuine Autos - Quality Auto Parts in Pakistan",
  description:
    "Pakistan's trusted source for genuine new and used auto parts. Shop for Suzuki, Toyota, Honda, KIA, MG, CHANGAN & All Wheel Drive models. AI-powered part search. Contact: 0320-0408917",
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
    "Ravi Genuine Autos",
    "vehicle parts Lahore",
  ],
  authors: [{ name: "Ravi Genuine Autos" }],
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Ravi Genuine Autos - Quality Auto Parts in Pakistan",
    description:
      "New & used genuine auto parts for Suzuki, Toyota, Honda, KIA, MG, CHANGAN & All Wheel Drive models. AI-powered search. Call: 0320-0408917",
    siteName: "Ravi Genuine Autos",
    type: "website",
    images: [{ url: "/logo.png", width: 1024, height: 1024, alt: "Ravi Genuine Autos Logo" }],
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
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
