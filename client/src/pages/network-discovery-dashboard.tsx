import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { Search, ArrowLeft, RefreshCw, Download } from "lucide-react";
import NetworkDiscoveryDashboard from "@/components/dashboard/network-discovery-dashboard";

export default function NetworkDiscoveryDashboardPage() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleViewDetails = (host: any) => {
    // This would open a detailed view or modal for the host
    console.log('Viewing details for host:', host);
  };

  const handleExportData = () => {
    // Export discovered hosts data as CSV
    const csvData = discoveredHosts.map((host: any) => ({
      hostname: host.hostname || 'Unknown',
      ipAddress: host.ipAddress,
      macAddress: host.macAddress || 'Unknown',
      status: host.status,
      manufacturer: host.hardwareDetails?.manufacturer || 'Unknown',
      model: host.hardwareDetails?.model || 'Unknown',
      os: host.systemInfo?.os || 'Unknown',
      lastSeen: host.lastSeen
    }));

    const csvContent = "data:text/csv;charset=utf-8," + 
      Object.keys(csvData[0] || {}).join(",") + "\n" +
      csvData.map(row => Object.values(row).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "network-discovery-results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation('/network-discovery')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Discovery
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Network Discovery Dashboard</h1>
            <p className="text-muted-foreground">
              Comprehensive overview of discovered network devices
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refetchHosts()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={handleExportData}
            disabled={discoveredHosts.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {isLoadingHosts ? (
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading network discovery data...</p>
          </div>
        </div>
      ) : (
        <NetworkDiscoveryDashboard 
          hosts={discoveredHosts} 
          onViewDetails={handleViewDetails}
        />
      )}
    </div>
  );
}