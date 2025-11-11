import { Geist } from "next/font/google";
import { type Metadata } from "next";
import { Toaster } from "sonner";

import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Fuel EU Maritime - Compliance Platform",
  description: "Fuel EU Maritime compliance dashboard for route management, banking, and pooling",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`} suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-background">
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: 'white',
              color: '#1f2937',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '16px',
            },
            className: 'font-sans',
          }}
        />
      </body>
    </html>
  );
}
