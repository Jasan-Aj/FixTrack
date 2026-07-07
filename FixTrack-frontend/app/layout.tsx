import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "FixTrack | Hostel Complaint Management",
  description:
    "AI-powered hostel complaint management system. Submit, track, and resolve campus issues intelligently.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (      <html
        lang="en"
        className={`${inter.variable} h-full antialiased scroll-smooth`}
        suppressHydrationWarning
      >
      <body className="min-h-full flex flex-col bg-background text-on-background font-sans selection:bg-primary-fixed selection:text-on-primary-fixed">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
