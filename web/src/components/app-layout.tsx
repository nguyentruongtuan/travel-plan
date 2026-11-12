import { ListChecks, LogOut, Map, Menu, Plane } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/context/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/plans", label: "My plans", icon: ListChecks },
  { to: "/map", label: "Map", icon: Map },
];

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const name = user?.displayName || user?.email || "Traveler";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-5 text-lg font-semibold">
        <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-lg">
          <Plane className="size-4" />
        </span>
        Travel Plan
      </div>

      <nav className="grid gap-1 px-2">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )
            }
          >
            <Icon className="size-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t p-3">
        <div className="mb-2 flex items-center gap-3 px-1">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="size-9 rounded-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <span className="bg-secondary grid size-9 place-items-center rounded-full text-sm font-semibold uppercase">
              {name[0]}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{name}</p>
            {user?.email && <p className="text-muted-foreground truncate text-xs">{user.email}</p>}
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start" onClick={() => logout()}>
          <LogOut />
          Log out
        </Button>
      </div>
    </div>
  );
}

export function AppLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const title = NAV.find((n) => pathname.startsWith(n.to))?.label ?? "Travel Plan";

  return (
    <div className="flex h-full">
      {/* Desktop sidebar */}
      <aside className="bg-card hidden w-64 shrink-0 border-r md:block">
        <NavContent />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="bg-background/90 sticky top-0 z-30 flex h-14 items-center gap-2 border-b px-2 backdrop-blur md:hidden">
          <Button variant="ghost" size="icon" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu className="size-5" />
          </Button>
          <span className="font-semibold">{title}</span>
        </header>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SheetDescription className="sr-only">Main menu</SheetDescription>
            <NavContent onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
