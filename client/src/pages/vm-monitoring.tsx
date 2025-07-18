import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, RefreshCw, Settings, Server, Activity, CheckSquare, Search, Cpu, HardDrive, MemoryStick, Wifi, AlertTriangle, CheckCircle, XCircle, Clock, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, AreaChart, Area } from "recharts";
import { Separator } from "@/components/ui/separator";

const zabbixSettingsSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL" }),
  apiKey: z.string().min(1, { message: "API key is required" }),
  autoSync: z.boolean().default(true),
  syncInterval: z.coerce.number().min(5).max(1440).default(60),
});

const subnetSchema = z.object({
  subnet: z.string().regex(/^([0-9]{1,3}\.){3}[0-9]{1,3}(\/([0-9]|[1-2][0-9]|3[0-2]))?$/, {
    message: "Please enter a valid CIDR subnet (e.g. 192.168.1.0/24)",
  }),
  description: z.string().optional(),
});

export default function VMMonitoringPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("monitoring");
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVM, setSelectedVM] = useState<any>(null);

  // Fetch Zabbix settings
  const { 
    data: zabbixSettings,
    isLoading: isLoadingSettings
  } = useQuery({
    queryKey: ['/api/zabbix/settings'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/zabbix/settings');
        return await response.json();
      } catch (error) {
        return { 
          url: '',
          apiKey: '',
          autoSync: true,
          syncInterval: 60,
          lastSync: null,
          status: 'not_configured'
        };
      }
    }
  });

  // Fetch VM monitoring data with real-time metrics
  const {
    data: vmMonitoring = [],
    isLoading: isLoadingVMs,
    refetch: refetchVMs
  } = useQuery({
    queryKey: ['/api/vm-monitoring'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/vm-monitoring');
      return await response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch VM performance metrics
  const { data: vmMetrics } = useQuery({
    queryKey: ['/api/vm-monitoring/metrics', selectedVM?.id],
    queryFn: async () => {
      if (!selectedVM) return null;
      const response = await apiRequest('GET', `/api/vm-monitoring/metrics/${selectedVM.id}`);
      return await response.json();
    },
    enabled: !!selectedVM,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const settingsForm = useForm<z.infer<typeof zabbixSettingsSchema>>({
    resolver: zodResolver(zabbixSettingsSchema),
    defaultValues: {
      url: zabbixSettings?.url || '',
      apiKey: zabbixSettings?.apiKey || '',
      autoSync: zabbixSettings?.autoSync ?? true,
      syncInterval: zabbixSettings?.syncInterval || 60,
    }
  });

  useEffect(() => {
    if (zabbixSettings) {
      settingsForm.reset({
        url: zabbixSettings.url || '',
        apiKey: zabbixSettings.apiKey || '',
        autoSync: zabbixSettings.autoSync ?? true,
        syncInterval: zabbixSettings.syncInterval || 60,
      });

      if (zabbixSettings.lastSync) {
        setLastSyncTime(zabbixSettings.lastSync);
      }
    }
  }, [zabbixSettings, settingsForm]);

  const subnetForm = useForm<z.infer<typeof subnetSchema>>({
    resolver: zodResolver(subnetSchema),
    defaultValues: {
      subnet: '',
      description: '',
    }
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof zabbixSettingsSchema>) => {
      const response = await apiRequest('POST', '/api/zabbix/settings', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Zabbix monitoring settings have been updated",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/zabbix/settings'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save settings: ${error.message}`,
        variant: "destructive",
      });
    }
  });

    // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof zabbixSettingsSchema>) => {
      const response = await apiRequest('POST', '/api/zabbix/test-connection', data);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Connection Success",
        description: `Connected to Zabbix API at ${data.url}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Connection Failed",
        description: `Could not connect to Zabbix API: ${error.message}`,
        variant: "destructive",
      });
    }
  });

    // Add subnet mutation
  const addSubnetMutation = useMutation({
    mutationFn: async (data: z.infer<typeof subnetSchema>) => {
      const response = await apiRequest('POST', '/api/zabbix/subnets', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subnet Added",
        description: "New subnet has been added for monitoring",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/zabbix/subnets'] });
      subnetForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add subnet: ${error.message}`,
        variant: "destructive",
      });
    }
  });

    // Delete subnet mutation
  const deleteSubnetMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/zabbix/subnets/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subnet Removed",
        description: "Subnet has been removed from monitoring",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/zabbix/subnets'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to remove subnet: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const syncNowMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/vm-monitoring/sync');
      return await response.json();
    },
    onSuccess: (data) => {
      setLastSyncTime(new Date().toISOString());
      toast({
        title: "Sync Complete",
        description: `Synchronized ${data.count} virtual machines`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vm-monitoring'] });
    },
    onError: (error) => {
      toast({
        title: "Sync Failed",
        description: `Failed to synchronize with Zabbix: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  function onSaveSettings(data: z.infer<typeof zabbixSettingsSchema>) {
    saveSettingsMutation.mutate(data);
  }

  function onTestConnection() {
    const values = settingsForm.getValues();
    testConnectionMutation.mutate(values);
  }

  function onAddSubnet(data: z.infer<typeof subnetSchema>) {
    addSubnetMutation.mutate(data);
  }

  function onDeleteSubnet(id: number) {
    deleteSubnetMutation.mutate(id);
  }

  function onSyncNow() {
    syncNowMutation.mutate();
  }

  function formatDateTime(dateTimeStr: string | null) {
    if (!dateTimeStr) return "Never";
    const date = new Date(dateTimeStr);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    }).format(date);
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'running':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Running</Badge>;
      case 'stopped':
        return <Badge className="bg-red-500"><XCircle className="h-3 w-3 mr-1" />Stopped</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500"><AlertTriangle className="h-3 w-3 mr-1" />Warning</Badge>;
      case 'maintenance':
        return <Badge className="bg-blue-500"><Settings className="h-3 w-3 mr-1" />Maintenance</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  }

  function formatUptime(seconds: number) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  }

  function getProgressColor(value: number) {
    if (value >= 90) return "bg-red-500";
    if (value >= 70) return "bg-yellow-500";
    return "bg-green-500";
  }

  const filteredVMs = vmMonitoring.filter((vm: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (vm.hostname && vm.hostname.toLowerCase().includes(query)) ||
      (vm.ipAddress && vm.ipAddress.toLowerCase().includes(query)) ||
      (vm.status && vm.status.toLowerCase().includes(query))
    );
  });

  const onlineVMs = vmMonitoring.filter((vm: any) => vm.status === 'running').length;
  const totalVMs = vmMonitoring.length;
  const avgCpuUsage = vmMonitoring.reduce((acc: number, vm: any) => acc + (vm.cpuUsage || 0), 0) / totalVMs || 0;
  const avgMemoryUsage = vmMonitoring.reduce((acc: number, vm: any) => acc + (vm.memoryUsage || 0), 0) / totalVMs || 0;

  function onAddSubnet(data: z.infer<typeof subnetSchema>) {
    addSubnetMutation.mutate(data);
  }

  function onDeleteSubnet(id: number) {
    deleteSubnetMutation.mutate(id);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">VM Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time monitoring and management of virtual machines through Zabbix
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setActiveTab("settings")}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
          <Button
            onClick={onSyncNow}
            disabled={syncNowMutation.isPending || !zabbixSettings?.url || !zabbixSettings?.apiKey}
            className="flex items-center gap-2"
          >
            {syncNowMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Sync Now
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Server className="h-5 w-5 text-blue-500" />
              Total VMs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalVMs}</div>
            <p className="text-sm text-muted-foreground">{onlineVMs} online</p>
            <Progress className="mt-2" value={(onlineVMs / totalVMs) * 100} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Cpu className="h-5 w-5 text-green-500" />
              Avg CPU Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgCpuUsage.toFixed(1)}%</div>
            <Progress className="mt-2" value={avgCpuUsage} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <MemoryStick className="h-5 w-5 text-yellow-500" />
              Avg Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgMemoryUsage.toFixed(1)}%</div>
            <Progress className="mt-2" value={avgMemoryUsage} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-500" />
              Last Sync
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{formatDateTime(lastSyncTime)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {zabbixSettings?.autoSync ? `Auto-sync every ${zabbixSettings.syncInterval}m` : 'Manual sync only'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>Virtual Machines</span>
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search VMs..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingVMs ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredVMs.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Hostname</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>CPU Usage</TableHead>
                        <TableHead>Memory Usage</TableHead>
                        <TableHead>Disk Usage</TableHead>
                        <TableHead>Uptime</TableHead>
                        <TableHead>Network</TableHead>
                        <TableHead>Last Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredVMs.map((vm: any) => (
                        <TableRow 
                          key={vm.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedVM(vm)}
                        >
                          <TableCell>{getStatusBadge(vm.status)}</TableCell>
                          <TableCell className="font-medium">{vm.hostname || 'Unknown'}</TableCell>
                          <TableCell>{vm.ipAddress}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{vm.cpuUsage ? `${vm.cpuUsage.toFixed(1)}%` : 'N/A'}</span>
                              {vm.cpuUsage && (
                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${getProgressColor(vm.cpuUsage)}`}
                                    style={{ width: `${Math.min(vm.cpuUsage, 100)}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{vm.memoryUsage ? `${vm.memoryUsage.toFixed(1)}%` : 'N/A'}</span>
                              {vm.memoryUsage && (
                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${getProgressColor(vm.memoryUsage)}`}
                                    style={{ width: `${Math.min(vm.memoryUsage, 100)}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{vm.diskUsage ? `${vm.diskUsage.toFixed(1)}%` : 'N/A'}</span>
                              {vm.diskUsage && (
                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${getProgressColor(vm.diskUsage)}`}
                                    style={{ width: `${Math.min(vm.diskUsage, 100)}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{vm.uptime ? formatUptime(vm.uptime) : 'N/A'}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Wifi className={`h-3 w-3 ${vm.networkStatus === 'up' ? 'text-green-500' : 'text-red-500'}`} />
                              <span className="text-xs">{vm.networkStatus || 'Unknown'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(vm.updatedAt)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-6 text-center">
                  <Server className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <h3 className="text-lg font-medium">No VMs Found</h3>
                  <p className="text-sm text-muted-foreground">
                    {!zabbixSettings?.url || !zabbixSettings?.apiKey ? (
                      <span>Configure Zabbix integration in the settings tab.</span>
                    ) : (
                      <span>Click 'Sync Now' to fetch VMs from Zabbix.</span>
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* VM Details Modal */}
          {selectedVM && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>VM Details: {selectedVM.hostname}</span>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedVM(null)}>
                    ✕
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">System Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span>{getStatusBadge(selectedVM.status)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>IP Address:</span>
                        <span>{selectedVM.ipAddress}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>OS:</span>
                        <span>{selectedVM.osName || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Uptime:</span>
                        <span>{selectedVM.uptime ? formatUptime(selectedVM.uptime) : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CPU Cores:</span>
                        <span>{selectedVM.cpuCores || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Memory:</span>
                        <span>{selectedVM.totalMemory ? `${(selectedVM.totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB` : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Disk:</span>
                        <span>{selectedVM.totalDisk ? `${(selectedVM.totalDisk / 1024 / 1024 / 1024).toFixed(2)} GB` : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Performance Metrics</h4>
                    {vmMetrics?.length > 0 ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={vmMetrics}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="timestamp" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="cpuUsage" stroke="#8884d8" name="CPU %" />
                            <Line type="monotone" dataKey="memoryUsage" stroke="#82ca9d" name="Memory %" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <BarChart3 className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-sm text-muted-foreground">No performance data available</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Zabbix API Settings</CardTitle>
              <CardDescription>
                Configure the connection to your Zabbix monitoring system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSettings ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <Form {...settingsForm}>
                  <form
                    onSubmit={settingsForm.handleSubmit(onSaveSettings)}
                    className="space-y-4"
                  >
                    <FormField
                      control={settingsForm.control}
                      name="url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zabbix URL</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://zabbix.example.com/api_jsonrpc.php"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            The URL of your Zabbix API endpoint
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={settingsForm.control}
                      name="apiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>API Key / Token</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Enter your Zabbix API key"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            API token for authentication with Zabbix
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={settingsForm.control}
                      name="autoSync"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Auto Synchronization</FormLabel>
                            <FormDescription>
                              Automatically sync VMs from Zabbix
                            </FormDescription>
                          </div>
                          <FormControl>
                            <CheckSquare
                              className={`h-5 w-5 ${
                                field.value
                                  ? "text-primary"
                                  : "text-muted-foreground"
                              }`}
                              onClick={() =>
                                field.onChange(!field.value)
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={settingsForm.control}
                      name="syncInterval"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sync Interval (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={5}
                              max={1440}
                              {...field}
                              disabled={!settingsForm.watch("autoSync")}
                            />
                          </FormControl>
                          <FormDescription>
                            How often to sync data from Zabbix (5-1440 minutes)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" disabled={saveSettingsMutation.isPending}>
                        {saveSettingsMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Save Settings
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onTestConnection}
                        disabled={
                          testConnectionMutation.isPending ||
                          !settingsForm.watch("url") ||
                          !settingsForm.watch("apiKey")
                        }
                      >
                        {testConnectionMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Test Connection
                      </Button>
                    </div>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monitoring Subnets</CardTitle>
              <CardDescription>
                Define network subnets to monitor for virtual machines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Form {...subnetForm}>
                <form
                  onSubmit={subnetForm.handleSubmit(onAddSubnet)}
                  className="space-y-4"
                >
                  <FormField
                    control={subnetForm.control}
                    name="subnet"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subnet (CIDR)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="192.168.1.0/24"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter subnet in CIDR format (e.g., 192.168.1.0/24)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={subnetForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Production network"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Optional description for this subnet
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={addSubnetMutation.isPending}
                  >
                    {addSubnetMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Add Subnet
                  </Button>
                </form>
              </Form>

              <Separator className="my-4" />

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Configured Subnets</h3>
                {isLoadingSettings ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Subnet</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}