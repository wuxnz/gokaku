import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { NotificationProvider } from "@/lib/notifications/NotificationContext";
import { Navbar } from "@/components/layout/Navbar";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

export const metadata: Metadata = {
  title: "TourneyPro",
  description: "Tournament management system",
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
      <body>
        <TRPCReactProvider>
          <NotificationProvider>
            <SessionProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
              >
                <div className="flex min-h-full flex-col">
                  <Navbar />
                  <main className="flex flex-1 flex-col">{children}</main>
                </div>
              </ThemeProvider>
            </SessionProvider>
          </NotificationProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
