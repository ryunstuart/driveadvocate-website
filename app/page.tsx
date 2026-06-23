<<<<<<< HEAD
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            To get started, edit the page.tsx file.
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
=======
'use client';

import React from 'react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-24">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-6xl font-bold mb-6">
            Your Voice at the Dealership Table
          </h1>
          <p className="text-2xl text-slate-300 mb-10 max-w-3xl mx-auto">
            Professional car buying advocates who negotiate for you.<br />
            Skip the stress and get the deal you deserve.
          </p>
          <div className="flex justify-center gap-4">
            <a href="#book" className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 rounded-xl text-lg font-semibold">
              Book a Free Discovery Call
            </a>
            <a href="#how" className="border border-white hover:bg-white hover:text-slate-900 text-white px-8 py-4 rounded-xl text-lg font-semibold">
              See How It Works
            </a>
          </div>
        </div>
      </div>

      {/* Trust Bar */}
      <div className="bg-slate-100 py-4 text-center text-slate-600 font-medium">
        100% Buyer-Focused • Average Savings $2,500+ • Transparent Process • No Dealer Kickbacks
      </div>

      {/* Why Us */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">Why Choose DriveAdvocate</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-8 bg-white rounded-2xl shadow">
            <h3 className="text-2xl font-semibold mb-3">Expert Negotiation</h3>
            <p className="text-slate-600">We fight for the best price and remove junk fees.</p>
          </div>
          <div className="p-8 bg-white rounded-2xl shadow">
            <h3 className="text-2xl font-semibold mb-3">Total Convenience</h3>
            <p className="text-slate-600">We handle research, paperwork, and coordination.</p>
          </div>
          <div className="p-8 bg-white rounded-2xl shadow">
            <h3 className="text-2xl font-semibold mb-3">Complete Transparency</h3>
            <p className="text-slate-600">We work only for you. Clear updates every step.</p>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-slate-900 text-white py-20 text-center" id="book">
        <h2 className="text-4xl font-bold mb-6">Ready to Buy Your Next Car the Smart Way?</h2>
        <a href="https://calendly.com" className="bg-emerald-600 hover:bg-emerald-700 px-12 py-5 rounded-2xl text-xl font-semibold">
          Book Your Free Discovery Call
        </a>
      </div>
    </div>
  );
}
>>>>>>> d7f101f582cb74c844fcf4786037b9e379b3fc00
