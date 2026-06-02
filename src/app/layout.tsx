import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Poni Rampi",
  description: "Random Pick Tool for Streamers"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
