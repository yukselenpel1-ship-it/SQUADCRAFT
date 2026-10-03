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
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <body className="bg-[#040711] text-[#F8FAFC] antialiased selection:bg-[#00F5A0] selection:text-black">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
