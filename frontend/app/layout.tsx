import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StructraMorph.ai — Precision Document Parsing & Component Segmentation",
  description:
    "Enterprise document deconstruction, semantic block-level classification, targeted surgical AI mutations, and multi-format recompilation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen bg-cyber-bg text-cyber-text">
        {children}
      </body>
    </html>
  );
}
