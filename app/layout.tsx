import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LightboxProvider } from "@/components/app/lightbox";
import { StatsProvider } from "@/components/app/stats-provider";
import { ToastProvider } from "@/components/app/toaster";
import { Sidebar } from "@/components/app/sidebar";

export const metadata: Metadata = {
  title: {
    default: "Curation Dashboard",
    template: "%s · Curation Dashboard",
  },
  description:
    "Curation dashboard for the product-matching backend: queue, links, duplicates, and legacy items.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-dvh">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          disableTransitionOnChange
        >
          <ToastProvider>
            <LightboxProvider>
              <StatsProvider>
                <Sidebar />
                <main className="flex min-w-0 flex-1 flex-col px-4 pb-12 sm:px-6">
                  <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
                    {children}
                  </div>
                </main>
              </StatsProvider>
            </LightboxProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
