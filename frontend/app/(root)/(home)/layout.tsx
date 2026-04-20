import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/custom/screen/sidebar/Sidebar";
import Topbar from "@/components/custom/screen/topbar/Topbar";
import { PublicEnvScript } from 'next-runtime-env';
import { Providers } from "@/provider";
import { Toaster } from "sonner";

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
          <div className="flex flex-col w-full min-h-screen h-screen">
            <Topbar />
            <div className="flex flex-1 overflow-hidden">
              <AppSidebar />
              <main className="min-h-0 w-full overflow-y-auto bg-zinc-50/90">
              {children}
            </main>
            </div>
          </div>
          <Toaster position="top-right" richColors />
        </SidebarProvider>
      </body>
    </html>
  );
}
