import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { LicenseStatus } from "@shared/schema";

// License form schema with validation
const licenseFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  key: z.string().min(2, "License key is required"),
  seats: z.string().optional(),
  company: z.string().optional(),
  manufacturer: z.string().optional(),
  purchaseDate: z.string().optional(),
  expirationDate: z.string().optional(),
  purchaseCost: z.string().optional(),
  status: z.string(),
  notes: z.string().optional(),
});

type LicenseFormValues = z.infer<typeof licenseFormSchema>;

interface LicenseFormProps {
  onSubmit: (values: LicenseFormValues) => void;
  isLoading: boolean;
  defaultValues?: Partial<LicenseFormValues>;
}

export default function LicenseForm({ 
  onSubmit, 
  isLoading,
  defaultValues = {
    name: "",
    key: "",
    seats: "",
    company: "",
    manufacturer: "",
    purchaseDate: "",
    expirationDate: "",
    purchaseCost: "",
    status: LicenseStatus.UNUSED,
    notes: "",
  }
}: LicenseFormProps) {
  const form = useForm<LicenseFormValues>({
    resolver: zodResolver(licenseFormSchema),
    defaultValues,
  });

  const handleSubmit = (values: LicenseFormValues) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>License Name*</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Windows Server 2022 License" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="key"
            render={({ field }) => (
              <FormItem>
                <FormLabel>License Key*</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. XXXXX-XXXXX-XXXXX-XXXXX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="seats"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Seats/Quantity</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g. 5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Microsoft" {...field} />
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
                  <Input placeholder="e.g. Microsoft" {...field} />
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
            name="expirationDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expiration Date</FormLabel>
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
                  <Input placeholder="e.g. 299.99" {...field} />
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
                    <SelectItem value={LicenseStatus.ACTIVE}>Active</SelectItem>
                    <SelectItem value={LicenseStatus.UNUSED}>Unused</SelectItem>
                    <SelectItem value={LicenseStatus.EXPIRED}>Expired</SelectItem>
                  </SelectContent>
                </Select>
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
                <Textarea placeholder="Additional notes or comments about this license" className="h-24" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save License"}
          </Button>
        </div>
      </form>
    </Form>
  );
}