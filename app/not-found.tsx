import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="font-serif text-3xl text-ink">Page not found</h1>
      <p className="text-ink-muted">The page you are looking for does not exist or has moved.</p>
      <Link href="/" className="text-accent hover:underline">
        Back to home
      </Link>
    </div>
  );
}
