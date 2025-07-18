import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  Loader2, 
  RefreshCw, 
  Settings, 
  Server, 
  Activity, 
  CheckSquare, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  HardDrive, 
  Cpu, 
  MemoryStick,
  Network,
  Thermometer,
  Zap,
  Database,
  Monitor,
  Wifi,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";

// Enhanced Zabbix settings form schema with authentication
const zabbixSettingsSchema = z.object({
  url: z.string().url({ message: "Please enter a valid Zabbix URL" }),
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
  autoSync: z.boolean().default(true),
  syncInterval: z.coerce.number().min(5).max(1440).default(60),
  alertsEnabled: z.boolean().default(true),
  criticalThreshold: z.coerce.number().min(1).max(100).default(90),
  warningThreshold: z.coerce.number().min(1).max(100).default(75),
});

type ZabbixSettings = z.infer<typeof zabbixSettingsSchema>;

// Enhanced host interface with comprehensive monitoring data
interface ZabbixHost {
  hostid: string;
  host: string;
  name: string;
  status: 'enabled' | 'disabled';
  available: 'available' | 'unavailable' | 'unknown';
  error?: string;
  maintenance_status: 'normal' | 'maintenance';
  // Performance metrics
  cpu_usage?: number;
  memory_usage?: number;
  disk_usage?: number;
  network_in?: number;
  network_out?: number;
  uptime?: number;
  load_average?: number;
  swap_usage?: number;
  // System information
  os_name?: string;
  kernel_version?: string;
  architecture?: string;
  last_seen?: string;
  // Alerts
  active_alerts?: ZabbixAlert[];
  groups?: string[];
  templates?: string[];
}

interface ZabbixAlert {
  eventid: string;
  name: string;
  severity: 'disaster' | 'high' | 'average' | 'warning' | 'information' | 'not_classified';
  status: 'problem' | 'ok';
  acknowledged: boolean;
  timestamp: string;
  age: string;
  description?: string;
  recovery_expression?: string;
  manual_close?: boolean;
  url?: string;
  comments?: ZabbixAlertComment[];
}

interface ZabbixAlertComment {
  message: string;
  time: string;
  userid: string;
  username: string;
}

interface ZabbixTemplate {
  templateid: string;
  name: string;
  description?: string;
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'disaster': return 'bg-red-500';
    case 'high': return 'bg-orange-500';
    case 'average': return 'bg-yellow-500';
    case 'warning': return 'bg-blue-500';
    case 'information': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
};

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'disaster': 
    case 'high': 
      return <AlertTriangle className="h-4 w-4" />;
    case 'average':
    case 'warning':
      return <Clock className="h-4 w-4" />;
    default:
      return <CheckCircle className="h-4 w-4" />;
  }
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export default function VMMonitoringEnhanced() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHost, setSelectedHost] = useState<ZabbixHost | null>(null);
  const [alertFilter, setAlertFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  
  // Zabbix settings form
  const form = useForm<ZabbixSettings>({
    resolver: zodResolver(zabbixSettingsSchema),
    defaultValues: {
      url: "",
      username: "",
      password: "",
      autoSync: true,
      syncInterval: 60,
      alertsEnabled: true,
      criticalThreshold: 90,
      warningThreshold: 75,
    },
  });

  // Fetch Zabbix settings
  const { data: zabbixSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['/api/zabbix/settings'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/zabbix/settings');
      return await res.json();
    },
  });

  // Fetch hosts with enhanced monitoring data
  const { data: hosts = [], isLoading: isLoadingHosts, error: hostsError } = useQuery({
    queryKey: ['/api/zabbix/hosts'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/zabbix/hosts');
      return await res.json() as ZabbixHost[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: !!zabbixSettings?.url,
  });

  // Fetch active alerts
  const { data: alerts = [], isLoading: isLoadingAlerts } = useQuery({
    queryKey: ['/api/zabbix/alerts'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/zabbix/alerts');
      return await res.json() as ZabbixAlert[];
    },
    refetchInterval: 15000, // Refresh every 15 seconds
    enabled: !!zabbixSettings?.url,
  });

  // Fetch available templates
  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['/api/zabbix/templates'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/zabbix/templates');
      return await res.json() as ZabbixTemplate[];
    },
    enabled: !!zabbixSettings?.url,
  });

  // Save Zabbix settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: ZabbixSettings) => {
      const res = await apiRequest('POST', '/api/zabbix/settings', data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Zabbix configuration has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/zabbix/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/zabbix/hosts'] });
    },
    onError: (error) => {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (data: ZabbixSettings) => {
      const res = await apiRequest('POST', '/api/zabbix/test-connection', data);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Connection successful",
        description: `Connected to Zabbix server. Found ${data.hostCount || 0} hosts.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Connection failed",
        description: error.message || "Unable to connect to Zabbix server",
        variant: "destructive",
      });
    },
  });

  // Acknowledge alert mutation
  const acknowledgeAlertMutation = useMutation({
    mutationFn: async ({ eventId, message }: { eventId: string, message: string }) => {
      const res = await apiRequest('POST', `/api/zabbix/alerts/${eventId}/acknowledge`, { message });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Alert acknowledged",
        description: "The alert has been acknowledged successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/zabbix/alerts'] });
    },
    onError: (error) => {
      toast({
        title: "Error acknowledging alert",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Sync hosts mutation
  const syncHostsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/zabbix/sync');
      return await res.json();
    },
    onSuccess: (data) => {
      setLastSyncTime(new Date().toLocaleString());
      toast({
        title: "Sync completed",
        description: `Synchronized ${data.hostCount || 0} hosts from Zabbix.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/zabbix/hosts'] });
    },
    onError: (error) => {
      toast({
        title: "Sync failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter hosts based on search and status
  const filteredHosts = hosts.filter(host => {
    const matchesSearch = host.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         host.host.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Filter alerts based on severity
  const filteredAlerts = alerts.filter(alert => {
    if (alertFilter === 'all') return true;
    if (alertFilter === 'critical') return ['disaster', 'high'].includes(alert.severity);
    if (alertFilter === 'warning') return ['average', 'warning'].includes(alert.severity);
    if (alertFilter === 'info') return ['information', 'not_classified'].includes(alert.severity);
    return true;
  });

  // Calculate dashboard statistics
  const stats = {
    totalHosts: hosts.length,
    availableHosts: hosts.filter(h => h.available === 'available').length,
    unavailableHosts: hosts.filter(h => h.available === 'unavailable').length,
    maintenanceHosts: hosts.filter(h => h.maintenance_status === 'maintenance').length,
    totalAlerts: alerts.length,
    criticalAlerts: alerts.filter(a => ['disaster', 'high'].includes(a.severity)).length,
    warningAlerts: alerts.filter(a => ['average', 'warning'].includes(a.severity)).length,
    avgCpuUsage: hosts.reduce((acc, h) => acc + (h.cpu_usage || 0), 0) / (hosts.length || 1),
    avgMemoryUsage: hosts.reduce((acc, h) => acc + (h.memory_usage || 0), 0) / (hosts.length || 1),
  };

  const onSubmit = (data: ZabbixSettings) => {
    saveSettingsMutation.mutate(data);
  };

  const handleTestConnection = () => {
    const currentValues = form.getValues();
    testConnectionMutation.mutate(currentValues);
  };

  useEffect(() => {
    if (zabbixSettings) {
      form.reset(zabbixSettings);
    }
  }, [zabbixSettings, form]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center">
            <Monitor className="mr-3 h-8 w-8" />
            Enhanced Zabbix Monitoring
          </h1>
          <p className="text-muted-foreground">
            Comprehensive infrastructure monitoring with real-time alerts and performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {lastSyncTime && (
            <span className="text-sm text-muted-foreground">
              Last sync: {lastSyncTime}
            </span>
          )}
          <Button
            variant="outline"
            onClick={() => syncHostsMutation.mutate()}
            disabled={syncHostsMutation.isPending || !zabbixSettings?.url}
          >
            {syncHostsMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sync Now
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="hosts">Hosts</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Hosts</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalHosts}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.availableHosts} available, {stats.unavailableHosts} unavailable
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.totalAlerts}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.criticalAlerts} critical, {stats.warningAlerts} warning
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg CPU Usage</CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgCpuUsage.toFixed(1)}%</div>
                <Progress value={stats.avgCpuUsage} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Memory Usage</CardTitle>
                <MemoryStick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgMemoryUsage.toFixed(1)}%</div>
                <Progress value={stats.avgMemoryUsage} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          {/* Critical Alerts */}
          {stats.criticalAlerts > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
                  Critical Alerts ({stats.criticalAlerts})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {alerts
                    .filter(alert => ['disaster', 'high'].includes(alert.severity))
                    .slice(0, 5)
                    .map((alert) => (
                      <div key={alert.eventid} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center space-x-3">
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <div>
                            <p className="font-medium">{alert.name}</p>
                            <p className="text-sm text-muted-foreground">{alert.age}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => acknowledgeAlertMutation.mutate({ 
                            eventId: alert.eventid, 
                            message: "Acknowledged via dashboard" 
                          })}
                          disabled={alert.acknowledged}
                        >
                          {alert.acknowledged ? "Acknowledged" : "Acknowledge"}
                        </Button>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top Hosts by Resource Usage */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Hosts by CPU Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {hosts
                    .filter(h => h.cpu_usage !== undefined)
                    .sort((a, b) => (b.cpu_usage || 0) - (a.cpu_usage || 0))
                    .slice(0, 5)
                    .map((host) => (
                      <div key={host.hostid} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${host.available === 'available' ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="font-medium">{host.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Progress value={host.cpu_usage} className="w-20" />
                          <span className="text-sm w-12">{host.cpu_usage}%</span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hosts by Memory Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {hosts
                    .filter(h => h.memory_usage !== undefined)
                    .sort((a, b) => (b.memory_usage || 0) - (a.memory_usage || 0))
                    .slice(0, 5)
                    .map((host) => (
                      <div key={host.hostid} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${host.available === 'available' ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="font-medium">{host.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Progress value={host.memory_usage} className="w-20" />
                          <span className="text-sm w-12">{host.memory_usage}%</span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Hosts Tab */}
        <TabsContent value="hosts" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="relative w-96">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search hosts..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoadingHosts ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Host</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>CPU %</TableHead>
                      <TableHead>Memory %</TableHead>
                      <TableHead>Disk %</TableHead>
                      <TableHead>Uptime</TableHead>
                      <TableHead>Load Avg</TableHead>
                      <TableHead>Last Seen</TableHead>
                      <TableHead>Alerts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHosts.map((host) => (
                      <TableRow 
                        key={host.hostid}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedHost(host)}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">{host.name}</p>
                            <p className="text-sm text-muted-foreground">{host.host}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              host.available === 'available' ? 'bg-green-500' : 
                              host.available === 'unavailable' ? 'bg-red-500' : 'bg-yellow-500'
                            }`} />
                            <span className="capitalize">{host.available}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {host.cpu_usage !== undefined ? (
                            <div className="flex items-center space-x-2">
                              <Progress value={host.cpu_usage} className="w-16" />
                              <span className="text-sm">{host.cpu_usage}%</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {host.memory_usage !== undefined ? (
                            <div className="flex items-center space-x-2">
                              <Progress value={host.memory_usage} className="w-16" />
                              <span className="text-sm">{host.memory_usage}%</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {host.disk_usage !== undefined ? (
                            <div className="flex items-center space-x-2">
                              <Progress value={host.disk_usage} className="w-16" />
                              <span className="text-sm">{host.disk_usage}%</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {host.uptime ? formatUptime(host.uptime) : '-'}
                        </TableCell>
                        <TableCell>
                          {host.load_average ? host.load_average.toFixed(2) : '-'}
                        </TableCell>
                        <TableCell>
                          {host.last_seen ? new Date(host.last_seen).toLocaleString() : '-'}
                        </TableCell>
                        <TableCell>
                          {host.active_alerts && host.active_alerts.length > 0 ? (
                            <Badge variant="destructive">
                              {host.active_alerts.length}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">0</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="flex justify-between items-center">
            <Select value={alertFilter} onValueChange={(value: any) => setAlertFilter(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Alerts</SelectItem>
                <SelectItem value="critical">Critical Only</SelectItem>
                <SelectItem value="warning">Warning Only</SelectItem>
                <SelectItem value="info">Information Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoadingAlerts ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Severity</TableHead>
                      <TableHead>Alert Name</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Acknowledged</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAlerts.map((alert) => (
                      <TableRow key={alert.eventid}>
                        <TableCell>
                          <Badge className={getSeverityColor(alert.severity)}>
                            {getSeverityIcon(alert.severity)}
                            <span className="ml-1">{alert.severity.toUpperCase()}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{alert.name}</p>
                            {alert.description && (
                              <p className="text-sm text-muted-foreground">{alert.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{alert.age}</TableCell>
                        <TableCell>
                          <Badge variant={alert.status === 'problem' ? 'destructive' : 'default'}>
                            {alert.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {alert.acknowledged ? (
                            <Badge variant="secondary">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Yes
                            </Badge>
                          ) : (
                            <Badge variant="outline">No</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => acknowledgeAlertMutation.mutate({ 
                              eventId: alert.eventid, 
                              message: "Acknowledged" 
                            })}
                            disabled={alert.acknowledged || acknowledgeAlertMutation.isPending}
                          >
                            {acknowledgeAlertMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Acknowledge"
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Templates</CardTitle>
              <CardDescription>
                Zabbix templates available for monitoring different types of hosts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTemplates ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <Card key={template.templateid}>
                      <CardHeader>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        {template.description && (
                          <CardDescription className="text-sm">
                            {template.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Zabbix Configuration</CardTitle>
              <CardDescription>
                Configure your Zabbix server connection and monitoring settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zabbix Server URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://your-zabbix-server.com" {...field} />
                          </FormControl>
                          <FormDescription>
                            The full URL to your Zabbix server instance
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="syncInterval"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sync Interval (minutes)</FormLabel>
                          <FormControl>
                            <Input type="number" min="5" max="1440" {...field} />
                          </FormControl>
                          <FormDescription>
                            How often to sync data from Zabbix (5-1440 minutes)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="zabbix-user" {...field} />
                          </FormControl>
                          <FormDescription>
                            Zabbix user with API access permissions
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormDescription>
                            Password for the Zabbix user
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="criticalThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Critical Threshold (%)</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" max="100" {...field} />
                          </FormControl>
                          <FormDescription>
                            Resource usage threshold for critical alerts
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="warningThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Warning Threshold (%)</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" max="100" {...field} />
                          </FormControl>
                          <FormDescription>
                            Resource usage threshold for warning alerts
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="autoSync"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Auto Sync</FormLabel>
                            <FormDescription>
                              Automatically sync data from Zabbix at regular intervals
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="alertsEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Enable Alerts</FormLabel>
                            <FormDescription>
                              Enable real-time alert monitoring and notifications
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTestConnection}
                      disabled={testConnectionMutation.isPending}
                    >
                      {testConnectionMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Activity className="mr-2 h-4 w-4" />
                      )}
                      Test Connection
                    </Button>
                    
                    <Button
                      type="submit"
                      disabled={saveSettingsMutation.isPending}
                    >
                      {saveSettingsMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Settings className="mr-2 h-4 w-4" />
                      )}
                      Save Settings
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {hostsError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Connection Error</AlertTitle>
              <AlertDescription>
                {hostsError.message || "Unable to connect to Zabbix server. Please check your settings."}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}