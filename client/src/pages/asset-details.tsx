import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { QRCodeSVG } from "qrcode.react";
import { 
  ArrowLeftIcon,
  BadgeIcon,
  Edit2Icon,
  TrashIcon,
  HistoryIcon,
  BoxIcon,
  CalendarIcon,
  DollarSignIcon,
  KeyIcon,
  MapPinIcon,
  MonitorIcon,
  NetworkIcon,
  HashIcon,
  HardDriveIcon,
  BuildingIcon,
  FileTextIcon,
  UserIcon,
  QrCodeIcon,
  ServerIcon,
  CreditCardIcon,
} from "lucide-react";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDate, getStatusColor } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Asset, User, AssetStatus } from "@shared/schema";
import AssetForm from "@/components/assets/asset-form";
import CheckoutForm from "@/components/assets/checkout-form";
import CheckinForm from "@/components/assets/checkin-form";
import { useState } from "react";

export default function AssetDetails() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [isCheckinDialogOpen, setIsCheckinDialogOpen] = useState(false);

  // Get asset details
  const { 
    data: asset, 
    isLoading,
    isError,
    error
  } = useQuery<Asset>({ 
    queryKey: [`/api/assets/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/assets/${id}`);
      if (!res.ok) throw new Error('Failed to fetch asset');
      return res.json();
    },
  });

  // Get asset activity
  const { 
    data: activities,
    isLoading: isActivitiesLoading
  } = useQuery({
    queryKey: [`/api/assets/${id}/activities`],
    queryFn: async () => {
      const res = await fetch(`/api/assets/${id}/activities`);
      if (!res.ok) throw new Error('Failed to fetch activities');
      return res.json();
    },
  });

  // Get assigned user details
  const { 
    data: assignedUser,
    isLoading: isUserLoading
  } = useQuery<User>({
    queryKey: [`/api/users/${asset?.assignedTo}`],
    queryFn: async () => {
      const res = await fetch(`/api/users/${asset?.assignedTo}`);
      if (!res.ok) throw new Error('Failed to fetch user');
      return res.json();
    },
    enabled: !!asset?.assignedTo,
  });

  // Update asset mutation
  const updateAssetMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PATCH', `/api/assets/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/assets/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      queryClient.invalidateQueries({ queryKey: [`/api/assets/${id}/activities`] });
      setIsEditDialogOpen(false);
      toast({
        title: "Asset updated",
        description: "The asset has been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update asset",
        variant: "destructive"
      });
    }
  });

  // Delete asset mutation
  const deleteAssetMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/assets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      navigate('/assets');
      toast({
        title: "Asset deleted",
        description: "The asset has been deleted successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete asset",
        variant: "destructive"
      });
    }
  });

  // Checkout asset mutation
  const checkoutAssetMutation = useMutation({
    mutationFn: async (data: { 
      userId: number, 
      knoxId?: string,
      firstName?: string,
      lastName?: string,
      expectedCheckinDate?: string 
    }) => {
      const response = await apiRequest('POST', `/api/assets/${id}/checkout`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/assets/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      queryClient.invalidateQueries({ queryKey: [`/api/assets/${id}/activities`] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      setIsCheckoutDialogOpen(false);
      toast({
        title: "Asset checked out",
        description: "The asset has been checked out successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to check out asset",
        variant: "destructive"
      });
    }
  });

  // Checkin asset mutation
  const checkinAssetMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/assets/${id}/checkin`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/assets/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      queryClient.invalidateQueries({ queryKey: [`/api/assets/${id}/activities`] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      setIsCheckinDialogOpen(false);
      toast({
        title: "Asset checked in",
        description: "The asset has been checked in successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to check in asset",
        variant: "destructive"
      });
    }
  });
  
  // Finance update mutation
  const updateFinanceMutation = useMutation({
    mutationFn: async (financeUpdated: boolean) => {
      const response = await apiRequest('POST', `/api/assets/${id}/finance`, { financeUpdated });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/assets/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] });
      queryClient.invalidateQueries({ queryKey: [`/api/assets/${id}/activities`] });
      toast({
        title: "Finance status updated",
        description: "The finance status has been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update finance status",
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading asset details...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Error Loading Asset</h2>
          <p className="text-gray-500 mb-4">{error?.message || "Failed to load asset details"}</p>
          <Button onClick={() => navigate('/assets')}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Assets
          </Button>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-gray-500 text-4xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold mb-2">Asset Not Found</h2>
          <p className="text-gray-500 mb-4">The asset you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/assets')}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Assets
          </Button>
        </div>
      </div>
    );
  }

  const isDeployed = asset.status === AssetStatus.DEPLOYED || asset.status === AssetStatus.OVERDUE;
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate('/assets')}>
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Asset: {asset.name}</h1>
            <p className="text-sm text-gray-600">Tag: {asset.assetTag}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isDeployed ? (
            <Button onClick={() => setIsCheckinDialogOpen(true)}>
              <BoxIcon className="mr-2 h-4 w-4" />
              Check In
            </Button>
          ) : (
            <Button onClick={() => setIsCheckoutDialogOpen(true)}>
              <BoxIcon className="mr-2 h-4 w-4" />
              Check Out
            </Button>
          )}
          <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
            <Edit2Icon className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" className="text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => setIsDeleteDialogOpen(true)}>
            <TrashIcon className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Asset Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <Badge className={getStatusColor(asset.status)}>
                      {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Condition</p>
                    <Badge className={asset.condition === 'Good' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {asset.condition}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Category</p>
                    <p>{asset.category}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Asset Tag</p>
                    <div className="flex items-center">
                      <HashIcon className="h-4 w-4 text-gray-400 mr-1" />
                      <p>{asset.assetTag}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Serial Number</p>
                    <p>{asset.serialNumber || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Model</p>
                    <div className="flex items-center">
                      <HardDriveIcon className="h-4 w-4 text-gray-400 mr-1" />
                      <p>{asset.model || "—"}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Manufacturer</p>
                    <div className="flex items-center">
                      <BuildingIcon className="h-4 w-4 text-gray-400 mr-1" />
                      <p>{asset.manufacturer || "—"}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Purchase Date</p>
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                      <p>{formatDate(asset.purchaseDate) || "—"}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Purchase Cost</p>
                    <div className="flex items-center">
                      <DollarSignIcon className="h-4 w-4 text-gray-400 mr-1" />
                      <p>{asset.purchaseCost || "—"}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Location</p>
                    <div className="flex items-center">
                      <MapPinIcon className="h-4 w-4 text-gray-400 mr-1" />
                      <p>{asset.location || "—"}</p>
                    </div>
                  </div>
                </div>

                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  {/* Only show Knox ID if the asset is deployed */}
                  {isDeployed && asset.knoxId && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Knox ID</p>
                      <div className="flex items-center">
                        <KeyIcon className="h-4 w-4 text-gray-400 mr-1" />
                        <p>{asset.knoxId}</p>
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-500">IP Address</p>
                    <div className="flex items-center">
                      <NetworkIcon className="h-4 w-4 text-gray-400 mr-1" />
                      <p>{asset.ipAddress || "—"}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">MAC Address</p>
                    <div className="flex items-center">
                      <ServerIcon className="h-4 w-4 text-gray-400 mr-1" />
                      <p>{asset.macAddress || "—"}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">OS Type</p>
                    <div className="flex items-center">
                      <MonitorIcon className="h-4 w-4 text-gray-400 mr-1" />
                      <p>{asset.osType || "—"}</p>
                    </div>
                  </div>
                </div>
                
                <Separator />

                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Notes</p>
                  <div className="bg-gray-50 p-3 rounded-md min-h-[80px]">
                    <p className="text-sm whitespace-pre-wrap">{asset.notes || "No notes available."}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Assignment & Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isDeployed && asset.assignedTo ? (
                  <>
                    <div className="bg-blue-50 p-4 rounded-md">
                      <div className="flex items-center mb-2">
                        <BadgeIcon className="h-5 w-5 text-primary mr-2" />
                        <h3 className="font-medium">Knox ID (Assigned To)</h3>
                      </div>
                      {asset.knoxId ? (
                        <div className="flex items-center mb-3">
                          <Badge variant="outline" className="border-blue-500 text-blue-600 px-3 py-1 text-sm font-semibold">
                            {asset.knoxId}
                          </Badge>
                        </div>
                      ) : (
                        <div className="flex items-center mb-3">
                          <Badge variant="outline" className="px-3 py-1 text-sm">No Knox ID assigned</Badge>
                        </div>
                      )}
                      
                      {isUserLoading ? (
                        <div className="animate-pulse h-6 bg-blue-100 rounded"></div>
                      ) : assignedUser ? (
                        <div className="mt-2 border-t border-blue-100 pt-2">
                          <p className="text-xs text-gray-500 mb-1">User details:</p>
                          <p className="text-sm">
                            <span className="font-medium">{assignedUser.firstName} {assignedUser.lastName}</span>
                            <br />
                            <span className="text-gray-600">{assignedUser.email}</span>
                            {assignedUser.department && (
                              <>
                                <br />
                                <span className="text-gray-600">{assignedUser.department}</span>
                              </>
                            )}
                          </p>
                        </div>
                      ) : asset.assignedTo ? (
                        <p className="text-sm text-gray-600">User not found</p>
                      ) : null}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Checkout Date</p>
                      <p className="text-sm">{formatDate(asset.checkoutDate) || "—"}</p>
                    </div>
                    {asset.expectedCheckinDate && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Expected Return Date</p>
                        <p className="text-sm">{formatDate(asset.expectedCheckinDate)}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-28 text-center">
                    <BoxIcon className="h-10 w-10 text-gray-300 mb-2" />
                    <p className="text-gray-500 mb-1">Asset is not checked out</p>
                    <Button size="sm" onClick={() => setIsCheckoutDialogOpen(true)}>Check Out Now</Button>
                  </div>
                )}
                
                {/* Finance Status */}
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="finance-updated" 
                      checked={asset.financeUpdated || false}
                      onCheckedChange={(checked) => {
                        updateFinanceMutation.mutate(!!checked);
                      }}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="finance-updated"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Finance Updated
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Mark when finance department has updated this asset in their system.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* QR Code */}
                <Separator />
                <div className="pt-2">
                  <div className="flex items-center mb-2">
                    <QrCodeIcon className="h-4 w-4 text-gray-500 mr-1" />
                    <p className="text-sm font-medium text-gray-500">Asset QR Code</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="p-2 bg-white rounded border">
                      <QRCodeSVG 
                        value={`${window.location.origin}/assets/${id}`} 
                        size={120} 
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">Scan to view asset details</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Asset History</CardTitle>
              <HistoryIcon className="h-5 w-5 text-gray-400" />
            </CardHeader>
            <CardContent>
              <ActivityFeed 
                activities={activities || []} 
                isLoading={isActivitiesLoading} 
                emptyMessage="No activity history for this asset yet."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
          </DialogHeader>
          <AssetForm 
            onSubmit={(data) => updateAssetMutation.mutate(data)} 
            isLoading={updateAssetMutation.isPending}
            defaultValues={asset}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Asset</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this asset? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteAssetMutation.mutate()}
              disabled={deleteAssetMutation.isPending}
            >
              {deleteAssetMutation.isPending ? "Deleting..." : "Delete Asset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Check Out Asset</DialogTitle>
            <DialogDescription>
              Assign this asset to a user.
            </DialogDescription>
          </DialogHeader>
          <CheckoutForm 
            onSubmit={(data) => checkoutAssetMutation.mutate(data)} 
            isLoading={checkoutAssetMutation.isPending}
            assetName={asset.name}
          />
        </DialogContent>
      </Dialog>

      {/* Checkin Dialog */}
      <Dialog open={isCheckinDialogOpen} onOpenChange={setIsCheckinDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Check In Asset</DialogTitle>
            <DialogDescription>
              Return this asset to inventory.
            </DialogDescription>
          </DialogHeader>
          <CheckinForm 
            onSubmit={() => checkinAssetMutation.mutate()} 
            isLoading={checkinAssetMutation.isPending}
            assetName={asset.name}
            userName={assignedUser ? `${assignedUser.firstName} ${assignedUser.lastName}` : "Unknown User"}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
