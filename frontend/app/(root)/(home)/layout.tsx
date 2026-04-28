import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/custom/screen/sidebar/Sidebar";
import RouteGuard from "@/components/custom/utils/RouteGuard";
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
  title: "LakerLogs",
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
          <div className="flex w-full min-h-screen h-screen">
            <AppSidebar />
            <main className="w-full overflow-y-auto min-h-0">
              <div className="max-w-7xl mx-auto pt-10 sm:pt-12 px-4 sm:px-6">
                <RouteGuard>{children}</RouteGuard>
              </div>
            </main>
          </div>
          <Toaster position="top-right" richColors />
        </SidebarProvider>
      </body>
    </html>
  );
}
