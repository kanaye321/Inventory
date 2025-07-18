import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeftIcon,
  Edit2Icon,
  TrashIcon,
  HistoryIcon,
  BoxIcon,
  UserIcon,
  MailIcon,
  BriefcaseIcon,
  ShieldIcon,
  BoxesIcon,
} from "lucide-react";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User, Asset } from "@shared/schema";
import UserForm from "@/components/users/user-form";
import AssetTable from "@/components/assets/asset-table";
import { useState } from "react";

export default function UserDetails() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Get user details
  const { 
    data: user, 
    isLoading,
    isError,
    error
  } = useQuery<User>({ 
    queryKey: [`/api/users/${id}`],
  });

  // Get user activity
  const { 
    data: activities,
    isLoading: isActivitiesLoading
  } = useQuery({
    queryKey: [`/api/users/${id}/activities`],
    enabled: !!id,
  });

  // Get all assets to filter assigned assets
  const {
    data: allAssets,
    isLoading: isAssetsLoading
  } = useQuery<Asset[]>({
    queryKey: ['/api/assets'],
    enabled: !!id,
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('PATCH', `/api/users/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${id}/activities`] });
      setIsEditDialogOpen(false);
      toast({
        title: "User updated",
        description: "The user has been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive"
      });
    }
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      navigate('/users');
      toast({
        title: "User deleted",
        description: "The user has been deleted successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Error Loading User</h2>
          <p className="text-gray-500 mb-4">{error?.message || "Failed to load user details"}</p>
          <Button onClick={() => navigate('/users')}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-gray-500 text-4xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold mb-2">User Not Found</h2>
          <p className="text-gray-500 mb-4">The user you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/users')}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  // Filter assets assigned to this user
  const assignedAssets = allAssets?.filter(asset => asset.assignedTo === parseInt(id)) || [];
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate('/users')}>
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">{user.firstName} {user.lastName}</h1>
            <p className="text-sm text-gray-600">@{user.username}</p>
          </div>
        </div>
        <div className="flex gap-2">
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
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Full Name</p>
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 text-gray-400 mr-1" />
                    <p>{user.firstName} {user.lastName}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Username</p>
                  <p>@{user.username}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <div className="flex items-center">
                    <MailIcon className="h-4 w-4 text-gray-400 mr-1" />
                    <p>{user.email}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Department</p>
                  <div className="flex items-center">
                    <BriefcaseIcon className="h-4 w-4 text-gray-400 mr-1" />
                    <p>{user.department || "—"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Role</p>
                  <div className="flex items-center">
                    <ShieldIcon className="h-4 w-4 text-gray-400 mr-1" />
                    <Badge variant={user.isAdmin ? "default" : "outline"}>
                      {user.isAdmin ? "Administrator" : "User"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Assigned Assets</p>
                  <div className="flex items-center">
                    <BoxesIcon className="h-4 w-4 text-gray-400 mr-1" />
                    <p>{assignedAssets.length}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="assets">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Assigned Assets</CardTitle>
              <BoxIcon className="h-5 w-5 text-gray-400" />
            </CardHeader>
            <CardContent>
              {isAssetsLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-10 bg-gray-100 rounded"></div>
                  <div className="h-40 bg-gray-100 rounded"></div>
                </div>
              ) : assignedAssets.length > 0 ? (
                <AssetTable assets={assignedAssets} isLoading={false} />
              ) : (
                <div className="text-center py-8">
                  <BoxIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No assets currently assigned to this user.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">User Activity</CardTitle>
              <HistoryIcon className="h-5 w-5 text-gray-400" />
            </CardHeader>
            <CardContent>
              <ActivityFeed 
                activities={activities || []} 
                isLoading={isActivitiesLoading} 
                emptyMessage="No activity history for this user yet."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <UserForm 
            onSubmit={(data) => updateUserMutation.mutate(data)} 
            isLoading={updateUserMutation.isPending}
            defaultValues={{
              ...user,
              // Don't include the password in the form
              password: "",
            }}
            isEditMode={true}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
              {assignedAssets.length > 0 && (
                <p className="text-red-500 mt-2">
                  Warning: This user has {assignedAssets.length} asset(s) assigned. These assets will need to be checked in first.
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteUserMutation.mutate()}
              disabled={deleteUserMutation.isPending || assignedAssets.length > 0}
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
