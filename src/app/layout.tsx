import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
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
    <html lang="en" className={`h-full ${dmSans.variable}`}>
      <body className={`${dmSans.className} flex min-h-full flex-col bg-background text-foreground`}>
        {children}
      </body>
    </html>
  );
}
