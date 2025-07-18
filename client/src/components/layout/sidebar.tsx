import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Settings, 
  FileText, 
  Activity, 
  Key,
  ChevronLeft,
  ChevronRight,
  MonitorSpeaker,
  Cpu,
  HardDrive,
  Wrench,
  BookOpen,
  ChevronDown,
  Database,
  UserCog,
  Shield,
  BarChart,
  Network,
  Zap,
  HelpCircle,
  FileQuestion,
  Phone,
  Mail,
  Globe,
  Computer,
  Router,
  Server,
  Wifi,
  Cloud,
  Tablet,
  Smartphone,
  Gamepad2,
  Headphones,
  Keyboard,
  Mouse,
  Printer,
  Scanner,
  Camera,
  Projector,
  Webcam,
  Microphone,
  ShoppingCart,
  Menu,
  X
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const menuItems = [
  { 
    title: "Dashboard", 
    icon: LayoutDashboard, 
    href: "/",
    badge: null
  },
  { 
    title: "Assets", 
    icon: Package, 
    href: "/assets",
    badge: null
  },
  { 
    title: "Users", 
    icon: Users, 
    href: "/users",
    badge: null
  },
  { 
    title: "Licenses", 
    icon: FileText, 
    href: "/licenses",
    badge: null
  },
  { 
    title: "Components", 
    icon: Cpu, 
    href: "/components",
    badge: null
  },
  { 
    title: "Accessories", 
    icon: Wrench, 
    href: "/accessories",
    badge: null
  },
  { 
    title: "Consumables", 
    icon: ShoppingCart, 
    href: "/consumables",
    badge: null
  },
  { 
    title: "VM Inventory", 
    icon: Server, 
    href: "/vm-inventory",
    badge: null
  },
  { 
    title: "VM Monitoring", 
    icon: MonitorSpeaker, 
    href: "/vm-monitoring",
    badge: null
  },
  { 
    title: "Network Discovery", 
    icon: Network, 
    href: "/network-discovery",
    badge: null
  },
  { 
    title: "BitLocker Keys", 
    icon: Key, 
    href: "/bitlocker-keys",
    badge: null
  },
  { 
    title: "Activities", 
    icon: Activity, 
    href: "/activities",
    badge: null
  },
  { 
    title: "Reports", 
    icon: BarChart, 
    href: "/reports",
    badge: null
  },
];

const adminMenuItems = [
  { 
    title: "User Management", 
    icon: Shield, 
    href: "/user-management",
    badge: null
  },
  { 
    title: "Database", 
    icon: Database, 
    href: "/admin/database",
    badge: null
  },
  { 
    title: "System Setup", 
    icon: Settings, 
    href: "/admin/system-setup",
    badge: null
  },
];

const helpMenuItems = [
  { 
    title: "User Manual", 
    icon: BookOpen, 
    href: "/user-manual",
    badge: null
  },
  { 
    title: "Settings", 
    icon: Settings, 
    href: "/settings",
    badge: null
  },
];

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}

function Sidebar({ isCollapsed = false, onToggle, className = "" }: SidebarProps) {
  const [location] = useLocation();
  const [isAdminExpanded, setIsAdminExpanded] = useState(false);
  const [isHelpExpanded, setIsHelpExpanded] = useState(false);

  // Fetch user data to check permissions
  const { data: user } = useQuery({
    queryKey: ['/api/me'],
    queryFn: async () => {
      const response = await fetch('/api/me', {
        credentials: 'include',
      });
      if (!response.ok) {
        return null;
      }
      const result = await response.json();
      return result.user || result;
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const isAdmin = user?.role === 'admin' || user?.username === 'admin';

  return (
    <div className={cn("flex flex-col h-full border-r bg-background", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold">SRPH-MIS</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-9 w-9"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      <Separator />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-2 py-2">
          {/* Main Menu Items */}
          {menuItems.map((item) => (
            <SidebarItem
              key={item.href}
              item={item}
              isActive={location === item.href}
              isCollapsed={isCollapsed}
            />
          ))}

          {/* Admin Section */}
          {isAdmin && (
            <>
              <Separator className="my-2" />
              <div className="px-2 py-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start px-2 py-1 h-8"
                  onClick={() => setIsAdminExpanded(!isAdminExpanded)}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-left">Admin</span>
                      {isAdminExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </>
                  )}
                </Button>
                {(isAdminExpanded || isCollapsed) && (
                  <div className="ml-4 space-y-1 mt-1">
                    {adminMenuItems.map((item) => (
                      <SidebarItem
                        key={item.href}
                        item={item}
                        isActive={location === item.href}
                        isCollapsed={isCollapsed}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Help Section */}
          <Separator className="my-2" />
          <div className="px-2 py-2">
            <Button
              variant="ghost"
              className="w-full justify-start px-2 py-1 h-8"
              onClick={() => setIsHelpExpanded(!isHelpExpanded)}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">Help</span>
                  {isHelpExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </>
              )}
            </Button>
            {(isHelpExpanded || isCollapsed) && (
              <div className="ml-4 space-y-1 mt-1">
                {helpMenuItems.map((item) => (
                  <SidebarItem
                    key={item.href}
                    item={item}
                    isActive={location === item.href}
                    isCollapsed={isCollapsed}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export default Sidebar;
export { Sidebar };

interface SidebarItemProps {
  item: {
    title: string;
    icon: any;
    href: string;
    badge: string | null;
  };
  isActive: boolean;
  isCollapsed: boolean;
}

function SidebarItem({ item, isActive, isCollapsed }: SidebarItemProps) {
  const { title, icon: Icon, href, badge } = item;
  const [, setLocation] = useLocation();

  const handleClick = () => {
    setLocation(href);
  };

  return (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      className={cn(
        "w-full justify-start px-2 py-1 h-8",
        isActive && "bg-secondary"
      )}
      onClick={handleClick}
    >
      <Icon className="h-4 w-4 mr-2" />
      {!isCollapsed && (
        <>
          <span className="flex-1 text-left">{title}</span>
          {badge && (
            <Badge variant="secondary" className="ml-auto">
              {badge}
            </Badge>
          )}
        </>
      )}
    </Button>
  );
}