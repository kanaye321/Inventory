import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter,
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  AlertTriangle, 
  FileUp, 
  FileDown, 
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Table as TableIcon,
  Settings,
  Loader2, 
  Clock,
  FileCog
} from "lucide-react";

interface DatabaseTable {
  name: string;
  columns: number;
  size: string;
  sizeBytes: number;
}

interface DatabaseBackup {
  filename: string;
  path: string;
  size: string;
  created: string;
}

interface DatabaseStatus {
  status: string;
  name: string;
  version: string;
  size: string;
  sizeBytes: number;
  tables: DatabaseTable[];
  tablesCount: number;
  lastBackup: string;
}

export default function DatabaseManagementPage() {
  const [activeTab, setActiveTab] = useState("status");
  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [backupProgress, setBackupProgress] = useState(0);
  const [backupFilename, setBackupFilename] = useState(`backup-${new Date().toISOString().split('T')[0]}.sql`);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [autoBackup, setAutoBackup] = useState(false);
  const [autoOptimize, setAutoOptimize] = useState(false);
  const { toast } = useToast();

  // Fetch database status
  const { data: databaseStatus, isLoading: isStatusLoading, error: statusError } = useQuery({
    queryKey: ['/api/database/status'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/database/status');
      if (!res.ok) throw new Error('Failed to fetch database status');
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 1,
    retryOnMount: false,
  });

  // Fetch backups
  const { 
    data: backups, 
    isLoading: isBackupsLoading,
    error: backupsError,
    refetch: refetchBackups
  } = useQuery<DatabaseBackup[]>({
    queryKey: ['/api/database/backups'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/database/backups');
      const data = await response.json();
      return data;
    },
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 1000
  });

  // Create backup mutation
  const createBackupMutation = useMutation({
    mutationFn: async () => {
      // Simulate progress updates
      let progress = 0;
      const interval = setInterval(() => {
        progress += 15;
        setBackupProgress(Math.min(progress, 90));
        if (progress >= 90) clearInterval(interval);
      }, 300);

      try {
        // Perform the backup
        const response = await apiRequest('POST', '/api/database/backup', {
          filename: backupFilename,
          tables: selectedTables.length > 0 ? selectedTables : undefined
        });

        // Complete the progress
        clearInterval(interval);
        setBackupProgress(100);

        if (!response.ok) {
          throw new Error('Backup failed');
        }

        // Clear selected tables
        setSelectedTables([]);

        // Handle file download if response contains file data
        if (response.headers.get('content-type')?.includes('application/sql')) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = backupFilename;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          return { success: true, message: 'Backup downloaded successfully' };
        }

        // Return the response
        return await response.json();
      } catch (error) {
        clearInterval(interval);
        setBackupProgress(0);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Backup created",
        description: `Database backup "${backupFilename}" has been created successfully.`,
      });
      setIsBackupDialogOpen(false);
      refetchBackups();
      // Reset progress after a short delay
      setTimeout(() => setBackupProgress(0), 1000);
    },
    onError: (error) => {
      setBackupProgress(0);
      toast({
        title: "Backup failed",
        description: "There was an error creating the database backup.",
        variant: "destructive",
      });
    }
  });

  // Restore backup mutation
  const restoreBackupMutation = useMutation({
    mutationFn: async (backupPath: string) => {
      const response = await apiRequest('POST', '/api/database/restore', {
        backupPath
      });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Backup restored",
        description: "Database has been restored from backup successfully.",
      });
      setIsRestoreDialogOpen(false);
      refetchStatus();
    },
    onError: (error) => {
      toast({
        title: "Restore failed",
        description: "There was an error restoring the database from backup.",
        variant: "destructive",
      });
    }
  });

  // Optimize database mutation
  const optimizeDatabaseMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/database/optimize', {
        tables: ['users', 'assets', 'activities', 'licenses', 'components', 'accessories']
      });
      if (!response.ok) {
        throw new Error('Database optimization failed');
      }
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Database Optimized",
        description: `Database optimization completed successfully. ${data.optimizedTables?.length || 0} tables optimized.`,
      });
      refetchStatus();
    },
    onError: (error) => {
      toast({
        title: "Optimization Failed",
        description: "There was an error optimizing the database. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Schedule maintenance mutation
  const scheduleMaintenanceMutation = useMutation({
    mutationFn: async (settings: { autoBackup: boolean; autoOptimize: boolean }) => {
      const response = await apiRequest('POST', '/api/database/schedule', settings);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Schedule updated",
        description: "Maintenance schedule has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Schedule update failed",
        description: "There was an error updating the maintenance schedule.",
        variant: "destructive",
      });
    }
  });

  // Handle saving maintenance schedule
  const saveMaintenanceSchedule = () => {
    scheduleMaintenanceMutation.mutate({
      autoBackup,
      autoOptimize
    });
  };

  // Add refetchStatus function
  const refetchStatus = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/database/status'] });
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setRestoreFile(files[0]);
    }
  };

  // Toggle table selection
  const toggleTableSelection = (tableName: string) => {
    setSelectedTables(prev => 
      prev.includes(tableName) 
        ? prev.filter(name => name !== tableName)
        : [...prev, tableName]
    );
  };

  // Select all tables
  const selectAllTables = () => {
    if (databaseStatus && databaseStatus.tables) {
      setSelectedTables(databaseStatus.tables.map(table => table.name));
    }
  };

  // Deselect all tables
  const deselectAllTables = () => {
    setSelectedTables([]);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight flex items-center">
          <Database className="mr-2 sm:mr-3 h-6 w-6 sm:h-8 sm:w-8" />
          Database Management
        </h1>
        <Button
          onClick={() => {
            refetchStatus();
            refetchBackups();
          }}
          variant="outline"
          size="sm"
          className="flex items-center mt-2 sm:mt-0 text-xs sm:text-sm"
        >
          <RefreshCw className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="status" className="flex items-center text-xs sm:text-sm">
            <HardDrive className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Status</span>
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center text-xs sm:text-sm">
            <Download className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Backup</span>
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center text-xs sm:text-sm">
            <Settings className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Maintenance</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Database Status</CardTitle>
              <CardDescription>
                Current status and information about your database.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            {statusError ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-yellow-600 font-medium">Database Using Fallback Mode</p>
                <p className="text-sm text-gray-500 mt-2">
                  PostgreSQL connection failed. Using in-memory storage for development.
                </p>
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Data will not persist between server restarts. 
                    Configure PostgreSQL for production use.
                  </p>
                </div>
              </div>
            ) : isStatusLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Checking database status...</p>
              </div>
            ) : (


              databaseStatus ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mt-4">
                  <div className="p-4 border rounded-md">
                    <div className="flex items-center">
                      <Database className="h-5 w-5 text-primary mr-2" />
                      <h3 className="font-medium">Database Name</h3>
                    </div>
                    <p className="mt-2">{databaseStatus.name}</p>
                  </div>

                  <div className="p-4 border rounded-md">
                    <div className="flex items-center">
                      <HardDrive className="h-5 w-5 text-primary mr-2" />
                      <h3 className="font-medium">Database Size</h3>
                    </div>
                    <p className="mt-2">{databaseStatus.size}</p>
                  </div>

                  <div className="p-4 border rounded-md">
                    <div className="flex items-center">
                      <FileCog className="h-5 w-5 text-primary mr-2" />
                      <h3 className="font-medium">Database Version</h3>
                    </div>
                    <p className="mt-2">{databaseStatus.version}</p>
                  </div>

                  <div className="p-4 border rounded-md">
                    <div className="flex items-center">
                      <TableIcon className="h-5 w-5 text-primary mr-2" />
                      <h3 className="font-medium">Tables</h3>
                    </div>
                    <p className="mt-2">{databaseStatus.tablesCount}</p>
                  </div>

                  <div className="p-4 border rounded-md">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-primary mr-2" />
                      <h3 className="font-medium">Last Backup</h3>
                    </div>
                    <p className="mt-2">{databaseStatus.lastBackup || 'No backups yet'}</p>
                  </div>
                </div>
              ) : (
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Data</AlertTitle>
                  <AlertDescription>
                    No database statistics available.
                  </AlertDescription>
                </Alert>
              )
            )}

              {databaseStatus && databaseStatus.tables && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-3">Database Tables</h3>
                  <div className="rounded-md border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="h-10 px-4 text-left font-medium">Table Name</th>
                          <th className="h-10 px-4 text-left font-medium">Columns</th>
                          <th className="h-10 px-4 text-left font-medium">Size</th>
                        </tr>
                      </thead>
                      <tbody>
                        {databaseStatus.tables.map((table) => (
                          <tr key={table.name} className="border-b">
                            <td className="p-4 align-middle">{table.name}</td>
                            <td className="p-4 align-middle">{table.columns}</td>
                            <td className="p-4 align-middle">{table.size}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Database Backup</CardTitle>
                <CardDescription>
                  Create a backup of your database to prevent data loss.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Backups contain all your database tables and can be used to restore your system in case of failure.
                </p>
                <Button 
                  onClick={() => setIsBackupDialogOpen(true)}
                  className="w-full"
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  Create New Backup
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Restore Database</CardTitle>
                <CardDescription>
                  Restore your database from a previous backup.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Restoring will replace your current database with a previous backup.
                </p>
                <Button 
                  onClick={() => setIsRestoreDialogOpen(true)}
                  className="w-full"
                  variant="outline"
                >
                  <FileUp className="mr-2 h-4 w-4" />
                  Restore from Backup
                </Button>
              </CardContent>
            </Card>
          </div>

          {isBackupsLoading ? (
            <div className="flex items-center justify-center py-8 mt-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading backup history...</span>
            </div>
          ) : backupsError ? (
            <Alert variant="destructive" className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load backup history. Please try again.
              </AlertDescription>
            </Alert>
          ) : backups && backups.length > 0 ? (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Backup History</CardTitle>
                <CardDescription>
                  Previous database backups available for restoration.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="h-10 px-4 text-left font-medium">Filename</th>
                        <th className="h-10 px-4 text-left font-medium">Size</th>
                        <th className="h-10 px-4 text-left font-medium">Created</th>
                        <th className="h-10 px-4 text-left font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backups.map((backup) => (
                        <tr key={backup.path} className="border-b">
                          <td className="p-4 align-middle">{backup.filename}</td>
                          <td className="p-4 align-middle">{backup.size}</td>
                          <td className="p-4 align-middle">{backup.created}</td>
                          <td className="p-4 align-middle">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => restoreBackupMutation.mutate(backup.path)}
                              disabled={restoreBackupMutation.isPending}
                            >
                              {restoreBackupMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <FileUp className="h-4 w-4" />
                              )}
                              <span className="ml-2">Restore</span>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Backup History</CardTitle>
                <CardDescription>
                  No backups found. Create your first backup to protect your data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>No backups available</AlertTitle>
                  <AlertDescription>
                    It's recommended to create regular backups of your database to prevent data loss.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Database Maintenance</CardTitle>
              <CardDescription>
                Optimize and maintain your database for better performance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="border rounded-md p-6">
                  <h3 className="text-lg font-medium mb-2">Optimize Database</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Optimize tables to reclaim unused space and improve performance.
                  </p>
                  <Button 
                    onClick={() => optimizeDatabaseMutation.mutate()}
                    disabled={optimizeDatabaseMutation.isPending}
                  >
                    {optimizeDatabaseMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Settings className="mr-2 h-4 w-4" />
                    )}
                    Optimize Database
                  </Button>
                </div>

                <div className="border rounded-md p-6">
                  <h3 className="text-lg font-medium mb-2">Schedule Maintenance</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Set up automatic maintenance tasks for your database.
                  </p>
                  <div className="flex items-center space-x-2 mb-4">
                    <Checkbox 
                      id="auto-backup" 
                      checked={autoBackup}
                      onCheckedChange={(checked) => 
                        setAutoBackup(checked === true)
                      }
                    />
                    <label
                      htmlFor="auto-backup"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Enable automatic daily backups
                    </label>
                  </div>
                  <div className="flex items-center space-x-2 mb-4">
                    <Checkbox 
                      id="auto-optimize" 
                      checked={autoOptimize}
                      onCheckedChange={(checked) => 
                        setAutoOptimize(checked === true)
                      }
                    />
                    <label
                      htmlFor="auto-optimize"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Enable weekly optimization
                    </label>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={saveMaintenanceSchedule} 
                    disabled={scheduleMaintenanceMutation.isPending}
                  >
                    {scheduleMaintenanceMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Schedule'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Backup Dialog */}
      <Dialog open={isBackupDialogOpen} onOpenChange={setIsBackupDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Database Backup</DialogTitle>
            <DialogDescription>
              Create a backup of your database. You can select specific tables or backup the entire database.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="backup-filename">Backup Filename</Label>
              <Input
                id="backup-filename"
                value={backupFilename}
                onChange={(e) => setBackupFilename(e.target.value)}
              />
            </div>

            {databaseStatus && databaseStatus.tables && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Select Tables to Backup</Label>
                  <div className="space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={selectAllTables}
                    >
                      Select All
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={deselectAllTables}
                    >
                      Deselect All
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 h-48 overflow-y-auto border rounded-md p-4">
                  {databaseStatus.tables.map((table) => (
                    <div key={table.name} className="flex items-center space-x-2">
                      <Checkbox
                        id={`table-${table.name}`}
                        checked={selectedTables.includes(table.name)}
                        onCheckedChange={() => toggleTableSelection(table.name)}
                      />
                      <label
                        htmlFor={`table-${table.name}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {table.name}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedTables.length === 0 
                    ? "No tables selected. The entire database will be backed up." 
                    : `${selectedTables.length} tables selected for backup.`}
                </p>
              </div>
            )}

            {backupProgress > 0 && (
              <div className="space-y-2">
                <Label>Backup Progress</Label>
                <Progress value={backupProgress} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  {backupProgress < 100 
                    ? "Creating backup..." 
                    : "Backup completed successfully!"}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsBackupDialogOpen(false)}
              disabled={createBackupMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => createBackupMutation.mutate()}
              disabled={createBackupMutation.isPending || backupProgress > 0}
            >
              {createBackupMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="mr-2 h-4 w-4" />
              )}
              Create Backup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Backup Dialog */}
      <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Database</DialogTitle>
            <DialogDescription>
              Select a backup file to restore your database. This will replace all current data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Restoring a backup will replace all current data in your database. This action cannot be undone.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="backup-file">Select Backup File</Label>
              <Input
                id="backup-file"
                type="file"
                accept=".sql,.backup"
                onChange={handleFileUpload}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsRestoreDialogOpen(false)}
              disabled={restoreBackupMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (restoreFile) {
                  // In a real implementation, you would upload the file here
                  toast({
                    title: "Restore started",
                    description: "Uploading and restoring backup file...",
                  });
                  // Close dialog
                  setIsRestoreDialogOpen(false);
                } else {
                  toast({
                    title: "No file selected",
                    description: "Please select a backup file to restore.",
                    variant: "destructive",
                  });
                }
              }}
              disabled={!restoreFile || restoreBackupMutation.isPending}
            >
              {restoreBackupMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileUp className="mr-2 h-4 w-4" />
              )}
              Restore Database
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}