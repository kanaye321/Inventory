import { useState } from "react";
import { Link } from "wouter";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Asset, User } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getStatusColor } from "@/lib/utils";
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon 
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface AssetTableProps {
  assets: Asset[];
  isLoading: boolean;
  onEdit: (asset: Asset) => void;
  onDelete?: (asset: Asset) => void;
  limit?: number;
  onView?: (asset: Asset) => void;
}

export default function AssetTable({ assets, isLoading, onEdit, onDelete, limit, onView }: AssetTableProps) {
  const [page, setPage] = useState(1);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const pageSize = limit || 10;
  const { toast } = useToast();

  // Get all users to display assigned names
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    retry: false
  });

  // Get assigned information (KnoxID has priority over username)
  const getAssignedInfo = (asset: Asset) => {
    if (asset.knoxId) {
      return `KnoxID: ${asset.knoxId}`;
    } else if (asset.assignedTo && users) {
      const user = users.find(user => user.id === asset.assignedTo);
      return user ? `${user.firstName} ${user.lastName}` : "-";
    }
    return "-";
  };

  // Delete asset mutation
  const deleteAssetMutation = useMutation({
    mutationFn: async (assetId: number) => {
      const response = await apiRequest('DELETE', `/api/assets/${assetId}`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Asset deleted",
        description: "The asset has been deleted successfully.",
      });
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      setAssetToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
      setAssetToDelete(null);
    }
  });

  const totalPages = Math.ceil(assets.length / pageSize);
  const displayedAssets = limit ? assets.slice(0, limit) : assets.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="bg-card dark:bg-muted rounded-lg shadow">
      {/* Delete confirmation dialog */}
      <AlertDialog open={!!assetToDelete} onOpenChange={(open) => !open && setAssetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this asset?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the asset
              {assetToDelete && ` "${assetToDelete.name}" (${assetToDelete.assetTag})`} 
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => assetToDelete && deleteAssetMutation.mutate(assetToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteAssetMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">Assets Overview</h2>
        <div className="flex space-x-2">
          <Link href="/assets">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-5">
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-100 w-full rounded"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-50 w-full rounded"></div>
            ))}
          </div>
        ) : displayedAssets.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Asset Tag</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">
                      <Link href={`/assets/${asset.id}`} className="text-primary hover:underline">
                        {asset.assetTag}
                      </Link>
                    </TableCell>
                    <TableCell>{asset.name}</TableCell>
                    <TableCell className="text-gray-500">{asset.serialNumber || '-'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(asset.status)}>
                        {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={asset.condition === 'Good' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {asset.condition}
                      </Badge>
                    </TableCell>
                    <TableCell>{asset.category}</TableCell>
                    <TableCell className="text-gray-500">
                      {asset.status === "deployed" ? (
                        asset.knoxId ? (
                          <span className="text-blue-700 font-medium">{getAssignedInfo(asset)}</span>
                        ) : (
                          asset.assignedTo ? (
                            <Link href={`/users/${asset.assignedTo}`} className="hover:underline">
                              {getAssignedInfo(asset)}
                            </Link>
                          ) : "-"
                        )
                      ) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center space-x-2">
                        <Link href={`/assets/${asset.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="View Asset Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                        </Link>
                        {onEdit && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => onEdit(asset)}
                            title="Edit Asset"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setAssetToDelete(asset)}
                            title="Delete Asset"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {!limit && totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, assets.length)} of {assets.length} assets
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeftIcon className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                    <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {limit && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Showing {Math.min(limit, assets.length)} of {assets.length} assets
                </div>
                <Link href="/assets" className="text-sm font-medium text-primary hover:underline">
                  View All Assets
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="py-32 flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-gray-100 p-3 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No assets found</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first asset</p>
            <Link href="/assets?add=true">
              <Button>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Asset
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}