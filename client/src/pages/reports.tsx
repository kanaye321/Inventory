
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Download, 
  Calendar as CalendarIcon, 
  Filter, 
  Search, 
  BarChart3, 
  PieChart, 
  TrendingUp,
  Package,
  Users,
  Activity,
  FileSpreadsheet,
  Laptop,
  Monitor,
  Building2,
  Clock,
  User
} from "lucide-react";
import { format } from "date-fns";

interface ReportData {
  assets: any[];
  users: any[];
  activities: any[];
  consumables: any[];
  licenses: any[];
}

export default function Reports() {
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = useState("device-summary");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  // Fetch data for reports
  const { data: assets = [] } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const response = await fetch("/api/assets", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch assets");
      return response.json();
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["activities"],
    queryFn: async () => {
      const response = await fetch("/api/activities", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch activities");
      return response.json();
    },
  });

  const { data: consumables = [] } = useQuery({
    queryKey: ["consumables"],
    queryFn: async () => {
      const response = await fetch("/api/consumables", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch consumables");
      return response.json();
    },
  });

  const { data: licenses = [] } = useQuery({
    queryKey: ["licenses"],
    queryFn: async () => {
      const response = await fetch("/api/licenses", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch licenses");
      return response.json();
    },
  });

  useEffect(() => {
    setReportData({
      assets,
      users,
      activities,
      consumables,
      licenses
    });
  }, [assets, users, activities, consumables, licenses]);

  // Calculate device age in years
  const calculateDeviceAge = (purchaseDate: string) => {
    if (!purchaseDate) return 0;
    const purchase = new Date(purchaseDate);
    const now = new Date();
    const ageInYears = Math.floor((now.getTime() - purchase.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return ageInYears;
  };

  // Device Summary Calculations
  const laptops = assets.filter(asset => asset.category?.toLowerCase() === 'laptop');
  const desktops = assets.filter(asset => asset.category?.toLowerCase() === 'desktop');

  const laptopStats = {
    total: laptops.length,
    onHand: laptops.filter(laptop => laptop.status === 'available' || laptop.status === 'on-hand').length,
    deployed: laptops.filter(laptop => laptop.status === 'deployed').length,
    goodCondition: laptops.filter(laptop => laptop.condition === 'Good').length,
    badCondition: laptops.filter(laptop => laptop.condition === 'Bad').length
  };

  const desktopStats = {
    total: desktops.length,
    onHand: desktops.filter(desktop => desktop.status === 'available' || desktop.status === 'on-hand').length,
    deployed: desktops.filter(desktop => desktop.status === 'deployed').length,
    goodCondition: desktops.filter(desktop => desktop.condition === 'Good').length,
    badCondition: desktops.filter(desktop => desktop.condition === 'Bad').length
  };

  // Department Summary
  const departmentSummary = assets.reduce((acc: any, asset: any) => {
    if (asset.department && asset.status === 'deployed') {
      if (!acc[asset.department]) {
        acc[asset.department] = {
          laptops: 0,
          desktops: 0
        };
      }
      if (asset.category?.toLowerCase() === 'laptop') {
        acc[asset.department].laptops++;
      } else if (asset.category?.toLowerCase() === 'desktop') {
        acc[asset.department].desktops++;
      }
    }
    return acc;
  }, {});

  // Laptop Age Analysis
  const laptopAgeStats = {
    oneYear: laptops.filter(laptop => calculateDeviceAge(laptop.purchaseDate) === 1).length,
    twoYears: laptops.filter(laptop => calculateDeviceAge(laptop.purchaseDate) === 2).length,
    threeYears: laptops.filter(laptop => calculateDeviceAge(laptop.purchaseDate) === 3).length,
    fourYears: laptops.filter(laptop => calculateDeviceAge(laptop.purchaseDate) === 4).length,
    fiveYears: laptops.filter(laptop => calculateDeviceAge(laptop.purchaseDate) === 5).length,
    moreThanFive: laptops.filter(laptop => calculateDeviceAge(laptop.purchaseDate) > 5).length
  };

  // Users with single 5+ year old laptop
  const usersWithOldSingleLaptop = users.filter(user => {
    const userAssets = assets.filter(asset => asset.assignedTo === user.id);
    return userAssets.length === 1 && 
           userAssets[0].category?.toLowerCase() === 'laptop' && 
           calculateDeviceAge(userAssets[0].purchaseDate) >= 5;
  });

  const generateReport = async () => {
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Report Generated",
        description: "Your report has been generated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const exportReport = (format: string) => {
    try {
      if (!reportData) {
        toast({
          title: "Export Error",
          description: "No data available to export. Please wait for data to load.",
          variant: "destructive",
        });
        return;
      }

      const data = getReportData(selectedReport);
      if (!data || data.length === 0) {
        toast({
          title: "Export Error",
          description: "No data available for the selected report type.",
          variant: "destructive",
        });
        return;
      }

      const reportTypeNames: { [key: string]: string } = {
        'device-summary': 'Device_Summary',
        'department-summary': 'Department_Summary',
        'laptop-age': 'Laptop_Age_Analysis',
        'user-device-analysis': 'User_Device_Analysis'
      };

      const reportName = reportTypeNames[selectedReport] || selectedReport;
      const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
      const filename = `${reportName}_${timestamp}`;

      if (format === 'csv') {
        exportToCSV(data, filename);
      } else if (format === 'json') {
        exportToJSON(data, filename);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Error",
        description: "Failed to export report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      toast({
        title: "Export Error",
        description: "No data available to export.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Escape CSV values that contain commas, quotes, or newlines
      const escapeCSVValue = (value: any) => {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      };

      // Get headers from the first row
      const firstRow = data[0];
      if (!firstRow || typeof firstRow !== 'object') {
        throw new Error('Invalid data format');
      }

      const headers = Object.keys(firstRow)
        .map(key => key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()))
        .join(',');
      
      const rows = data.map(row => 
        Object.values(row || {}).map(escapeCSVValue).join(',')
      ).join('\n');
      
      const csvContent = `${headers}\n${rows}`;

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.csv`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `CSV file "${filename}.csv" has been downloaded.`,
      });
    } catch (error) {
      console.error('CSV export error:', error);
      toast({
        title: "Export Error",
        description: "Failed to export CSV file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const exportToJSON = (data: any[], filename: string) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      toast({
        title: "Export Error",
        description: "No data available to export.",
        variant: "destructive",
      });
      return;
    }

    try {
      const exportData = {
        reportType: selectedReport,
        reportName: selectedReport.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '),
        generatedAt: new Date().toISOString(),
        generatedBy: 'SRPH-MIS Report System',
        totalRecords: data.length,
        data: data
      };
      
      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.json`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `JSON file "${filename}.json" has been downloaded.`,
      });
    } catch (error) {
      console.error('JSON export error:', error);
      toast({
        title: "Export Error",
        description: "Failed to export JSON file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getReportData = (reportType: string) => {
    if (!reportData) return [];

    try {
      switch (reportType) {
        case 'device-summary':
          return [
            { 
              deviceType: 'Laptop', 
              totalDevices: laptopStats.total || 0, 
              onHandDevices: laptopStats.onHand || 0, 
              deployedDevices: laptopStats.deployed || 0,
              goodCondition: laptopStats.goodCondition || 0,
              badCondition: laptopStats.badCondition || 0
            },
            { 
              deviceType: 'Desktop', 
              totalDevices: desktopStats.total || 0, 
              onHandDevices: desktopStats.onHand || 0, 
              deployedDevices: desktopStats.deployed || 0,
              goodCondition: desktopStats.goodCondition || 0,
              badCondition: desktopStats.badCondition || 0
            }
          ];
        case 'department-summary':
          const deptData = Object.keys(departmentSummary || {}).map(dept => ({
            department: dept,
            deployedLaptops: departmentSummary[dept]?.laptops || 0,
            deployedDesktops: departmentSummary[dept]?.desktops || 0,
            totalDeployedDevices: (departmentSummary[dept]?.laptops || 0) + (departmentSummary[dept]?.desktops || 0)
          }));
          return deptData.length > 0 ? deptData : [{ department: 'No Data', deployedLaptops: 0, deployedDesktops: 0, totalDeployedDevices: 0 }];
        case 'laptop-age':
          return [
            { ageCategory: '1 Year Old', deviceCount: laptopAgeStats.oneYear || 0 },
            { ageCategory: '2 Years Old', deviceCount: laptopAgeStats.twoYears || 0 },
            { ageCategory: '3 Years Old', deviceCount: laptopAgeStats.threeYears || 0 },
            { ageCategory: '4 Years Old', deviceCount: laptopAgeStats.fourYears || 0 },
            { ageCategory: '5 Years Old', deviceCount: laptopAgeStats.fiveYears || 0 },
            { ageCategory: '5+ Years Old', deviceCount: laptopAgeStats.moreThanFive || 0 }
          ];
        case 'user-device-analysis':
          const userData = (usersWithOldSingleLaptop || []).map(user => {
            const userAsset = assets.find(asset => asset.assignedTo === user.id);
            return {
              userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown',
              department: user.department || 'N/A',
              deviceAgeYears: calculateDeviceAge(userAsset?.purchaseDate) || 0,
              assetTag: userAsset?.assetTag || 'N/A',
              deviceModel: userAsset?.model || 'N/A'
            };
          });
          return userData.length > 0 ? userData : [{ userName: 'No Users Found', department: 'N/A', deviceAgeYears: 0, assetTag: 'N/A', deviceModel: 'N/A' }];
        default:
          return [];
      }
    } catch (error) {
      console.error('Error generating report data:', error);
      return [];
    }
  };

  const reportTypes = [
    { value: "device-summary", label: "Device Summary", icon: Package },
    { value: "department-summary", label: "Department Summary", icon: Building2 },
    { value: "laptop-age", label: "Laptop Age Analysis", icon: Clock },
    { value: "user-device-analysis", label: "User Device Analysis", icon: User },
  ];

  const currentData = getReportData(selectedReport);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="space-y-8 p-6 animate-in fade-in-0 duration-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-2 animate-in slide-in-from-left-5 duration-700">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Device & Department Reports
            </h1>
            <p className="text-lg text-slate-600 font-medium">Comprehensive device analytics and department summaries</p>
          </div>
          <div className="flex flex-wrap gap-3 animate-in slide-in-from-right-5 duration-700">
            <Button
              onClick={generateReport}
              disabled={isGenerating}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              {isGenerating ? "Generating..." : "Generate Report"}
            </Button>
            <Button
              variant="outline"
              onClick={() => exportReport('csv')}
              className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => exportReport('json')}
              className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export JSON
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Device Overview</TabsTrigger>
            <TabsTrigger value="departments">Department Analysis</TabsTrigger>
            <TabsTrigger value="age-analysis">Age Analysis</TabsTrigger>
            <TabsTrigger value="user-analysis">User Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="flex justify-end gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedReport('device-summary');
                  exportReport('csv');
                }}
                className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
              >
                <Download className="mr-1 h-3 w-3" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedReport('device-summary');
                  exportReport('json');
                }}
                className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
              >
                <FileSpreadsheet className="mr-1 h-3 w-3" />
                Export JSON
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Laptop Summary */}
              <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-b border-blue-100">
                  <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-3">
                    <Laptop className="h-6 w-6 text-blue-600" />
                    Laptop Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                      <span className="font-medium">Total Laptops:</span>
                      <Badge variant="outline" className="text-lg px-3 py-1">{laptopStats.total}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                      <span className="font-medium">On-Hand Laptops:</span>
                      <Badge variant="outline" className="text-lg px-3 py-1 border-green-500 text-green-700">{laptopStats.onHand}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                      <span className="font-medium">Deployed Laptops:</span>
                      <Badge variant="outline" className="text-lg px-3 py-1 border-blue-500 text-blue-700">{laptopStats.deployed}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-lg">
                      <span className="font-medium">Good Condition:</span>
                      <Badge variant="outline" className="text-lg px-3 py-1 border-emerald-500 text-emerald-700">{laptopStats.goodCondition}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                      <span className="font-medium">Bad Condition:</span>
                      <Badge variant="outline" className="text-lg px-3 py-1 border-red-500 text-red-700">{laptopStats.badCondition}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Desktop Summary */}
              <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-purple-100">
                  <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-3">
                    <Monitor className="h-6 w-6 text-purple-600" />
                    Desktop Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                      <span className="font-medium">Total Desktops:</span>
                      <Badge variant="outline" className="text-lg px-3 py-1">{desktopStats.total}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                      <span className="font-medium">On-Hand Desktops:</span>
                      <Badge variant="outline" className="text-lg px-3 py-1 border-green-500 text-green-700">{desktopStats.onHand}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                      <span className="font-medium">Deployed Desktops:</span>
                      <Badge variant="outline" className="text-lg px-3 py-1 border-blue-500 text-blue-700">{desktopStats.deployed}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-lg">
                      <span className="font-medium">Good Condition:</span>
                      <Badge variant="outline" className="text-lg px-3 py-1 border-emerald-500 text-emerald-700">{desktopStats.goodCondition}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                      <span className="font-medium">Bad Condition:</span>
                      <Badge variant="outline" className="text-lg px-3 py-1 border-red-500 text-red-700">{desktopStats.badCondition}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="departments" className="space-y-6">
            <div className="flex justify-end gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedReport('department-summary');
                  exportReport('csv');
                }}
                className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
              >
                <Download className="mr-1 h-3 w-3" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedReport('department-summary');
                  exportReport('json');
                }}
                className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
              >
                <FileSpreadsheet className="mr-1 h-3 w-3" />
                Export JSON
              </Button>
            </div>
            <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-green-500/10 to-teal-500/10 border-b border-green-100">
                <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-3">
                  <Building2 className="h-6 w-6 text-green-600" />
                  Department Summary - Deployed Devices
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Breakdown of deployed devices by department
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="rounded-md border overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">Department</TableHead>
                        <TableHead className="font-semibold">Deployed Laptops</TableHead>
                        <TableHead className="font-semibold">Deployed Desktops</TableHead>
                        <TableHead className="font-semibold">Total Deployed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.keys(departmentSummary).map((dept) => (
                        <TableRow key={dept}>
                          <TableCell className="font-medium">{dept}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-blue-500 text-blue-700">
                              {departmentSummary[dept].laptops}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-purple-500 text-purple-700">
                              {departmentSummary[dept].desktops}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-slate-500 text-slate-700">
                              {departmentSummary[dept].laptops + departmentSummary[dept].desktops}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="age-analysis" className="space-y-6">
            <div className="flex justify-end gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedReport('laptop-age');
                  exportReport('csv');
                }}
                className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
              >
                <Download className="mr-1 h-3 w-3" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedReport('laptop-age');
                  exportReport('json');
                }}
                className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
              >
                <FileSpreadsheet className="mr-1 h-3 w-3" />
                Export JSON
              </Button>
            </div>
            <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-b border-orange-100">
                <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-3">
                  <Clock className="h-6 w-6 text-orange-600" />
                  Laptop Age Analysis
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Distribution of laptops by age in years
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">{laptopAgeStats.oneYear}</div>
                    <div className="text-sm text-slate-600">1 Year Old</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">{laptopAgeStats.twoYears}</div>
                    <div className="text-sm text-slate-600">2 Years Old</div>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-600">{laptopAgeStats.threeYears}</div>
                    <div className="text-sm text-slate-600">3 Years Old</div>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-orange-600">{laptopAgeStats.fourYears}</div>
                    <div className="text-sm text-slate-600">4 Years Old</div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600">{laptopAgeStats.fiveYears}</div>
                    <div className="text-sm text-slate-600">5 Years Old</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">{laptopAgeStats.moreThanFive}</div>
                    <div className="text-sm text-slate-600">5+ Years Old</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="user-analysis" className="space-y-6">
            <div className="flex justify-end gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedReport('user-device-analysis');
                  exportReport('csv');
                }}
                className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
              >
                <Download className="mr-1 h-3 w-3" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedReport('user-device-analysis');
                  exportReport('json');
                }}
                className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
              >
                <FileSpreadsheet className="mr-1 h-3 w-3" />
                Export JSON
              </Button>
            </div>
            <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-b border-indigo-100">
                <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-3">
                  <User className="h-6 w-6 text-indigo-600" />
                  Users with Single 5+ Year Old Laptop
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Users who have only one device that is a 5+ year old laptop
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 rounded-lg text-center">
                    <div className="text-3xl font-bold text-red-600">{usersWithOldSingleLaptop.length}</div>
                    <div className="text-sm text-slate-600">Users with only 5+ year old laptops</div>
                  </div>
                  
                  {usersWithOldSingleLaptop.length > 0 && (
                    <div className="rounded-md border overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="font-semibold">User</TableHead>
                            <TableHead className="font-semibold">Department</TableHead>
                            <TableHead className="font-semibold">Device Age</TableHead>
                            <TableHead className="font-semibold">Asset Tag</TableHead>
                            <TableHead className="font-semibold">Model</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {usersWithOldSingleLaptop.map((user) => {
                            const userAsset = assets.find(asset => asset.assignedTo === user.id);
                            return (
                              <TableRow key={user.id}>
                                <TableCell className="font-medium">
                                  {user.firstName} {user.lastName}
                                </TableCell>
                                <TableCell>{user.department || 'N/A'}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="border-red-500 text-red-700">
                                    {calculateDeviceAge(userAsset?.purchaseDate)} years
                                  </Badge>
                                </TableCell>
                                <TableCell>{userAsset?.assetTag || 'N/A'}</TableCell>
                                <TableCell>{userAsset?.model || 'N/A'}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Report Configuration */}
        <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-2xl hover:shadow-3xl transition-all duration-500">
          <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-b border-indigo-100">
            <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-indigo-600" />
              Export Report Configuration
            </CardTitle>
            <CardDescription className="text-slate-600 text-base">
              Configure and export detailed reports for your organization
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700">Report Type</Label>
                  <Select value={selectedReport} onValueChange={setSelectedReport}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="lg:col-span-2">
                <Label className="text-sm font-medium text-slate-700">Report Preview</Label>
                <div className="mt-2 border rounded-lg p-4 bg-slate-50 max-h-96 overflow-y-auto">
                  {currentData.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(currentData[0]).map((key) => (
                            <TableHead key={key} className="text-xs">
                              {key.charAt(0).toUpperCase() + key.slice(1)}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentData.slice(0, 10).map((row, index) => (
                          <TableRow key={index}>
                            {Object.values(row).map((value, cellIndex) => (
                              <TableCell key={cellIndex} className="text-xs">
                                {String(value)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      No data available for this report type
                    </div>
                  )}
                </div>
                {currentData.length > 10 && (
                  <p className="text-xs text-slate-500 mt-2">
                    Showing first 10 of {currentData.length} records
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
