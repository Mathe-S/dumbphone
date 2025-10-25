"use client";

import Link from "next/link";

export default function Home() {
  return (
    <>
      <style jsx global>{`
        @keyframes blueShift {
          0%, 100% { color: #60a5fa; }
          25% { color: #3b82f6; }
          50% { color: #2563eb; }
          75% { color: #1d4ed8; }
        }
        @keyframes bluePulse {
          0%, 100% { color: #93c5fd; }
          50% { color: #1e40af; }
        }
        @keyframes blueGlow {
          0%, 100% { text-shadow: 0 0 10px #3b82f6, 0 0 20px #60a5fa; }
          50% { text-shadow: 0 0 20px #1d4ed8, 0 0 40px #2563eb; }
        }
        .animate-blue-shift {
          animation: blueShift 4s ease-in-out infinite;
        }
        .animate-blue-pulse {
          animation: bluePulse 2s ease-in-out infinite;
        }
        .animate-blue-glow {
          animation: blueGlow 3s ease-in-out infinite;
        }
      `}</style>
      <main className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute top-1/2 -left-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
            {/* Main Hero Content */}
            <div className="text-center">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
                </span>
                <span className="text-sm font-medium text-blue-200">
                  Built for Dumb Things 2.0 Hackathon
                </span>
              </div>

              <h1 className="mb-6 text-6xl font-extrabold tracking-tight text-white sm:text-7xl lg:text-8xl">
                <span className="block animate-blue-shift">dumb</span>
                <span className="animate-blue-glow block bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  phone
                </span>
              </h1>

              {/* <p className="mx-auto mb-4 max-w-2xl text-xl text-blue-100 sm:text-2xl">
                <span className="animate-blue-pulse">you are not invited</span> 📵
              </p> */}
              <p className="mx-auto mb-12 max-w-3xl text-lg text-blue-300">
                {/* Play telephone with AI... except nobody invited you to the party.
                <br /> */}
                <span className="animate-blue-shift inline-block">Draw something and then watch AI have fun without you</span> 
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/draw"
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-blue-500/50 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/60"
                >
                  <span className="relative z-10">Try It Now</span>
                  <svg
                    className="relative z-10 h-5 w-5 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                  <div className="absolute inset-0 -z-0 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-blue-400/50 bg-blue-950/50 px-8 py-4 text-lg font-semibold text-blue-100 backdrop-blur-sm transition-all hover:border-blue-400 hover:bg-blue-900/50"
                >
                  How It Works
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div id="how-it-works" className="relative bg-blue-950/50 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="mb-4 text-4xl font-bold text-white sm:text-5xl">
                How It Works
              </h2>
              <p className="mx-auto mb-16 max-w-2xl text-lg text-blue-200">
                <span className="animate-blue-shift">A simple one-step process to watch AI have fun without you </span> 🎭
              </p>
            </div>

            <div className="grid gap-12 lg:grid-cols-3">
              <div className="relative">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-2xl font-bold text-white">
                  1
                </div>
                <h3 className="mb-3 text-2xl font-bold text-white">Draw Your Image</h3>
                <p className="animate-blue-pulse text-blue-200">
                  Draw literally anything, the dumber the better. We're not judging (yet) 👀
                </p>
              </div>

              <div className="relative">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-2xl font-bold text-white">
                  2
                </div>
                <h3 className="mb-3 text-2xl font-bold text-white">Watch AI have fun without you</h3>
                <p className="animate-blue-shift text-blue-200">
                  AI plays telephone and the prompt gets dumber
                </p>
              </div>

              <div className="relative">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-2xl font-bold text-white">
                  3
                </div>
                <h3 className="mb-3 text-2xl font-bold text-white">Admire the futility</h3>
                <p className="animate-blue-pulse text-blue-200">
                  Wonder why we humans struggle with social interactions<br />
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="relative py-24">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="mb-6 text-4xl font-bold text-white sm:text-5xl">
              <span className="animate-blue-glow">Ready to Get Dumb?</span>
            </h2>
            <p className="mb-8 text-xl text-blue-200">
              <span className="animate-blue-shift">Start the party.</span> Watch the robots have fun without you. <span className="animate-blue-pulse">Become one with the void.</span> 🌀
            </p>
            <Link
              href="/draw"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-blue-500/50 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/60"
            >
              Start Creating
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-blue-800/50 bg-blue-950/50 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="animate-blue-pulse text-blue-300">
                Built with 💙 (and questionable life choices) for{" "}
                <a
                  href="https://luma.com/qwnhi88t"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="animate-blue-shift font-semibold text-blue-400 hover:text-blue-300"
                >
                  Dumb Things 2.0 Hackathon
                </a>
              </p>
              <p className="mt-2 text-sm text-blue-400">
                Powered by Replicate • DigitalOcean • Next.js • <span className="animate-blue-shift">pure chaos energy</span> ⚡
              </p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
