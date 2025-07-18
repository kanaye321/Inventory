import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertUserSchema, type User, type InsertUser } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UserPlus, Users, Settings, Shield, Edit, Trash2, Eye, Plus, Crown, UserCheck } from "lucide-react";

interface UserPermissions {
  users: { view: boolean; edit: boolean; add: boolean };
  assets: { view: boolean; edit: boolean; add: boolean };
  components: { view: boolean; edit: boolean; add: boolean };
  accessories: { view: boolean; edit: boolean; add: boolean };
  licenses: { view: boolean; edit: boolean; add: boolean };
  reports: { view: boolean; edit: boolean; add: boolean };
  settings: { view: boolean; edit: boolean; add: boolean };
  vmInventory: { view: boolean; edit: boolean; add: boolean };
  networkDiscovery: { view: boolean; edit: boolean; add: boolean };
  admin: { view: boolean; edit: boolean; add: boolean };
}

interface Role {
  id: number;
  name: string;
  description: string;
  permissions: UserPermissions;
  isSystem?: boolean;
}

const defaultPermissions: UserPermissions = {
  users: { view: false, edit: false, add: false },
  assets: { view: true, edit: false, add: false },
  components: { view: true, edit: false, add: false },
  accessories: { view: true, edit: false, add: false },
  licenses: { view: true, edit: false, add: false },
  reports: { view: true, edit: false, add: false },
  settings: { view: false, edit: false, add: false },
  vmInventory: { view: true, edit: false, add: false },
  networkDiscovery: { view: false, edit: false, add: false },
  admin: { view: false, edit: false, add: false },
};

export default function UserManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [editingPermissions, setEditingPermissions] = useState<UserPermissions>(defaultPermissions);
  
  // Role management state
  const [isAddRoleDialogOpen, setIsAddRoleDialogOpen] = useState(false);
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [newRolePermissions, setNewRolePermissions] = useState<UserPermissions>(defaultPermissions);

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
  });

  const addUserForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      firstName: "",
      lastName: "",
      email: "",
      department: "",
      isAdmin: false,
    },
  });

  const editUserForm = useForm<Partial<InsertUser>>({
    resolver: zodResolver(insertUserSchema.partial()),
    defaultValues: {},
  });

  const addUserMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const userWithPermissions = {
        ...data,
        permissions: defaultPermissions
      };
      const response = await apiRequest("POST", "/api/users", userWithPermissions);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create user');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsAddDialogOpen(false);
      addUserForm.reset();
      toast({
        title: "Success",
        description: "User created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const editUserMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<InsertUser> }) => {
      const response = await apiRequest("PATCH", `/api/users/${data.id}`, data.updates);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      editUserForm.reset();
      toast({
        title: "Success",
        description: "User updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: async (data: { id: number; permissions: UserPermissions }) => {
      const response = await apiRequest("PUT", `/api/users/${data.id}/permissions`, { permissions: data.permissions });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update permissions');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsPermissionsDialogOpen(false);
      setSelectedUser(null);
      toast({
        title: "Success",
        description: "User permissions updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/users/${id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete user');
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    editUserForm.reset({
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      department: user.department || "",
      isAdmin: user.isAdmin || false,
    });
    setIsEditDialogOpen(true);
  };

  const handleEditPermissions = (user: User) => {
    setSelectedUser(user);
    setEditingPermissions(user.permissions || defaultPermissions);
    setIsPermissionsDialogOpen(true);
  };

  const handlePermissionChange = (module: keyof UserPermissions, action: keyof UserPermissions[keyof UserPermissions], value: boolean) => {
    setEditingPermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: value
      }
    }));
  };

  const permissionModules = [
    { key: 'users' as keyof UserPermissions, label: 'User Management', icon: Users },
    { key: 'assets' as keyof UserPermissions, label: 'Assets', icon: Shield },
    { key: 'components' as keyof UserPermissions, label: 'Components', icon: Settings },
    { key: 'accessories' as keyof UserPermissions, label: 'Accessories', icon: Plus },
    { key: 'licenses' as keyof UserPermissions, label: 'Licenses', icon: Shield },
    { key: 'reports' as keyof UserPermissions, label: 'Reports', icon: Eye },
    { key: 'vmInventory' as keyof UserPermissions, label: 'VM Inventory', icon: Settings },
    { key: 'networkDiscovery' as keyof UserPermissions, label: 'Network Discovery', icon: Settings },
    { key: 'settings' as keyof UserPermissions, label: 'System Settings', icon: Settings },
    { key: 'admin' as keyof UserPermissions, label: 'Admin Panel', icon: Shield },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center h-96">Loading users...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage users, roles, and their permissions</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>Create a new user account</DialogDescription>
            </DialogHeader>
            <Form {...addUserForm}>
              <form onSubmit={addUserForm.handleSubmit((data) => addUserMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={addUserForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addUserForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={addUserForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="First name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={addUserForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={addUserForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addUserForm.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Input placeholder="Department" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addUserForm.control}
                  name="isAdmin"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Administrator</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Grant admin privileges
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={addUserMutation.isPending}>
                    {addUserMutation.isPending ? "Creating..." : "Create User"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Roles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Manage user accounts and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.firstName} {user.lastName}</div>
                      <div className="text-sm text-muted-foreground">@{user.username}</div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.department || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={user.isAdmin ? "default" : "secondary"}>
                      {user.isAdmin ? "Admin" : "User"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Active
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPermissions(user)}
                      >
                        <Shield className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteUserMutation.mutate(user.id)}
                        disabled={user.isAdmin}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Roles</CardTitle>
                  <CardDescription>Manage user roles and their permissions</CardDescription>
                </div>
                <Dialog open={isAddRoleDialogOpen} onOpenChange={setIsAddRoleDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Role
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Role</DialogTitle>
                      <DialogDescription>Define a new role with specific permissions</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="roleName">Role Name</Label>
                          <Input
                            id="roleName"
                            value={newRoleName}
                            onChange={(e) => setNewRoleName(e.target.value)}
                            placeholder="Enter role name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="roleDescription">Description</Label>
                          <Input
                            id="roleDescription"
                            value={newRoleDescription}
                            onChange={(e) => setNewRoleDescription(e.target.value)}
                            placeholder="Enter role description"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <Label>Permissions</Label>
                        {permissionModules.map((module) => {
                          const Icon = module.icon;
                          return (
                            <Card key={module.key}>
                              <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-sm">
                                  <Icon className="h-4 w-4" />
                                  {module.label}
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-3 gap-4">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`new-${module.key}-view`}
                                      checked={newRolePermissions[module.key].view}
                                      onCheckedChange={(checked) => {
                                        setNewRolePermissions(prev => ({
                                          ...prev,
                                          [module.key]: {
                                            ...prev[module.key],
                                            view: checked as boolean
                                          }
                                        }));
                                      }}
                                    />
                                    <Label htmlFor={`new-${module.key}-view`}>View</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`new-${module.key}-edit`}
                                      checked={newRolePermissions[module.key].edit}
                                      onCheckedChange={(checked) => {
                                        setNewRolePermissions(prev => ({
                                          ...prev,
                                          [module.key]: {
                                            ...prev[module.key],
                                            edit: checked as boolean
                                          }
                                        }));
                                      }}
                                    />
                                    <Label htmlFor={`new-${module.key}-edit`}>Edit</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`new-${module.key}-add`}
                                      checked={newRolePermissions[module.key].add}
                                      onCheckedChange={(checked) => {
                                        setNewRolePermissions(prev => ({
                                          ...prev,
                                          [module.key]: {
                                            ...prev[module.key],
                                            add: checked as boolean
                                          }
                                        }));
                                      }}
                                    />
                                    <Label htmlFor={`new-${module.key}-add`}>Add</Label>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        onClick={() => {
                          // Create role logic here
                          toast({
                            title: "Role Created",
                            description: `Role "${newRoleName}" has been created successfully.`,
                          });
                          setIsAddRoleDialogOpen(false);
                          setNewRoleName("");
                          setNewRoleDescription("");
                          setNewRolePermissions(defaultPermissions);
                        }}
                        disabled={!newRoleName.trim()}
                      >
                        Create Role
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Users Count</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Administrator</TableCell>
                    <TableCell>Full system access</TableCell>
                    <TableCell>1</TableCell>
                    <TableCell>
                      <Badge variant="default">System</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button variant="ghost" size="sm" disabled>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" disabled>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">User</TableCell>
                    <TableCell>Standard user access</TableCell>
                    <TableCell>0</TableCell>
                    <TableCell>
                      <Badge variant="secondary">System</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button variant="ghost" size="sm" disabled>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" disabled>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          <Form {...editUserForm}>
            <form onSubmit={editUserForm.handleSubmit((data) => selectedUser && editUserMutation.mutate({ id: selectedUser.id, updates: data }))} className="space-y-4">
              <FormField
                control={editUserForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editUserForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="First name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editUserForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editUserForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editUserForm.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <Input placeholder="Department" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editUserForm.control}
                name="isAdmin"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Administrator</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Grant admin privileges
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={editUserMutation.isPending}>
                  {editUserMutation.isPending ? "Updating..." : "Update User"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User Permissions</DialogTitle>
            <DialogDescription>
              Configure what {selectedUser?.firstName} {selectedUser?.lastName} can view, edit, and add
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {permissionModules.map((module) => {
              const Icon = module.icon;
              return (
                <Card key={module.key}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Icon className="h-5 w-5" />
                      {module.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${module.key}-view`}
                          checked={editingPermissions[module.key].view}
                          onCheckedChange={(checked) => 
                            handlePermissionChange(module.key, 'view', checked as boolean)
                          }
                        />
                        <Label htmlFor={`${module.key}-view`}>View</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${module.key}-edit`}
                          checked={editingPermissions[module.key].edit}
                          onCheckedChange={(checked) => 
                            handlePermissionChange(module.key, 'edit', checked as boolean)
                          }
                        />
                        <Label htmlFor={`${module.key}-edit`}>Edit</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`${module.key}-add`}
                          checked={editingPermissions[module.key].add}
                          onCheckedChange={(checked) => 
                            handlePermissionChange(module.key, 'add', checked as boolean)
                          }
                        />
                        <Label htmlFor={`${module.key}-add`}>Add</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <DialogFooter>
            <Button
              onClick={() => selectedUser && updatePermissionsMutation.mutate({ 
                id: selectedUser.id, 
                permissions: editingPermissions 
              })}
              disabled={updatePermissionsMutation.isPending}
            >
              {updatePermissionsMutation.isPending ? "Updating..." : "Update Permissions"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}