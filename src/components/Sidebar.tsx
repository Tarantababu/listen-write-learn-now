
import React from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Home,
  Settings,
  MenuIcon,
  X,
  PencilLine,
  CreditCard,
  LayoutDashboard,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface SidebarProps {
  className?: string;
}

type NavItem = {
  title: string;
  icon: React.ReactNode;
  href: string;
  isAdmin?: boolean;
};

const Sidebar = ({ className }: SidebarProps) => {
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = React.useState(false);

  const navItems: NavItem[] = [
    {
      title: "Home",
      icon: <Home className="h-5 w-5" />,
      href: "/dashboard",
    },
    {
      title: "Exercises",
      icon: <PencilLine className="h-5 w-5" />,
      href: "/dashboard/exercises",
    },
    {
      title: "Vocabulary",
      icon: <BookOpen className="h-5 w-5" />,
      href: "/dashboard/vocabulary",
    },
    {
      title: "Subscription",
      icon: <CreditCard className="h-5 w-5" />,
      href: "/dashboard/subscription",
    },
    {
      title: "Settings",
      icon: <Settings className="h-5 w-5" />,
      href: "/dashboard/settings",
    },
    {
      title: "Tutorial",
      icon: <Info className="h-5 w-5" />,
      href: "/dashboard/tutorial",
    },
    {
      title: "Admin",
      icon: <LayoutDashboard className="h-5 w-5" />,
      href: "/dashboard/admin",
      isAdmin: true,
    },
  ];

  // Filter out admin routes if user is not an admin
  const filteredNavItems = navItems.filter(
    (item) => !item.isAdmin || (item.isAdmin && isAdmin)
  );

  const NavLinks = () => (
    <>
      {filteredNavItems.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-base transition-all hover:bg-accent",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-primary"
            )
          }
          end={item.href === "/dashboard"}
        >
          {item.icon}
          {item.title}
        </NavLink>
      ))}
    </>
  );

  // Mobile sidebar
  const MobileSidebar = () => (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="md:hidden fixed bottom-4 right-4 z-50 rounded-full shadow-lg"
        >
          <MenuIcon className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[240px] sm:w-[300px]">
        <div className="flex flex-col h-full">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Menu</h2>
          </div>
          <div className="px-2 py-2 flex flex-col gap-1 flex-1">
            <NavLinks />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <MobileSidebar />

      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden md:flex flex-col w-64 border-r bg-card p-4",
          className
        )}
      >
        <div className="flex flex-col gap-1 flex-1">
          <NavLinks />
        </div>
      </div>
    </>
  );
};

export default Sidebar;
