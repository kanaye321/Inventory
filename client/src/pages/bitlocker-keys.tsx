import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { BitlockerKey } from "@shared/schema";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Plus, Search, TrashIcon, Edit, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Import the page header component we created
import PageHeader from "../components/page-header";

// Define the form schema for adding/editing a Bitlocker key
const formSchema = z.object({
  serialNumber: z
    .string()
    .min(1, "Serial number is required")
    .max(255, "Serial number is too long"),
  identifier: z
    .string()
    .min(1, "Identifier is required")
    .max(255, "Identifier is too long"),
  recoveryKey: z
    .string()
    .min(1, "Recovery key is required")
    .max(255, "Recovery key is too long"),
  assetId: z.string().optional(),
  notes: z.string().optional(),
});

export default function BitlockerKeysPage() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<BitlockerKey | null>(null);
  const [searchType, setSearchType] = useState<"serial" | "identifier">("serial");
  const [searchQuery, setSearchQuery] = useState("");

  // Form for adding a new Bitlocker key
  const addForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serialNumber: "",
      identifier: "",
      recoveryKey: "",
      assetId: "",
      notes: "",
    },
  });

  // Form for editing a Bitlocker key
  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serialNumber: "",
      identifier: "",
      recoveryKey: "",
      assetId: "",
      notes: "",
    },
  });

  // Query for fetching all Bitlocker keys
  const {
    data: keys = [],
    isLoading,
    error,
  } = useQuery<BitlockerKey[]>({
    queryKey: ["/api/bitlocker-keys"],
    queryFn: async () => {
      const res = await fetch("/api/bitlocker-keys");
      if (!res.ok) throw new Error('Failed to fetch Bitlocker keys');
      return res.json();
    },
    enabled: searchQuery === "", // Only fetch all keys when there's no search query
  });

  // Query for searching Bitlocker keys by serial number
  const {
    data: searchResultsSerial,
    isLoading: isSearchingSerial,
  } = useQuery<BitlockerKey[]>({
    queryKey: ["/api/bitlocker-keys/search/serial", searchQuery],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/bitlocker-keys/search/serial/${searchQuery}`);
      return await res.json();
    },
    enabled: searchType === "serial" && searchQuery !== "",
  });

  // Query for searching Bitlocker keys by identifier
  const {
    data: searchResultsIdentifier,
    isLoading: isSearchingIdentifier,
  } = useQuery<BitlockerKey[]>({
    queryKey: ["/api/bitlocker-keys/search/identifier", searchQuery],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/bitlocker-keys/search/identifier/${searchQuery}`);
      return await res.json();
    },
    enabled: searchType === "identifier" && searchQuery !== "",
  });

  // Combine all data sources based on search state
  const displayedKeys = searchQuery !== "" 
    ? (searchType === "serial" ? searchResultsSerial : searchResultsIdentifier) || []
    : keys || [];

  // Mutation for adding a new Bitlocker key
  const addKeyMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const res = await apiRequest("POST", "/api/bitlocker-keys", {
        ...data,
        assetId: data.assetId ? parseInt(data.assetId) : null,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bitlocker-keys"] });
      toast({
        title: "Success",
        description: "Bitlocker key added successfully",
      });
      setIsAddDialogOpen(false);
      addForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add Bitlocker key",
        variant: "destructive",
      });
    },
  });

  // Mutation for updating a Bitlocker key
  const updateKeyMutation = useMutation({
    mutationFn: async (data: { id: number; formData: z.infer<typeof formSchema> }) => {
      const res = await apiRequest("PATCH", `/api/bitlocker-keys/${data.id}`, {
        ...data.formData,
        assetId: data.formData.assetId ? parseInt(data.formData.assetId) : null,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bitlocker-keys"] });
      if (searchQuery) {
        queryClient.invalidateQueries({ queryKey: [`/api/bitlocker-keys/search/${searchType}`, searchQuery] });
      }
      toast({
        title: "Success",
        description: "Bitlocker key updated successfully",
      });
      setIsEditDialogOpen(false);
      setSelectedKey(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update Bitlocker key",
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting a Bitlocker key
  const deleteKeyMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/bitlocker-keys/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bitlocker-keys"] });
      if (searchQuery) {
        queryClient.invalidateQueries({ queryKey: [`/api/bitlocker-keys/search/${searchType}`, searchQuery] });
      }
      toast({
        title: "Success",
        description: "Bitlocker key deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setSelectedKey(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete Bitlocker key",
        variant: "destructive",
      });
    },
  });

  const onAddSubmit = (data: z.infer<typeof formSchema>) => {
    addKeyMutation.mutate(data);
  };

  const onEditSubmit = (data: z.infer<typeof formSchema>) => {
    if (selectedKey) {
      updateKeyMutation.mutate({
        id: selectedKey.id,
        formData: data,
      });
    }
  };

  const handleEditClick = (key: BitlockerKey) => {
    setSelectedKey(key);
    editForm.reset({
      serialNumber: key.serialNumber,
      identifier: key.identifier,
      recoveryKey: key.recoveryKey,
      assetId: key.assetId ? key.assetId.toString() : "",
      notes: key.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleViewClick = (key: BitlockerKey) => {
    setSelectedKey(key);
    setIsViewDialogOpen(true);
  };

  const handleDeleteClick = (key: BitlockerKey) => {
    setSelectedKey(key);
    setIsDeleteDialogOpen(true);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Force refetch the search results when the form is submitted
    if (searchQuery && searchQuery.trim() !== "") {
      if (searchType === "serial") {
        queryClient.invalidateQueries({ queryKey: ["/api/bitlocker-keys/search/serial", searchQuery] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/bitlocker-keys/search/identifier", searchQuery] });
      }
    }
  };

  const isLoading_Search = isSearchingSerial || isSearchingIdentifier;
  const isLoading_All = isLoading || addKeyMutation.isPending || updateKeyMutation.isPending || deleteKeyMutation.isPending;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader
        title="Bitlocker Recovery Keys"
        description="Manage Bitlocker recovery keys for your assets"
      />

      <div className="flex justify-between items-center">
        <form onSubmit={handleSearch} className="flex gap-2 items-center">
          <select
            className="border border-input rounded-md h-10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as "serial" | "identifier")}
          >
            <option value="serial">Serial Number</option>
            <option value="identifier">Identifier</option>
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-60 md:w-80"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

        <Button className="space-x-2" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          <span>Add New Key</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bitlocker Recovery Keys</CardTitle>
          <CardDescription>
            {searchQuery ? `Search results for "${searchQuery}" (${displayedKeys.length} keys found)` : `All Bitlocker keys (${displayedKeys.length} total)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(isLoading_All || isLoading_Search) ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center text-red-500 my-4">
              Error loading Bitlocker keys: {error instanceof Error ? error.message : "Unknown error"}
            </div>
          ) : displayedKeys.length === 0 ? (
            <div className="text-center my-4 text-gray-500">
              {searchQuery ? "No Bitlocker keys match your search criteria" : "No Bitlocker keys available. Add a new key to get started."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Identifier</TableHead>
                    <TableHead>Recovery Key</TableHead>
                    <TableHead>Date Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedKeys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell>{key.serialNumber}</TableCell>
                      <TableCell>{key.identifier}</TableCell>
                      <TableCell>
                        {/* Show only first 5 and last 5 characters for security */}
                        {key.recoveryKey.length > 10 
                          ? `${key.recoveryKey.substring(0, 5)}...${key.recoveryKey.substring(key.recoveryKey.length - 5)}`
                          : key.recoveryKey}
                      </TableCell>
                      <TableCell>
                        {key.dateAdded ? new Date(key.dateAdded).toLocaleDateString() : "N/A"}
                      </TableCell>
                      <TableCell className="text-right flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleViewClick(key)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEditClick(key)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteClick(key)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Key Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Bitlocker Key</DialogTitle>
            <DialogDescription>
              Enter the details for the new Bitlocker recovery key.
            </DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="serialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serial Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter device serial number" {...field} />
                    </FormControl>
                    <FormDescription>
                      The serial number of the device
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Identifier</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter identifier" {...field} />
                    </FormControl>
                    <FormDescription>
                      The identifier for the Bitlocker key (e.g., drive label)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="recoveryKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recovery Key</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter recovery key" {...field} />
                    </FormControl>
                    <FormDescription>
                      The Bitlocker recovery key
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="assetId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset ID (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter asset ID" type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                      Associate with an asset in the inventory
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter additional notes" {...field} />
                    </FormControl>
                    <FormDescription>
                      Any additional information about this recovery key
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={addKeyMutation.isPending}>
                  {addKeyMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Key
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Key Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Bitlocker Key</DialogTitle>
            <DialogDescription>
              Update the details for this Bitlocker recovery key.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="serialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serial Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter device serial number" {...field} />
                    </FormControl>
                    <FormDescription>
                      The serial number of the device
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Identifier</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter identifier" {...field} />
                    </FormControl>
                    <FormDescription>
                      The identifier for the Bitlocker key (e.g., drive label)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="recoveryKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recovery Key</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter recovery key" {...field} />
                    </FormControl>
                    <FormDescription>
                      The Bitlocker recovery key
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="assetId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset ID (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter asset ID" type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                      Associate with an asset in the inventory
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter additional notes" {...field} />
                    </FormControl>
                    <FormDescription>
                      Any additional information about this recovery key
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateKeyMutation.isPending}>
                  {updateKeyMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update Key
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Key Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>View Bitlocker Key</DialogTitle>
            <DialogDescription>
              Full details for this Bitlocker recovery key.
            </DialogDescription>
          </DialogHeader>
          {selectedKey && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium">Serial Number</h4>
                <p className="text-sm">{selectedKey.serialNumber}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium">Identifier</h4>
                <p className="text-sm">{selectedKey.identifier}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium">Recovery Key</h4>
                <p className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded select-all overflow-x-auto">
                  {selectedKey.recoveryKey}
                </p>
              </div>
              {selectedKey.assetId && (
                <div>
                  <h4 className="text-sm font-medium">Asset ID</h4>
                  <p className="text-sm">{selectedKey.assetId}</p>
                </div>
              )}
              {selectedKey.notes && (
                <div>
                  <h4 className="text-sm font-medium">Notes</h4>
                  <p className="text-sm whitespace-pre-wrap">{selectedKey.notes}</p>
                </div>
              )}
              <div>
                <h4 className="text-sm font-medium">Date Added</h4>
                <p className="text-sm">
                  {selectedKey.dateAdded ? 
                    (typeof selectedKey.dateAdded === 'string' ? 
                      new Date(selectedKey.dateAdded).toLocaleString() : 
                      selectedKey.dateAdded.toLocaleString()) 
                    : "N/A"}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium">Last Updated</h4>
                <p className="text-sm">
                  {selectedKey.updatedAt ? 
                    (typeof selectedKey.updatedAt === 'string' ? 
                      new Date(selectedKey.updatedAt).toLocaleString() : 
                      selectedKey.updatedAt.toLocaleString()) 
                    : "N/A"}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              type="button" 
              onClick={() => setIsViewDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this Bitlocker key? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedKey && (
            <div className="py-4">
              <p><strong>Serial Number:</strong> {selectedKey.serialNumber}</p>
              <p><strong>Identifier:</strong> {selectedKey.identifier}</p>
            </div>
          )}
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button"
              variant="destructive" 
              onClick={() => selectedKey && deleteKeyMutation.mutate(selectedKey.id)}
              disabled={deleteKeyMutation.isPending}
            >
              {deleteKeyMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}