import Link from "next/link";

/** Minimal chrome for candidate-facing pages: the hiring company is the brand, not the platform. */
export default function PublicShell({
  companyName,
  companySlug,
  children,
}: {
  companyName?: string;
  companySlug?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
          {companyName ? (
            <Link href={companySlug ? `/careers/${companySlug}` : "#"} className="flex items-center gap-2.5 font-semibold text-slate-900">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900 text-sm text-white">{companyName[0]}</span>
              {companyName}
              <span className="hidden font-normal text-slate-400 sm:inline">· Careers</span>
            </Link>
          ) : (
            <span className="h-8 w-40 animate-pulse rounded-lg bg-slate-100" />
          )}
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-200/70 py-6 text-center text-xs text-slate-400">
        Your information is shared only with {companyName ?? "the hiring company"} and used solely to assess your application.
      </footer>
    </div>
  );
}
