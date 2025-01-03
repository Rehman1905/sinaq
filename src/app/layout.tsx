import Navbar from '../components/Navbar';
import '../styles/globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: "R sinaq - Sınaq saytı",
  description: "R sinaq, sınaq saytının pulsuz versiyasıdır.",

};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body className={inter.className}>
        <main className='h-screen flex flex-col justify-center items-center '>
          <Navbar />
          {children}
        </main>
      </body>
    </html>
  );
}
