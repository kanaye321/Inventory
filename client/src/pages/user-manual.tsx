
import { BookOpen, Mail, AlertTriangle, Check, Database, Cog, UserCog, LifeBuoy, Shield, Activity, Monitor, Network, Settings, Users, HardDrive, Package, Key, FileText, Search, Eye, Edit, Plus, Download, Upload, RefreshCw, Filter, Calendar, Clock, Bell, ChevronRight } from "lucide-react";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function UserManualPage() {
  return (
    <div className="container py-4 md:py-8 px-4 sm:px-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center gap-2 mb-4 md:mb-6">
        <BookOpen className="h-6 w-6 md:h-8 md:w-8 text-primary" />
        <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          SRPH-MIS Complete User Manual
        </h1>
      </div>

      <div className="mb-8 md:mb-10">
        <Card className="overflow-hidden border-2 border-primary/20">
          <CardHeader className="pb-3 md:pb-4 bg-gradient-to-r from-primary/5 to-blue-600/5">
            <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Welcome to SRPH-MIS Inventory Management System
            </CardTitle>
            <CardDescription className="mt-2 text-base">
              Your comprehensive guide to mastering the SRPH-MIS platform - from basic navigation to advanced administration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 md:space-y-6">
            <p className="text-muted-foreground">
              SRPH-MIS is a powerful, enterprise-grade inventory management system designed for efficient asset tracking,
              user management, virtual machine monitoring, network discovery, and comprehensive reporting. This complete guide 
              covers every feature and functionality to help you maximize your productivity.
            </p>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                <Check className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Asset Management</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <Monitor className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">VM Monitoring</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
                <Network className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium">Network Discovery</span>
              </div>
            </div>
            
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Important Security Notice</AlertTitle>
              <AlertDescription>
                Always ensure you have appropriate permissions before performing administrative actions. 
                Contact your system administrator if you need additional access.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="mb-6 grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-3">Overview</TabsTrigger>
          <TabsTrigger value="navigation" className="text-xs sm:text-sm py-3">Navigation</TabsTrigger>
          <TabsTrigger value="assets" className="text-xs sm:text-sm py-3">Assets</TabsTrigger>
          <TabsTrigger value="monitoring" className="text-xs sm:text-sm py-3">Monitoring</TabsTrigger>
          <TabsTrigger value="users" className="text-xs sm:text-sm py-3">Users</TabsTrigger>
          <TabsTrigger value="admin" className="text-xs sm:text-sm py-3">Admin</TabsTrigger>
          <TabsTrigger value="troubleshooting" className="text-xs sm:text-sm py-3">Support</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="h-5 w-5 text-primary" />
            <h2 className="text-xl md:text-2xl font-semibold">System Overview</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Dashboard Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    Real-time inventory statistics
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    Asset status distribution charts
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    Recent activity timeline
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    Quick action shortcuts
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    System health indicators
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security & Permissions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    Role-based access control
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    Granular permission settings
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    Activity audit trails
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    Secure authentication
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    Department-based access
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-3">
            <AccordionItem value="getting-started">
              <AccordionTrigger className="text-left">Getting Started Guide</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Step 1: First Login</h4>
                    <ol className="list-decimal pl-6 space-y-1 text-sm">
                      <li>Navigate to the SRPH-MIS login page</li>
                      <li>Enter your username and password</li>
                      <li>If this is your first login, you may be prompted to change your password</li>
                      <li>Familiarize yourself with the dashboard layout</li>
                    </ol>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Step 2: Understanding Your Role</h4>
                    <p className="text-sm mb-2">Your access level determines what features you can use:</p>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      <li><strong>Administrator:</strong> Full system access including user management</li>
                      <li><strong>Asset Manager:</strong> Can manage assets, components, licenses</li>
                      <li><strong>Department User:</strong> Can view and manage department assets</li>
                      <li><strong>Read-Only:</strong> View-only access to assigned resources</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Step 3: Initial Setup Tasks</h4>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      <li>Review your department's current asset inventory</li>
                      <li>Update your profile information if needed</li>
                      <li>Familiarize yourself with the navigation menu</li>
                      <li>Explore the dashboard to understand key metrics</li>
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="quick-reference">
              <AccordionTrigger className="text-left">Quick Reference Card</AccordionTrigger>
              <AccordionContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">Common Actions</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Add new asset:</span>
                        <Badge variant="secondary">Assets → Add Asset</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Check out asset:</span>
                        <Badge variant="secondary">Find Asset → Checkout</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Generate report:</span>
                        <Badge variant="secondary">Reports → Create</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Manage users:</span>
                        <Badge variant="secondary">Users → Add/Edit</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Keyboard Shortcuts</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Global search:</span>
                        <Badge variant="outline">Ctrl + /</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Quick add:</span>
                        <Badge variant="outline">Ctrl + N</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Refresh page:</span>
                        <Badge variant="outline">F5</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Help menu:</span>
                        <Badge variant="outline">F1</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        <TabsContent value="navigation" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="text-xl md:text-2xl font-semibold">Navigation & Interface</h2>
          </div>
          
          <Accordion type="single" collapsible className="w-full space-y-3">
            <AccordionItem value="sidebar-navigation">
              <AccordionTrigger>Sidebar Navigation Menu</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <HardDrive className="h-4 w-4" />
                      Inventory Management
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li><strong>Dashboard:</strong> System overview and key metrics</li>
                      <li><strong>Assets:</strong> Hardware inventory (computers, servers, etc.)</li>
                      <li><strong>Components:</strong> Internal hardware parts (RAM, CPU, etc.)</li>
                      <li><strong>Accessories:</strong> Peripheral devices (keyboards, mice, etc.)</li>
                      <li><strong>Consumables:</strong> Supplies and consumable items</li>
                      <li><strong>Licenses:</strong> Software licenses and assignments</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      Monitoring & Discovery
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li><strong>VM Monitoring:</strong> Virtual machine status via Zabbix</li>
                      <li><strong>Network Discovery:</strong> Scan and inventory network devices</li>
                      <li><strong>Network Dashboard:</strong> Analytics on discovered devices</li>
                      <li><strong>VM Inventory:</strong> Virtual machine lifecycle management</li>
                      <li><strong>BitLocker Keys:</strong> Recovery key management</li>
                    </ul>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      User Management
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li><strong>Users:</strong> User account management</li>
                      <li><strong>User Permissions:</strong> Role and permission configuration</li>
                      <li><strong>Activities:</strong> System activity logs</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Reporting & Admin
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li><strong>Reports:</strong> Generate various system reports</li>
                      <li><strong>Admin:</strong> System administration and settings</li>
                      <li><strong>Database:</strong> Database management tools</li>
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="search-functionality">
              <AccordionTrigger>Global Search & Filtering</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Search Capabilities
                  </h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Search across all asset types using the global search bar</li>
                    <li>Find items by asset tag, serial number, model, or name</li>
                    <li>Search for users by username, name, or department</li>
                    <li>Use filters to narrow results by category, status, or department</li>
                    <li>Advanced search with multiple criteria</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filter Options
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-1">Asset Filters:</p>
                      <ul className="list-disc pl-6 space-y-1 text-sm">
                        <li>Status (Available, Checked Out, Maintenance)</li>
                        <li>Category (Laptop, Desktop, Server, etc.)</li>
                        <li>Department assignment</li>
                        <li>Date ranges (Purchase, Warranty)</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">User Filters:</p>
                      <ul className="list-disc pl-6 space-y-1 text-sm">
                        <li>Role (Admin, Manager, User)</li>
                        <li>Department</li>
                        <li>Active/Inactive status</li>
                        <li>Last login date</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Alert className="bg-blue-50 border-blue-200">
                  <Search className="h-4 w-4" />
                  <AlertTitle>Search Tips</AlertTitle>
                  <AlertDescription>
                    Use quotation marks for exact phrase matching (e.g., "Dell Laptop"). 
                    Use wildcards (*) for partial matching. Combine filters for more precise results.
                  </AlertDescription>
                </Alert>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="interface-customization">
              <AccordionTrigger>Interface Customization</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Display Options</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Toggle between light and dark themes</li>
                    <li>Customize table column visibility</li>
                    <li>Adjust items per page in listings</li>
                    <li>Save preferred dashboard widget layouts</li>
                    <li>Set default filters for frequent searches</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Accessibility Features</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Keyboard navigation support</li>
                    <li>High contrast mode</li>
                    <li>Screen reader compatibility</li>
                    <li>Adjustable font sizes</li>
                    <li>Focus indicators for all interactive elements</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        <TabsContent value="assets" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <HardDrive className="h-5 w-5 text-primary" />
            <h2 className="text-xl md:text-2xl font-semibold">Complete Asset Management Guide</h2>
          </div>
          
          <Accordion type="single" collapsible className="w-full space-y-3">
            <AccordionItem value="asset-lifecycle">
              <AccordionTrigger>Asset Lifecycle Management</AccordionTrigger>
              <AccordionContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Adding New Assets
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ol className="list-decimal pl-6 space-y-2 text-sm">
                        <li>Navigate to Assets → Add Asset</li>
                        <li>Fill in required information:
                          <ul className="list-disc pl-6 mt-1">
                            <li>Asset tag (auto-generated or custom)</li>
                            <li>Name and model</li>
                            <li>Serial number</li>
                            <li>Category and manufacturer</li>
                          </ul>
                        </li>
                        <li>Add financial details:
                          <ul className="list-disc pl-6 mt-1">
                            <li>Purchase date and cost</li>
                            <li>Warranty information</li>
                            <li>Supplier details</li>
                          </ul>
                        </li>
                        <li>Set initial status and location</li>
                        <li>Assign to user if needed</li>
                        <li>Add custom fields and notes</li>
                      </ol>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Bulk Import Process
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ol className="list-decimal pl-6 space-y-2 text-sm">
                        <li>Download the CSV template</li>
                        <li>Fill in asset information following the format</li>
                        <li>Required columns:
                          <ul className="list-disc pl-6 mt-1">
                            <li>name, model, serial</li>
                            <li>category, manufacturer</li>
                            <li>status, location</li>
                          </ul>
                        </li>
                        <li>Upload the CSV file</li>
                        <li>Review import preview</li>
                        <li>Confirm or correct any errors</li>
                        <li>Process the import</li>
                      </ol>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Asset Status Workflow</h4>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary">Available</Badge>
                    <span>→</span>
                    <Badge variant="default">Checked Out</Badge>
                    <span>→</span>
                    <Badge variant="outline">In Use</Badge>
                    <span>→</span>
                    <Badge variant="destructive">Maintenance</Badge>
                    <span>→</span>
                    <Badge variant="secondary">Available</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Assets flow through various states during their lifecycle. Each status change is logged for audit purposes.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="checkout-checkin">
              <AccordionTrigger>Checkout & Check-in Procedures</AccordionTrigger>
              <AccordionContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Checking Out Assets
                    </h4>
                    <ol className="list-decimal pl-6 space-y-2 text-sm">
                      <li>Find the asset using search or browse</li>
                      <li>Click the "Checkout" button</li>
                      <li>Select the user to assign to:
                        <ul className="list-disc pl-6 mt-1">
                          <li>Search by name or username</li>
                          <li>Verify user department</li>
                          <li>Check user's current assignments</li>
                        </ul>
                      </li>
                      <li>Set checkout details:
                        <ul className="list-disc pl-6 mt-1">
                          <li>Expected return date</li>
                          <li>Purpose/project notes</li>
                          <li>Special instructions</li>
                        </ul>
                      </li>
                      <li>Generate checkout notification</li>
                      <li>Print checkout receipt if needed</li>
                    </ol>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Checking In Assets
                    </h4>
                    <ol className="list-decimal pl-6 space-y-2 text-sm">
                      <li>Navigate to the asset details page</li>
                      <li>Click the "Check In" button</li>
                      <li>Inspect the asset condition:
                        <ul className="list-disc pl-6 mt-1">
                          <li>Physical condition assessment</li>
                          <li>Functionality testing</li>
                          <li>Accessory return verification</li>
                        </ul>
                      </li>
                      <li>Update asset information:
                        <ul className="list-disc pl-6 mt-1">
                          <li>Current location</li>
                          <li>Condition notes</li>
                          <li>Required maintenance</li>
                        </ul>
                      </li>
                      <li>Set new status (Available/Maintenance)</li>
                      <li>Generate check-in confirmation</li>
                    </ol>
                  </div>
                </div>

                <Alert className="bg-green-50 border-green-200">
                  <Check className="h-4 w-4" />
                  <AlertTitle>Best Practices</AlertTitle>
                  <AlertDescription>
                    Always verify asset condition during check-in. Document any issues immediately 
                    and schedule maintenance if required. Keep checkout periods reasonable and send 
                    reminders for overdue returns.
                  </AlertDescription>
                </Alert>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="maintenance-tracking">
              <AccordionTrigger>Maintenance & Service Tracking</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3">Preventive Maintenance</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Scheduling Maintenance:</p>
                      <ul className="list-disc pl-6 space-y-1 text-sm">
                        <li>Set recurring maintenance schedules</li>
                        <li>Create maintenance reminders</li>
                        <li>Assign maintenance to technicians</li>
                        <li>Track maintenance costs</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Maintenance Records:</p>
                      <ul className="list-disc pl-6 space-y-1 text-sm">
                        <li>Document all service activities</li>
                        <li>Record parts used and costs</li>
                        <li>Track service provider information</li>
                        <li>Maintain warranty compliance</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Reactive Maintenance</h4>
                  <ol className="list-decimal pl-6 space-y-1 text-sm">
                    <li>Report issues through the system</li>
                    <li>Set asset status to "Maintenance"</li>
                    <li>Create work order with issue details</li>
                    <li>Assign to appropriate technician</li>
                    <li>Track repair progress and costs</li>
                    <li>Update asset status upon completion</li>
                    <li>Document lessons learned</li>
                  </ol>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="component-management">
              <AccordionTrigger>Components & Accessories Management</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Component Tracking
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm">Track internal hardware components:</p>
                      <ul className="list-disc pl-6 space-y-1 text-sm">
                        <li>CPU, RAM, Storage devices</li>
                        <li>Graphics cards, Network cards</li>
                        <li>Power supplies, Motherboards</li>
                        <li>Associate with parent assets</li>
                        <li>Track component specifications</li>
                        <li>Monitor component failures</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        Accessory Management
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm">Manage peripheral devices:</p>
                      <ul className="list-disc pl-6 space-y-1 text-sm">
                        <li>Keyboards, Mice, Monitors</li>
                        <li>Cables, Adapters, Chargers</li>
                        <li>Docking stations, Webcams</li>
                        <li>Checkout with main assets</li>
                        <li>Track accessory compatibility</li>
                        <li>Manage accessory pools</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h4 className="font-medium mb-2">License Management</h4>
                  <p className="text-sm mb-3">Comprehensive software license tracking:</p>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-1">License Types:</p>
                      <ul className="list-disc pl-6 space-y-1 text-xs">
                        <li>Individual licenses</li>
                        <li>Volume licenses</li>
                        <li>Subscription services</li>
                        <li>Site licenses</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Compliance:</p>
                      <ul className="list-disc pl-6 space-y-1 text-xs">
                        <li>Track usage vs. entitlements</li>
                        <li>Monitor expiration dates</li>
                        <li>Audit trail maintenance</li>
                        <li>Renewal notifications</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Assignments:</p>
                      <ul className="list-disc pl-6 space-y-1 text-xs">
                        <li>User-based assignments</li>
                        <li>Asset-based installations</li>
                        <li>Automatic reclamation</li>
                        <li>Usage reporting</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="h-5 w-5 text-primary" />
            <h2 className="text-xl md:text-2xl font-semibold">Monitoring & Discovery Systems</h2>
          </div>
          
          <Accordion type="single" collapsible className="w-full space-y-3">
            <AccordionItem value="vm-monitoring">
              <AccordionTrigger>Virtual Machine Monitoring (Zabbix Integration)</AccordionTrigger>
              <AccordionContent className="space-y-6">
                <Alert className="bg-blue-50 border-blue-200">
                  <Monitor className="h-4 w-4" />
                  <AlertTitle>Zabbix Integration</AlertTitle>
                  <AlertDescription>
                    SRPH-MIS integrates with Zabbix monitoring system to provide real-time VM performance data 
                    and automated alerting for critical issues.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <h4 className="font-medium">Initial Setup</h4>
                  <ol className="list-decimal pl-6 space-y-2 text-sm">
                    <li>Navigate to Monitoring → VM Monitoring</li>
                    <li>Click the Settings tab</li>
                    <li>Configure Zabbix connection:
                      <ul className="list-disc pl-6 mt-1">
                        <li>Zabbix URL (e.g., http://107.105.168.201/zabbix)</li>
                        <li>API Key (generate from Zabbix Administration)</li>
                        <li>Auto-sync interval (recommended: 5 minutes)</li>
                        <li>Alert thresholds for CPU, memory, disk</li>
                      </ul>
                    </li>
                    <li>Test connection and verify API access</li>
                    <li>Enable automatic synchronization</li>
                  </ol>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Monitoring Capabilities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Real-time VM status tracking
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          CPU utilization monitoring
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Memory usage tracking
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Disk space monitoring
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Network performance metrics
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          Automated alerting system
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Alert Management</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li><strong>Critical Alerts:</strong> System down, disk full</li>
                        <li><strong>Warning Alerts:</strong> High CPU, low memory</li>
                        <li><strong>Info Alerts:</strong> Maintenance windows</li>
                        <li><strong>Escalation:</strong> Auto-escalate unack'd alerts</li>
                        <li><strong>Notifications:</strong> Email, SMS, webhooks</li>
                        <li><strong>Dashboard:</strong> Visual alert status</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="network-discovery">
              <AccordionTrigger>Network Discovery & Device Inventory</AccordionTrigger>
              <AccordionContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Network Scanning Process</h4>
                  <ol className="list-decimal pl-6 space-y-2 text-sm">
                    <li>Navigate to Monitoring → Network Discovery</li>
                    <li>Configure scan parameters:
                      <ul className="list-disc pl-6 mt-1">
                        <li>Target subnets (CIDR format: 192.168.1.0/24)</li>
                        <li>Port ranges to scan (default: 22,80,443,3389)</li>
                        <li>DNS servers (default: 107.105.134.9, 107.105.134.8)</li>
                        <li>Scan timeout and retry settings</li>
                      </ul>
                    </li>
                    <li>Start the discovery scan</li>
                    <li>Monitor scan progress in real-time</li>
                    <li>Review discovered devices</li>
                    <li>Generate inventory reports</li>
                  </ol>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Device Detection</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs">
                      <ul className="space-y-1">
                        <li>• IP address and hostname</li>
                        <li>• Operating system detection</li>
                        <li>• Open ports and services</li>
                        <li>• MAC address resolution</li>
                        <li>• Device type classification</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Hardware Discovery</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs">
                      <ul className="space-y-1">
                        <li>• CPU specifications</li>
                        <li>• Memory configuration</li>
                        <li>• Storage devices</li>
                        <li>• Network interfaces</li>
                        <li>• Peripheral devices</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Software Inventory</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs">
                      <ul className="space-y-1">
                        <li>• Installed applications</li>
                        <li>• Service configurations</li>
                        <li>• Security software</li>
                        <li>• System updates</li>
                        <li>• License information</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <Alert className="bg-amber-50 border-amber-200">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Network Security Considerations</AlertTitle>
                  <AlertDescription>
                    Network discovery scans should be performed during maintenance windows when possible. 
                    Ensure proper authorization before scanning production networks. Some security systems 
                    may flag discovery activities as potential threats.
                  </AlertDescription>
                </Alert>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="vm-inventory">
              <AccordionTrigger>Virtual Machine Inventory Management</AccordionTrigger>
              <AccordionContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">VM Lifecycle Management</h4>
                  <p className="text-sm text-muted-foreground">
                    Track virtual machines from deployment to decommissioning with detailed metadata and usage analytics.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Required VM Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-1">Host Details:</p>
                        <ul className="list-disc pl-6 space-y-1 text-xs">
                          <li>Host IP Address</li>
                          <li>Host Operating System</li>
                          <li>Physical rack location</li>
                          <li>Hypervisor type and version</li>
                        </ul>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-1">VM Configuration:</p>
                        <ul className="list-disc pl-6 space-y-1 text-xs">
                          <li>VM ID and Name</li>
                          <li>VM IP and network config</li>
                          <li>Guest OS and version</li>
                          <li>Resource allocation (CPU, RAM)</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Usage Tracking</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-1">Assignment Details:</p>
                        <ul className="list-disc pl-6 space-y-1 text-xs">
                          <li>Deployed by (user)</li>
                          <li>Department/project</li>
                          <li>Start and end dates</li>
                          <li>Internet access requirements</li>
                        </ul>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-1">Documentation:</p>
                        <ul className="list-disc pl-6 space-y-1 text-xs">
                          <li>Jira ticket number</li>
                          <li>Purpose and remarks</li>
                          <li>Decommission reason</li>
                          <li>Date deleted/archived</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="rounded-md border p-4 bg-muted/50">
                  <h4 className="font-medium mb-3 flex items-center text-blue-600">
                    <Settings className="h-4 w-4 mr-2" />
                    VM Decommissioning Process
                  </h4>
                  <ol className="list-decimal pl-6 space-y-1 text-sm">
                    <li>Navigate to Virtual Machines section</li>
                    <li>Find the VM to decommission</li>
                    <li>Click the menu icon (⋮) in the Actions column</li>
                    <li>Select "Decommission VM" from dropdown</li>
                    <li>Confirm decommission action</li>
                    <li>VM status changes to "Decommissioned"</li>
                    <li>Historical data is preserved for auditing</li>
                  </ol>
                  <p className="text-sm mt-3 text-muted-foreground">
                    Decommissioned VMs remain visible in the system with historical data intact. 
                    Use the status filter to view only decommissioned VMs when needed.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="bitlocker-management">
              <AccordionTrigger>BitLocker Recovery Key Management</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <Alert className="bg-red-50 border-red-200">
                  <Shield className="h-4 w-4" />
                  <AlertTitle>Security Critical Feature</AlertTitle>
                  <AlertDescription>
                    BitLocker recovery keys provide access to encrypted drives. Access to this module 
                    is restricted to authorized security personnel only.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <h4 className="font-medium">Key Management Functions</h4>
                  <ul className="list-disc pl-6 space-y-2 text-sm">
                    <li><strong>Key Storage:</strong> Secure centralized storage of recovery keys</li>
                    <li><strong>Asset Association:</strong> Link keys to specific devices</li>
                    <li><strong>Access Logging:</strong> Track all key access attempts</li>
                    <li><strong>Emergency Access:</strong> Quick key retrieval for urgent situations</li>
                    <li><strong>Audit Trail:</strong> Complete history of key usage</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Recovery Process</h4>
                  <ol className="list-decimal pl-6 space-y-1 text-sm">
                    <li>Verify user identity and authorization</li>
                    <li>Locate device in BitLocker Keys module</li>
                    <li>Retrieve associated recovery key</li>
                    <li>Provide key to authorized user</li>
                    <li>Log the key access event</li>
                    <li>Monitor for successful recovery</li>
                  </ol>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-xl md:text-2xl font-semibold">User Management & Permissions</h2>
          </div>
          
          <Accordion type="single" collapsible className="w-full space-y-3">
            <AccordionItem value="user-accounts">
              <AccordionTrigger>User Account Management</AccordionTrigger>
              <AccordionContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>User Types & Roles</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Badge variant="default" className="mb-2">Administrator</Badge>
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                          <li>Full system access</li>
                          <li>User management capabilities</li>
                          <li>System configuration</li>
                          <li>Database administration</li>
                        </ul>
                      </div>
                      
                      <div>
                        <Badge variant="secondary" className="mb-2">Asset Manager</Badge>
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                          <li>Asset lifecycle management</li>
                          <li>Checkout/checkin operations</li>
                          <li>Maintenance scheduling</li>
                          <li>Department reporting</li>
                        </ul>
                      </div>
                      
                      <div>
                        <Badge variant="outline" className="mb-2">Department User</Badge>
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                          <li>View department assets</li>
                          <li>Request asset assignments</li>
                          <li>Limited editing capabilities</li>
                          <li>Self-service functions</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Account Creation Process</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ol className="list-decimal pl-6 space-y-2 text-sm">
                        <li>Navigate to Users → Add User</li>
                        <li>Enter basic information:
                          <ul className="list-disc pl-6 mt-1">
                            <li>Username (unique identifier)</li>
                            <li>First and last name</li>
                            <li>Email address</li>
                            <li>Department assignment</li>
                          </ul>
                        </li>
                        <li>Set initial password (user must change on first login)</li>
                        <li>Assign appropriate role</li>
                        <li>Configure permissions</li>
                        <li>Enable/disable account</li>
                        <li>Send welcome notification</li>
                      </ol>
                    </CardContent>
                  </Card>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="permission-system">
              <AccordionTrigger>Granular Permission System</AccordionTrigger>
              <AccordionContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Permission Categories</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    The system uses granular permissions with View, Edit, and Add access levels for each module.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Inventory Permissions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>Assets:</span>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="px-1 py-0 text-xs">View</Badge>
                          <Badge variant="outline" className="px-1 py-0 text-xs">Edit</Badge>
                          <Badge variant="outline" className="px-1 py-0 text-xs">Add</Badge>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span>Components:</span>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="px-1 py-0 text-xs">View</Badge>
                          <Badge variant="outline" className="px-1 py-0 text-xs">Edit</Badge>
                          <Badge variant="outline" className="px-1 py-0 text-xs">Add</Badge>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span>Accessories:</span>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="px-1 py-0 text-xs">View</Badge>
                          <Badge variant="outline" className="px-1 py-0 text-xs">Edit</Badge>
                          <Badge variant="outline" className="px-1 py-0 text-xs">Add</Badge>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span>Licenses:</span>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="px-1 py-0 text-xs">View</Badge>
                          <Badge variant="outline" className="px-1 py-0 text-xs">Edit</Badge>
                          <Badge variant="outline" className="px-1 py-0 text-xs">Add</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Monitoring Permissions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>VM Monitoring:</span>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="px-1 py-0 text-xs">View</Badge>
                          <Badge variant="outline" className="px-1 py-0 text-xs">Edit</Badge>
                          <Badge variant="outline" className="px-1 py-0 text-xs">Add</Badge>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span>Network Discovery:</span>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="px-1 py-0 text-xs">View</Badge>
                          <Badge variant="outline" className="px-1 py-0 text-xs">Edit</Badge>
                          <Badge variant="outline" className="px-1 py-0 text-xs">Add</Badge>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span>BitLocker Keys:</span>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="px-1 py-0 text-xs">View</Badge>
                          <Badge variant="outline" className="px-1 py-0 text-xs">Edit</Badge>
                          <Badge variant="outline" className="px-1 py-0 text-xs">Add</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Administrative Permissions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>User Management:</span>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="px-1 py-0 text-xs">View</Badge>
                          <Badge variant="outline" className="px-1 py-0 text-xs">Edit</Badge>
                          <Badge variant="outline" className="px-1 py-0 text-xs">Add</Badge>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span>Reports:</span>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="px-1 py-0 text-xs">View</Badge>
                          <Badge variant="outline" className="px-1 py-0 text-xs">Edit</Badge>
                          <Badge variant="outline" className="px-1 py-0 text-xs">Add</Badge>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span>Admin Settings:</span>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="px-1 py-0 text-xs">View</Badge>
                          <Badge variant="outline" className="px-1 py-0 text-xs">Edit</Badge>
                          <Badge variant="outline" className="px-1 py-0 text-xs">Add</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Permission Management</h4>
                  <ol className="list-decimal pl-6 space-y-1 text-sm">
                    <li>Navigate to Admin → User Permissions</li>
                    <li>Select user to modify</li>
                    <li>Use preset permission templates or configure custom</li>
                    <li>Enable/disable specific permissions per category</li>
                    <li>Save changes and notify user if needed</li>
                  </ol>
                </div>

                <Alert className="bg-blue-50 border-blue-200">
                  <UserCog className="h-4 w-4" />
                  <AlertTitle>Best Practice</AlertTitle>
                  <AlertDescription>
                    Follow the principle of least privilege: grant users only the minimum permissions 
                    required for their role. Regularly review and audit user permissions.
                  </AlertDescription>
                </Alert>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="activity-tracking">
              <AccordionTrigger>Activity Tracking & Audit Logs</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3">Logged Activities</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-2">User Actions:</p>
                      <ul className="list-disc pl-6 space-y-1 text-sm">
                        <li>Login/logout events</li>
                        <li>Asset checkout/checkin</li>
                        <li>Record creation/modification</li>
                        <li>Permission changes</li>
                        <li>Search queries</li>
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">System Events:</p>
                      <ul className="list-disc pl-6 space-y-1 text-sm">
                        <li>Database operations</li>
                        <li>Backup/restore activities</li>
                        <li>Configuration changes</li>
                        <li>Error conditions</li>
                        <li>Security incidents</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Audit Trail Features</h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Immutable activity logs</li>
                    <li>Detailed timestamps and user identification</li>
                    <li>Before/after values for changes</li>
                    <li>Filterable and searchable audit history</li>
                    <li>Export capabilities for compliance reporting</li>
                    <li>Automated retention policies</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        <TabsContent value="admin" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Cog className="h-5 w-5 text-primary" />
            <h2 className="text-xl md:text-2xl font-semibold">System Administration</h2>
          </div>
          
          <Accordion type="single" collapsible className="w-full space-y-3">
            <AccordionItem value="database-management">
              <AccordionTrigger>Database Management</AccordionTrigger>
              <AccordionContent className="space-y-6">
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Critical Operations</AlertTitle>
                  <AlertDescription>
                    Database operations can affect system availability. Always create backups before 
                    performing maintenance and schedule operations during low-usage periods.
                  </AlertDescription>
                </Alert>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Backup Operations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-2">Manual Backup:</p>
                        <ol className="list-decimal pl-6 space-y-1 text-sm">
                          <li>Navigate to Admin → Database</li>
                          <li>Click "Create Backup"</li>
                          <li>Enter backup description</li>
                          <li>Select backup location</li>
                          <li>Monitor backup progress</li>
                          <li>Verify backup completion</li>
                        </ol>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-2">Automated Backups:</p>
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                          <li>Daily automatic backups</li>
                          <li>Configurable retention period</li>
                          <li>Email notifications on failure</li>
                          <li>Backup integrity verification</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Maintenance Tasks
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-2">Regular Maintenance:</p>
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                          <li>Database optimization</li>
                          <li>Index rebuilding</li>
                          <li>Statistics updates</li>
                          <li>Cleanup of old logs</li>
                          <li>Performance monitoring</li>
                        </ul>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-2">Emergency Procedures:</p>
                        <ul className="list-disc pl-6 space-y-1 text-sm">
                          <li>Database restoration</li>
                          <li>Corruption recovery</li>
                          <li>Emergency access procedures</li>
                          <li>Disaster recovery protocols</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="system-configuration">
              <AccordionTrigger>System Configuration</AccordionTrigger>
              <AccordionContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>General Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <ul className="space-y-2 text-sm">
                        <li><strong>Site Information:</strong> Company name, logo, contact details</li>
                        <li><strong>Localization:</strong> Timezone, date format, currency</li>
                        <li><strong>Asset Settings:</strong> Tag format, categories, statuses</li>
                        <li><strong>Notifications:</strong> Email templates, alert thresholds</li>
                        <li><strong>Integration:</strong> API keys, external service configs</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Security Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <ul className="space-y-2 text-sm">
                        <li><strong>Password Policy:</strong> Complexity, expiration, history</li>
                        <li><strong>Session Management:</strong> Timeout, concurrent sessions</li>
                        <li><strong>Access Control:</strong> IP restrictions, rate limiting</li>
                        <li><strong>Audit Settings:</strong> Log retention, compliance reporting</li>
                        <li><strong>Encryption:</strong> Data-at-rest, transport security</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="reporting-analytics">
              <AccordionTrigger>Reporting & Analytics</AccordionTrigger>
              <AccordionContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Available Report Types</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Inventory Reports</CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs space-y-1">
                        <ul className="list-disc pl-4">
                          <li>Asset inventory summary</li>
                          <li>Assets by department</li>
                          <li>Asset valuation report</li>
                          <li>Warranty expiration</li>
                          <li>Maintenance schedules</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Usage Reports</CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs space-y-1">
                        <ul className="list-disc pl-4">
                          <li>Asset utilization rates</li>
                          <li>Checkout history</li>
                          <li>User activity summary</li>
                          <li>License compliance</li>
                          <li>VM usage analytics</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Compliance Reports</CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs space-y-1">
                        <ul className="list-disc pl-4">
                          <li>Audit trail summaries</li>
                          <li>Security compliance</li>
                          <li>Change management</li>
                          <li>Asset lifecycle</li>
                          <li>Regulatory compliance</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Report Generation</h4>
                  <ol className="list-decimal pl-6 space-y-1 text-sm">
                    <li>Navigate to Reports section</li>
                    <li>Select report type and template</li>
                    <li>Configure parameters and filters</li>
                    <li>Choose output format (PDF, Excel, CSV)</li>
                    <li>Schedule for recurring generation (optional)</li>
                    <li>Generate and download report</li>
                  </ol>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="performance-monitoring">
              <AccordionTrigger>Performance Monitoring</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>System Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <ul className="space-y-1">
                        <li>• Database query performance</li>
                        <li>• Memory usage and availability</li>
                        <li>• CPU utilization patterns</li>
                        <li>• Network bandwidth usage</li>
                        <li>• Disk space and I/O metrics</li>
                        <li>• User session statistics</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Optimization</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <ul className="space-y-1">
                        <li>• Database index optimization</li>
                        <li>• Query performance tuning</li>
                        <li>• Caching strategy implementation</li>
                        <li>• Resource allocation adjustment</li>
                        <li>• Background task scheduling</li>
                        <li>• Cleanup of historical data</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>

        <TabsContent value="troubleshooting" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <LifeBuoy className="h-5 w-5 text-primary" />
            <h2 className="text-xl md:text-2xl font-semibold">Troubleshooting & Support</h2>
          </div>
          
          <Accordion type="single" collapsible className="w-full space-y-3">
            <AccordionItem value="common-issues">
              <AccordionTrigger>Common Issues & Solutions</AccordionTrigger>
              <AccordionContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Login & Authentication</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div>
                        <p className="font-medium text-red-600">Problem: Can't log in</p>
                        <ul className="list-disc pl-6 space-y-1 text-xs mt-1">
                          <li>Verify username/password spelling</li>
                          <li>Check Caps Lock status</li>
                          <li>Clear browser cache and cookies</li>
                          <li>Try different browser or incognito mode</li>
                          <li>Contact admin if account is locked</li>
                        </ul>
                      </div>
                      
                      <div>
                        <p className="font-medium text-red-600">Problem: Session expires quickly</p>
                        <ul className="list-disc pl-6 space-y-1 text-xs mt-1">
                          <li>Check system timeout settings</li>
                          <li>Ensure cookies are enabled</li>
                          <li>Avoid opening multiple tabs</li>
                          <li>Contact admin to adjust session length</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Data & Display Issues</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div>
                        <p className="font-medium text-red-600">Problem: Missing assets/data</p>
                        <ul className="list-disc pl-6 space-y-1 text-xs mt-1">
                          <li>Check applied filters and search terms</li>
                          <li>Verify permissions for data access</li>
                          <li>Try refreshing the page</li>
                          <li>Check if items are archived</li>
                        </ul>
                      </div>
                      
                      <div>
                        <p className="font-medium text-red-600">Problem: Slow performance</p>
                        <ul className="list-disc pl-6 space-y-1 text-xs mt-1">
                          <li>Check internet connection speed</li>
                          <li>Clear browser cache</li>
                          <li>Reduce number of displayed items</li>
                          <li>Contact admin about server performance</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Asset Management Issues</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div>
                        <p className="font-medium text-red-600">Problem: Can't checkout asset</p>
                        <ul className="list-disc pl-6 space-y-1 text-xs mt-1">
                          <li>Verify asset is available status</li>
                          <li>Check user permissions</li>
                          <li>Ensure user account is active</li>
                          <li>Verify asset isn't under maintenance</li>
                        </ul>
                      </div>
                      
                      <div>
                        <p className="font-medium text-red-600">Problem: Duplicate asset tags</p>
                        <ul className="list-disc pl-6 space-y-1 text-xs mt-1">
                          <li>Use asset tag generator</li>
                          <li>Check existing assets before creating</li>
                          <li>Update duplicate tags immediately</li>
                          <li>Implement tag validation rules</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">System Administration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div>
                        <p className="font-medium text-red-600">Problem: Database errors</p>
                        <ul className="list-disc pl-6 space-y-1 text-xs mt-1">
                          <li>Check database connection settings</li>
                          <li>Verify database service is running</li>
                          <li>Review error logs for details</li>
                          <li>Restore from backup if necessary</li>
                        </ul>
                      </div>
                      
                      <div>
                        <p className="font-medium text-red-600">Problem: Integration failures</p>
                        <ul className="list-disc pl-6 space-y-1 text-xs mt-1">
                          <li>Verify API keys and endpoints</li>
                          <li>Check network connectivity</li>
                          <li>Review integration logs</li>
                          <li>Test with minimal configuration</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="error-codes">
              <AccordionTrigger>Error Codes & Messages</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Authentication Errors</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center p-2 border rounded">
                        <span className="font-mono text-red-600">AUTH_001</span>
                        <span>Invalid credentials - Check username/password</span>
                      </div>
                      <div className="flex justify-between items-center p-2 border rounded">
                        <span className="font-mono text-red-600">AUTH_002</span>
                        <span>Account locked - Contact administrator</span>
                      </div>
                      <div className="flex justify-between items-center p-2 border rounded">
                        <span className="font-mono text-red-600">AUTH_003</span>
                        <span>Session expired - Please log in again</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Permission Errors</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center p-2 border rounded">
                        <span className="font-mono text-orange-600">PERM_001</span>
                        <span>Insufficient permissions - Contact administrator</span>
                      </div>
                      <div className="flex justify-between items-center p-2 border rounded">
                        <span className="font-mono text-orange-600">PERM_002</span>
                        <span>Resource access denied - Check user role</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Database Errors</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center p-2 border rounded">
                        <span className="font-mono text-red-600">DB_001</span>
                        <span>Connection failed - Check database service</span>
                      </div>
                      <div className="flex justify-between items-center p-2 border rounded">
                        <span className="font-mono text-red-600">DB_002</span>
                        <span>Query timeout - Optimize query or contact admin</span>
                      </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="contact-support">
              <AccordionTrigger>Getting Help & Support</AccordionTrigger>
              <AccordionContent className="space-y-6">
                <div className="rounded-md border p-4 md:p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-start">
                    <div className="mr-4">
                      <LifeBuoy className="h-12 w-12 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Primary Support Contact</h3>
                      <div className="space-y-2">
                        <p className="flex items-center text-sm">
                          <Mail className="h-4 w-4 mr-2 text-blue-600" />
                          <span className="font-medium">Nikkel Jimenez</span>
                          <span className="ml-2 text-muted-foreground">(Knox ID: jimenez.n)</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          System Developer & Administrator
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        When to Contact Support
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <ul className="space-y-1">
                        <li>• System errors or unexpected behavior</li>
                        <li>• Permission or access issues</li>
                        <li>• Data integrity concerns</li>
                        <li>• Performance problems</li>
                        <li>• Feature requests or enhancements</li>
                        <li>• Training or user guidance needs</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Support Request Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p className="font-medium mb-2">Include in your request:</p>
                      <ul className="space-y-1">
                        <li>• Detailed description of the issue</li>
                        <li>• Steps to reproduce the problem</li>
                        <li>• Screenshots or error messages</li>
                        <li>• Browser and OS information</li>
                        <li>• Your username and department</li>
                        <li>• Urgency level and business impact</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <Alert className="bg-green-50 border-green-200">
                  <Check className="h-4 w-4" />
                  <AlertTitle>Support Response Times</AlertTitle>
                  <AlertDescription>
                    <div className="mt-2 space-y-1 text-sm">
                      <div><strong>Critical Issues:</strong> 2-4 hours (system down, security breaches)</div>
                      <div><strong>High Priority:</strong> 8-24 hours (significant functionality impacted)</div>
                      <div><strong>Medium Priority:</strong> 1-3 business days (minor issues, enhancement requests)</div>
                      <div><strong>Low Priority:</strong> 3-5 business days (documentation, training)</div>
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="rounded-md border p-4 bg-muted/50">
                  <h4 className="font-medium mb-3 flex items-center text-purple-600">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Self-Help Resources
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li>• This comprehensive user manual (bookmark this page!)</li>
                    <li>• Built-in tooltips and help text throughout the system</li>
                    <li>• Video tutorials and documentation (contact support for access)</li>
                    <li>• Peer support through department administrators</li>
                    <li>• System status page for maintenance notifications</li>
                  </ul>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Emergency Contact</AlertTitle>
                  <AlertDescription>
                    For critical system failures outside business hours, contact Nikkel Jimenez directly. 
                    Emergency support is available for system-down situations affecting business operations.
                  </AlertDescription>
                </Alert>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>
      </Tabs>

      <div className="mt-12 border-t pt-8">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold">Thank you for using SRPH-MIS!</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            This manual is continuously updated to reflect new features and improvements. 
            If you have suggestions for additional documentation or notice any inaccuracies, 
            please contact our support team.
          </p>
          <div className="flex justify-center gap-4 mt-6">
            <Badge variant="outline" className="px-3 py-1">Version 2.0</Badge>
            <Badge variant="outline" className="px-3 py-1">Last Updated: January 2025</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
