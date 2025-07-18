import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Palette, 
  Settings as SettingsIcon, 
  Monitor, 
  Bell, 
  Shield, 
  Database,
  Save
} from "lucide-react";

const colorThemes = [
  { name: "Default", value: "default", primary: "hsl(222.2 84% 4.9%)", secondary: "hsl(210 40% 98%)" },
  { name: "Blue", value: "blue", primary: "hsl(221.2 83.2% 53.3%)", secondary: "hsl(210 40% 98%)" },
  { name: "Green", value: "green", primary: "hsl(142.1 76.2% 36.3%)", secondary: "hsl(138 76% 97%)" },
  { name: "Purple", value: "purple", primary: "hsl(262.1 83.3% 57.8%)", secondary: "hsl(270 20% 98%)" },
  { name: "Red", value: "red", primary: "hsl(346.8 77.2% 49.8%)", secondary: "hsl(355 100% 97%)" },
  { name: "Orange", value: "orange", primary: "hsl(24.6 95% 53.1%)", secondary: "hsl(33 100% 97%)" },
  { name: "Yellow", value: "yellow", primary: "hsl(47.9 95.8% 53.1%)", secondary: "hsl(48 100% 97%)" },
  { name: "Pink", value: "pink", primary: "hsl(330.4 81.2% 60.4%)", secondary: "hsl(322 100% 97%)" },
];

export default function Settings() {
  const [theme, setTheme] = useState<"light" | "dark">(
    localStorage.getItem("theme") as "light" | "dark" || "light"
  );
  const [colorTheme, setColorTheme] = useState(
    localStorage.getItem("colorTheme") || "default"
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/settings'],
    queryFn: async () => {
      const response = await fetch('/api/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      return response.json();
    }
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update settings');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Settings Updated",
        description: "Your settings have been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    }
  });

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const applyColorTheme = (themeName: string) => {
    setColorTheme(themeName);
    localStorage.setItem("colorTheme", themeName);

    const selectedTheme = colorThemes.find(t => t.value === themeName);
    if (selectedTheme) {
      document.documentElement.style.setProperty("--primary", selectedTheme.primary);
      document.documentElement.style.setProperty("--secondary", selectedTheme.secondary);
    }

    toast({
      title: "Theme Applied",
      description: `${selectedTheme?.name} theme has been applied.`,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData);
    updateSettingsMutation.mutate(data);
  };

  useEffect(() => {
    // Apply saved color theme on load
    const savedColorTheme = localStorage.getItem("colorTheme");
    if (savedColorTheme) {
      const selectedTheme = colorThemes.find(t => t.value === savedColorTheme);
      if (selectedTheme) {
        document.documentElement.style.setProperty("--primary", selectedTheme.primary);
        document.documentElement.style.setProperty("--secondary", selectedTheme.secondary);
      }
    }
  }, []);

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <Badge variant="secondary">
          <SettingsIcon className="h-3 w-3 mr-1" />
          System Configuration
        </Badge>
      </div>

      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="h-5 w-5 mr-2" />
                Appearance Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Dark Mode</Label>
                  <div className="text-sm text-muted-foreground">
                    Toggle between light and dark themes
                  </div>
                </div>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={toggleTheme}
                />
              </div>

              <Separator />

              {/* Color Theme Selection */}
              <div className="space-y-4">
                <Label className="text-base">Color Theme</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {colorThemes.map((themeOption) => (
                    <Button
                      key={themeOption.value}
                      variant={colorTheme === themeOption.value ? "default" : "outline"}
                      className="h-20 flex flex-col items-center justify-center"
                      onClick={() => applyColorTheme(themeOption.value)}
                    >
                      <div
                        className="w-6 h-6 rounded-full mb-2"
                        style={{ backgroundColor: themeOption.primary }}
                      />
                      <span className="text-xs">{themeOption.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Monitor className="h-5 w-5 mr-2" />
                System Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    name="siteName"
                    defaultValue={settings?.siteName || "SRPH-MIS"}
                  />
                </div>
                <div>
                  <Label htmlFor="siteUrl">Site URL</Label>
                  <Input
                    id="siteUrl"
                    name="siteUrl"
                    defaultValue={settings?.siteUrl || ""}
                  />
                </div>
                <div>
                  <Label htmlFor="organizationName">Organization Name</Label>
                  <Input
                    id="organizationName"
                    name="organizationName"
                    defaultValue={settings?.organizationName || ""}
                  />
                </div>
                <div>
                  <Label htmlFor="adminEmail">Admin Email</Label>
                  <Input
                    id="adminEmail"
                    name="adminEmail"
                    type="email"
                    defaultValue={settings?.adminEmail || ""}
                  />
                </div>
                <Button type="submit" disabled={updateSettingsMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Email Notifications</Label>
                  <div className="text-sm text-muted-foreground">
                    Receive email notifications for system events
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Low Stock Alerts</Label>
                  <div className="text-sm text-muted-foreground">
                    Get notified when inventory is running low
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Asset Checkout Alerts</Label>
                  <div className="text-sm text-muted-foreground">
                    Notifications for asset checkouts and returns
                  </div>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Two-Factor Authentication</Label>
                  <div className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </div>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Auto-logout</Label>
                  <div className="text-sm text-muted-foreground">
                    Automatically logout after period of inactivity
                  </div>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="space-y-2">
                <Label className="text-base">Session Timeout</Label>
                <Select defaultValue="30">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select timeout duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}