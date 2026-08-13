import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OptiPhoenix Survey Tool",
  description: "Client feedback surveys for OptiPhoenix teams",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
