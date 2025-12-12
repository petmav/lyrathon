import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lyrathon - RAG Pipeline Application',
  description: 'A Next.js application with RAG (Retrieval-Augmented Generation) pipeline capabilities',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
