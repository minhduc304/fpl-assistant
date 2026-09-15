import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center px-5 py-16">
      <main className="w-full max-w-sm flex flex-col items-center gap-4 text-center">
        <h1 className="text-xl font-semibold">Mini-league not found</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          We couldn&apos;t find that mini-league. Check the ID and try again.
        </p>
        <Link
          href="/"
          className="text-sm text-[var(--muted-foreground)] no-underline underline-offset-4 transition-colors duration-150 hover:text-[var(--foreground)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
        >
          Back to home
        </Link>
      </main>
    </div>
  );
}
