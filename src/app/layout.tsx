import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "../components/Navbar";
import RecurringAlertsClient from "../components/RecurringAlertsClient";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Salaryman",
  description: "Expense management app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider afterSignInUrl="/dashboard" afterSignUpUrl="/dashboard">
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased animate-fade-in`}
        >
          <Navbar />
          {/* Global recurring payment alerts (bottom-right) */}
          <RecurringAlertsClient />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
