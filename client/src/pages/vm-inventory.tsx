import { PlusCircle, Filter, Trash2, Download, Upload, RefreshCw, Server, HardDrive, FileText, Calendar, Users, Pencil } from "lucide-react";
import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { parseVMCSV, convertCSVToVMs, convertToCSV, downloadCSV } from "@/lib/csv-import";

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

// Mock data - this would be replaced with actual API data
const vmData = [
  {
    id: 1,
    // VM Identification
    vmId: "VM-001",
    vmName: "WebServer01",
    vmStatus: "Running",
    vmIp: "192.168.1.10",
    internetAccess: true,
    vmOs: "Ubuntu",
    vmOsVersion: "22.04 LTS",
    // Host Details
    hypervisor: "VMware",
    hostname: "esxi-host-01",
    hostModel: "Dell PowerEdge R740",
    hostIp: "10.0.0.5",
    hostOs: "VMware ESXi",
    rack: "Rack-A02",
    // Usage and tracking
    deployedBy: "admin",
    user: "webadmin",
    department: "IT",
    startDate: "2023-01-15",
    endDate: "2024-01-15",
    jiraTicket: "SRPH-1234",
    remarks: "Production web server",
    dateDeleted: null
  },
  {
    id: 2,
    // VM Identification
    vmId: "VM-002",
    vmName: "DBServer01",
    vmStatus: "Running",
    vmIp: "192.168.1.11",
    internetAccess: false,
    vmOs: "CentOS",
    vmOsVersion: "8.5",
    // Host Details
    hypervisor: "VMware",
    hostname: "esxi-host-01",
    hostModel: "Dell PowerEdge R740",
    hostIp: "10.0.0.5",
    hostOs: "VMware ESXi",
    rack: "Rack-A02",
    // Usage and tracking
    deployedBy: "admin",
    user: "dbadmin",
    department: "IT",
    startDate: "2023-01-20",
    endDate: "2024-01-20",
    jiraTicket: "SRPH-1235",
    remarks: "Production database server",
    dateDeleted: null
  },
  {
    id: 3,
    // VM Identification
    vmId: "VM-003",
    vmName: "TestServer01",
    vmStatus: "Stopped",
    vmIp: "192.168.1.12",
    internetAccess: false,
    vmOs: "Windows Server",
    vmOsVersion: "2019",
    // Host Details
    hypervisor: "VMware",
    hostname: "esxi-host-02",
    hostModel: "Dell PowerEdge R740",
    hostIp: "10.0.0.6",
    hostOs: "VMware ESXi",
    rack: "Rack-A03",
    // Usage and tracking
    deployedBy: "user1",
    user: "testadmin",
    department: "Development",
    startDate: "2023-02-10",
    endDate: "2023-08-10",
    jiraTicket: "SRPH-1240",
    remarks: "Test environment for new application",
    dateDeleted: null
  },
  {
    id: 4,
    // VM Identification
    vmId: "VM-004",
    vmName: "DevServer01",
    vmStatus: "Running",
    vmIp: "192.168.1.13",
    internetAccess: false,
    vmOs: "Debian",
    vmOsVersion: "11",
    // Host Details
    hypervisor: "Hyper-V",
    hostname: "hyperv-host-01",
    hostModel: "HP ProLiant DL380",
    hostIp: "10.0.0.7",
    hostOs: "Windows Server 2019",
    rack: "Rack-A04",
    // Usage and tracking
    deployedBy: "user2",
    user: "devadmin",
    department: "Development",
    startDate: "2023-03-05",
    endDate: "2023-12-31",
    jiraTicket: "SRPH-1245",
    remarks: "Development environment",
    dateDeleted: null
  },
  {
    id: 5,
    // VM Identification
    vmId: "VM-005",
    vmName: "BackupServer01",
    vmStatus: "Running",
    vmIp: "192.168.1.14",
    internetAccess: false,
    vmOs: "Ubuntu",
    vmOsVersion: "20.04 LTS",
    // Host Details
    hypervisor: "VMware",
    hostname: "esxi-host-03",
    hostModel: "Dell PowerEdge R740",
    hostIp: "10.0.0.8",
    hostOs: "VMware ESXi",
    rack: "Rack-A05",
    // Usage and tracking
    deployedBy: "admin",
    user: "backupadmin",
    department: "IT",
    startDate: "2023-01-25",
    endDate: "2024-01-25",
    jiraTicket: "SRPH-1250",
    remarks: "Backup server for critical systems",
    dateDeleted: null
  }
];

type VmStatus = "Running" | "Stopped" | "Provisioning" | "Decommissioned";

interface VirtualMachine {
  id: number;
  // VM Identification
  vmId: string;
  vmName: string;
  vmStatus: string;
  vmIp: string;
  internetAccess: boolean;
  vmOs: string;
  vmOsVersion: string;
  // Host Details
  hypervisor: string;
  hostname: string;
  hostModel: string;
  hostIp: string;
  hostOs: string;
  rack: string;
  // Usage and tracking
  deployedBy: string;
  user: string;
  department: string;
  startDate: string;
  endDate: string;
  jiraTicket: string;
  remarks: string;
  dateDeleted: string | null;
}

type NewVirtualMachine = Omit<VirtualMachine, "id">;

export default function VMInventoryPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [vmToDelete, setVmToDelete] = useState<VirtualMachine | null>(null);
  const [vmToEdit, setVmToEdit] = useState<VirtualMachine | null>(null);
  const [vmToView, setVmToView] = useState<VirtualMachine | null>(null);
  const [newVM, setNewVM] = useState<Partial<NewVirtualMachine>>({
    vmStatus: "Provisioning",
    internetAccess: false,
  });
  const [importContent, setImportContent] = useState<string>("");
  const [importType, setImportType] = useState<"csv" | "excel">("csv");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch VMs from the API
  const { data: vms = [], isLoading, error } = useQuery({ 
    queryKey: ['/api/vm-inventory'],
    queryFn: async () => {
      const response = await fetch('/api/vm-inventory');
      if (!response.ok) throw new Error('Failed to fetch VM inventory');
      return response.json();
    },
  });

  // Create VM mutation
  const createVmMutation = useMutation({
    mutationFn: async (vmData: any) => {
      const response = await apiRequest('POST', '/api/vm-inventory', vmData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vm-inventory'] });
      toast({
        title: "Success",
        description: "VM added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update VM mutation
  const updateVmMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest('PATCH', `/api/vm-inventory/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vm-inventory'] });
      toast({
        title: "Success",
        description: "VM updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete VM mutation
  const deleteVmMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/vm-inventory/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vm-inventory'] });
      toast({
        title: "Success",
        description: "VM deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: keyof NewVirtualMachine, value: string | boolean) => {
    setNewVM((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!newVM.vmName || !newVM.vmId || !newVM.hypervisor) {
      toast({
        title: "Missing information",
        description: "Please fill in the required fields (VM Name, VM ID, and Hypervisor).",
        variant: "destructive",
      });
      return;
    }

    const vmData = {
      vmId: newVM.vmId || "",
      vmName: newVM.vmName,
      vmStatus: newVM.vmStatus || "Running",
      vmIp: newVM.vmIp || "",
      internetAccess: newVM.internetAccess || false,
      vmOs: newVM.vmOs || "",
      vmOsVersion: newVM.vmOsVersion || "",
      hypervisor: newVM.hypervisor,
      hostname: newVM.hostname || "",
      hostModel: newVM.hostModel || "",
      hostIp: newVM.hostIp || "",
      hostOs: newVM.hostOs || "",
      rack: newVM.rack || "",
      deployedBy: newVM.deployedBy || "",
      user: newVM.user || "",
      department: newVM.department || "",
      startDate: newVM.startDate || "",
      endDate: newVM.endDate || "",
      jiraTicket: newVM.jiraTicket || "",
      remarks: newVM.remarks || "",
      dateDeleted: newVM.dateDeleted || null,
      
      // Legacy fields for compatibility
      hostName: newVM.hostname || "",
      guestOs: newVM.vmOs || "",
      powerState: newVM.vmStatus || "Running",
      ipAddress: newVM.vmIp || null,
      macAddress: null,
      notes: newVM.remarks || null,
      cpuCount: null,
      memoryMB: null,
      diskSpaceGB: null,
      datacenter: newVM.rack || null,
      lastModified: new Date().toISOString(),
    };

    createVmMutation.mutate(vmData, {
      onSuccess: () => {
        setIsAddDialogOpen(false);
        setNewVM({
          vmStatus: "Provisioning",
          internetAccess: false,
        });
      },
    });
  };

  const handleDeleteVM = () => {
    if (!vmToDelete) return;
    
    deleteVmMutation.mutate(vmToDelete.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        setVmToDelete(null);
      },
    });
  };
  
  const handleVmEditChange = (field: keyof VirtualMachine, value: string | boolean) => {
    if (!vmToEdit) return;
    
    setVmToEdit(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: value
      };
    });
  };
  
  const handleEditVM = () => {
    if (!vmToEdit) return;
    
    const vmData = {
      vmId: vmToEdit.vmId || "",
      vmName: vmToEdit.vmName,
      vmStatus: vmToEdit.vmStatus || "Running",
      vmIp: vmToEdit.vmIp || "",
      internetAccess: vmToEdit.internetAccess || false,
      vmOs: vmToEdit.vmOs || "",
      vmOsVersion: vmToEdit.vmOsVersion || "",
      hypervisor: vmToEdit.hypervisor,
      hostname: vmToEdit.hostname || "",
      hostModel: vmToEdit.hostModel || "",
      hostIp: vmToEdit.hostIp || "",
      hostOs: vmToEdit.hostOs || "",
      rack: vmToEdit.rack || "",
      deployedBy: vmToEdit.deployedBy || "",
      user: vmToEdit.user || "",
      department: vmToEdit.department || "",
      startDate: vmToEdit.startDate || "",
      endDate: vmToEdit.endDate || "",
      jiraTicket: vmToEdit.jiraTicket || "",
      remarks: vmToEdit.remarks || "",
      dateDeleted: vmToEdit.dateDeleted || null,
      
      // Legacy fields for compatibility
      hostName: vmToEdit.hostname || "",
      guestOs: vmToEdit.vmOs || "",
      powerState: vmToEdit.vmStatus || "Running",
      ipAddress: vmToEdit.vmIp || null,
      macAddress: null,
      notes: vmToEdit.remarks || null,
      cpuCount: null,
      memoryMB: null,
      diskSpaceGB: null,
      datacenter: vmToEdit.rack || null,
      lastModified: new Date().toISOString(),
    };
    
    updateVmMutation.mutate({ id: vmToEdit.id, data: vmData }, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        setVmToEdit(null);
      },
    });
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportContent(content);
    };
    reader.readAsText(file);
  };
  
  const handleImportVMs = async () => {
    if (!importContent) {
      toast({
        title: "No data to import",
        description: "Please upload a CSV file first",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Parse the CSV content
      const csvVMs = parseVMCSV(importContent);
      
      // Convert the CSV data to VM format
      const newVMs = convertCSVToVMs(csvVMs);
      
      // Import each VM through the API
      const importPromises = newVMs.map(vmData => {
        const formattedVMData = {
          vmId: vmData.vmId || "",
          vmName: vmData.vmName,
          vmStatus: vmData.vmStatus || "Provisioning",
          vmIp: vmData.vmIp || "",
          internetAccess: vmData.internetAccess || false,
          vmOs: vmData.vmOs || "",
          vmOsVersion: vmData.vmOsVersion || "",
          hypervisor: vmData.hypervisor,
          hostname: vmData.hostname || "",
          hostModel: vmData.hostModel || "",
          hostIp: vmData.hostIp || "",
          hostOs: vmData.hostOs || "",
          rack: vmData.rack || "",
          deployedBy: vmData.deployedBy || "",
          user: vmData.user || "",
          department: vmData.department || "",
          startDate: vmData.startDate || "",
          endDate: vmData.endDate || "",
          jiraTicket: vmData.jiraTicket || "",
          remarks: vmData.remarks || "",
          dateDeleted: vmData.dateDeleted || null,
          
          // Legacy fields for compatibility
          hostName: vmData.hostname || "",
          guestOs: vmData.vmOs || "",
          powerState: vmData.vmStatus || "Provisioning",
          ipAddress: vmData.vmIp || null,
          macAddress: null,
          notes: vmData.remarks || null,
          cpuCount: null,
          memoryMB: null,
          diskSpaceGB: null,
          datacenter: vmData.rack || null,
          lastModified: new Date().toISOString(),
        };
        
        return apiRequest('POST', '/api/vm-inventory', formattedVMData);
      });
      
      // Wait for all VMs to be imported
      await Promise.all(importPromises);
      
      // Refresh the VM list
      queryClient.invalidateQueries({ queryKey: ['/api/vm-inventory'] });
      
      toast({
        title: "Import Successful",
        description: `Imported ${newVMs.length} virtual machines`,
      });
      
      // Reset the import state
      setImportContent("");
      setIsImportDialogOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import VMs",
        variant: "destructive",
      });
    }
  };
  
  const handleExportToCSV = () => {
    try {
      // Generate CSV content from VMs data
      const csvContent = convertToCSV(filteredVMs);
      
      // Download the CSV file
      downloadCSV(csvContent, "vm-inventory.csv");
      
      toast({
        title: "Export Successful",
        description: `Exported ${filteredVMs.length} virtual machines to CSV`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export VMs to CSV",
        variant: "destructive",
      });
    }
  };

  const filteredVMs = vms.filter((vm) => {
    const vmId = vm.vmId || vm.vmName || '';
    const vmName = vm.vmName || '';
    const vmIp = vm.vmIp || vm.ipAddress || '';
    const vmStatus = vm.vmStatus || vm.powerState || '';
    
    const matchesSearch = searchTerm === "" || 
      vmName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      vmId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vmIp.includes(searchTerm);
    
    const matchesStatus = !statusFilter || statusFilter === "all" || 
      (vmStatus && vmStatus.toLowerCase() === (statusFilter || "").toLowerCase());
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    
    switch(status.toLowerCase()) {
      case "running":
        return <Badge className="bg-green-600">Running</Badge>;
      case "stopped":
        return <Badge variant="outline" className="text-amber-600 border-amber-600">Stopped</Badge>;
      case "provisioning":
        return <Badge className="bg-blue-600">Provisioning</Badge>;
      case "decommissioned":
        return <Badge variant="destructive">Decommissioned</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  const getValidityBadge = (startDate: string, endDate: string) => {
    if (!endDate || !startDate) {
      return <Badge variant="outline" className="text-gray-600 border-gray-600">No Dates Set</Badge>;
    }
    
    const today = new Date();
    const end = new Date(endDate);
    
    if (isNaN(end.getTime())) {
      return <Badge variant="outline" className="text-gray-600 border-gray-600">Invalid Date</Badge>;
    }
    
    if (end < today) {
      return <Badge variant="destructive">Overdue</Badge>;
    } else {
      const diffTime = Math.abs(end.getTime() - today.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 30) {
        return <Badge variant="outline" className="text-amber-600 border-amber-600">Expiring Soon</Badge>;
      } else {
        return <Badge variant="outline" className="text-green-600 border-green-600">Available</Badge>;
      }
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="h-6 w-6 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold">Virtual Machine Inventory</h1>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add New VM
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">VM Inventory Summary</CardTitle>
          <CardDescription>Overview of your virtual machine deployment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-1">
                <CardDescription>Total VMs</CardDescription>
                <CardTitle className="text-3xl">{vms.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-1">
                <CardDescription>Running</CardDescription>
                <CardTitle className="text-3xl">{vms.filter(vm => vm.vmStatus === "Running").length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-1">
                <CardDescription>Stopped</CardDescription>
                <CardTitle className="text-3xl">{vms.filter(vm => vm.vmStatus === "Stopped").length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-1">
                <CardDescription>Internet Access</CardDescription>
                <CardTitle className="text-3xl">{vms.filter(vm => vm.internetAccess).length}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative w-full md:w-auto flex-1">
          <Input
            placeholder="Search by VM Name, ID, or IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <Select value={statusFilter || ""} onValueChange={(value) => setStatusFilter(value || null)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Running">Running</SelectItem>
              <SelectItem value="Stopped">Stopped</SelectItem>
              <SelectItem value="Provisioning">Provisioning</SelectItem>
              <SelectItem value="Decommissioned">Decommissioned</SelectItem>
            </SelectContent>
          </Select>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportToCSV}>
                Export to CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                toast({
                  title: "Feature Coming Soon",
                  description: "PDF export will be available in a future update",
                });
              }}>
                Export to PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                handleExportToCSV();
                toast({
                  title: "Excel Export",
                  description: "CSV files can be opened in Excel. You can import the downloaded CSV file into Excel.",
                });
              }}>
                Export to Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => {
            // Re-fetch VMs data
            queryClient.invalidateQueries({ queryKey: ['/api/vm-inventory'] });
            toast({
              title: "Refreshing",
              description: "VM data refreshed",
            });
          }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Validity</TableHead>
                  <TableHead>VM ID</TableHead>
                  <TableHead>VM Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Hypervisor</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Assigned User</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVMs.map((vm) => (
                  <TableRow key={vm.id}>
                    <TableCell>{getValidityBadge(vm.startDate || vm.lastModified || new Date().toISOString(), vm.endDate || vm.lastModified || new Date().toISOString())}</TableCell>
                    <TableCell className="font-medium">{vm.vmId || vm.vmName || 'N/A'}</TableCell>
                    <TableCell>{vm.vmName || 'Unnamed VM'}</TableCell>
                    <TableCell>{getStatusBadge(vm.vmStatus || vm.powerState || 'Unknown')}</TableCell>
                    <TableCell>{vm.hypervisor || 'N/A'}</TableCell>
                    <TableCell>{vm.hostIp || vm.ipAddress || 'N/A'}</TableCell>
                    <TableCell>{vm.user || 'Not assigned'}</TableCell>
                    <TableCell>{vm.department || 'Not specified'}</TableCell>
                    <TableCell>{vm.endDate || 'Not set'}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-more-horizontal">
                              <circle cx="12" cy="12" r="1"></circle>
                              <circle cx="19" cy="12" r="1"></circle>
                              <circle cx="5" cy="12" r="1"></circle>
                            </svg>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem 
                            className="cursor-pointer flex items-center gap-2"
                            onClick={() => {
                              setVmToView(vm);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            <FileText className="h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="cursor-pointer flex items-center gap-2"
                            onClick={() => {
                              setVmToEdit(vm);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil">
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                              <path d="m15 5 4 4"/>
                            </svg>
                            Edit VM
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="cursor-pointer flex items-center gap-2"
                            onClick={() => {
                              // Create updated VM object with new status
                              const updatedVM = {
                                ...vm,
                                vmStatus: vm.vmStatus === "Running" ? "Stopped" : "Running"
                              };
                              
                              // Update all VMs array by replacing the updated VM
                              const updatedVMs = vms.map(item => {
                                if (item.id === vm.id) {
                                  return updatedVM;
                                }
                                return item;
                              });
                              
                              // Update cache
                              queryClient.setQueryData(['/api/vms'], updatedVMs);
                              
                              // Show toast
                              toast({
                                title: vm.vmStatus === "Running" ? "VM Stopped" : "VM Started",
                                description: `${vm.vmName} has been ${vm.vmStatus === "Running" ? "stopped" : "started"}.`,
                              });
                            }}
                          >
                            {vm.vmStatus === "Running" ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-square">
                                <rect width="18" height="18" x="3" y="3" rx="2" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-play">
                                <polygon points="5 3 19 12 5 21 5 3" />
                              </svg>
                            )}
                            {vm.vmStatus === "Running" ? "Stop VM" : "Start VM"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="cursor-pointer text-destructive flex items-center gap-2"
                            onClick={() => {
                              setVmToDelete(vm);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash">
                              <path d="M3 6h18"/>
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                            </svg>
                            Decommission VM
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredVMs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">
                      No results found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="w-[95%] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Virtual Machine</DialogTitle>
            <DialogDescription>
              Enter the details for the new virtual machine.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            {/* Validity Section */}
            <div className="space-y-4 border-b border-border pb-4">
              <h3 className="text-base font-medium flex items-center text-primary">
                <Calendar className="h-4 w-4 mr-2" />
                Validity & Dates
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input 
                    id="startDate" 
                    type="date"
                    value={newVM.startDate || ''} 
                    onChange={(e) => handleInputChange('startDate', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input 
                    id="endDate" 
                    type="date"
                    value={newVM.endDate || ''} 
                    onChange={(e) => handleInputChange('endDate', e.target.value)} 
                  />
                </div>
              </div>
            </div>
            
            {/* Host Information Section */}
            <div className="space-y-4 border-b border-border pb-4">
              <h3 className="text-base font-medium flex items-center text-primary">
                <Server className="h-4 w-4 mr-2" />
                Host Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hypervisor">Hypervisor</Label>
                  <Input 
                    id="hypervisor" 
                    value={newVM.hypervisor || ''} 
                    onChange={(e) => handleInputChange('hypervisor', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hostname">Hostname</Label>
                  <Input 
                    id="hostname" 
                    value={newVM.hostname || ''} 
                    onChange={(e) => handleInputChange('hostname', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hostModel">Host Model</Label>
                  <Input 
                    id="hostModel" 
                    value={newVM.hostModel || ''} 
                    onChange={(e) => handleInputChange('hostModel', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hostIp">Host IP Address</Label>
                  <Input 
                    id="hostIp" 
                    value={newVM.hostIp || ''} 
                    onChange={(e) => handleInputChange('hostIp', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hostOs">Host OS</Label>
                  <Input 
                    id="hostOs" 
                    value={newVM.hostOs || ''} 
                    onChange={(e) => handleInputChange('hostOs', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rack">Rack</Label>
                  <Input 
                    id="rack" 
                    value={newVM.rack || ''} 
                    onChange={(e) => handleInputChange('rack', e.target.value)} 
                  />
                </div>
              </div>
            </div>
            
            {/* VM Details Section */}
            <div className="space-y-4 border-b border-border pb-4">
              <h3 className="text-base font-medium flex items-center text-primary">
                <HardDrive className="h-4 w-4 mr-2" />
                VM Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vmId">VM ID</Label>
                  <Input 
                    id="vmId" 
                    value={newVM.vmId || ''} 
                    onChange={(e) => handleInputChange('vmId', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vmName">VM Name</Label>
                  <Input 
                    id="vmName" 
                    value={newVM.vmName || ''} 
                    onChange={(e) => handleInputChange('vmName', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vmStatus">VM Status</Label>
                  <Select 
                    value={newVM.vmStatus} 
                    onValueChange={(value) => handleInputChange('vmStatus', value)}
                  >
                    <SelectTrigger id="vmStatus">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Provisioning">Provisioning</SelectItem>
                      <SelectItem value="Running">Running</SelectItem>
                      <SelectItem value="Stopped">Stopped</SelectItem>
                      <SelectItem value="Decommissioned">Decommissioned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vmIp">VM IP Address</Label>
                  <Input 
                    id="vmIp" 
                    value={newVM.vmIp || ''} 
                    onChange={(e) => handleInputChange('vmIp', e.target.value)} 
                  />
                </div>
                <div className="flex items-center space-x-2 pt-4">
                  <Checkbox 
                    id="internetAccess" 
                    checked={newVM.internetAccess || false}
                    onCheckedChange={(checked) => 
                      handleInputChange('internetAccess', checked === true)
                    }
                  />
                  <label
                    htmlFor="internetAccess"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Internet Access
                  </label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vmOs">VM OS</Label>
                  <Input 
                    id="vmOs" 
                    value={newVM.vmOs || ''} 
                    onChange={(e) => handleInputChange('vmOs', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vmOsVersion">VM OS Version</Label>
                  <Input 
                    id="vmOsVersion" 
                    value={newVM.vmOsVersion || ''} 
                    onChange={(e) => handleInputChange('vmOsVersion', e.target.value)} 
                  />
                </div>
              </div>
            </div>
            
            {/* User & Department Section */}
            <div className="space-y-4">
              <h3 className="text-base font-medium flex items-center text-primary">
                <Users className="h-4 w-4 mr-2" />
                User & Department
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deployedBy">Deployed By</Label>
                  <Input 
                    id="deployedBy" 
                    value={newVM.deployedBy || ''} 
                    onChange={(e) => handleInputChange('deployedBy', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user">User</Label>
                  <Input 
                    id="user" 
                    value={newVM.user || ''} 
                    onChange={(e) => handleInputChange('user', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input 
                    id="department" 
                    value={newVM.department || ''} 
                    onChange={(e) => handleInputChange('department', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jiraTicket">Jira Ticket Number</Label>
                  <Input 
                    id="jiraTicket" 
                    value={newVM.jiraTicket || ''} 
                    onChange={(e) => handleInputChange('jiraTicket', e.target.value)} 
                  />
                </div>
                <div className="space-y-2 col-span-full">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea 
                    id="remarks" 
                    value={newVM.remarks || ''} 
                    onChange={(e) => handleInputChange('remarks', e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateDeleted">Date Deleted</Label>
                  <Input 
                    id="dateDeleted" 
                    type="date"
                    value={newVM.dateDeleted || ''} 
                    onChange={(e) => handleInputChange('dateDeleted', e.target.value)} 
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-end mt-2">
            <Button 
              variant="outline" 
              onClick={() => setIsAddDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              className="w-full sm:w-auto"
            >
              Add VM
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit VM Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[95%] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Virtual Machine</DialogTitle>
            <DialogDescription>
              Update the details for this virtual machine.
            </DialogDescription>
          </DialogHeader>
          
          {vmToEdit && (
            <div className="py-4 space-y-6">
              {/* Validity Section */}
              <div className="space-y-4 border-b border-border pb-4">
                <h3 className="text-base font-medium flex items-center text-primary">
                  <Calendar className="h-4 w-4 mr-2" />
                  Validity & Dates
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-startDate">Start Date</Label>
                    <Input 
                      id="edit-startDate" 
                      type="date"
                      value={vmToEdit.startDate || ''} 
                      onChange={(e) => handleVmEditChange('startDate', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-endDate">End Date</Label>
                    <Input 
                      id="edit-endDate" 
                      type="date"
                      value={vmToEdit.endDate || ''} 
                      onChange={(e) => handleVmEditChange('endDate', e.target.value)} 
                    />
                  </div>
                </div>
              </div>
              
              {/* Host Information Section */}
              <div className="space-y-4 border-b border-border pb-4">
                <h3 className="text-base font-medium flex items-center text-primary">
                  <Server className="h-4 w-4 mr-2" />
                  Host Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-hypervisor">Hypervisor</Label>
                    <Input 
                      id="edit-hypervisor" 
                      value={vmToEdit.hypervisor || ''} 
                      onChange={(e) => handleVmEditChange('hypervisor', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-hostname">Hostname</Label>
                    <Input 
                      id="edit-hostname" 
                      value={vmToEdit.hostname || ''} 
                      onChange={(e) => handleVmEditChange('hostname', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-hostModel">Host Model</Label>
                    <Input 
                      id="edit-hostModel" 
                      value={vmToEdit.hostModel || ''} 
                      onChange={(e) => handleVmEditChange('hostModel', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-hostIp">Host IP Address</Label>
                    <Input 
                      id="edit-hostIp" 
                      value={vmToEdit.hostIp || ''} 
                      onChange={(e) => handleVmEditChange('hostIp', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-hostOs">Host OS</Label>
                    <Input 
                      id="edit-hostOs" 
                      value={vmToEdit.hostOs || ''} 
                      onChange={(e) => handleVmEditChange('hostOs', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-rack">Rack</Label>
                    <Input 
                      id="edit-rack" 
                      value={vmToEdit.rack || ''} 
                      onChange={(e) => handleVmEditChange('rack', e.target.value)} 
                    />
                  </div>
                </div>
              </div>
              
              {/* VM Details Section */}
              <div className="space-y-4 border-b border-border pb-4">
                <h3 className="text-base font-medium flex items-center text-primary">
                  <HardDrive className="h-4 w-4 mr-2" />
                  VM Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-vmId">VM ID</Label>
                    <Input 
                      id="edit-vmId" 
                      value={vmToEdit.vmId || ''} 
                      onChange={(e) => handleVmEditChange('vmId', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-vmName">VM Name</Label>
                    <Input 
                      id="edit-vmName" 
                      value={vmToEdit.vmName || ''} 
                      onChange={(e) => handleVmEditChange('vmName', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-vmStatus">VM Status</Label>
                    <Select 
                      value={vmToEdit.vmStatus} 
                      onValueChange={(value) => handleVmEditChange('vmStatus', value)}
                    >
                      <SelectTrigger id="edit-vmStatus">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Provisioning">Provisioning</SelectItem>
                        <SelectItem value="Running">Running</SelectItem>
                        <SelectItem value="Stopped">Stopped</SelectItem>
                        <SelectItem value="Decommissioned">Decommissioned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-vmIp">VM IP Address</Label>
                    <Input 
                      id="edit-vmIp" 
                      value={vmToEdit.vmIp || ''} 
                      onChange={(e) => handleVmEditChange('vmIp', e.target.value)} 
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-4">
                    <Checkbox 
                      id="edit-internetAccess" 
                      checked={vmToEdit.internetAccess || false}
                      onCheckedChange={(checked) => 
                        handleVmEditChange('internetAccess', checked === true)
                      }
                    />
                    <label
                      htmlFor="edit-internetAccess"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Internet Access
                    </label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-vmOs">VM OS</Label>
                    <Input 
                      id="edit-vmOs" 
                      value={vmToEdit.vmOs || ''} 
                      onChange={(e) => handleVmEditChange('vmOs', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-vmOsVersion">VM OS Version</Label>
                    <Input 
                      id="edit-vmOsVersion" 
                      value={vmToEdit.vmOsVersion || ''} 
                      onChange={(e) => handleVmEditChange('vmOsVersion', e.target.value)} 
                    />
                  </div>
                </div>
              </div>
              
              {/* User & Department Section */}
              <div className="space-y-4">
                <h3 className="text-base font-medium flex items-center text-primary">
                  <Users className="h-4 w-4 mr-2" />
                  User & Department
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-deployedBy">Deployed By</Label>
                    <Input 
                      id="edit-deployedBy" 
                      value={vmToEdit.deployedBy || ''} 
                      onChange={(e) => handleVmEditChange('deployedBy', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-user">User</Label>
                    <Input 
                      id="edit-user" 
                      value={vmToEdit.user || ''} 
                      onChange={(e) => handleVmEditChange('user', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-department">Department</Label>
                    <Input 
                      id="edit-department" 
                      value={vmToEdit.department || ''} 
                      onChange={(e) => handleVmEditChange('department', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-jiraTicket">Jira Ticket Number</Label>
                    <Input 
                      id="edit-jiraTicket" 
                      value={vmToEdit.jiraTicket || ''} 
                      onChange={(e) => handleVmEditChange('jiraTicket', e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2 col-span-full">
                    <Label htmlFor="edit-remarks">Remarks</Label>
                    <Textarea 
                      id="edit-remarks" 
                      value={vmToEdit.remarks || ''} 
                      onChange={(e) => handleVmEditChange('remarks', e.target.value)} 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-end mt-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditDialogOpen(false);
                setVmToEdit(null);
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditVM}
              className="w-full sm:w-auto"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="w-[95%] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Server className="h-5 w-5 mr-2" />
              VM Details
            </DialogTitle>
            <DialogDescription>
              Detailed information for this virtual machine.
            </DialogDescription>
          </DialogHeader>
          
          {vmToView && (
            <div className="py-4 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">{vmToView.vmName}</h2>
                  <p className="text-muted-foreground">ID: {vmToView.vmId}</p>
                </div>
                <div className="flex flex-col items-end">
                  {getStatusBadge(vmToView.vmStatus)}
                  <span className="mt-1 text-xs text-muted-foreground">
                    {vmToView.internetAccess ? "Internet Access" : "No Internet Access"}
                  </span>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-base font-medium mb-2 flex items-center text-primary">
                    <Calendar className="h-4 w-4 mr-2" />
                    Validity & Dates
                  </h3>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="font-medium">Start Date:</dt>
                    <dd>{vmToView.startDate || "N/A"}</dd>
                    <dt className="font-medium">End Date:</dt>
                    <dd>{vmToView.endDate || "N/A"}</dd>
                    <dt className="font-medium">Date Deleted:</dt>
                    <dd>{vmToView.dateDeleted || "N/A"}</dd>
                    <dt className="font-medium">Status:</dt>
                    <dd>{getValidityBadge(vmToView.startDate, vmToView.endDate)}</dd>
                  </dl>
                </div>
                
                <div>
                  <h3 className="text-base font-medium mb-2 flex items-center text-primary">
                    <Users className="h-4 w-4 mr-2" />
                    User & Department
                  </h3>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="font-medium">Deployed By:</dt>
                    <dd>{vmToView.deployedBy || "N/A"}</dd>
                    <dt className="font-medium">User:</dt>
                    <dd>{vmToView.user || "N/A"}</dd>
                    <dt className="font-medium">Department:</dt>
                    <dd>{vmToView.department || "N/A"}</dd>
                    <dt className="font-medium">Jira Ticket:</dt>
                    <dd>{vmToView.jiraTicket || "N/A"}</dd>
                  </dl>
                </div>
                
                <div>
                  <h3 className="text-base font-medium mb-2 flex items-center text-primary">
                    <HardDrive className="h-4 w-4 mr-2" />
                    VM Details
                  </h3>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="font-medium">VM ID:</dt>
                    <dd>{vmToView.vmId}</dd>
                    <dt className="font-medium">VM Name:</dt>
                    <dd>{vmToView.vmName}</dd>
                    <dt className="font-medium">VM IP:</dt>
                    <dd>{vmToView.vmIp || "N/A"}</dd>
                    <dt className="font-medium">VM Status:</dt>
                    <dd>{vmToView.vmStatus}</dd>
                    <dt className="font-medium">VM OS:</dt>
                    <dd>{vmToView.vmOs || "N/A"}</dd>
                    <dt className="font-medium">OS Version:</dt>
                    <dd>{vmToView.vmOsVersion || "N/A"}</dd>
                    <dt className="font-medium">Internet:</dt>
                    <dd>{vmToView.internetAccess ? "Yes" : "No"}</dd>
                  </dl>
                </div>
                
                <div>
                  <h3 className="text-base font-medium mb-2 flex items-center text-primary">
                    <Server className="h-4 w-4 mr-2" />
                    Host Information
                  </h3>
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    <dt className="font-medium">Hypervisor:</dt>
                    <dd>{vmToView.hypervisor}</dd>
                    <dt className="font-medium">Hostname:</dt>
                    <dd>{vmToView.hostname || "N/A"}</dd>
                    <dt className="font-medium">Host Model:</dt>
                    <dd>{vmToView.hostModel || "N/A"}</dd>
                    <dt className="font-medium">Host IP:</dt>
                    <dd>{vmToView.hostIp || "N/A"}</dd>
                    <dt className="font-medium">Host OS:</dt>
                    <dd>{vmToView.hostOs || "N/A"}</dd>
                    <dt className="font-medium">Rack:</dt>
                    <dd>{vmToView.rack || "N/A"}</dd>
                  </dl>
                </div>
              </div>
              
              {vmToView.remarks && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-base font-medium mb-2 flex items-center text-primary">
                      <FileText className="h-4 w-4 mr-2" />
                      Remarks
                    </h3>
                    <p className="text-sm whitespace-pre-line border border-border rounded-md p-3 bg-muted/50">
                      {vmToView.remarks}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button 
              onClick={() => {
                setIsViewDialogOpen(false);
                setVmToEdit(vmToView);
                setIsEditDialogOpen(true);
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit VM
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="w-[95%] max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-destructive">Decommission Virtual Machine</DialogTitle>
            <DialogDescription>
              Are you sure you want to decommission this virtual machine? This action is irreversible.
            </DialogDescription>
          </DialogHeader>

          {vmToDelete && (
            <div className="py-4">
              <div className="mb-4">
                <p><strong>VM Name:</strong> {vmToDelete.vmName}</p>
                <p><strong>VM ID:</strong> {vmToDelete.vmId}</p>
                <p><strong>Hypervisor:</strong> {vmToDelete.hypervisor}</p>
                <p><strong>Status:</strong> {vmToDelete.vmStatus}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setVmToDelete(null);
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteVM}
              className="w-full sm:w-auto"
            >
              Decommission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="w-[95%] max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Virtual Machines</DialogTitle>
            <DialogDescription>
              Upload a CSV file with VM data to import multiple VMs at once.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="importType">Import Format</Label>
              <Select 
                value={importType} 
                onValueChange={(val) => setImportType(val as "csv" | "excel")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select import format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV (Comma-Separated Values)</SelectItem>
                  <SelectItem value="excel">Excel (via CSV)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fileUpload">Upload File</Label>
              <Input 
                id="fileUpload" 
                type="file" 
                accept=".csv" 
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <p className="text-xs text-muted-foreground mt-1">
                The CSV file must include vmId, vmName, and hypervisor columns. Other fields are optional. For Excel files, save as CSV first.
              </p>
            </div>
            
            {importContent && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="border rounded-md p-2 h-32 overflow-y-auto text-xs">
                  <pre className="whitespace-pre-wrap">{importContent.slice(0, 500)}...</pre>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
            <div className="text-sm text-muted-foreground">
              <a 
                href="#" 
                className="text-primary hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  // Create a sample CSV file and download it
                  const sampleData = [
                    "vmId,vmName,vmStatus,vmIp,internetAccess,vmOs,vmOsVersion,hypervisor,hostname,hostModel,hostIp,hostOs,rack,deployedBy,user,department,startDate,endDate,jiraTicket,remarks",
                    "VM-SMP-001,SampleVM1,Provisioning,192.168.1.100,true,Ubuntu,22.04 LTS,VMware,esxi-host-01,Dell PowerEdge,10.0.0.5,VMware ESXi,Rack-A02,admin,user1,IT,2023-10-01,2024-10-01,JIRA-123,Sample VM"
                  ].join("\n");
                  
                  downloadCSV(sampleData, "vm_import_template.csv");
                }}
              >
                Download Template
              </a>
            </div>
            <div>
              <Button variant="outline" onClick={() => setIsImportDialogOpen(false)} className="mr-2">
                Cancel
              </Button>
              <Button onClick={handleImportVMs}>
                <Upload className="h-4 w-4 mr-2" />
                Import VMs
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}