import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Laptop, Server, Monitor, Cpu, HardDrive, Usb, Package, Eye } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface NetworkDiscoveryDashboardProps {
  hosts: any[];
  onViewDetails?: (host: any) => void;
}

export default function NetworkDiscoveryDashboard({ hosts, onViewDetails }: NetworkDiscoveryDashboardProps) {
  if (!hosts || hosts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Network Discovery Dashboard</CardTitle>
          <CardDescription>No discovered hosts to display</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground">Scan your network to discover devices</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate statistics
  const totalHosts = hosts.length;
  const onlineHosts = hosts.filter(h => h.status === 'online').length;
  const importedHosts = hosts.filter(h => h.status === 'imported').length;
  const withUsbDevices = hosts.filter(h => h.hardwareDetails?.usb?.length > 0).length;
  const withSoftwareInfo = hosts.filter(h => h.systemInfo?.installedSoftware?.length > 0).length;
  const withSerialNumbers = hosts.filter(h => h.hardwareDetails?.serialNumber).length;
  
  // OS distribution data
  const osDistribution = hosts.reduce((acc: any, host: any) => {
    const os = host.systemInfo?.os || 'Unknown';
    acc[os] = (acc[os] || 0) + 1;
    return acc;
  }, {});
  
  const osChartData = Object.keys(osDistribution).map(os => ({
    name: os,
    value: osDistribution[os]
  }));
  
  // Manufacturer distribution
  const manufacturerDistribution = hosts.reduce((acc: any, host: any) => {
    const manufacturer = host.hardwareDetails?.manufacturer || 'Unknown';
    acc[manufacturer] = (acc[manufacturer] || 0) + 1;
    return acc;
  }, {});
  
  const manufacturerChartData = Object.keys(manufacturerDistribution).map(manufacturer => ({
    name: manufacturer,
    value: manufacturerDistribution[manufacturer]
  }));
  
  // Hardware resource data
  const memoryData = hosts
    .filter(h => h.hardwareDetails?.memory)
    .map(host => ({
      name: host.hostname || host.ipAddress,
      memory: parseInt(host.hardwareDetails.memory) / 1024, // Convert to GB
    }))
    .sort((a, b) => b.memory - a.memory)
    .slice(0, 10);
  
  // Storage data
  const storageData = hosts
    .filter(h => h.hardwareDetails?.drives && h.hardwareDetails.drives.length > 0)
    .map(host => {
      const totalStorage = host.hardwareDetails.drives.reduce(
        (acc: number, drive: any) => acc + (parseInt(drive.size) || 0), 
        0
      ) / 1073741824; // Convert to GB
      
      return {
        name: host.hostname || host.ipAddress,
        storage: parseFloat(totalStorage.toFixed(2))
      };
    })
    .sort((a, b) => b.storage - a.storage)
    .slice(0, 10);

  // USB device categories
  const usbCategories = hosts.reduce((acc: any, host: any) => {
    if (host.hardwareDetails?.usb) {
      host.hardwareDetails.usb.forEach((device: any) => {
        const category = device.name?.includes('Keyboard') ? 'Keyboard' :
                         device.name?.includes('Mouse') ? 'Mouse' :
                         device.name?.includes('Camera') ? 'Camera' :
                         device.name?.includes('Storage') || device.name?.includes('USB Drive') ? 'Storage' :
                         'Other';
        acc[category] = (acc[category] || 0) + 1;
      });
    }
    return acc;
  }, {});
  
  const usbCategoryData = Object.keys(usbCategories).map(category => ({
    name: category,
    value: usbCategories[category]
  }));
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Monitor className="h-5 w-5 text-blue-500" />
              Total Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalHosts}</div>
            <p className="text-sm text-muted-foreground">Discovered on network</p>
            <Progress className="mt-2" value={(onlineHosts / totalHosts) * 100} />
            <p className="text-xs text-muted-foreground mt-1">{onlineHosts} online</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Cpu className="h-5 w-5 text-green-500" />
              Hardware Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{withSerialNumbers}</div>
            <p className="text-sm text-muted-foreground">With serial numbers</p>
            <Progress className="mt-2" value={(withSerialNumbers / totalHosts) * 100} />
            <p className="text-xs text-muted-foreground mt-1">{Math.round((withSerialNumbers / totalHosts) * 100)}% coverage</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Usb className="h-5 w-5 text-yellow-500" />
              USB Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{withUsbDevices}</div>
            <p className="text-sm text-muted-foreground">With USB peripherals</p>
            <Progress className="mt-2" value={(withUsbDevices / totalHosts) * 100} />
            <p className="text-xs text-muted-foreground mt-1">{Math.round((withUsbDevices / totalHosts) * 100)}% coverage</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-500" />
              Software Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{withSoftwareInfo}</div>
            <p className="text-sm text-muted-foreground">With installed software</p>
            <Progress className="mt-2" value={(withSoftwareInfo / totalHosts) * 100} />
            <p className="text-xs text-muted-foreground mt-1">{Math.round((withSoftwareInfo / totalHosts) * 100)}% coverage</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="hardware">Hardware</TabsTrigger>
          <TabsTrigger value="software">Software</TabsTrigger>
          <TabsTrigger value="peripherals">Peripherals</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Operating System Distribution</CardTitle>
                <CardDescription>Discovered operating systems by count</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={osChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {osChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} device(s)`, 'Count']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Manufacturer Distribution</CardTitle>
                <CardDescription>Discovered manufacturers by count</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={manufacturerChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {manufacturerChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} device(s)`, 'Count']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Device Overview</CardTitle>
              <CardDescription>Summary of discovered hosts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Hostname</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>OS</TableHead>
                      <TableHead>Manufacturer / Model</TableHead>
                      <TableHead>RAM</TableHead>
                      <TableHead>Last Seen</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hosts.map((host, index) => (
                      <TableRow key={`host-${index}`}>
                        <TableCell>
                          {host.status === 'online' ? (
                            <Badge className="bg-green-500">Online</Badge>
                          ) : host.status === 'imported' ? (
                            <Badge className="bg-blue-500">Imported</Badge>
                          ) : (
                            <Badge variant="outline">Offline</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{host.hostname || 'Unknown'}</TableCell>
                        <TableCell>{host.ipAddress}</TableCell>
                        <TableCell>{host.systemInfo?.os || 'Unknown'}</TableCell>
                        <TableCell>
                          {host.hardwareDetails?.manufacturer ? (
                            `${host.hardwareDetails.manufacturer} / ${host.hardwareDetails.model || 'Unknown'}`
                          ) : (
                            'Unknown'
                          )}
                        </TableCell>
                        <TableCell>
                          {host.hardwareDetails?.memory ? (
                            `${(parseInt(host.hardwareDetails.memory) / 1024).toFixed(2)} GB`
                          ) : (
                            'Unknown'
                          )}
                        </TableCell>
                        <TableCell>{formatDate(host.lastSeen)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onViewDetails && onViewDetails(host)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="hardware" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Memory Resources</CardTitle>
                <CardDescription>Top 10 devices by RAM</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={memoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis label={{ value: 'RAM (GB)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(value) => [`${value} GB`, 'RAM']} />
                      <Bar dataKey="memory" fill="#0088FE" name="RAM (GB)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Storage Resources</CardTitle>
                <CardDescription>Top 10 devices by storage capacity</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={storageData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis label={{ value: 'Storage (GB)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(value) => [`${value} GB`, 'Storage']} />
                      <Bar dataKey="storage" fill="#00C49F" name="Storage (GB)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Hardware Inventory</CardTitle>
              <CardDescription>Detailed hardware information for discovered devices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Device</TableHead>
                      <TableHead>Manufacturer</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Serial Number</TableHead>
                      <TableHead>CPU</TableHead>
                      <TableHead>RAM</TableHead>
                      <TableHead>Storage</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hosts.filter(host => host.hardwareDetails).map((host, index) => (
                      <TableRow key={`hw-${index}`}>
                        <TableCell className="font-medium">{host.hostname || host.ipAddress}</TableCell>
                        <TableCell>{host.hardwareDetails?.manufacturer || 'Unknown'}</TableCell>
                        <TableCell>{host.hardwareDetails?.model || 'Unknown'}</TableCell>
                        <TableCell>{host.hardwareDetails?.serialNumber || 'Unknown'}</TableCell>
                        <TableCell>{host.hardwareDetails?.processor || 'Unknown'}</TableCell>
                        <TableCell>
                          {host.hardwareDetails?.memory ? (
                            `${(parseInt(host.hardwareDetails.memory) / 1024).toFixed(2)} GB`
                          ) : (
                            'Unknown'
                          )}
                        </TableCell>
                        <TableCell>
                          {host.hardwareDetails?.drives ? (
                            `${host.hardwareDetails.drives.length} drive(s)`
                          ) : (
                            'Unknown'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onViewDetails && onViewDetails(host)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="software" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Operating System Distribution</CardTitle>
              <CardDescription>Breakdown of operating systems across network</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={osChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {osChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} device(s)`, 'Count']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Software Inventory</CardTitle>
              <CardDescription>Installed software across all devices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Device</TableHead>
                      <TableHead>OS</TableHead>
                      <TableHead>OS Version</TableHead>
                      <TableHead>Software Count</TableHead>
                      <TableHead>Notable Applications</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hosts.filter(host => host.systemInfo).map((host, index) => {
                      const softwareCount = host.systemInfo?.installedSoftware?.length || 0;
                      const notableSoftware = host.systemInfo?.installedSoftware
                        ?.slice(0, 3)
                        .map((sw: any) => sw.name)
                        .join(", ");
                      
                      return (
                        <TableRow key={`sw-${index}`}>
                          <TableCell className="font-medium">{host.hostname || host.ipAddress}</TableCell>
                          <TableCell>{host.systemInfo?.os || 'Unknown'}</TableCell>
                          <TableCell>{host.systemInfo?.osVersion || 'Unknown'}</TableCell>
                          <TableCell>{softwareCount}</TableCell>
                          <TableCell>{notableSoftware || 'None'}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onViewDetails && onViewDetails(host)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="peripherals" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>USB Device Categories</CardTitle>
                <CardDescription>Types of USB devices detected</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={usbCategoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {usbCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} device(s)`, 'Count']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Peripheral Summary</CardTitle>
                <CardDescription>Summary of detected peripherals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-md border p-4 text-center">
                      <div className="text-2xl font-bold">
                        {hosts.reduce((acc, host) => 
                          acc + (host.hardwareDetails?.usb?.length || 0), 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total USB Devices</div>
                    </div>
                    
                    <div className="rounded-md border p-4 text-center">
                      <div className="text-2xl font-bold">
                        {withUsbDevices}
                      </div>
                      <div className="text-sm text-muted-foreground">Hosts with USB Devices</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Device Type Breakdown</h4>
                    {Object.keys(usbCategories).map((category, index) => (
                      <div key={`cat-${index}`} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="text-sm">{category}:</span>
                        <span className="text-sm font-medium">{usbCategories[category]} devices</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>USB Inventory</CardTitle>
              <CardDescription>Detailed list of all USB devices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Host</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Product ID</TableHead>
                      <TableHead>Serial</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hosts
                      .filter(host => host.hardwareDetails?.usb?.length > 0)
                      .flatMap(host => 
                        host.hardwareDetails.usb.map((device: any, deviceIndex: number) => ({
                          hostName: host.hostname || host.ipAddress,
                          device,
                          key: `${host.id}-${deviceIndex}`
                        }))
                      )
                      .map((item) => (
                        <TableRow key={item.key}>
                          <TableCell className="font-medium">{item.hostName}</TableCell>
                          <TableCell>{item.device.name || 'Unknown Device'}</TableCell>
                          <TableCell>{item.device.vendor || 'Unknown'}</TableCell>
                          <TableCell>{item.device.productId || 'N/A'}</TableCell>
                          <TableCell>{item.device.serial || 'N/A'}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                // Find the host that contains this USB device
                                const host = hosts.find(h => 
                                  (h.hostname || h.ipAddress) === item.hostName && 
                                  h.hardwareDetails?.usb?.some((d: any) => 
                                    d.name === item.device.name && 
                                    d.vendor === item.device.vendor
                                  )
                                );
                                if (host && onViewDetails) onViewDetails(host);
                              }}
                              title="View Host Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    }
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper function to format dates
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