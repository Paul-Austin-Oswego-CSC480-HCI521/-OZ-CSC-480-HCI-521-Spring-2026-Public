import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/custom/screen/sidebar/Sidebar";
import Topbar from "@/components/custom/screen/topbar/Topbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LakerTracks",
  description: "SPRING 2026",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SidebarProvider>
          <div className="flex flex-col w-full h-screen">
            <Topbar />
            <div className="flex flex-1 overflow-hidden">
              <AppSidebar />
              <main className="w-full">{children}</main>
            </div>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}
