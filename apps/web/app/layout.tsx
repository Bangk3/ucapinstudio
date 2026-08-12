import type { Metadata } from "next";
import { Bodoni_Moda, Cormorant_Infant, Great_Vibes, Inter, Playfair_Display } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const cormorant = Cormorant_Infant({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  variable: "--font-script",
  weight: "400",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-bodoni",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | UcapinStudio",
    default: "UcapinStudio — Digital Wedding Invitation Platform",
  },
  description: "Digital wedding invitation platform for Indonesia and beyond.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${cormorant.variable} ${greatVibes.variable} ${playfair.variable} ${bodoni.variable} font-sans antialiased`}
      >
        <NextTopLoader
          color="var(--color-primary)"
          height={2}
          shadow={false}
          showSpinner={false}
          easing="ease"
          speed={200}
          crawlSpeed={200}
        />
        {children}
      </body>
    </html>
  );
}
