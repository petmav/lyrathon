import type { Metadata } from 'next';
import './globals.css';
import CandidateRedirect from '@/components/CandidateRedirect';

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
      <body>
        <CandidateRedirect />
        {children}
      </body>
    </html>
  );
}
