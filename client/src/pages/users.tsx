import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusIcon, SearchIcon, FileDownIcon, Plus, Search, Edit, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { downloadCSV } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import UserTable from "@/components/users/user-table";
import UserForm from "@/components/users/user-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import type { User as UserType } from "@shared/schema";

function UsersPage() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [userToView, setUserToView] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    retry: false
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/users', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      setIsAddDialogOpen(false);
      toast({
        title: "User created",
        description: "The user has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    }
  });

  const filteredUsers = users ? users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.department && user.department.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : [];

  const handleExport = () => {
    if (users && users.length > 0) {
      // Create a safe version of the data without passwords
      const safeUsers = users.map(({ password, ...rest }) => ({
        ...rest,
        password: '********' // Replace with placeholder
      }));
      downloadCSV(safeUsers, 'users-export.csv');
      toast({
        title: "Export successful",
        description: "Users data has been exported to CSV",
      });
    } else {
      toast({
        title: "Export failed",
        description: "No data to export",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Users</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">Manage system users</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setIsAddDialogOpen(true)} className="bg-primary hover:bg-primary/90">
            <PlusIcon className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative max-w-md w-full">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={handleExport}>
          <FileDownIcon className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <UserTable 
        users={filteredUsers} 
        isLoading={isLoading}
        onView={(user) => {
          setUserToView(user);
          setIsViewDialogOpen(true);
        }}
      />

      {/* View User Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {userToView && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Username:</strong> {userToView.username}
                </div>
                <div>
                  <strong>First Name:</strong> {userToView.firstName}
                </div>
                <div>
                  <strong>Last Name:</strong> {userToView.lastName}
                </div>
                <div>
                  <strong>Email:</strong> {userToView.email}
                </div>
                <div>
                  <strong>Department:</strong> {userToView.department || 'N/A'}
                </div>
                <div>
                  <strong>Role:</strong> {userToView.isAdmin ? 'Administrator' : 'User'}
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <UserForm 
            onSubmit={(data) => createUserMutation.mutate(data)} 
            isLoading={createUserMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default UsersPage;