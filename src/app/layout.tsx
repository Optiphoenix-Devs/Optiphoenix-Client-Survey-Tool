import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "OptiPhoenix Survey Tool",
  description: "Client feedback surveys for OptiPhoenix teams",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`min-h-dvh ${dmSans.variable}`} suppressHydrationWarning>
      <body
        className={`${dmSans.className} flex min-h-dvh flex-col bg-background text-foreground`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
