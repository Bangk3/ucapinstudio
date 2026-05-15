import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | Invyte",
    default: "Invyte — Digital Wedding Invitation Platform",
  },
  description:
    "Open-source, self-hosted digital wedding invitation platform for Indonesia and beyond.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
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
