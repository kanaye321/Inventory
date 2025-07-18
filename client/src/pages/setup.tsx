import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileIcon, DatabaseIcon, UserIcon, CheckCircle2Icon, AlertCircleIcon } from "lucide-react";

// Form schema for admin account setup
const adminSetupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  department: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Form schema for database setup
const databaseSetupSchema = z.object({
  importDemoData: z.boolean().default(true),
  databaseUrl: z.string().optional(),
  customSqlScript: z.string().optional(),
});

type AdminSetupValues = z.infer<typeof adminSetupSchema>;
type DatabaseSetupValues = z.infer<typeof databaseSetupSchema>;

export default function Setup() {
  const [activeTab, setActiveTab] = useState("admin");
  const [adminCompleted, setAdminCompleted] = useState(false);
  const [databaseCompleted, setDatabaseCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  // Admin form
  const adminForm = useForm<AdminSetupValues>({
    resolver: zodResolver(adminSetupSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      email: "",
      department: "",
    }
  });

  // Database form
  const databaseForm = useForm<DatabaseSetupValues>({
    resolver: zodResolver(databaseSetupSchema),
    defaultValues: {
      importDemoData: true,
      databaseUrl: "",
      customSqlScript: "",
    }
  });

  // Handle admin form submission
  const onAdminSubmit = async (data: AdminSetupValues) => {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/setup/admin", {
        username: data.username,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        department: data.department,
        isAdmin: true
      });
      
      toast({
        title: "Admin account created",
        description: "Your administrator account has been created successfully.",
      });
      
      setAdminCompleted(true);
      setActiveTab("database");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create admin account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle database form submission
  const onDatabaseSubmit = async (data: DatabaseSetupValues) => {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/setup/database", {
        importDemoData: data.importDemoData,
        databaseUrl: data.databaseUrl,
        customSqlScript: data.customSqlScript,
      });
      
      toast({
        title: "Database setup complete",
        description: data.importDemoData 
          ? "Database has been set up with demo data." 
          : "Database has been set up successfully.",
      });
      
      setDatabaseCompleted(true);
      setSetupComplete(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set up database. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // When setup is complete, provide option to go to login
  const handleFinish = () => {
    navigate("/");
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-[800px] max-w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">SRPH-MIS Initial Setup</CardTitle>
          <CardDescription>Configure your inventory management system</CardDescription>
        </CardHeader>
        
        <CardContent>
          {setupComplete ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-6">
              <CheckCircle2Icon className="w-16 h-16 text-green-500" />
              <h2 className="text-xl font-bold">Setup Complete!</h2>
              <p className="text-gray-500 text-center mb-4">
                Your SRPH-MIS system has been successfully configured and is ready to use.
              </p>
              <Button onClick={handleFinish}>Go to Login</Button>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="admin" disabled={adminCompleted}>
                  <div className="flex items-center">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Admin Account</span>
                    {adminCompleted && <CheckCircle2Icon className="ml-2 h-4 w-4 text-green-500" />}
                  </div>
                </TabsTrigger>
                <TabsTrigger value="database" disabled={!adminCompleted || databaseCompleted}>
                  <div className="flex items-center">
                    <DatabaseIcon className="mr-2 h-4 w-4" />
                    <span>Database Setup</span>
                    {databaseCompleted && <CheckCircle2Icon className="ml-2 h-4 w-4 text-green-500" />}
                  </div>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="admin">
                <Form {...adminForm}>
                  <form onSubmit={adminForm.handleSubmit(onAdminSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={adminForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={adminForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={adminForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="admin@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={adminForm.control}
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
                    
                    <FormField
                      control={adminForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="admin" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={adminForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={adminForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Creating Admin Account..." : "Create Admin Account"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="database">
                <Form {...databaseForm}>
                  <form onSubmit={databaseForm.handleSubmit(onDatabaseSubmit)} className="space-y-4">
                    <Alert>
                      <AlertCircleIcon className="h-4 w-4" />
                      <AlertTitle>Database Setup</AlertTitle>
                      <AlertDescription>
                        Configure database settings for your SRPH-MIS installation.
                      </AlertDescription>
                    </Alert>
                    
                    <FormField
                      control={databaseForm.control}
                      name="importDemoData"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Import Demo Data</FormLabel>
                            <FormDescription>
                              Populate your database with sample assets, users, and other inventory data for testing.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={databaseForm.control}
                      name="databaseUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Database URL (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="postgres://username:password@hostname:port/database" {...field} />
                          </FormControl>
                          <FormDescription>
                            Leave blank to use the default database configuration.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={databaseForm.control}
                      name="customSqlScript"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custom SQL Script (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="INSERT INTO assets (name, asset_tag, status, category) VALUES ('MacBook Pro', 'A00123', 'available', 'Laptop');" 
                              className="font-mono text-sm" 
                              rows={6}
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Add custom SQL statements to be executed during setup.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Setting Up Database..." : "Complete Database Setup"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <div className="text-sm text-gray-500">
            SRPH-MIS Inventory Management System
          </div>
          <div className="text-sm text-gray-500">
            Version 1.0.0
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}