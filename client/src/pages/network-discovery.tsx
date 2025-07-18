import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Scan, Search, AlertTriangle, Database, PlusCircle, Eye, Download, RefreshCw, Server, PieChart } from "lucide-react";

// Form schema for network scan
const scanFormSchema = z.object({
  ipRange: z.string()
    .regex(/^([0-9]{1,3}\.){3}[0-9]{1,3}(\/([0-9]|[1-2][0-9]|3[0-2]))?$/, {
      message: "Please enter a valid IP address or CIDR range",
    }),
  primaryDNS: z.string().optional(),
  secondaryDNS: z.string().optional(),
  useDNS: z.boolean().default(true),
  scanForUSB: z.boolean().default(true),
  scanForSerialNumbers: z.boolean().default(true),
  scanForHardwareDetails: z.boolean().default(true),
  scanForInstalledSoftware: z.boolean().default(true),
});

// Form schema for discovered host details
const importHostSchema = z.object({
  assetTag: z.string().min(1, "Asset tag is required"),
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  status: z.string().min(1, "Status is required"),
  notes: z.string().optional(),
});

export default function NetworkDiscoveryPage() {
  const { toast } = useToast();
  const [selectedHost, setSelectedHost] = useState<any>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scanInProgress, setScanInProgress] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResults, setScanResults] = useState<any[]>([]);
  
  // WebSocket functionality temporarily disabled
  const wsStatus = 'CLOSED';
  
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
        // Return default settings if none exist
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
  
  // Fetch subnets
  const { 
    data: subnets = [],
    isLoading: isLoadingSubnets
  } = useQuery({
    queryKey: ['/api/zabbix/subnets'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/zabbix/subnets');
      return await response.json();
    }
  });
  
  // Fetch discovered hosts
  const { 
    data: discoveredHosts = [],
    isLoading: isLoadingHosts,
    refetch: refetchHosts
  } = useQuery({
    queryKey: ['/api/network-discovery/hosts'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/network-discovery/hosts');
      return await response.json();
    }
  });
  
  // Set up polling as fallback for real-time updates
  useEffect(() => {
    if (scanInProgress) {
      const pollInterval = setInterval(() => {
        // Simulate progress updates
        setScanProgress(prev => {
          const newProgress = Math.min(prev + 10, 100);
          if (newProgress >= 100) {
            setScanInProgress(false);
            clearInterval(pollInterval);
            
            // Refetch hosts when scan is complete
            refetchHosts().then(() => {
              toast({
                title: "Scan Complete",
                description: "Discovered devices on your network",
              });
            });
          }
          return newProgress;
        });
      }, 1000);
      
      return () => clearInterval(pollInterval);
    }
  }, [scanInProgress, refetchHosts, toast]);
  
  // Form for network scan
  const scanForm = useForm<z.infer<typeof scanFormSchema>>({
    resolver: zodResolver(scanFormSchema),
    defaultValues: {
      ipRange: '',
      primaryDNS: '8.8.8.8',
      secondaryDNS: '8.8.4.4',
      useDNS: true,
      scanForUSB: true,
      scanForSerialNumbers: true,
      scanForHardwareDetails: true,
      scanForInstalledSoftware: true,
    }
  });
  
  // Form for importing a host as an asset
  const importForm = useForm<z.infer<typeof importHostSchema>>({
    resolver: zodResolver(importHostSchema),
    defaultValues: {
      assetTag: '',
      name: '',
      category: 'computer',
      status: 'deployed',
      notes: '',
    }
  });
  
  // Start network scan mutation
  const startScanMutation = useMutation({
    mutationFn: async (data: z.infer<typeof scanFormSchema>) => {
      setScanInProgress(true);
      setScanProgress(0);
      setScanResults([]);
      
      // Include Zabbix settings in the scan request if available
      const scanPayload = {
        ...data,
        zabbixUrl: zabbixSettings?.url || null,
        zabbixApiKey: zabbixSettings?.apiKey || null,
        useZabbix: !!(zabbixSettings?.url && zabbixSettings?.apiKey),
        // Enhanced scanning options
        deepScan: true,
        timeout: 5000,
        concurrent: 50
      };
      
      const response = await apiRequest('POST', '/api/network-discovery/scan', scanPayload);
      return await response.json();
    },
    onSuccess: (data) => {
      let scanDescription = `Scanning network range ${data.ipRange}`;
      
      if (data.scanDetails?.usingZabbix) {
        scanDescription += ' with Zabbix integration';
      }
      
      if (data.scanDetails?.dnsSettings) {
        scanDescription += ` using DNS servers (${data.scanDetails.dnsSettings.primaryDNS || 'primary'}, ${data.scanDetails.dnsSettings.secondaryDNS || 'secondary'})`;
      }
      
      toast({
        title: "Scan Started",
        description: scanDescription,
      });
      
      // Set up polling for updates (WebSocket functionality is disabled)
      {
        const interval = setInterval(async () => {
          const response = await apiRequest('GET', '/api/network-discovery/hosts');
          const hosts = await response.json();
          if (hosts.length > scanResults.length) {
            setScanResults(hosts);
          }
        }, 5000);
        
        setTimeout(() => {
          clearInterval(interval);
          setScanInProgress(false);
          setScanProgress(100);
          refetchHosts();
        }, 30000);
      }
    },
    onError: (error) => {
      setScanInProgress(false);
      toast({
        title: "Scan Failed",
        description: `Could not start network scan: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Import host as asset mutation
  const importHostMutation = useMutation({
    mutationFn: async ({ hostId, data }: { hostId: number, data: z.infer<typeof importHostSchema> }) => {
      const response = await apiRequest('POST', `/api/network-discovery/hosts/${hostId}/import`, data);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Host Imported",
        description: `Successfully imported as asset: ${data.asset.name}`,
      });
      setImportDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/network-discovery/hosts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: `Could not import host: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Delete host mutation
  const deleteHostMutation = useMutation({
    mutationFn: async (hostId: number) => {
      const response = await apiRequest('DELETE', `/api/network-discovery/hosts/${hostId}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Host Deleted",
        description: "Host has been removed from discovered hosts",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/network-discovery/hosts'] });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: `Could not delete host: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission for scanning
  function onStartScan(data: z.infer<typeof scanFormSchema>) {
    startScanMutation.mutate(data);
  }
  
  // Handle form submission for importing
  function onImportHost(data: z.infer<typeof importHostSchema>) {
    if (selectedHost) {
      importHostMutation.mutate({ hostId: selectedHost.id, data });
    }
  }
  
  // Open the import dialog for a host
  function handleImportClick(host: any) {
    setSelectedHost(host);
    importForm.reset({
      assetTag: `DISC-${Date.now().toString().substring(7)}`,
      name: host.hostname || `Device-${host.ipAddress.replace(/\./g, '-')}`,
      category: 'computer',
      status: 'deployed',
      notes: `Discovered via network scan. IP: ${host.ipAddress}, MAC: ${host.macAddress || 'Unknown'}`,
    });
    setImportDialogOpen(true);
  }
  
  // Open the details dialog for a host
  function handleViewDetailsClick(host: any) {
    setSelectedHost(host);
    setDetailsDialogOpen(true);
  }
  
  // Handle deleting a host
  function handleDeleteClick(host: any) {
    if (confirm(`Are you sure you want to delete the host at ${host.ipAddress}?`)) {
      deleteHostMutation.mutate(host.id);
    }
  }
  
  // Format a date for display
  function formatDate(dateString: string | null) {
    if (!dateString) return "Unknown";
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(new Date(dateString));
  }
  
  // Get status badge for a host
  function getStatusBadge(status: string) {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-500">Online</Badge>;
      case 'offline':
        return <Badge variant="outline">Offline</Badge>;
      case 'imported':
        return <Badge className="bg-blue-500">Imported</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  }
  
  // Filter hosts based on search query
  const filteredHosts = discoveredHosts.filter((host: any) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      (host.hostname && host.hostname.toLowerCase().includes(query)) ||
      (host.ipAddress && host.ipAddress.toLowerCase().includes(query)) ||
      (host.macAddress && host.macAddress.toLowerCase().includes(query))
    );
  });
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Network Discovery</h1>
          <p className="text-muted-foreground">
            Scan your network to discover devices and import them as assets
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative flex-grow">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search hosts..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => refetchHosts()}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden md:inline">Refresh</span>
          </Button>
          <Button
            variant="default"
            onClick={() => window.location.href = '/network-discovery-dashboard'}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <PieChart className="h-4 w-4" />
            <span className="hidden md:inline">View Dashboard</span>
            <span className="md:hidden">Dashboard</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="hosts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hosts" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Discovered Hosts
          </TabsTrigger>
          <TabsTrigger value="scan" className="flex items-center gap-2">
            <Scan className="h-4 w-4" />
            Network Scan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hosts" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Discovered Network Devices</CardTitle>
              <CardDescription>
                Devices found on your network through scanning
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingHosts ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredHosts.length > 0 ? (
                <div className="rounded-md border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Hostname</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>MAC Address</TableHead>
                        <TableHead>Discovered</TableHead>
                        <TableHead>Last Seen</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHosts.map((host: any) => (
                        <TableRow key={host.id}>
                          <TableCell>{getStatusBadge(host.status)}</TableCell>
                          <TableCell className="font-medium">{host.hostname || 'Unknown'}</TableCell>
                          <TableCell>{host.ipAddress}</TableCell>
                          <TableCell>{host.macAddress || 'Unknown'}</TableCell>
                          <TableCell>{formatDate(host.createdAt)}</TableCell>
                          <TableCell>{formatDate(host.lastSeen)}</TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewDetailsClick(host)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {host.status !== 'imported' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleImportClick(host)}
                                >
                                  <Database className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(host)}
                              >
                                <span className="text-red-500">✕</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-6 text-center">
                  <div className="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                    <Search className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium">No Hosts Found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    No devices have been discovered on your network yet.<br />
                    Use the Network Scan tab to start scanning.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scan" className="space-y-4">
          {/* Zabbix Settings Alert */}
          {!isLoadingSettings && (!zabbixSettings?.url || !zabbixSettings?.apiKey) && (
            <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-orange-600 dark:text-orange-300 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Zabbix Settings Not Configured
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-orange-600 dark:text-orange-300">
                  The Zabbix API connection is not fully configured. Some network discovery features may be limited.
                  To enable full functionality, please configure the Zabbix settings in the VM Monitoring page.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4 text-orange-600 border-orange-200 hover:bg-orange-100 dark:text-orange-300 dark:border-orange-800 dark:hover:bg-orange-900"
                  onClick={() => window.location.href = '/vm-monitoring'}
                >
                  Go to VM Monitoring Settings
                </Button>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Network Scan</CardTitle>
              <CardDescription>
                Scan your network to discover devices and their details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Form {...scanForm}>
                <form
                  onSubmit={scanForm.handleSubmit(onStartScan)}
                  className="space-y-4"
                >
                  <FormField
                    control={scanForm.control}
                    name="ipRange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IP Address or Range</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="192.168.1.0/24"
                            {...field}
                            disabled={scanInProgress}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter a single IP address (192.168.1.1) or CIDR range (192.168.1.0/24)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={scanForm.control}
                      name="primaryDNS"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary DNS</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="8.8.8.8"
                              {...field}
                              disabled={scanInProgress || !scanForm.watch("useDNS")}
                            />
                          </FormControl>
                          <FormDescription>
                            Primary DNS server for hostname resolution (e.g., 8.8.8.8)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={scanForm.control}
                      name="secondaryDNS"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Secondary DNS</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="8.8.4.4"
                              {...field}
                              disabled={scanInProgress || !scanForm.watch("useDNS")}
                            />
                          </FormControl>
                          <FormDescription>
                            Backup DNS server for hostname resolution (e.g., 8.8.4.4)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={scanForm.control}
                    name="useDNS"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={scanInProgress}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Use DNS for Hostname Resolution</FormLabel>
                          <FormDescription>
                            Enable DNS lookups during scanning to resolve hostnames
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={scanForm.control}
                      name="scanForUSB"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={scanInProgress}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Scan USB Devices</FormLabel>
                            <FormDescription>
                              Detect connected USB peripherals
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={scanForm.control}
                      name="scanForSerialNumbers"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={scanInProgress}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Scan Serial Numbers</FormLabel>
                            <FormDescription>
                              Collect hardware serial numbers
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={scanForm.control}
                      name="scanForHardwareDetails"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={scanInProgress}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Scan Hardware Details</FormLabel>
                            <FormDescription>
                              Collect CPU, RAM, and storage info
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={scanForm.control}
                      name="scanForInstalledSoftware"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={scanInProgress}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Scan Installed Software</FormLabel>
                            <FormDescription>
                              Collect OS and installed applications
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {scanInProgress && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Scan progress: {scanProgress.toFixed(0)}%
                      </p>
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div
                          className="bg-primary h-2.5 rounded-full"
                          style={{ width: `${scanProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={scanInProgress || startScanMutation.isPending}
                  >
                    {scanInProgress || startScanMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Scan className="mr-2 h-4 w-4" />
                        Start Network Scan
                      </>
                    )}
                  </Button>
                </form>
              </Form>

              {scanResults.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-lg font-medium">Live Scan Results</h3>
                  <div className="rounded-md border overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Hostname</TableHead>
                          <TableHead>IP Address</TableHead>
                          <TableHead>MAC Address</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scanResults.map((host: any, index: number) => (
                          <TableRow key={`scan-result-${index}`}>
                            <TableCell className="font-medium">{host.hostname || 'Unknown'}</TableCell>
                            <TableCell>{host.ipAddress}</TableCell>
                            <TableCell>{host.macAddress || 'Unknown'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Host Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Host Details: {selectedHost?.hostname || selectedHost?.ipAddress}</DialogTitle>
            <DialogDescription>
              Detailed information collected from the discovered device
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto p-2">
            {selectedHost && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Basic Information</h3>
                    <div className="rounded-md border p-4 space-y-2">
                      <div className="grid grid-cols-3 gap-1">
                        <span className="text-sm font-medium">Status:</span>
                        <span className="col-span-2">{getStatusBadge(selectedHost.status)}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <span className="text-sm font-medium">Hostname:</span>
                        <span className="col-span-2">{selectedHost.hostname || 'Unknown'}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <span className="text-sm font-medium">IP Address:</span>
                        <span className="col-span-2">{selectedHost.ipAddress}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <span className="text-sm font-medium">MAC Address:</span>
                        <span className="col-span-2">{selectedHost.macAddress || 'Unknown'}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <span className="text-sm font-medium">First Discovered:</span>
                        <span className="col-span-2">{formatDate(selectedHost.createdAt)}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <span className="text-sm font-medium">Last Seen:</span>
                        <span className="col-span-2">{formatDate(selectedHost.lastSeen)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">System Information</h3>
                    <div className="rounded-md border p-4 space-y-2">
                      {selectedHost.systemInfo ? (
                        <>
                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-sm font-medium">OS:</span>
                            <span className="col-span-2">{selectedHost.systemInfo.os || 'Unknown'}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-sm font-medium">OS Version:</span>
                            <span className="col-span-2">{selectedHost.systemInfo.osVersion || 'Unknown'}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-sm font-medium">Architecture:</span>
                            <span className="col-span-2">{selectedHost.systemInfo.architecture || 'Unknown'}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-sm font-medium">Computer Name:</span>
                            <span className="col-span-2">{selectedHost.systemInfo.computerName || 'Unknown'}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-sm font-medium">Domain:</span>
                            <span className="col-span-2">{selectedHost.systemInfo.domain || 'None'}</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                          <p>No system information available</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Hardware Details</h3>
                  <div className="rounded-md border p-4 space-y-2">
                    {selectedHost.hardwareDetails ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-sm font-medium">Manufacturer:</span>
                            <span className="col-span-2">{selectedHost.hardwareDetails.manufacturer || 'Unknown'}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-sm font-medium">Model:</span>
                            <span className="col-span-2">{selectedHost.hardwareDetails.model || 'Unknown'}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-sm font-medium">Serial Number:</span>
                            <span className="col-span-2">{selectedHost.hardwareDetails.serialNumber || 'Unknown'}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-sm font-medium">CPU:</span>
                            <span className="col-span-2">{selectedHost.hardwareDetails.processor || 'Unknown'}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            <span className="text-sm font-medium">Memory:</span>
                            <span className="col-span-2">
                              {selectedHost.hardwareDetails.memory 
                                ? `${(selectedHost.hardwareDetails.memory / 1024).toFixed(2)} GB` 
                                : 'Unknown'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="text-md font-medium">Storage Devices</h4>
                          {selectedHost.hardwareDetails.drives?.length > 0 ? (
                            <div className="rounded-md border">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Drive</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead>Free Space</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {selectedHost.hardwareDetails.drives.map((drive: any, index: number) => (
                                    <TableRow key={`drive-${index}`}>
                                      <TableCell>{drive.device || drive.name || `Drive ${index}`}</TableCell>
                                      <TableCell>
                                        {drive.size 
                                          ? `${(drive.size / 1073741824).toFixed(2)} GB` 
                                          : 'Unknown'}
                                      </TableCell>
                                      <TableCell>
                                        {drive.freeSpace 
                                          ? `${(drive.freeSpace / 1073741824).toFixed(2)} GB` 
                                          : 'Unknown'}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No storage information available</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                        <p>No hardware details available</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedHost.hardwareDetails?.usb?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">USB Devices</h3>
                    <div className="rounded-md border overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Device</TableHead>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Product ID</TableHead>
                            <TableHead>Serial</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedHost.hardwareDetails.usb.map((device: any, index: number) => (
                            <TableRow key={`usb-${index}`}>
                              <TableCell>{device.name || 'Unknown Device'}</TableCell>
                              <TableCell>{device.vendor || 'Unknown'}</TableCell>
                              <TableCell>{device.productId || 'N/A'}</TableCell>
                              <TableCell>{device.serial || 'N/A'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
                
                {selectedHost.systemInfo?.installedSoftware?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Installed Software</h3>
                    <div className="rounded-md border overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Application</TableHead>
                            <TableHead>Version</TableHead>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Install Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedHost.systemInfo.installedSoftware.map((app: any, index: number) => (
                            <TableRow key={`app-${index}`}>
                              <TableCell>{app.name || 'Unknown'}</TableCell>
                              <TableCell>{app.version || 'Unknown'}</TableCell>
                              <TableCell>{app.vendor || 'Unknown'}</TableCell>
                              <TableCell>{app.installDate ? formatDate(app.installDate) : 'Unknown'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            {selectedHost && selectedHost.status !== 'imported' && (
              <Button onClick={() => {
                setDetailsDialogOpen(false);
                handleImportClick(selectedHost);
              }}>
                <Database className="mr-2 h-4 w-4" />
                Import as Asset
              </Button>
            )}
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Host Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import Host as Asset</DialogTitle>
            <DialogDescription>
              Create a new asset record from this discovered device
            </DialogDescription>
          </DialogHeader>
          
          <Form {...importForm}>
            <form
              onSubmit={importForm.handleSubmit(onImportHost)}
              className="space-y-4"
            >
              <FormField
                control={importForm.control}
                name="assetTag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Tag</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter asset tag"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={importForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter asset name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={importForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="computer">Computer</SelectItem>
                        <SelectItem value="server">Server</SelectItem>
                        <SelectItem value="networking">Networking Equipment</SelectItem>
                        <SelectItem value="mobile">Mobile Device</SelectItem>
                        <SelectItem value="printer">Printer</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={importForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="deployed">Deployed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={importForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional information"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={importHostMutation.isPending}
                >
                  {importHostMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <PlusCircle className="mr-2 h-4 w-4" />
                  )}
                  Import as Asset
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}