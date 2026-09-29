import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'SquadCraft — Özgün Futbol Menajerlik Simülasyonu',
  description: 'Kendi kulübünüzü yönetin, taktiklerinizi geliştirin ve şampiyonluk yolunda SquadCraft evrenine hükmedin.',
  keywords: ['futbol menajerlik', 'football manager', 'squadcraft', 'simülasyon', 'taktik', 'transfer'],
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <body className="bg-[#090B10] text-[#F3F4F6] antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
