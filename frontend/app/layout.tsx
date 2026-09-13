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
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
