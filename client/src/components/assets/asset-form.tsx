import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AssetCategories, AssetStatus, AssetConditions, insertAssetSchema } from "@shared/schema";

// Extend the schema with validation rules
const assetFormSchema = insertAssetSchema.extend({
  assetTag: z.string().min(2, {
    message: "Asset tag must be at least 2 characters",
  }),
  name: z.string().min(2, {
    message: "Name must be at least 2 characters",
  }),
  category: z.string().min(1, {
    message: "Please select a category",
  }),
  status: z.string().min(1, {
    message: "Please select a status",
  }),
  condition: z.string().min(1, {
    message: "Please select a condition",
  }),
});

type AssetFormValues = z.infer<typeof assetFormSchema>;

interface AssetFormProps {
  onSubmit: (values: AssetFormValues) => void;
  isLoading: boolean;
  defaultValues?: Partial<AssetFormValues>;
}

export default function AssetForm({ 
  onSubmit, 
  isLoading,
  defaultValues = {
    assetTag: "",
    name: "",
    description: "",
    category: AssetCategories.LAPTOP,
    status: AssetStatus.AVAILABLE,
    condition: AssetConditions.GOOD,
    purchaseDate: "",
    purchaseCost: "",
    location: "",
    serialNumber: "",
    model: "",
    manufacturer: "",
    notes: "",
    knoxId: "",
    ipAddress: "",
    macAddress: "",
    osType: "",
    department: "",
  } 
}: AssetFormProps) {
  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues,
  });

  const handleSubmit = (values: AssetFormValues) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="assetTag"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Asset Tag*</FormLabel>
                <FormControl>
                  <Input placeholder="LT-MBP-0023" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name*</FormLabel>
                <FormControl>
                  <Input placeholder="MacBook Pro 16" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category*</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(AssetCategories).map(([key, value]) => (
                      <SelectItem key={key} value={value}>
                        {value}
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
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status*</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(AssetStatus).map(([key, value]) => (
                      <SelectItem key={key} value={value}>
                        {value.charAt(0).toUpperCase() + value.slice(1)}
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
            name="condition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Condition*</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(AssetConditions).map(([key, value]) => (
                      <SelectItem key={key} value={value}>
                        {value}
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
                  <Input placeholder="C02ZF0PXLVDL" {...field} />
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
                  <Input placeholder="A2141" {...field} />
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
                    <FormLabel>Manufacturer <span className="text-gray-400">(Optional)</span></FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

          <FormField
                control={form.control}
                name="purchaseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Date <span className="text-gray-400">(Optional)</span></FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

          <FormField
                control={form.control}
                name="purchaseCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Cost <span className="text-gray-400">(Optional)</span></FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="2500.00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

          <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location <span className="text-gray-400">(Optional)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Head Office" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

          <FormField
            control={form.control}
            name="knoxId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Knox ID</FormLabel>
                <FormControl>
                  <Input placeholder="K12345" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
                control={form.control}
                name="ipAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IP Address <span className="text-gray-400">(Optional)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="192.168.1.100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

          <FormField
                control={form.control}
                name="macAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MAC Address <span className="text-gray-400">(Optional)</span></FormLabel>
                    <FormControl>
                      <Input placeholder="00:1A:2B:3C:4D:5E" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

          <FormField
            control={form.control}
            name="osType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>OS Type</FormLabel>
                <FormControl>
                  <Input placeholder="Windows 10 Pro" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <FormControl>
                  <Input placeholder="IT Department" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Brief description of the asset"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes <span className="text-gray-400">(Optional)</span></FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about the asset"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Asset"}
          </Button>
        </div>
      </form>
    </Form>
  );
}