import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
export default function NotFound() {
  return (
    <main className="boot">
      <BrandLogo size={64} />
      <h1>This demo page was not found.</h1>
      <p>Open the prototype to choose a patient or facility view.</p>
      <Link className="button primary" href="/">
        Open iHealth demo
      </Link>
    </main>
  );
}
