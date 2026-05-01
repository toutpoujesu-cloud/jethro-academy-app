'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-ivory flex flex-col items-center justify-center p-8 text-center">
      {/* Icon */}
      <div className="h-24 w-24 rounded-full bg-navy/10 flex items-center justify-center mb-6">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="#0B1C3E"
          strokeWidth={1.5}
          className="h-12 w-12"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 3l18 18M8.111 8.111A5.5 5.5 0 0112 7c3.038 0 5.5 2.462 5.5 5.5 0 1.477-.583 2.817-1.531 3.806M6.5 12.5A5.5 5.5 0 0112 7m0 5.5A2.5 2.5 0 0114.5 15m-5 0a2.5 2.5 0 012.5-2.5"
          />
        </svg>
      </div>

      <h1 className="font-serif text-2xl font-bold text-charcoal mb-2">You're offline</h1>
      <p className="text-slate text-sm max-w-xs mb-8">
        It looks like you've lost your internet connection. Check your connection and try again.
      </p>

      {/* Scripture */}
      <blockquote className="border-l-4 border-gold pl-4 text-left max-w-xs mb-8">
        <p className="text-sm italic text-charcoal">
          "I can do all things through Christ who strengthens me."
        </p>
        <cite className="text-xs text-slate mt-1 block">— Philippians 4:13</cite>
      </blockquote>

      <button
        onClick={() => window.location.reload()}
        className="bg-navy text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-navy/90 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
