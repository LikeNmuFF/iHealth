"use client";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="boot">
      <BrandLogo size={64} />
      <h1>The demo could not display this screen.</h1>
      <p>Your saved fictional records are kept. Try loading the view again.</p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
      <Link href="/" className="button secondary">
        Return to demo
      </Link>
    </main>
  );
}
