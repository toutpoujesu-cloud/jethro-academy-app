import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title:       { template: '%s | Jethro Academy', default: 'Jethro Academy' },
  description: 'Faith-based professional development platform',
  manifest:    '/manifest.json',
  appleWebApp: {
    capable:    true,
    statusBarStyle: 'black-translucent',
    title:      'Jethro Academy',
  },
  icons: {
    icon:  [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
    shortcut: '/favicon.ico',
  },
  openGraph: {
    type:        'website',
    siteName:    'Jethro Academy',
    title:       'Jethro Academy',
    description: 'Faith-based professional development platform',
    images:      [{ url: '/icons/icon-512.png', width: 512, height: 512 }],
  },
};

export const viewport: Viewport = {
  themeColor:    '#0B1C3E',
  width:         'device-width',
  initialScale:  1,
  maximumScale:  1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Playfair Display — serif heading font */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
