import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MAGI SYSTEM",
  description: "NERV MAGI Decision Support System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
