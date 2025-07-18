
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConsumableStatus } from "@shared/schema";

// Improved consumable form schema
const consumableFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  category: z.string().min(1, "Category is required").max(50, "Category must be less than 50 characters"),
  quantity: z.number().min(0, "Quantity must be 0 or greater").max(999999, "Quantity must be reasonable"),
  modelNumber: z.string().max(50, "Model number must be less than 50 characters").optional(),
  location: z.string().max(100, "Location must be less than 100 characters").optional(),
  manufacturer: z.string().max(50, "Manufacturer must be less than 50 characters").optional(),
  purchaseDate: z.string().optional(),
  purchaseCost: z.string().optional(),
  status: z.string(),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
});

type ConsumableFormValues = z.infer<typeof consumableFormSchema>;

interface ConsumableFormProps {
  onSubmit: (values: ConsumableFormValues) => void;
  isLoading: boolean;
  defaultValues?: Partial<ConsumableFormValues>;
}

export default function ConsumableForm({ 
  onSubmit, 
  isLoading,
  defaultValues = {
    name: "",
    category: "",
    quantity: 1,
    modelNumber: "",
    location: "",
    manufacturer: "",
    purchaseDate: "",
    purchaseCost: "",
    status: ConsumableStatus.AVAILABLE,
    notes: "",
  }
}: ConsumableFormProps) {
  const form = useForm<ConsumableFormValues>({
    resolver: zodResolver(consumableFormSchema),
    defaultValues,
  });

  const handleSubmit = (values: ConsumableFormValues) => {
    // Clean up empty string values
    const cleanedValues = {
      ...values,
      modelNumber: values.modelNumber?.trim() || undefined,
      location: values.location?.trim() || undefined,
      manufacturer: values.manufacturer?.trim() || undefined,
      purchaseDate: values.purchaseDate?.trim() || undefined,
      purchaseCost: values.purchaseCost?.trim() || undefined,
      notes: values.notes?.trim() || undefined,
    };
    
    onSubmit(cleanedValues);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 animate-in fade-in-0 duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g. USB Cable, Paper, Toner" 
                    {...field} 
                    maxLength={100}
                  />
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
                <FormLabel>Category *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g. Office Supplies, IT Accessories" 
                    {...field} 
                    maxLength={50}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Quantity *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="e.g. 50" 
                    min="0"
                    max="999999"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
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
                <FormLabel>Status *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={ConsumableStatus.AVAILABLE}>Available</SelectItem>
                    <SelectItem value={ConsumableStatus.IN_USE}>In Use</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="modelNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model Number</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g. HP CF280A" 
                    {...field} 
                    maxLength={50}
                  />
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
                  <Input 
                    placeholder="e.g. HP, Canon, Epson" 
                    {...field} 
                    maxLength={50}
                  />
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
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g. Storage Room A, IT Closet" 
                    {...field} 
                    maxLength={100}
                  />
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
                <FormLabel>Purchase Date</FormLabel>
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
                <FormLabel>Purchase Cost</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g. 29.99" 
                    type="number"
                    step="0.01"
                    min="0"
                    {...field} 
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
                  placeholder="Additional notes or comments about this consumable" 
                  className="h-24" 
                  maxLength={500}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-6 border-t border-slate-200">
          <Button 
            type="submit" 
            disabled={isLoading}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-8 py-3 text-lg"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Saving...
              </div>
            ) : (
              "Save Consumable"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
