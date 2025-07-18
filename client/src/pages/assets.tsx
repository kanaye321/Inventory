import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AssetTable from "@/components/assets/asset-table";
import AssetForm from "@/components/assets/asset-form";
import CSVImport from '@/components/assets/csv-import';
import {
  PlusIcon,
  SearchIcon,
  FileDownIcon,
  UploadIcon,
  FileIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  FilterIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { downloadCSV } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Asset, AssetCategories, AssetStatus } from "@shared/schema";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Assets() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [assetToEdit, setAssetToEdit] = useState<Asset | null>(null);

  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [importResults, setImportResults] = useState<{
    total: number;
    successful: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ Add the missing queryFn to fetch data
  const { data: assets = [], isLoading } = useQuery<Asset[]>({
    queryKey: ['/api/assets'],
    queryFn: async () => {
      const res = await fetch('/api/assets');
      if (!res.ok) throw new Error('Failed to fetch assets');
      return res.json();
    },
  });

  const createAssetMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/assets', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      setIsAddDialogOpen(false);
      toast({
        title: "Asset created",
        description: "The asset has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create asset",
        variant: "destructive",
      });
    }
  });

  const updateAssetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest('PATCH', `/api/assets/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      setAssetToEdit(null);
      toast({
        title: "Asset updated",
        description: "The asset has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update asset",
        variant: "destructive",
      });
    }
  });

  // Cleanup Knox IDs mutation
  const cleanupKnoxMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/assets/cleanup-knox');
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Knox IDs Cleaned Up",
        description: `${data.count || 0} assets were updated to remove Knox IDs from assets that are not checked out.`
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to clean up Knox IDs",
        variant: "destructive"
      });
    }
  });

  // Import assets mutation
  const importAssetsMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/assets/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Import failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });

      setImportResults({
        total: data.total || 0,
        successful: data.successful || 0,
        failed: data.failed || 0,
        errors: data.errors || []
      });

      setIsImporting(false);
      setImportProgress(100);
    },
    onError: (error) => {
      toast({
        title: "Import failed",
        description: error.message || "Failed to import assets",
        variant: "destructive"
      });
      setIsImporting(false);
      setImportProgress(0);
    }
  });

  const deleteAssetMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/assets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      setAssetToDelete(null);
      setDeleteConfirmText("");
      toast({
        title: "Asset deleted",
        description: "The asset has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete asset",
        variant: "destructive",
      });
    }
  });

  const uniqueDepartments = [...new Set(assets.map(asset => asset.department).filter(Boolean))] as string[];

  const filteredAssets = assets.filter(asset => {
    const matchesSearch =
      asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.assetTag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.knoxId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === "all" || asset.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || asset.status === statusFilter;
    const matchesDepartment = departmentFilter === "all" || asset.department === departmentFilter;

    return matchesSearch && matchesCategory && matchesStatus && matchesDepartment;
  });

  // Count assets assigned to the same Knox ID when searching by Knox ID
  const getKnoxIdCount = (knoxId: string) => {
    if (!knoxId) return 0;
    return assets.filter(asset => asset.knoxId?.toLowerCase() === knoxId.toLowerCase()).length;
  };

  const handleExport = () => {
    if (assets.length === 0) {
      toast({
        title: "Export failed",
        description: "No data to export",
        variant: "destructive",
      });
      return;
    }

    const exportData = assets.map(asset => ({
      id: asset.id,
      assetTag: asset.assetTag,
      name: asset.name,
      knoxId: asset.knoxId || 'N/A',
      ipAddress: asset.ipAddress || 'N/A',
      macAddress: asset.macAddress || 'N/A',
      serialNumber: asset.serialNumber || 'N/A',
      osType: asset.osType || 'N/A',
      status: asset.status,
      category: asset.category,
      purchaseDate: asset.purchaseDate || 'N/A',
    }));

    downloadCSV(exportData, 'assets-export.csv');
    toast({
      title: "Export successful",
      description: "Assets data has been exported to CSV",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Assets</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Manage your inventory assets</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setIsAddDialogOpen(true)} className="bg-primary hover:bg-primary/90">
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Asset
          </Button>
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <UploadIcon className="mr-2 h-4 w-4" />
            Import Assets
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative max-w-md w-full">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search assets by name, tag, category, serial number, department, or Knox ID..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <FileDownIcon className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Custom Filters */}
        <div className="flex flex-wrap gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2">
            <FilterIcon className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(AssetCategories).map(([key, value]) => (
                <SelectItem key={key} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(AssetStatus).map(([key, value]) => (
                <SelectItem key={key} value={value}>
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {uniqueDepartments.map(dept => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={() => {
            setCategoryFilter("all");
            setStatusFilter("all");
            setDepartmentFilter("all");
            setSearchTerm("");
          }}>
            Clear Filters
          </Button>
        </div>
      </div>

      <AssetTable
        assets={filteredAssets}
        isLoading={isLoading}
        onEdit={setAssetToEdit}
        onDelete={setAssetToDelete}
      />

      {/* Add Asset Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[90vw] lg:max-w-[800px] xl:max-w-[900px] max-h-[90vh] overflow-y-auto resize">
          <DialogHeader>
            <DialogTitle>Add New Asset</DialogTitle>
            <DialogDescription>
              Create a new asset in the inventory system.
            </DialogDescription>
          </DialogHeader>
          <AssetForm
            onSubmit={(data) => createAssetMutation.mutate(data)}
            isLoading={createAssetMutation.isPending}
          />
        </DialogContent>
      </Dialog>



      {/* Edit Asset Dialog */}
      <Dialog open={!!assetToEdit} onOpenChange={(open) => !open && setAssetToEdit(null)}>
        <DialogContent className="sm:max-w-[90vw] lg:max-w-[800px] xl:max-w-[900px] max-h-[90vh] overflow-y-auto resize">
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
            <DialogDescription>
              Update asset information.
            </DialogDescription>
          </DialogHeader>
          {assetToEdit && (
            <AssetForm
              defaultValues={assetToEdit}
              onSubmit={(data) => updateAssetMutation.mutate({ id: assetToEdit.id, data })}
              isLoading={updateAssetMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Import Assets Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsImportDialogOpen(false);
          setImportResults(null);
          setImportProgress(0);
        }
      }}>
        <DialogContent className="sm:max-w-[600px] dark:bg-gray-900 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-gray-100">Import Assets</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Upload a CSV file to import assets in bulk. If you have an Excel file, please save it as CSV format first.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <CSVImport
              importAssetsMutation={importAssetsMutation}
              setIsImporting={setIsImporting}
              setImportProgress={setImportProgress}
              setImportResults={setImportResults}
              toast={toast}
              fileInputRef={fileInputRef}
              isImporting={isImporting}
              importProgress={importProgress}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!assetToDelete} onOpenChange={(open) => !open && setAssetToDelete(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Asset</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the asset "{assetToDelete?.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              To confirm deletion, please type <strong>"Delete"</strong> in the box below:
            </p>
            <Input
              placeholder="Type 'Delete' to confirm"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => {
              setAssetToDelete(null);
              setDeleteConfirmText("");
            }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmText !== "Delete" || deleteAssetMutation.isPending}
              onClick={() => assetToDelete && deleteAssetMutation.mutate(assetToDelete.id)}
            >
              {deleteAssetMutation.isPending ? "Deleting..." : "Delete Asset"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}