// src/app/layout.tsx
import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// Charger Poppins
const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'], 
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Maison d'Actions Solidaires",
  description: 'Ensemble pour l’inclusion et la solidarité',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={poppins.className}>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}