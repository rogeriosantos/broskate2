import './globals.css';
import type { Metadata } from 'next';
import { Inter, Oswald } from 'next/font/google';
import { Providers } from './providers';
import { NavBar } from '../components/layout/NavBar';
import { Footer } from '../components/layout/Footer';
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const oswald = Oswald({
  subsets: ['latin'],
  variable: '--font-oswald',
});

export const metadata: Metadata = {
  title: 'BroSkate - Skateboarding Social Network',
  description: 'Connect with local skate shops, discover spots, and build your skateboarding community',
  keywords: ['skateboarding', 'skate spots', 'skate shops', 'community', 'social network'],
  authors: [{ name: 'BroSkate Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#0ea5e9',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en' className={`${inter.variable} ${oswald.variable}`}>
      <body className='min-h-screen bg-gray-50 font-sans antialiased'>
        <Providers>
          <div className='flex min-h-screen flex-col'>
            <NavBar />
            <main className='flex-1'>{children}</main>
            <Footer />
          </div>
          <Toaster
            position='top-right'
            toastOptions={{
              duration: 4000,
              className: 'bg-white border border-gray-200 text-gray-900',
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
