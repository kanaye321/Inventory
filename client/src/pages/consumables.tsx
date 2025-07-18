
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusIcon, CheckCircleIcon, PackageIcon, CalendarIcon, TrendingUpIcon, AlertCircleIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ConsumableForm from "@/components/consumables/consumable-form";
import { queryClient } from "@/lib/queryClient";
import { Consumable } from "@shared/schema";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Consumables() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedConsumable, setSelectedConsumable] = useState<Consumable | null>(null);
  const [assignmentData, setAssignmentData] = useState({
    assignedTo: '',
    quantity: 1,
    notes: ''
  });
  const { toast } = useToast();

  // Fetch consumables with better error handling
  const { data: consumables = [], isLoading, error } = useQuery({
    queryKey: ['/api/consumables'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/consumables');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Failed to fetch consumables:', error);
        return [];
      }
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Consumable mutation with improved error handling
  const consumablesMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/consumables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to create consumable: ${errorData}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/consumables'] });
      toast({
        title: "Success",
        description: "Consumable has been added successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Consumable creation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add consumable. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleConsumableSubmit = (data: any) => {
    consumablesMutation.mutate(data);
  };

  // Assignment mutation with improved error handling
  const assignmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/consumables/${selectedConsumable?.id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to assign consumable: ${errorData}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      setIsAssignDialogOpen(false);
      setSelectedConsumable(null);
      setAssignmentData({ assignedTo: '', quantity: 1, notes: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/consumables'] });
      toast({
        title: "Success",
        description: "Consumable has been assigned successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Assignment error:', error);
      toast({
        title: "Assignment Failed",
        description: error.message || "Failed to assign consumable. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleAssignConsumable = (consumable: Consumable) => {
    setSelectedConsumable(consumable);
    setAssignmentData({ assignedTo: '', quantity: 1, notes: '' });
    setIsAssignDialogOpen(true);
  };

  const handleAssignmentSubmit = () => {
    if (!assignmentData.assignedTo.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter who the consumable is assigned to.",
        variant: "destructive",
      });
      return;
    }

    if (assignmentData.quantity <= 0 || assignmentData.quantity > (selectedConsumable?.quantity || 0)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid quantity.",
        variant: "destructive",
      });
      return;
    }

    assignmentMutation.mutate(assignmentData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="space-y-8 p-6 animate-in fade-in-0 duration-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-2 animate-in slide-in-from-left-5 duration-700">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Consumables
            </h1>
            <p className="text-lg text-slate-600 font-medium">Manage consumable items and inventory</p>
          </div>
          <div className="flex flex-wrap gap-3 animate-in slide-in-from-right-5 duration-700">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <PlusIcon className="mr-2 h-5 w-5" />
                  Add Consumable
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95%] max-w-4xl max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-300">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-slate-800">Add New Consumable</DialogTitle>
                  <DialogDescription className="text-slate-600">
                    Enter the details for the new consumable item
                  </DialogDescription>
                </DialogHeader>
                <ConsumableForm 
                  onSubmit={handleConsumableSubmit} 
                  isLoading={consumablesMutation.isPending} 
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircleIcon className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Unable to load consumables. Please check your connection and try again.
            </AlertDescription>
          </Alert>
        )}

        <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 animate-in slide-in-from-bottom-8 delay-200">
          <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-b border-indigo-100">
            <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <TrendingUpIcon className="h-6 w-6 text-indigo-600" />
              Consumables Inventory
            </CardTitle>
            <CardDescription className="text-slate-600 text-base">
              Track and manage consumable items and assignments
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200"></div>
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent absolute top-0 left-0"></div>
                </div>
                <div className="ml-4 text-slate-600">Loading consumables...</div>
              </div>
            ) : consumables && consumables.length > 0 ? (
              <div className="grid gap-6">
                {consumables.map((consumable, index) => (
                  <div 
                    key={consumable.id} 
                    className={`group border border-slate-200 rounded-2xl p-6 bg-gradient-to-br from-white to-slate-50 shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-in slide-in-from-bottom-4`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex flex-col lg:flex-row justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="space-y-2">
                          <h3 className="font-bold text-xl text-slate-800 group-hover:text-indigo-600 transition-colors duration-300">
                            {consumable.name}
                          </h3>
                          <div className="flex items-center gap-2 text-slate-500">
                            <PackageIcon className="h-5 w-5 text-indigo-500" />
                            <span className="font-medium">Model: {consumable.modelNumber || 'N/A'}</span>
                          </div>
                        </div>

                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 bg-slate-50/50 rounded-xl p-4">
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Category</p>
                            <p className="font-medium text-slate-700">{consumable.category}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Total Quantity</p>
                            <p className="font-bold text-xl text-slate-800">{consumable.quantity || 0}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Available</p>
                            <p className="font-bold text-xl text-green-600">{consumable.quantity || 0}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Location</p>
                            <p className="font-medium text-slate-700">{consumable.location || 'N/A'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Manufacturer</p>
                            <p className="font-medium text-slate-700">{consumable.manufacturer || 'N/A'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Purchase Date</p>
                            <p className="font-medium text-slate-700">{formatDate(consumable.purchaseDate)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col lg:items-end gap-4 lg:min-w-[200px]">
                        <Badge 
                          className={`px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                            consumable.status === 'available' 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:shadow-green-200' 
                              : consumable.status === 'in_use' 
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg hover:shadow-blue-200' 
                              : 'bg-gradient-to-r from-gray-500 to-slate-500 text-white shadow-lg'
                          }`}
                        >
                          {consumable.status === 'available' ? '✓ Available' : 
                           consumable.status === 'in_use' ? '⚡ In Use' : 
                           consumable.status}
                        </Badge>
                        <div className="flex gap-3">
                          <Link href={`/consumables/${consumable.id}`}>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-300 transform hover:scale-105"
                            >
                              View Details
                            </Button>
                          </Link>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 transition-all duration-300 transform hover:scale-105"
                            onClick={() => handleAssignConsumable(consumable)}
                            disabled={!consumable.quantity || consumable.quantity <= 0}
                          >
                            Assign
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 animate-in fade-in-0 duration-700">
                <div className="relative mb-8">
                  <CheckCircleIcon className="h-24 w-24 mx-auto text-green-500 animate-pulse" />
                  <div className="absolute inset-0 h-24 w-24 mx-auto rounded-full bg-green-100 animate-ping opacity-20"></div>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">No Consumables Found</h3>
                <p className="text-slate-600 mb-8 text-lg max-w-md mx-auto">
                  Click the "Add Consumable" button above to start tracking your consumable items.
                </p>
                <div className="flex justify-center">
                  <Link href="/">
                    <Button 
                      variant="outline" 
                      className="px-8 py-3 text-lg border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-all duration-300 transform hover:scale-105"
                    >
                      Return to Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assignment Dialog */}
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Consumable</DialogTitle>
              <DialogDescription>
                Assign {selectedConsumable?.name} to a user
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="assignedTo">Assigned To *</Label>
                <Input
                  id="assignedTo"
                  value={assignmentData.assignedTo}
                  onChange={(e) => setAssignmentData({...assignmentData, assignedTo: e.target.value})}
                  placeholder="Enter name or employee ID"
                />
              </div>
              <div>
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={selectedConsumable?.quantity || 1}
                  value={assignmentData.quantity}
                  onChange={(e) => setAssignmentData({...assignmentData, quantity: parseInt(e.target.value) || 1})}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Available: {selectedConsumable?.quantity || 0}
                </p>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={assignmentData.notes}
                  onChange={(e) => setAssignmentData({...assignmentData, notes: e.target.value})}
                  placeholder="Additional notes (optional)"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAssignDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignmentSubmit}
                disabled={assignmentMutation.isPending || !assignmentData.assignedTo.trim()}
              >
                {assignmentMutation.isPending ? 'Assigning...' : 'Assign'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
