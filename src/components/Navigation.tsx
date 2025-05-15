
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Home,
  Settings,
  User,
  BookMarked,
  School,
  BookOpenCheck,
  ShieldCheck
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { useAdmin } from "@/hooks/use-admin";

const Navigation = () => {
  const location = useLocation();
  const { isAdmin } = useAdmin();

  const navItems = [
    {
      href: "/dashboard",
      label: "Home",
      icon: <Home className="h-5 w-5" />,
    },
    {
      href: "/dashboard/exercises",
      label: "Exercises",
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      href: "/dashboard/vocabulary",
      label: "Vocabulary",
      icon: <BookMarked className="h-5 w-5" />,
    },
    {
      href: "/dashboard/tutorial",
      label: "Tutorial",
      icon: <School className="h-5 w-5" />,
    },
    ...(isAdmin
      ? [
          {
            href: "/dashboard/admin",
            label: "Admin",
            icon: <ShieldCheck className="h-5 w-5" />,
          },
        ]
      : []),
    {
      href: "/dashboard/settings",
      label: "Settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <nav className="flex flex-col space-y-2 p-2">
      {navItems.map((item) => (
        <Button
          key={item.href}
          variant={location.pathname === item.href ? "default" : "ghost"}
          asChild
          size="lg"
          className={cn("justify-start")}
        >
          <Link to={item.href}>
            {item.icon}
            <span className="ml-2">{item.label}</span>
          </Link>
        </Button>
      ))}
    </nav>
  );
};

export default Navigation;
