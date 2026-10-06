import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'SQUADCRAFT — Premium 3D Football Manager Web Experience',
  description: 'Next-generation cinematic football management web application. Career Mode, Draft League, 3D tactical radar, and live simulation.',
  keywords: ['football manager', 'squadcraft', '3d simulation', 'tactics', 'draft league', 'career mode'],
  authors: [{ name: 'SquadCraft Team' }],
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: '#090B10',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <body className="bg-[#050806] text-[#F8FAFC] antialiased selection:bg-[#b7ff35] selection:text-black">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
