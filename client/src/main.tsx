import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router, Route, Switch } from 'wouter';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/hooks/use-auth';

// Layout components
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';

// Page components
import Dashboard from '@/pages/dashboard';
import Assets from '@/pages/assets';
import Users from '@/pages/users';
import Activities from '@/pages/activities';
import Licenses from '@/pages/licenses';
import Components from '@/pages/components';
import Accessories from '@/pages/accessories';
import Consumables from '@/pages/consumables';
import Reports from '@/pages/reports';
import Settings from '@/pages/settings';
import AssetDetails from '@/pages/asset-details';
import UserDetails from '@/pages/user-details';
import LicenseDetails from '@/pages/license-details';
import ConsumableDetails from '@/pages/consumable-details';
import AuthPage from '@/pages/auth-page';
import Setup from '@/pages/setup';
import NotFound from '@/pages/not-found';
import UserManual from '@/pages/user-manual';
import NetworkDiscovery from '@/pages/network-discovery';
import VMMonitoring from '@/pages/vm-monitoring';
import BitlockerKeys from '@/pages/bitlocker-keys';
import VMInventory from '@/pages/vm-inventory';
import NetworkDiscoveryDashboard from '@/pages/network-discovery-dashboard';
import UserManagement from '@/pages/user-management';
import DatabaseInit from '@/pages/database-init';
import Profile from '@/pages/profile';

// Admin pages
import SystemSetup from '@/pages/admin/system-setup';
import UserPermissions from '@/pages/admin/user-permissions';
import Database from '@/pages/admin/database';

import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Switch>
          <Route path="/setup" component={Setup} />
          <Route component={AuthPage} />
        </Switch>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        <div className="w-64 flex-shrink-0">
          <Sidebar />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto">
            <div className="p-6">
              <Switch>
                <Route path="/" component={Dashboard} />
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/assets" component={Assets} />
                <Route path="/assets/:id" component={AssetDetails} />
                <Route path="/accessories" component={Accessories} />
                <Route path="/licenses" component={Licenses} />
                <Route path="/licenses/:id" component={LicenseDetails} />
                <Route path="/users" component={Users} />
                <Route path="/users/:id" component={UserDetails} />
                <Route path="/activities" component={Activities} />
                <Route path="/components" component={Components} />
                <Route path="/consumables" component={Consumables} />
                <Route path="/consumables/:id" component={ConsumableDetails} />
                <Route path="/vm-inventory" component={VMInventory} />
                <Route path="/vm-monitoring" component={VMMonitoring} />
                <Route path="/network-discovery" component={NetworkDiscovery} />
                <Route path="/network-discovery-dashboard" component={NetworkDiscoveryDashboard} />
                <Route path="/bitlocker-keys" component={BitlockerKeys} />
                <Route path="/reports" component={Reports} />
                <Route path="/user-management" component={UserManagement} />
                <Route path="/admin/database" component={Database} />
                <Route path="/admin/system-setup" component={SystemSetup} />
                <Route path="/profile" component={Profile} />
                <Route path="/settings" component={Settings} />
                <Route path="/user-manual" component={UserManual} />
                
                <Route path="/setup" component={Setup} />
                <Route path="/auth" component={AuthPage} />
                <Route component={NotFound} />
              </Switch>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function App() {
  // Apply saved color scheme on app load
  React.useEffect(() => {
    const savedColorScheme = localStorage.getItem('color-scheme');
    if (savedColorScheme) {
      const root = document.documentElement;
      switch(savedColorScheme) {
        case 'default':
          root.style.setProperty('--primary', '221.2 83.2% 53.3%');
          root.style.setProperty('--primary-foreground', '210 40% 98%');
          break;
        case 'green':
          root.style.setProperty('--primary', '142 71% 45%');
          root.style.setProperty('--primary-foreground', '144 100% 99%');
          break;
        case 'red':
          root.style.setProperty('--primary', '0 84% 60%');
          root.style.setProperty('--primary-foreground', '0 100% 99%');
          break;
        case 'purple':
          root.style.setProperty('--primary', '262 83% 58%');
          root.style.setProperty('--primary-foreground', '265 100% 99%');
          break;
        case 'orange':
          root.style.setProperty('--primary', '24 95% 53%');
          root.style.setProperty('--primary-foreground', '25 100% 99%');
          break;
        case 'teal':
          root.style.setProperty('--primary', '173 58% 39%');
          root.style.setProperty('--primary-foreground', '180 100% 99%');
          break;
        case 'indigo':
          root.style.setProperty('--primary', '239 84% 67%');
          root.style.setProperty('--primary-foreground', '239 100% 99%');
          break;
        case 'pink':
          root.style.setProperty('--primary', '322 81% 64%');
          root.style.setProperty('--primary-foreground', '322 100% 99%');
          break;
        case 'cyan':
          root.style.setProperty('--primary', '189 94% 43%');
          root.style.setProperty('--primary-foreground', '189 100% 99%');
          break;
        case 'amber':
          root.style.setProperty('--primary', '43 96% 56%');
          root.style.setProperty('--primary-foreground', '43 100% 99%');
          break;
      }
    }
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <AppContent />
            <Toaster />
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = ReactDOM.createRoot(rootElement);
root.render(<App />);