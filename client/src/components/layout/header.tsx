import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { 
  Sun, 
  Moon, 
  User, 
  Settings, 
  LogOut, 
  Bell,
  Menu
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
  const [theme, setTheme] = useState<"light" | "dark">(
    localStorage.getItem("theme") as "light" | "dark" || "light"
  );

  // Fetch user data
  const { data: user } = useQuery({
    queryKey: ['/api/me'],
    queryFn: async () => {
      const response = await fetch('/api/me');
      if (!response.ok) {
        throw new Error('Not authenticated');
      }
      return response.json();
    },
    retry: false
  });

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const handleLogout = async () => {
    try {
      await logout();
      setLocation("/auth");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleProfile = () => {
    setLocation("/profile");
  };

  const handleSettings = () => {
    setLocation("/settings");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">SRPH-MIS</h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9"
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Bell className="h-4 w-4" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.avatar} alt={user?.username} />
                  <AvatarFallback>
                    {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                  {user?.role && (
                    <Badge variant="secondary" className="w-fit mt-1">
                      {user.role}
                    </Badge>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfile}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSettings}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

export default Header;