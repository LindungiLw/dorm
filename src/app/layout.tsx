import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "JIUnity — Campus Dormitory Management",
  description:
    "JIUnity: one platform for campus dormitory life — meals, permissions, borrowing, and more.",
};

// viewport-fit=cover lets env(safe-area-inset-*) resolve to real insets on notched
// devices, so the fixed bottom nav sits above the home indicator instead of behind it.
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#f4f6fb",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="min-h-screen overflow-x-hidden bg-[#f4f6fb] font-sans text-navy-900">
        {children}
      </body>
    </html>
  );
}
