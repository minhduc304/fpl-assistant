import type { Metadata } from "next";
import { Anton, Martian_Mono } from "next/font/google";
import { PageShell } from "@/components/page-shell";
import "./globals.css";

const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
});

const martianMono = Martian_Mono({
  variable: "--font-martian-mono",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FPL Assistant",
  description: "Enter your FPL team ID to see your squad, points, and recommendations.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${martianMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PageShell>{children}</PageShell>
      </body>
    </html>
  );
}
