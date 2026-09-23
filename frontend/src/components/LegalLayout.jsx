import { Link, usePage } from '@inertiajs/react';

export default function LegalLayout({ children, title, lastUpdated }) {
  const { url } = usePage();
  const path = url;

  const links = [
    { name: "Privacy Policy", to: "/privacy" },
    { name: "Terms of Service", to: "/terms" },
    { name: "Acceptable Use Policy", to: "/acceptable-use" }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 flex flex-col md:flex-row gap-12 items-start">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 shrink-0 md:sticky md:top-24">
        <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">Legal Documents</h2>
        <nav className="flex flex-col space-y-1">
          {links.map((link) => {
            const isActive = path === link.to;
            return (
              <Link
                key={link.to}
                href={link.to}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-action text-white shadow-sm" 
                    : "text-text-secondary hover:bg-surface hover:text-text-primary"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <article className="flex-1 max-w-3xl min-w-0">
        <header className="mb-10 pb-6 border-b border-border">
          <h1 className="text-3xl md:text-4xl font-extrabold text-text-primary tracking-tight mb-3">
            {title}
          </h1>
          {lastUpdated && (
            <p className="text-sm text-text-secondary">
              Last Updated: <time>{lastUpdated}</time>
            </p>
          )}
        </header>

        <div className="
          text-text-primary leading-relaxed text-[15px] md:text-base
          [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-text-primary [&>h2]:mt-10 [&>h2]:mb-4
          [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:text-text-primary [&>h3]:mt-8 [&>h3]:mb-3
          [&>p]:mb-5 [&>p]:text-text-secondary
          [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-6 [&>ul>li]:mb-2 [&>ul>li]:text-text-secondary
          [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-6 [&>ol>li]:mb-2 [&>ol>li]:text-text-secondary
          [&>strong]:text-text-primary [&>strong]:font-semibold
          [&>a]:text-action [&>a]:underline [&>a]:underline-offset-2 [&>a]:hover:text-action-hover
        ">
          {children}
        </div>
      </article>
    </div>
  );
}
