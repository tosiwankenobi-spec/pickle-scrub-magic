import { Link } from "@tanstack/react-router";
import {
  Home,
  Copy,
  Images,
  Wand2,
  History,
  Settings as SettingsIcon,
  Smartphone,
  Moon,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePickle } from "@/lib/pickle-context";

const NAV = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/duplicates", label: "Duplicates", icon: Copy },
  { to: "/similar", label: "Similar", icon: Images },
  { to: "/clean", label: "Cleanup", icon: Wand2 },
  { to: "/history", label: "History", icon: History },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
  { to: "/roadmap", label: "Roadmap", icon: Smartphone },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { darkMode, setDarkMode } = usePickle();

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl bg-background">
      {/* Desktop sidebar — icon rail */}
      <aside className="hidden w-20 shrink-0 border-r border-border bg-sidebar px-3 py-6 md:flex md:flex-col md:items-center">
        <div className="flex flex-col items-center gap-8">
          <BrandMark />
          <nav className="flex flex-col gap-3">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                title={item.label}
                activeProps={{
                  className: "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm",
                }}
                inactiveProps={{
                  className:
                    "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                }}
                activeOptions={{ exact: item.to === "/" }}
                className="flex h-11 w-11 items-center justify-center rounded-xl transition"
              >
                <item.icon className="h-5 w-5" />
                <span className="sr-only">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto flex flex-col items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setDarkMode(!darkMode)}
            className="h-10 w-10 text-sidebar-foreground"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <div
            className="h-8 w-8 rounded-full border border-sidebar-border bg-sidebar-accent"
            aria-label="Profile"
          />
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col pb-24 md:pb-0">
        {/* Mobile header */}
        <header className="flex items-center justify-between border-b border-border bg-background/70 p-4 backdrop-blur md:hidden">
          <BrandMark />
          <Button size="icon" variant="ghost" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </header>

        <div className="flex-1 p-4 md:p-8">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border bg-background/95 p-2 backdrop-blur md:hidden">
        {NAV.slice(0, 5).map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeProps={{ className: "text-primary" }}
            inactiveProps={{ className: "text-muted-foreground" }}
            activeOptions={{ exact: item.to === "/" }}
            className="flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition"
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function BrandMark() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M9 12h6" />
      </svg>
    </div>
  );
}
