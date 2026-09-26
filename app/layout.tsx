import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Players — Bloxd.io Developer Hub',
  description: 'Players: documentation, Code Lab, Developer Tools, BloxdBench and AI assistant for Bloxd.io.',
  icons: {icon: '/favicon.png'},
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
