import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { License, LicenseAssignment, LicenseStatus } from "@shared/schema";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeftIcon,
  EditIcon,
  TrashIcon,
  CalendarIcon,
  KeyIcon,
  UsersIcon,
  BuildingIcon,
  ServerIcon,
  DollarSignIcon,
  PlusIcon,
  CheckCircleIcon,
  UserIcon
} from "lucide-react";
import LicenseForm from "@/components/licenses/license-form";

export default function LicenseDetails() {
  const params = useParams<{ id: string }>();
  const id = parseInt(params.id);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch license details
  const { data: license, isLoading, isError } = useQuery<License>({
    queryKey: [`/api/licenses/${id}`],
    queryFn: async () => {
      const response = await fetch(`/api/licenses/${id}`);
      if (!response.ok) throw new Error('Failed to fetch license');
      return response.json();
    },
  });
  
  // Fetch license assignments
  const { data: licenseAssignments = [] } = useQuery<LicenseAssignment[]>({
    queryKey: [`/api/licenses/${id}/assignments`],
    queryFn: async () => {
      const response = await fetch(`/api/licenses/${id}/assignments`);
      if (!response.ok) throw new Error('Failed to fetch license assignments');
      return response.json();
    },
    enabled: !!license,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/licenses/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "License deleted",
        description: "The license has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/licenses'] });
      navigate('/licenses');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "There was an error deleting the license. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PATCH', `/api/licenses/${id}`, data);
    },
    onSuccess: () => {
      setIsEditDialogOpen(false);
      toast({
        title: "License updated",
        description: "The license has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/licenses/${id}`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "There was an error updating the license. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle license update
  const handleUpdate = (data: any) => {
    updateMutation.mutate(data);
  };

  // Fix to ensure status is properly updated when licenses are assigned
  useEffect(() => {
    if (license && licenseAssignments.length > 0 && license.status === 'unused') {
      // If we have assignments but status is still 'unused', update to 'active'
      updateMutation.mutate({ 
        status: LicenseStatus.ACTIVE,
        assignedSeats: licenseAssignments.length 
      });
    }
  }, [license, licenseAssignments]);

  // Handle license delete
  const handleDelete = () => {
    deleteMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError || !license) {
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-medium mb-2">Error Loading License</h3>
        <p className="text-gray-500 mb-4">
          There was a problem loading the license details.
        </p>
        <Link href="/licenses">
          <Button>Return to Licenses</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center mb-2">
            <Link href="/licenses">
              <Button variant="ghost" size="sm" className="-ml-3">
                <ChevronLeftIcon className="mr-1 h-4 w-4" />
                Back to Licenses
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl font-semibold text-gray-800">{license.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge 
              className={license.status === 'active' ? 'bg-green-100 text-green-800' : 
                      license.status === 'expired' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'}
            >
              {license.status.charAt(0).toUpperCase() + license.status.slice(1)}
            </Badge>
            <span className="text-sm text-gray-500">License Key: <span className="font-mono">{license.key}</span></span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <EditIcon className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95%] max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit License</DialogTitle>
                <DialogDescription>
                  Update the license details
                </DialogDescription>
              </DialogHeader>
              <LicenseForm 
                onSubmit={handleUpdate} 
                isLoading={updateMutation.isPending}
                defaultValues={{
                  name: license.name,
                  key: license.key,
                  status: license.status,
                  manufacturer: license.manufacturer ?? undefined,
                  purchaseDate: license.purchaseDate ?? undefined,
                  purchaseCost: license.purchaseCost ?? undefined,
                  notes: license.notes ?? undefined,
                  seats: license.seats ?? undefined,
                  company: license.company ?? undefined,
                  expirationDate: license.expirationDate ?? undefined,
                }}
              />
            </DialogContent>
          </Dialog>
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="text-red-500 border-red-200 hover:text-red-600 hover:bg-red-50">
                <TrashIcon className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95%] max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Delete License</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this license? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete License"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>License Details</CardTitle>
              <CardDescription>Details about the software license</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 flex items-center">
                      <ServerIcon className="mr-2 h-4 w-4" />
                      Product
                    </h3>
                    <p className="mt-1">{license.name}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 flex items-center">
                      <BuildingIcon className="mr-2 h-4 w-4" />
                      Company
                    </h3>
                    <p className="mt-1">{license.company || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 flex items-center">
                      <KeyIcon className="mr-2 h-4 w-4" />
                      License Key
                    </h3>
                    <p className="mt-1 font-mono text-sm break-all">{license.key}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 flex items-center">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      Purchase Date
                    </h3>
                    <p className="mt-1">{license.purchaseDate ? formatDate(license.purchaseDate as string) : 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 flex items-center">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      Expiration Date
                    </h3>
                    <p className="mt-1">
                      {license.expirationDate ? formatDate(license.expirationDate as string) : 'Not specified'}
                      {license.status === 'expired' && (
                        <Badge variant="destructive" className="ml-2">Expired</Badge>
                      )}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 flex items-center">
                      <UsersIcon className="mr-2 h-4 w-4" />
                      Seats
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      <span>{license.seats || 'Unlimited'}</span>
                      {license.seats && (
                        <Badge variant="outline" className="ml-1">
                          {license.assignedSeats || 0} used
                        </Badge>
                      )}
                      {license.seats && license.assignedSeats !== undefined && license.assignedSeats !== null && parseInt(license.seats) - license.assignedSeats > 0 && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {parseInt(license.seats) - (license.assignedSeats || 0)} available
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                <p className="mt-1 text-gray-700 whitespace-pre-wrap">
                  {license.notes || 'No notes provided.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Financial Details</CardTitle>
              <CardDescription>Cost and purchase information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 flex items-center">
                    <DollarSignIcon className="mr-2 h-4 w-4" />
                    Purchase Cost
                  </h3>
                  <p className="mt-1 text-lg font-semibold">
                    {license.purchaseCost ? `$${license.purchaseCost}` : 'Not specified'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 flex items-center">
                    <BuildingIcon className="mr-2 h-4 w-4" />
                    Manufacturer
                  </h3>
                  <p className="mt-1">{license.manufacturer || 'Not specified'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>License Assignments</CardTitle>
                <CardDescription>Track who is using this license</CardDescription>
              </div>
              {license.seats && parseInt(license.seats) > (license.assignedSeats || 0) && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Assign Seat
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95%] max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Assign License Seat</DialogTitle>
                      <DialogDescription>
                        Enter the name of the user who will be using this license.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const assignedTo = formData.get('assignedTo') as string;
                      const notes = formData.get('notes') as string || null;
                      
                      if (!assignedTo) {
                        toast({
                          title: "Error",
                          description: "Assignment information is required",
                          variant: "destructive"
                        });
                        return;
                      }
                      
                      // Create license assignment
                      const assignmentData = {
                        licenseId: license.id,
                        assignedTo,
                        notes,
                        assignedDate: new Date().toISOString().split('T')[0]
                      };
                      
                      // First create the license assignment
                      apiRequest('POST', `/api/licenses/${id}/assign`, assignmentData)
                        .then(() => {
                          // If successful, update the license with new seat count
                          const currentAssignedSeats = (license.assignedSeats || 0) + 1;
                          const newStatus = license.expirationDate && new Date(license.expirationDate) < new Date() 
                            ? LicenseStatus.EXPIRED 
                            : currentAssignedSeats > 0 
                              ? LicenseStatus.ACTIVE 
                              : LicenseStatus.UNUSED;
                          
                          return updateMutation.mutateAsync({
                            assignedSeats: currentAssignedSeats,
                            status: newStatus
                          });
                        })
                        .then(() => {
                          toast({
                            title: "Success",
                            description: `License seat assigned to: ${assignedTo}`,
                          });
                          // Invalidate both license and assignment queries
                          queryClient.invalidateQueries({ queryKey: [`/api/licenses/${id}`] });
                          queryClient.invalidateQueries({ queryKey: [`/api/licenses/${id}/assignments`] });
                        })
                        .catch(() => {
                          toast({
                            title: "Error",
                            description: "Failed to assign license seat",
                            variant: "destructive"
                          });
                        });
                    }}>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="assignedTo" className="text-right">
                            Assigned to
                          </Label>
                          <Input 
                            id="assignedTo" 
                            name="assignedTo"
                            className="col-span-3" 
                            placeholder="Enter the assigned user's name"
                            required
                          />
                        </div>
                        
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="notes" className="text-right">
                            Notes
                          </Label>
                          <Textarea
                            id="notes"
                            name="notes"
                            className="col-span-3"
                            placeholder="Optional notes about this assignment"
                            rows={3}
                          />
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button type="submit" disabled={updateMutation.isPending}>
                          {updateMutation.isPending ? "Assigning..." : "Assign License"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between mb-2">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Total Seats</span>
                    <p className="font-semibold">{license.seats || 'Unlimited'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Assigned</span>
                    <p className="font-semibold">{license.assignedSeats || 0}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Available</span>
                    <p className="font-semibold">
                      {license.seats && license.seats !== 'Unlimited'
                        ? Math.max(0, parseInt(license.seats) - (license.assignedSeats || 0))
                        : 'Unlimited'}
                    </p>
                  </div>
                </div>
                
                {license.seats && license.seats !== 'Unlimited' && parseInt(license.seats) > 0 && (
                  <Progress 
                    value={license.assignedSeats !== undefined && license.seats
                      ? (license.assignedSeats / parseInt(license.seats)) * 100 
                      : 0
                    } 
                    className="h-2"
                  />
                )}
                
                {/* Primary assignment (legacy) */}
                {license.assignedTo && (
                  <div className="mt-4 p-3 border rounded-md">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Primary Assignment</p>
                        <p className="text-sm text-gray-500">This user is responsible for this license</p>
                      </div>
                      <Link href={`/users/${license.assignedTo}`}>
                        <Button variant="link" size="sm">View User</Button>
                      </Link>
                    </div>
                  </div>
                )}
                
                {/* License assignments */}
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">All Assigned Users</h3>
                  
                  {licenseAssignments.length > 0 ? (
                    <div className="space-y-2">
                      {licenseAssignments.map((assignment) => (
                        <div key={assignment.id} className="p-3 border rounded-md">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <UserIcon className="h-4 w-4 mr-2 text-gray-500" />
                              <div>
                                <p className="font-medium">{assignment.assignedTo}</p>
                                <p className="text-xs text-gray-500">
                                  Assigned on {formatDate(assignment.assignedDate)}
                                </p>
                              </div>
                            </div>
                            {assignment.notes && (
                              <Badge variant="outline" className="ml-auto mr-2">
                                Has notes
                              </Badge>
                            )}
                          </div>
                          {assignment.notes && (
                            <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                              {assignment.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 border rounded-md border-dashed">
                      <p className="text-gray-500">No assignments found</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}