import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { PlusIcon, SearchIcon, FilterIcon, HardDriveIcon, CheckCircleIcon, Pencil, Trash2, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";

const componentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.string().min(1, "Type is required"),
  serialNumber: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  capacity: z.string().optional(),
  notes: z.string().optional(),
  assignedTo: z.string().optional(),
  status: z.enum(['Returned', 'Borrowed', 'Deployed', 'Permanent']).optional(),
  releasedBy: z.string().optional(),
  returnedTo: z.string().optional(),
  dateReleased: z.string().optional(),
  dateReturned: z.string().optional(),
});

type ComponentFormValues = z.infer<typeof componentSchema>;

type Component = {
  id: number;
  name: string;
  type: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  capacity?: string;
  notes?: string;
  assignedTo?: string;  // KnoxID of the user it's assigned to
  status?: 'Returned' | 'Borrowed' | 'Deployed' | 'Permanent';
  releasedBy?: string;  // Person who released the component
  returnedTo?: string;  // Person who received the returned component
  dateReleased?: string; // Date when component was released
  dateReturned?: string; // Date when component was returned (if not permanent)
};

export default function Components() {
  const [isLoading, setIsLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [viewComponent, setViewComponent] = useState<Component | null>(null);
  const [editComponent, setEditComponent] = useState<Component | null>(null);
  const [components, setComponents] = useState<Component[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<ComponentFormValues>({
    resolver: zodResolver(componentSchema),
    defaultValues: {
      name: "",
      type: "",
      serialNumber: "",
      manufacturer: "",
      model: "",
      capacity: "",
      notes: "",
      assignedTo: "",
      status: undefined,
      releasedBy: "",
      returnedTo: "",
      dateReleased: "",
      dateReturned: "",
    },
  });

  const componentTypes = [
    "CPU",
    "RAM",
    "HDD",
    "SSD",
    "GPU",
    "Power Supply",
    "Motherboard",
    "Network Card",
    "Sound Card",
    "Fan",
    "Other"
  ];

  // Fetch components
  const { data: fetchedComponents, isLoading: isComponentsLoading } = useQuery({
    queryKey: ['/api/components'],
    queryFn: async () => {
      try {
        // For now, simulate API call with in-memory data
        return components;
      } catch (error) {
        console.error('Error fetching components:', error);
        return [];
      }
    }
  });

  // Effect to update components state when data is fetched
  useEffect(() => {
    if (fetchedComponents && fetchedComponents.length > 0) {
      setComponents(fetchedComponents);
    }
  }, [fetchedComponents]);

  // Filter components based on search query
  const filteredComponents = components.filter(component => 
    component.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    component.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (component.manufacturer && component.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Add component mutation
  const addComponentMutation = useMutation({
    mutationFn: async (data: ComponentFormValues) => {
      setIsLoading(true);
      try {
        // Simulate API call for now
        const newComponent: Component = {
          id: components.length + 1,
          name: data.name,
          type: data.type,
          serialNumber: data.serialNumber || '',
          manufacturer: data.manufacturer || '',
          model: data.model || '',
          capacity: data.capacity || '',
          notes: data.notes || '',
          assignedTo: data.assignedTo || '',
          status: data.status,
          releasedBy: data.releasedBy || '',
          returnedTo: data.returnedTo || '',
          dateReleased: data.dateReleased || '',
          dateReturned: data.dateReturned || '',
        };

        // Update local state immediately for better UX
        setComponents(prevComponents => [...prevComponents, newComponent]);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        return newComponent;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: (data) => {
      setIsAddDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/components'] });
      toast({
        title: "Component Added",
        description: `${data.name} has been successfully added.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add component. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Edit component mutation
  const editComponentMutation = useMutation({
    mutationFn: async (data: Component) => {
      setIsLoading(true);
      try {
        // Simulate API call
        const updatedComponent = { ...data };
        
        // Update local state immediately for better UX
        setComponents(prevComponents => 
          prevComponents.map(comp => comp.id === data.id ? updatedComponent : comp)
        );
        
        await new Promise(resolve => setTimeout(resolve, 500));
        return updatedComponent;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: (data) => {
      setIsEditDialogOpen(false);
      setEditComponent(null);
      queryClient.invalidateQueries({ queryKey: ['/api/components'] });
      toast({
        title: "Component Updated",
        description: `${data.name} has been successfully updated.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update component. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Delete component mutation
  const deleteComponentMutation = useMutation({
    mutationFn: async (id: number) => {
      setIsLoading(true);
      try {
        // Simulate API call
        // Update local state immediately for better UX
        setComponents(prevComponents => prevComponents.filter(comp => comp.id !== id));
        
        await new Promise(resolve => setTimeout(resolve, 500));
        return id;
      } finally {
        setIsLoading(false);
      }
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['/api/components'] });
      toast({
        title: "Component Deleted",
        description: `Component has been successfully deleted.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete component. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle form submission for adding a new component
  const onSubmit = (data: ComponentFormValues) => {
    addComponentMutation.mutate(data);
  };

  // Handle edit form submission
  const handleEditSubmit = (data: ComponentFormValues) => {
    if (!editComponent) return;
    
    editComponentMutation.mutate({
      ...editComponent,
      name: data.name,
      type: data.type,
      serialNumber: data.serialNumber,
      manufacturer: data.manufacturer,
      model: data.model,
      capacity: data.capacity,
      notes: data.notes,
      assignedTo: data.assignedTo,
      status: data.status,
      releasedBy: data.releasedBy,
      returnedTo: data.returnedTo,
      dateReleased: data.dateReleased,
      dateReturned: data.dateReturned,
    });
  };

  // Handle component deletion
  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this component?')) {
      deleteComponentMutation.mutate(id);
    }
  };

  // Handle opening the edit dialog
  const handleEditClick = (component: Component) => {
    setEditComponent(component);
    form.reset({
      name: component.name,
      type: component.type,
      serialNumber: component.serialNumber || '',
      manufacturer: component.manufacturer || '',
      model: component.model || '',
      capacity: component.capacity || '',
      notes: component.notes || '',
      assignedTo: component.assignedTo || '',
      status: component.status,
      releasedBy: component.releasedBy || '',
      returnedTo: component.returnedTo || '',
      dateReleased: component.dateReleased || '',
      dateReturned: component.dateReturned || '',
    });
    setIsEditDialogOpen(true);
  };

  // Handle opening the view dialog
  const handleViewClick = (component: Component) => {
    setViewComponent(component);
    setIsViewDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Components</h1>
          <p className="text-sm text-gray-600">Manage internal components like RAM, hard drives, etc.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Component
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search components..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <FilterIcon className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Components Management</CardTitle>
        </CardHeader>
        <CardContent>
          {components.length === 0 ? (
            <div className="text-center py-10">
              <HardDriveIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Components Added Yet</h3>
              <p className="text-gray-500 mb-4">
                Add your first component by clicking the "Add Component" button.
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Component
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Manufacturer</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComponents.map((component) => (
                  <TableRow key={component.id}>
                    <TableCell className="font-medium">{component.name}</TableCell>
                    <TableCell>{component.type}</TableCell>
                    <TableCell>{component.serialNumber || '-'}</TableCell>
                    <TableCell>{component.manufacturer || '-'}</TableCell>
                    <TableCell>{component.assignedTo || '-'}</TableCell>
                    <TableCell>
                      {component.status ? (
                        <Badge 
                          variant="outline"
                          className={
                            component.status === 'Returned' ? 'border-green-500 text-green-500' : 
                            component.status === 'Borrowed' ? 'border-yellow-500 text-yellow-500' : 
                            component.status === 'Deployed' ? 'border-blue-500 text-blue-500' : 
                            component.status === 'Permanent' ? 'border-purple-500 text-purple-500' : ''
                          }
                        >
                          {component.status}
                        </Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleViewClick(component)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(component)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(component.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Component Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="w-[95%] max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Component Details</DialogTitle>
          </DialogHeader>
          {viewComponent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">Name</Label>
                  <p className="font-medium">{viewComponent.name}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Type</Label>
                  <p className="font-medium">{viewComponent.type}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Serial Number</Label>
                  <p className="font-medium">{viewComponent.serialNumber || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Manufacturer</Label>
                  <p className="font-medium">{viewComponent.manufacturer || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Model</Label>
                  <p className="font-medium">{viewComponent.model || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Capacity/Specs</Label>
                  <p className="font-medium">{viewComponent.capacity || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Assigned To (Knox ID)</Label>
                  <p className="font-medium">{viewComponent.assignedTo || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Status</Label>
                  <div className="mt-1">
                    {viewComponent.status ? (
                      <Badge 
                        variant="outline"
                        className={
                          viewComponent.status === 'Returned' ? 'border-green-500 text-green-500' : 
                          viewComponent.status === 'Borrowed' ? 'border-yellow-500 text-yellow-500' : 
                          viewComponent.status === 'Deployed' ? 'border-blue-500 text-blue-500' : 
                          viewComponent.status === 'Permanent' ? 'border-purple-500 text-purple-500' : ''
                        }
                      >
                        {viewComponent.status}
                      </Badge>
                    ) : '-'}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Released By</Label>
                  <p className="font-medium">{viewComponent.releasedBy || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Date Released</Label>
                  <p className="font-medium">{viewComponent.dateReleased || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Returned To</Label>
                  <p className="font-medium">{viewComponent.returnedTo || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Date Returned</Label>
                  <p className="font-medium">{viewComponent.dateReturned || '-'}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Notes</Label>
                <p className="font-medium whitespace-pre-wrap">{viewComponent.notes || '-'}</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setIsViewDialogOpen(false);
                  handleEditClick(viewComponent);
                }}>
                  Edit
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Edit Component Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[95%] max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Component</DialogTitle>
            <DialogDescription>
              Update the details of this component.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name*</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {componentTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="manufacturer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manufacturer</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity/Specs</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <FormField
                  control={form.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned To (Knox ID)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Returned">Returned</SelectItem>
                          <SelectItem value="Borrowed">Borrowed</SelectItem>
                          <SelectItem value="Deployed">Deployed</SelectItem>
                          <SelectItem value="Permanent">Permanent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="releasedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Released By</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Name of person who released the component" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dateReleased"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date Released</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          placeholder="YYYY-MM-DD" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="returnedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Returned To</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Name of person receiving the return" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dateReturned"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date Returned</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          placeholder="YYYY-MM-DD" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update Component"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Add Component Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="w-[95%] max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Component</DialogTitle>
            <DialogDescription>
              Enter the details of the component you want to add to inventory.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="Kingston RAM 8GB" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type*</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {componentTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial Number</FormLabel>
                      <FormControl>
                        <Input placeholder="SN12345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="manufacturer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manufacturer</FormLabel>
                      <FormControl>
                        <Input placeholder="Kingston" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl>
                        <Input placeholder="DDR4-3200" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity/Specs</FormLabel>
                      <FormControl>
                        <Input placeholder="8GB" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned To (Knox ID)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. NP750-12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Returned">Returned</SelectItem>
                          <SelectItem value="Borrowed">Borrowed</SelectItem>
                          <SelectItem value="Deployed">Deployed</SelectItem>
                          <SelectItem value="Permanent">Permanent</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="releasedBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Released By</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Name of person who released the component" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dateReleased"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date Released</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          placeholder="YYYY-MM-DD" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="returnedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Returned To</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Name of person receiving the return" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dateReturned"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date Returned</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          placeholder="YYYY-MM-DD" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes about this component"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Adding..." : "Add Component"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}