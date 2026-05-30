import './globals.css';
import type { Metadata } from 'next';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'Tempo AI Hub',
  description: 'Agentic AI Entertain Assistant',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-inter">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
