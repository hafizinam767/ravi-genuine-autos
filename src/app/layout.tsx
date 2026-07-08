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
    "Genuine Parts for Suzuki, Toyota, Honda, KIA, MG, CHANGAN & ALL Wheel Drive Models. Near Ali Town Orange Line Station, Thokar Niaz Baig, Raiwind Road, Lahore. Contact: Mehar Zulfeqar Ali 0320-0408917 / 0332-4131636. Mon-Sat: 9AM-10PM, Sun: 10AM-10PM",
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
      "Genuine Parts for Suzuki, Toyota, Honda, KIA, MG, CHANGAN & ALL Wheel Drive Models. Near Ali Town Orange Line Station, Thokar Niaz Baig, Lahore. Call: Mehar Zulfeqar Ali 0320-0408917 / 0332-4131636",
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
        suppressHydrationWarning
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
