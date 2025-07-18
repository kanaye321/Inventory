import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Form schema
const checkoutFormSchema = z.object({
  knoxId: z.string().min(1, {
    message: "Please enter the user's KnoxID",
  }),
  firstName: z.string().min(1, {
    message: "First name is required",
  }),
  lastName: z.string().min(1, {
    message: "Last name is required",
  }),
  expectedCheckinDate: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

interface CheckoutFormProps {
  onSubmit: (values: { 
    userId: number; 
    knoxId?: string;
    firstName?: string;
    lastName?: string;
    expectedCheckinDate?: string 
  }) => void;
  isLoading: boolean;
  assetName: string;
}

export default function CheckoutForm({ 
  onSubmit, 
  isLoading,
  assetName
}: CheckoutFormProps) {
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      knoxId: "",
      firstName: "",
      lastName: "",
      expectedCheckinDate: "",
    },
  });

  const handleSubmit = (values: CheckoutFormValues) => {
    // Here we're using the default admin user ID (1) but tracking 
    // the actual user details in the notes. This allows using KnoxID
    // without creating user accounts.
    onSubmit({
      userId: 1, // Using admin account for all checkouts
      knoxId: values.knoxId,
      firstName: values.firstName,
      lastName: values.lastName,
      expectedCheckinDate: values.expectedCheckinDate,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="p-4 border rounded-md bg-blue-50 mb-4">
          <p className="text-blue-800 font-medium">Asset: {assetName}</p>
        </div>

        <FormField
          control={form.control}
          name="knoxId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>KnoxID*</FormLabel>
              <FormControl>
                <Input placeholder="Enter KnoxID" {...field} />
              </FormControl>
              <FormDescription>
                The user's Knox identification number
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name*</FormLabel>
              <FormControl>
                <Input placeholder="User's first name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name*</FormLabel>
              <FormControl>
                <Input placeholder="User's last name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expectedCheckinDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expected Return Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormDescription>
                Leave blank for indefinite checkout
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Processing..." : "Checkout Asset"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
