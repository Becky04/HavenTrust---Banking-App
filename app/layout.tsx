import type { Metadata } from "next";
import { Inter, IBM_Plex_Serif, Geist } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { cn } from "@/lib/utils";
import { Toaster } from "react-hot-toast";
import InactivityTracker from "@/components/InactivityTracker";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const ibmPlexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-ibm-plex-serif",
});

export const metadata: Metadata = {
  title: "HavenTrust",
  description: "HavenTrust is a modern banking platform for everyone.",
  icons: {
    icon: "/icons/logo.svg",
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
      className={cn(
        inter.variable,
        ibmPlexSerif.variable,
        "font-sans",
        geist.variable,
      )}
    >
      <body>
        <InactivityTracker>{children}</InactivityTracker>
        <Script
          src="https://connect.withmono.com/connect.js"
          strategy="afterInteractive"
        />
        <Toaster />
      </body>
    </html>
  );
}
