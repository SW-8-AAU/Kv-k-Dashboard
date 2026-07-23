import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LightboxProvider } from "@/components/app/lightbox";
import { ToastProvider } from "@/components/app/toaster";
import { Nav } from "@/components/app/nav";

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
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ToastProvider>
            <LightboxProvider>
              <Nav />
              <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
                {children}
              </main>
            </LightboxProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
