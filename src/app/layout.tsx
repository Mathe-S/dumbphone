import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

import { TRPCReactProvider } from "@/trpc/react";

export const metadata: Metadata = {
  title: "dumbphone - you are not invited",
  description: "Play telephone - except you are not invited. Built for Dumb Things 2.0 Hackathon.",
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
    <ClerkProvider>
      <html lang="en" className={`${geist.variable}`}>
        <body>
          <header className="sticky top-0 z-50 border-b border-blue-800/30 bg-blue-950/80 backdrop-blur-lg supports-backdrop-filter:bg-blue-950/70">
            <div className="mx-auto w-full max-w-7xl px-4">
              <div className="flex h-16 items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link href="/" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                      <span className="text-lg font-bold text-white">📱</span>
                    </div>
                    <span className="text-lg font-bold text-white">
                      dumb<span className="text-blue-400">phone</span>
                    </span>
                  </Link>
                </div>
                <div className="flex items-center gap-3">
                  <SignedOut>
                    <SignInButton mode="modal">
                      <button className="inline-flex items-center gap-1 rounded-lg border border-blue-400/50 bg-blue-900/50 px-4 py-2 text-sm font-medium text-blue-100 shadow-sm transition hover:border-blue-400 hover:bg-blue-800/50 active:translate-y-px">
                        Sign in
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:from-blue-600 hover:to-cyan-600 active:translate-y-px">
                        Sign up
                      </button>
                    </SignUpButton>
                  </SignedOut>
                  <SignedIn>
                    <UserButton />
                  </SignedIn>
                </div>
              </div>
            </div>
          </header>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
