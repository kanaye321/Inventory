import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, UserCog, Settings, Eye, Edit3, Plus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User, UserPermissions } from "@shared/schema";

interface UserWithPermissions {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string | null;
  isAdmin: boolean | null;
  roleId: number | null;
  permissions?: UserPermissions | null;
}

const pageCategories = [
  {
    name: "Inventory",
    pages: [
      { key: "assets", label: "Assets", description: "Asset management and tracking" },
      { key: "components", label: "Components", description: "Hardware components inventory" },
      { key: "accessories", label: "Accessories", description: "Accessory items management" },
      { key: "consumables", label: "Consumables", description: "Consumable items tracking" },
      { key: "licenses", label: "Licenses", description: "Software license management" },
    ]
  },
  {
    name: "Monitoring",
    pages: [
      { key: "vmMonitoring", label: "VM Monitoring", description: "Virtual machine monitoring" },
      { key: "networkDiscovery", label: "Network Discovery", description: "Network device discovery" },
      { key: "bitlockerKeys", label: "BitLocker Keys", description: "BitLocker recovery key management" },
    ]
  },
  {
    name: "Administration",
    pages: [
      { key: "users", label: "User Management", description: "User account management" },
      { key: "reports", label: "Reports", description: "System reports and analytics" },
      { key: "admin", label: "Admin Settings", description: "System administration" },
    ]
  }
];

export default function UserPermissionsEnhanced() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithPermissions | null>(null);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    select: (data) => data as UserWithPermissions[]
  });

  // Update user permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ userId, permissions }: { userId: number, permissions: UserPermissions }) => {
      const res = await apiRequest('PATCH', `/api/users/${userId}/permissions`, { permissions });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Permissions updated",
        description: "User permissions have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsPermissionsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error updating permissions",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Toggle admin status mutation
  const toggleAdminStatusMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: number, isAdmin: boolean }) => {
      const res = await apiRequest('PATCH', `/api/users/${userId}`, { isAdmin });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Admin status updated",
        description: "User admin status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error) => {
      toast({
        title: "Error updating admin status",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Filter users based on search query
  const filteredUsers = users?.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openPermissionsDialog = (user: UserWithPermissions) => {
    setSelectedUser(user);
    setIsPermissionsDialogOpen(true);
  };

  const updateUserPermission = (pageKey: string, permissionType: 'view' | 'edit' | 'add', value: boolean) => {
    if (!selectedUser) return;

    const currentPermissions = selectedUser.permissions || getDefaultPermissions();
    const updatedPermissions = {
      ...currentPermissions,
      [pageKey]: {
        ...currentPermissions[pageKey as keyof UserPermissions],
        [permissionType]: value
      }
    };

    setSelectedUser({ ...selectedUser, permissions: updatedPermissions });
  };

  const savePermissions = () => {
    if (!selectedUser || !selectedUser.permissions) return;

    updatePermissionsMutation.mutate({
      userId: selectedUser.id,
      permissions: selectedUser.permissions
    });
  };

  const getDefaultPermissions = (): UserPermissions => ({
    assets: { view: true, edit: false, add: false },
    components: { view: true, edit: false, add: false },
    accessories: { view: true, edit: false, add: false },
    consumables: { view: true, edit: false, add: false },
    licenses: { view: true, edit: false, add: false },
    users: { view: false, edit: false, add: false },
    reports: { view: true, edit: false, add: false },
    vmMonitoring: { view: true, edit: false, add: false },
    networkDiscovery: { view: true, edit: false, add: false },
    bitlockerKeys: { view: false, edit: false, add: false },
    admin: { view: false, edit: false, add: false }
  });

  const setPresetPermissions = (preset: 'viewer' | 'editor' | 'manager' | 'admin') => {
    if (!selectedUser) return;

    let permissions: UserPermissions;

    switch (preset) {
      case 'viewer':
        permissions = {
          assets: { view: true, edit: false, add: false },
          components: { view: true, edit: false, add: false },
          accessories: { view: true, edit: false, add: false },
          consumables: { view: true, edit: false, add: false },
          licenses: { view: true, edit: false, add: false },
          users: { view: false, edit: false, add: false },
          reports: { view: true, edit: false, add: false },
          vmMonitoring: { view: true, edit: false, add: false },
          networkDiscovery: { view: true, edit: false, add: false },
          bitlockerKeys: { view: false, edit: false, add: false },
          admin: { view: false, edit: false, add: false }
        };
        break;
      case 'editor':
        permissions = {
          assets: { view: true, edit: true, add: false },
          components: { view: true, edit: true, add: false },
          accessories: { view: true, edit: true, add: false },
          consumables: { view: true, edit: true, add: false },
          licenses: { view: true, edit: true, add: false },
          users: { view: false, edit: false, add: false },
          reports: { view: true, edit: false, add: false },
          vmMonitoring: { view: true, edit: false, add: false },
          networkDiscovery: { view: true, edit: false, add: false },
          bitlockerKeys: { view: false, edit: false, add: false },
          admin: { view: false, edit: false, add: false }
        };
        break;
      case 'manager':
        permissions = {
          assets: { view: true, edit: true, add: true },
          components: { view: true, edit: true, add: true },
          accessories: { view: true, edit: true, add: true },
          consumables: { view: true, edit: true, add: true },
          licenses: { view: true, edit: true, add: true },
          users: { view: true, edit: false, add: false },
          reports: { view: true, edit: true, add: false },
          vmMonitoring: { view: true, edit: true, add: false },
          networkDiscovery: { view: true, edit: true, add: false },
          bitlockerKeys: { view: true, edit: false, add: false },
          admin: { view: false, edit: false, add: false }
        };
        break;
      case 'admin':
        permissions = {
          assets: { view: true, edit: true, add: true },
          components: { view: true, edit: true, add: true },
          accessories: { view: true, edit: true, add: true },
          consumables: { view: true, edit: true, add: true },
          licenses: { view: true, edit: true, add: true },
          users: { view: true, edit: true, add: true },
          reports: { view: true, edit: true, add: true },
          vmMonitoring: { view: true, edit: true, add: true },
          networkDiscovery: { view: true, edit: true, add: true },
          bitlockerKeys: { view: true, edit: true, add: true },
          admin: { view: true, edit: true, add: true }
        };
        break;
    }

    setSelectedUser({ ...selectedUser, permissions });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight flex items-center">
          <UserCog className="mr-2 sm:mr-3 h-6 w-6 sm:h-8 sm:w-8" />
          User Permissions Management
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Permission Controls</CardTitle>
          <CardDescription>
            Manage detailed permissions for each user to control their access to different pages and actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex mb-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {usersLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Admin Status</TableHead>
                    <TableHead>Permission Summary</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers && filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => {
                      const permissions = user.permissions || getDefaultPermissions();
                      const totalPermissions = Object.values(permissions).reduce((acc, perm) => 
                        acc + (perm.view ? 1 : 0) + (perm.edit ? 1 : 0) + (perm.add ? 1 : 0), 0
                      );
                      
                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.username}</div>
                              <div className="text-sm text-muted-foreground">
                                {`${user.firstName} ${user.lastName}`}
                              </div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>{user.department || "-"}</TableCell>
                          <TableCell>
                            <Switch 
                              checked={user.isAdmin ?? false}
                              onCheckedChange={(checked) => {
                                toggleAdminStatusMutation.mutate({
                                  userId: user.id,
                                  isAdmin: checked
                                });
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {totalPermissions} permissions
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openPermissionsDialog(user)}
                              className="flex items-center"
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Manage
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        {searchQuery
                          ? "No users match your search."
                          : "No users found."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permissions Management Dialog */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <UserCog className="h-5 w-5 mr-2" />
              Manage Permissions - {selectedUser?.username}
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              {/* Quick Presets */}
              <div className="space-y-2">
                <Label>Quick Permission Presets</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPresetPermissions('viewer')}
                  >
                    Viewer Only
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPresetPermissions('editor')}
                  >
                    Editor
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPresetPermissions('manager')}
                  >
                    Manager
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPresetPermissions('admin')}
                  >
                    Full Admin
                  </Button>
                </div>
              </div>

              {/* Detailed Permissions */}
              <div className="space-y-4">
                {pageCategories.map((category) => (
                  <Card key={category.name}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {category.pages.map((page) => {
                          const permissions = selectedUser.permissions || getDefaultPermissions();
                          const pagePerms = permissions[page.key as keyof UserPermissions];
                          
                          return (
                            <div key={page.key} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center p-3 border rounded">
                              <div>
                                <div className="font-medium">{page.label}</div>
                                <div className="text-sm text-muted-foreground">{page.description}</div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${page.key}-view`}
                                  checked={pagePerms?.view || false}
                                  onCheckedChange={(checked) => 
                                    updateUserPermission(page.key, 'view', !!checked)
                                  }
                                />
                                <Label htmlFor={`${page.key}-view`} className="flex items-center">
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${page.key}-edit`}
                                  checked={pagePerms?.edit || false}
                                  onCheckedChange={(checked) => 
                                    updateUserPermission(page.key, 'edit', !!checked)
                                  }
                                />
                                <Label htmlFor={`${page.key}-edit`} className="flex items-center">
                                  <Edit3 className="h-4 w-4 mr-1" />
                                  Edit
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${page.key}-add`}
                                  checked={pagePerms?.add || false}
                                  onCheckedChange={(checked) => 
                                    updateUserPermission(page.key, 'add', !!checked)
                                  }
                                />
                                <Label htmlFor={`${page.key}-add`} className="flex items-center">
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add
                                </Label>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Save Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsPermissionsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={savePermissions}
                  disabled={updatePermissionsMutation.isPending}
                >
                  {updatePermissionsMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Save Permissions
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}