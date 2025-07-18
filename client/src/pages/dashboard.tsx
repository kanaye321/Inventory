
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Users, Package, HardDrive, Activity, TrendingUp, Eye, ShoppingCart, Monitor, Server, Laptop, Cpu, BarChart3, PieChart, Settings, Plus, FileText, Wrench, UserPlus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const response = await fetch("/api/stats", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  const { data: assets } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      const response = await fetch("/api/assets", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch assets");
      return response.json();
    },
  });

  const { data: activities } = useQuery({
    queryKey: ["activities"],
    queryFn: async () => {
      const response = await fetch("/api/activities", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch activities");
      return response.json();
    },
  });

  const { data: vmData } = useQuery({
    queryKey: ["vm-monitoring"],
    queryFn: async () => {
      const response = await fetch("/api/vm-monitoring", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch VM data");
      return response.json();
    },
  });

  const { data: consumables } = useQuery({
    queryKey: ["consumables"],
    queryFn: async () => {
      const response = await fetch("/api/consumables", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch consumables");
      return response.json();
    },
  });

  // Process real data for charts
  const assetsByCategory = assets?.reduce((acc: any, asset: any) => {
    const category = asset.category || 'Uncategorized';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {}) || {};

  const pieData = Object.entries(assetsByCategory).map(([name, value], index) => ({
    name,
    value: value as number,
    color: ['#0EA5E9', '#06B6D4', '#14B8A6', '#10B981', '#F59E0B', '#EF4444'][index % 6]
  }));

  const assetsByStatus = assets?.reduce((acc: any, asset: any) => {
    const status = asset.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {}) || {};

  const barChartData = Object.entries(assetsByStatus).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: value as number
  }));

  // Asset trends over the last 12 months (simulated based on real data)
  const monthlyTrends = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));
    return {
      name: format(date, 'MMM'),
      assets: Math.floor((assets?.length || 0) * (0.3 + (i * 0.06))),
      deployments: Math.floor((stats?.assets?.checkedOut || 0) * (0.2 + (i * 0.05)))
    };
  });

  const recentActivities = activities?.slice(0, 5).map((activity: any) => ({
    id: activity.id,
    action: activity.action,
    item: `${activity.itemType || 'Asset'} #${activity.itemId}`,
    time: format(new Date(activity.timestamp), 'MMM dd, HH:mm'),
    user: activity.userId ? `User ${activity.userId}` : 'System'
  })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              SRPH-MIS Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Welcome back, {user?.firstName}!</p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
              {format(currentTime, 'dd/MM/yyyy - HH:mm:ss')}
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Welcome Section */}
        <Card className="bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 text-white shadow-xl">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <Avatar className="h-20 w-20 ring-4 ring-white/30">
                  <AvatarImage src="/api/placeholder/80/80" />
                  <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-blue-100 font-medium text-lg">Good day,</p>
                  <h2 className="text-3xl font-bold">
                    {user?.firstName} {user?.lastName}
                  </h2>
                  <p className="text-blue-100 mt-1">
                    System Administrator • {user?.role || 'User'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mb-3">
                    <Package className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-2xl font-bold">{stats?.assets?.total || 0}</div>
                  <p className="text-blue-100 text-sm">Total Assets</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mb-3">
                    <Monitor className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-2xl font-bold">{stats?.assets?.checkedOut || 0}</div>
                  <p className="text-blue-100 text-sm">Deployed</p>
                </div>
                <div className="text-center">
                  <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mb-3">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-2xl font-bold">{stats?.users?.total || 0}</div>
                  <p className="text-blue-100 text-sm">Active Users</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center">
              <Activity className="h-5 w-5 mr-2 text-blue-600" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-200"
                onClick={() => window.location.href = '/assets'}
              >
                <Plus className="h-6 w-6 text-blue-600" />
                <span className="text-sm font-medium">Add New Asset</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-green-50 hover:border-green-200"
                onClick={() => window.location.href = '/users'}
              >
                <UserPlus className="h-6 w-6 text-green-600" />
                <span className="text-sm font-medium">Add User</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-purple-50 hover:border-purple-200"
                onClick={() => window.location.href = '/reports'}
              >
                <FileText className="h-6 w-6 text-purple-600" />
                <span className="text-sm font-medium">Generate Report</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 hover:border-gray-200"
                onClick={() => window.location.href = '/settings'}
              >
                <Settings className="h-6 w-6 text-gray-600" />
                <span className="text-sm font-medium">Settings</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-700 text-sm font-medium">Available Assets</p>
                  <p className="text-3xl font-bold text-emerald-900">
                    {assets?.filter((asset: any) => asset.status === 'available').length || 0}
                  </p>
                  <p className="text-emerald-600 text-sm mt-1">Ready for deployment</p>
                </div>
                <div className="w-12 h-12 bg-emerald-200 rounded-xl flex items-center justify-center">
                  <Package className="h-6 w-6 text-emerald-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-700 text-sm font-medium">Consumables</p>
                  <p className="text-3xl font-bold text-amber-900">{consumables?.length || 0}</p>
                  <p className="text-amber-600 text-sm mt-1">Items in inventory</p>
                </div>
                <div className="w-12 h-12 bg-amber-200 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="h-6 w-6 text-amber-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-700 text-sm font-medium">Alerts</p>
                  <p className="text-3xl font-bold text-red-900">
                    {assets?.filter((asset: any) => asset.status === 'broken' || asset.status === 'maintenance').length || 0}
                  </p>
                  <p className="text-red-600 text-sm mt-1">Require attention</p>
                </div>
                <div className="w-12 h-12 bg-red-200 rounded-xl flex items-center justify-center">
                  <Activity className="h-6 w-6 text-red-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-700 text-sm font-medium">Total VMs</p>
                  <p className="text-3xl font-bold text-blue-900">{vmData?.length || 0}</p>
                  <p className="text-blue-600 text-sm mt-1">
                    {vmData?.filter((vm: any) => vm.status === 'running').length || 0} online
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-200 rounded-xl flex items-center justify-center">
                  <Monitor className="h-6 w-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Asset Trends */}
          <Card className="lg:col-span-2 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                    Asset Management Trends
                  </CardTitle>
                  <CardDescription>Monthly asset deployment overview</CardDescription>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  +12.5% this month
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#666' }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#666' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="assets" 
                      stackId="1"
                      stroke="#0EA5E9" 
                      fill="#0EA5E9" 
                      fillOpacity={0.6}
                      name="Total Assets"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="deployments" 
                      stackId="1"
                      stroke="#06B6D4" 
                      fill="#06B6D4" 
                      fillOpacity={0.4}
                      name="Deployments"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Asset Categories */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center">
                <PieChart className="h-5 w-5 mr-2 text-blue-600" />
                Asset Categories
              </CardTitle>
              <CardDescription>Distribution by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {pieData.slice(0, 4).map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <span className="text-sm text-gray-600 font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Asset Status Overview */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center">
                <Monitor className="h-5 w-5 mr-2 text-blue-600" />
                Asset Status Overview
              </CardTitle>
              <CardDescription>Current status distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#666' }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#666' }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="#0EA5E9"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={60}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center">
                <Activity className="h-5 w-5 mr-2 text-blue-600" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest system activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity: any, index: number) => (
                    <div key={activity.id || index} className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Activity className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                        <p className="text-xs text-gray-500">{activity.item} • {activity.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No recent activities</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
