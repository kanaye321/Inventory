import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Search, UserCog } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Permission types
interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface UserPermission {
  userId: number;
  permissionId: string;
  granted: boolean;
}

interface Role {
  id: number;
  name: string;
  description: string;
  permissions: string[]; // Permission IDs
}

interface UserWithRole {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  isAdmin: boolean;
  roleId: number | null;
  department: string | null;
}

// Sample permissions data
const availablePermissions: Permission[] = [
  { id: "assets.view", name: "View Assets", description: "Can view asset details", category: "Assets" },
  { id: "assets.create", name: "Create Assets", description: "Can create new assets", category: "Assets" },
  { id: "assets.edit", name: "Edit Assets", description: "Can modify asset information", category: "Assets" },
  { id: "assets.delete", name: "Delete Assets", description: "Can remove assets from the system", category: "Assets" },
  { id: "assets.checkout", name: "Checkout Assets", description: "Can assign assets to users", category: "Assets" },
  { id: "assets.checkin", name: "Checkin Assets", description: "Can return assets from users", category: "Assets" },
  
  { id: "users.view", name: "View Users", description: "Can view user details", category: "Users" },
  { id: "users.create", name: "Create Users", description: "Can create new users", category: "Users" },
  { id: "users.edit", name: "Edit Users", description: "Can modify user information", category: "Users" },
  { id: "users.delete", name: "Delete Users", description: "Can remove users from the system", category: "Users" },
  
  { id: "licenses.view", name: "View Licenses", description: "Can view license details", category: "Licenses" },
  { id: "licenses.create", name: "Create Licenses", description: "Can create new licenses", category: "Licenses" },
  { id: "licenses.edit", name: "Edit Licenses", description: "Can modify license information", category: "Licenses" },
  { id: "licenses.delete", name: "Delete Licenses", description: "Can remove licenses from the system", category: "Licenses" },
  { id: "licenses.assign", name: "Assign Licenses", description: "Can assign licenses to users", category: "Licenses" },
  
  { id: "components.view", name: "View Components", description: "Can view component details", category: "Components" },
  { id: "components.create", name: "Create Components", description: "Can create new components", category: "Components" },
  { id: "components.edit", name: "Edit Components", description: "Can modify component information", category: "Components" },
  { id: "components.delete", name: "Delete Components", description: "Can remove components from the system", category: "Components" },

  { id: "accessories.view", name: "View Accessories", description: "Can view accessory details", category: "Accessories" },
  { id: "accessories.create", name: "Create Accessories", description: "Can create new accessories", category: "Accessories" },
  { id: "accessories.edit", name: "Edit Accessories", description: "Can modify accessory information", category: "Accessories" },
  { id: "accessories.delete", name: "Delete Accessories", description: "Can remove accessories from the system", category: "Accessories" },

  { id: "reports.view", name: "View Reports", description: "Can view reports", category: "Reports" },
  { id: "reports.export", name: "Export Reports", description: "Can export reports", category: "Reports" },

  { id: "admin.settings", name: "Manage Settings", description: "Can modify system settings", category: "Administration" },
  { id: "admin.backups", name: "Manage Backups", description: "Can create and restore backups", category: "Administration" },
  { id: "admin.permissions", name: "Manage Permissions", description: "Can assign permissions to users and roles", category: "Administration" },
];

// Sample roles
const predefinedRoles: Role[] = [
  { 
    id: 1, 
    name: "Administrator", 
    description: "Full access to all system features", 
    permissions: availablePermissions.map(p => p.id)
  },
  { 
    id: 2, 
    name: "Asset Manager", 
    description: "Can manage all assets but has limited administrative access", 
    permissions: [
      "assets.view", "assets.create", "assets.edit", "assets.delete", "assets.checkout", "assets.checkin",
      "components.view", "components.create", "components.edit", 
      "accessories.view", "accessories.create", "accessories.edit",
      "licenses.view", "licenses.create", "licenses.edit", "licenses.assign",
      "reports.view", "reports.export"
    ]
  },
  { 
    id: 3, 
    name: "User Manager", 
    description: "Can manage users and assign assets", 
    permissions: [
      "users.view", "users.create", "users.edit",
      "assets.view", "assets.checkout", "assets.checkin",
      "reports.view"
    ]
  },
  { 
    id: 4, 
    name: "Read Only", 
    description: "Can only view information but not make changes", 
    permissions: [
      "assets.view", "users.view", "licenses.view", "components.view", "accessories.view", "reports.view"
    ]
  }
];

export default function UserPermissionsPage() {
  const [activeTab, setActiveTab] = useState("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isRoleDetailsOpen, setIsRoleDetailsOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [newRolePermissions, setNewRolePermissions] = useState<string[]>([]);
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const { toast } = useToast();

  // Fetch users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
    select: (data) => data as UserWithRole[]
  });

  // Add roles to user mutation
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, roleId }: { userId: number, roleId: number | null }) => {
      const res = await apiRequest('PATCH', `/api/users/${userId}`, { roleId });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "User role updated",
        description: "The user's role has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
    },
    onError: (error) => {
      toast({
        title: "Error updating user role",
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
        description: "The user's admin status has been updated successfully.",
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

  // Create new role mutation (simulated)
  const createRoleMutation = useMutation({
    mutationFn: async (role: { name: string, description: string, permissions: string[] }) => {
      // This would typically be an API call to create a role
      // For this implementation, we're simulating success
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { ...role, id: Math.floor(Math.random() * 1000) + 10 };
    },
    onSuccess: () => {
      toast({
        title: "Role created",
        description: "The new role has been created successfully.",
      });
      setIsCreateRoleOpen(false);
      setNewRoleName("");
      setNewRoleDescription("");
      setNewRolePermissions([]);
    },
    onError: (error) => {
      toast({
        title: "Error creating role",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle toggling a permission for the new role
  const togglePermission = (permissionId: string) => {
    setNewRolePermissions(current => 
      current.includes(permissionId)
        ? current.filter(id => id !== permissionId)
        : [...current, permissionId]
    );
  };

  // Create new role handler
  const handleCreateRole = () => {
    if (!newRoleName.trim()) {
      toast({
        title: "Missing role name",
        description: "Please provide a name for the new role.",
        variant: "destructive",
      });
      return;
    }

    createRoleMutation.mutate({
      name: newRoleName,
      description: newRoleDescription,
      permissions: newRolePermissions
    });
  };

  // Filter users based on search query
  const filteredUsers = users?.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group permissions by category
  const permissionsByCategory = availablePermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight flex items-center">
          <UserCog className="mr-2 sm:mr-3 h-6 w-6 sm:h-8 sm:w-8" />
          User Permissions
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full sm:w-auto justify-start mb-2">
          <TabsTrigger value="users" className="text-xs sm:text-sm flex-1 sm:flex-none">Users</TabsTrigger>
          <TabsTrigger value="roles" className="text-xs sm:text-sm flex-1 sm:flex-none">Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Permissions Management</CardTitle>
              <CardDescription>
                Assign roles and permissions to users in the system.
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
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Username</TableHead>
                        <TableHead className="min-w-[150px]">Name</TableHead>
                        <TableHead className="min-w-[200px]">Email</TableHead>
                        <TableHead className="min-w-[120px]">Department</TableHead>
                        <TableHead className="min-w-[180px]">Role</TableHead>
                        <TableHead className="min-w-[120px]">Admin Access</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers && filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.username}</TableCell>
                            <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.department || "-"}</TableCell>
                            <TableCell>
                              <Select
                                value={user.roleId?.toString() || "none"}
                                onValueChange={(value) => {
                                  const roleId = value !== "none" ? parseInt(value) : null;
                                  updateUserRoleMutation.mutate({ 
                                    userId: user.id, 
                                    roleId 
                                  });
                                }}
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue>
                                    {user.roleId 
                                      ? predefinedRoles.find(r => r.id === user.roleId)?.name || "No Role" 
                                      : "No Role"}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">No Role</SelectItem>
                                  {predefinedRoles.map((role) => (
                                    <SelectItem key={role.id} value={role.id.toString()}>
                                      {role.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Switch 
                                checked={user.isAdmin}
                                onCheckedChange={(checked) => {
                                  toggleAdminStatusMutation.mutate({
                                    userId: user.id,
                                    isAdmin: checked
                                  });
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
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
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Roles Management</CardTitle>
                <CardDescription>
                  Create and manage roles with predefined sets of permissions.
                </CardDescription>
              </div>
              <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Role
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Role</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Role Name</Label>
                      <Input
                        id="name"
                        placeholder="Enter role name"
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        placeholder="Enter role description"
                        value={newRoleDescription}
                        onChange={(e) => setNewRoleDescription(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <Label>Permissions</Label>
                      
                      {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                        <div key={category} className="space-y-2">
                          <h3 className="text-sm font-medium">{category}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {permissions.map((permission) => (
                              <div key={permission.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`permission-${permission.id}`}
                                  checked={newRolePermissions.includes(permission.id)}
                                  onCheckedChange={() => togglePermission(permission.id)}
                                />
                                <label
                                  htmlFor={`permission-${permission.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {permission.name}
                                </label>
                              </div>
                            ))}
                          </div>
                          <Separator className="my-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleCreateRole}
                      disabled={createRoleMutation.isPending}
                    >
                      {createRoleMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create Role
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {predefinedRoles.map((role) => (
                  <Card key={role.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{role.name}</CardTitle>
                      <CardDescription>{role.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium">Permissions:</h4>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.length > 5 ? (
                            <>
                              {role.permissions.slice(0, 5).map((permId) => {
                                const perm = availablePermissions.find(p => p.id === permId);
                                return perm ? (
                                  <Badge key={permId} variant="outline" className="text-xs">
                                    {perm.name}
                                  </Badge>
                                ) : null;
                              })}
                              <Badge variant="outline" className="text-xs">
                                +{role.permissions.length - 5} more
                              </Badge>
                            </>
                          ) : (
                            role.permissions.map((permId) => {
                              const perm = availablePermissions.find(p => p.id === permId);
                              return perm ? (
                                <Badge key={permId} variant="outline" className="text-xs">
                                  {perm.name}
                                </Badge>
                              ) : null;
                            })
                          )}
                        </div>
                      </div>
                    </CardContent>
                    <div className="bg-muted/50 px-6 py-3 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRole(role);
                          setIsRoleDetailsOpen(true);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Role Details Dialog */}
      <Dialog open={isRoleDetailsOpen} onOpenChange={setIsRoleDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedRole?.name} Role Details</DialogTitle>
          </DialogHeader>
          {selectedRole && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
                <p>{selectedRole.description}</p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Permissions</h3>
                
                {Object.entries(permissionsByCategory).map(([category, permissions]) => {
                  // Filter permissions that belong to this role
                  const categoryPermissions = permissions.filter(
                    permission => selectedRole.permissions.includes(permission.id)
                  );
                  
                  // Only show categories that have permissions for this role
                  if (categoryPermissions.length === 0) return null;
                  
                  return (
                    <div key={category} className="mb-4">
                      <h4 className="text-sm font-medium mb-2">{category}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {categoryPermissions.map(permission => (
                          <div 
                            key={permission.id} 
                            className="flex items-center space-x-2 p-2 rounded-md bg-muted/50"
                          >
                            <Badge variant="outline" className="mr-2">
                              {permission.name}
                            </Badge>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {permission.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}