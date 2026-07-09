import { Link } from "@tanstack/react-router";
import {
  Home,
  Copy,
  Wand2,
  History,
  Settings as SettingsIcon,
  Smartphone,
  Moon,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePickle } from "@/lib/pickle-context";
import logoAsset from "@/assets/pickle-polish-logo.png.asset.json";

const NAV = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/duplicates", label: "Duplicates", icon: Copy },
  { to: "/clean", label: "Cleanup", icon: Wand2 },
  { to: "/history", label: "History", icon: History },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
  { to: "/roadmap", label: "Roadmap", icon: Smartphone },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { darkMode, setDarkMode } = usePickle();

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-sidebar p-4 md:flex md:flex-col">
        <BrandMark />
        <nav className="mt-6 flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{ className: "bg-primary text-primary-foreground shadow-sm" }}
              inactiveProps={{ className: "text-sidebar-foreground hover:bg-sidebar-accent" }}
              activeOptions={{ exact: item.to === "/" }}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl bg-accent/60 p-4 text-xs text-accent-foreground">
          <div className="flex items-center gap-2 font-semibold">
            Prototype
          </div>
          <p className="mt-1 text-muted-foreground">
            Web demo of Pickle Polish. Native cleanup needs Android APIs — see Roadmap.
          </p>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col pb-24 md:pb-0">
        {/* Mobile header */}
        <header className="flex items-center justify-between border-b border-border bg-background/70 p-4 backdrop-blur md:hidden">
          <BrandMark compact />
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

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src={logoAsset.url}
        alt="Pickle Polish logo"
        className="h-11 w-11 rounded-2xl object-cover shadow-md shadow-primary/20 ring-1 ring-border"
      />
      {!compact ? (
        <div>
          <div className="text-base font-bold leading-tight tracking-tight">Pickle Polish</div>
          <div className="text-[11px] text-muted-foreground">
            Pickle-clean your phone storage
          </div>
        </div>
      ) : (
        <div className="text-base font-bold tracking-tight">Pickle Polish</div>
      )}
    </div>
  );
}
