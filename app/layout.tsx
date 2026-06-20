import type { Metadata } from 'next';
import { Inter, Barlow } from 'next/font/google'; // Mengimpor font sesuai panduan proyek
import './globals.css';

// Font untuk data, angka, nilai sensor, dan teks umum (Sangat presisi dan bersih)
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

// Font untuk Judul, Rambu, dan Label Utama (Tegas, tebal, dan kokoh khas konstruksi)
const barlow = Barlow({
  variable: '--font-barlow',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Smart Water Flowmeter — KSCS Package 2',
  description:
    'Telemetry Control System - Karian Dam-Serpong Water Conveyance System Project Package II',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang='id'
      className={`${inter.variable} ${barlow.variable} h-full antialiased`}
    >
      <body className='min-h-full flex flex-col bg-[#F8FAFC]'>{children}</body>
    </html>
  );
}
