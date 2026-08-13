import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OptiPhoenix Survey Tool",
  description: "Client feedback surveys for OptiPhoenix teams",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
