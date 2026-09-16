import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import ToastProvider from "@/components/ToastProvider";

export const metadata: Metadata = {
  title: "AIDIL STORE — Solusi Digital",
  description: "Marketplace produk digital dan jasa dengan pembayaran saldo Aidil Store",
  icons: { icon: "/icon.svg", apple: "/apple-icon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <ToastProvider>
          <Navbar />
          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}
