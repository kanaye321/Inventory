
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Database, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  PlayCircle,
  RefreshCw
} from "lucide-react";

export default function DatabaseInitializationPage() {
  const [initProgress, setInitProgress] = useState(0);
  const [initStatus, setInitStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [initMessages, setInitMessages] = useState<string[]>([]);
  const { toast } = useToast();

  // Database initialization mutation
  const initializeDatabaseMutation = useMutation({
    mutationFn: async () => {
      setInitStatus('running');
      setInitProgress(0);
      setInitMessages([]);

      // Simulate progress updates
      const messages = [
        "Connecting to database...",
        "Checking existing tables...",
        "Creating users table...",
        "Creating assets table...",
        "Creating components table...",
        "Creating accessories table...",
        "Creating consumables table...",
        "Creating licenses table...",
        "Creating license_assignments table...",
        "Creating activities table...",
        "Creating vm_inventory table...",
        "Creating vms table...",
        "Creating consumable_assignments table...",
        "Database initialization completed successfully!"
      ];

      let currentProgress = 0;
      const progressStep = 100 / messages.length;

      for (let i = 0; i < messages.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setInitMessages(prev => [...prev, messages[i]]);
        currentProgress += progressStep;
        setInitProgress(Math.min(currentProgress, 100));
      }

      // Make the actual API call
      const response = await apiRequest('POST', '/api/database/initialize');
      return await response.json();
    },
    onSuccess: (data) => {
      setInitStatus('success');
      toast({
        title: "Database initialized",
        description: "Database has been initialized successfully with all required tables.",
      });
    },
    onError: (error) => {
      setInitStatus('error');
      setInitMessages(prev => [...prev, `Error: ${error.message}`]);
      toast({
        title: "Initialization failed",
        description: "There was an error initializing the database.",
        variant: "destructive",
      });
    }
  });

  const handleReset = () => {
    setInitStatus('idle');
    setInitProgress(0);
    setInitMessages([]);
  };

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <Database className="mr-3 h-8 w-8" />
          Database Initialization
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Initialize Database Tables</CardTitle>
          <CardDescription>
            This will create all required database tables for your SRPH-MIS system including assets, users, licenses, consumables, and more.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {initStatus === 'idle' && (
            <div className="text-center py-8">
              <Database className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Ready to Initialize Database</p>
              <p className="text-muted-foreground mb-6">
                Click the button below to create all required database tables for your application.
              </p>
              <Button 
                onClick={() => initializeDatabaseMutation.mutate()}
                size="lg"
                className="flex items-center"
              >
                <PlayCircle className="mr-2 h-5 w-5" />
                Initialize Database
              </Button>
            </div>
          )}

          {initStatus === 'running' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
                <span className="text-lg font-medium">Initializing Database...</span>
              </div>
              
              <Progress value={initProgress} className="h-3" />
              
              <div className="bg-muted rounded-lg p-4 max-h-60 overflow-y-auto">
                <div className="space-y-1 text-sm font-mono">
                  {initMessages.map((message, index) => (
                    <div key={index} className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      {message}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {initStatus === 'success' && (
            <div className="text-center py-8">
              <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <p className="text-lg font-medium text-green-700 mb-2">Database Initialized Successfully!</p>
              <p className="text-muted-foreground mb-6">
                All database tables have been created and your system is ready to use.
              </p>
              <div className="space-x-3">
                <Button 
                  onClick={handleReset}
                  variant="outline"
                  className="flex items-center"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Initialize Again
                </Button>
                <Button 
                  onClick={() => window.location.href = '/'}
                  className="flex items-center"
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}

          {initStatus === 'error' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Initialization Failed</AlertTitle>
                <AlertDescription>
                  There was an error during database initialization. Please check the logs below and try again.
                </AlertDescription>
              </Alert>

              <div className="bg-muted rounded-lg p-4 max-h-60 overflow-y-auto">
                <div className="space-y-1 text-sm font-mono">
                  {initMessages.map((message, index) => (
                    <div key={index} className="flex items-center">
                      <span className={`${message.startsWith('Error:') ? 'text-red-500' : 'text-green-500'} mr-2`}>
                        {message.startsWith('Error:') ? '✗' : '✓'}
                      </span>
                      {message}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center">
                <Button 
                  onClick={handleReset}
                  variant="outline"
                  className="flex items-center"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            </div>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Database Tables</AlertTitle>
            <AlertDescription>
              This will create the following tables: users, assets, components, accessories, consumables, 
              licenses, license_assignments, activities, vm_inventory, vms, and consumable_assignments.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
