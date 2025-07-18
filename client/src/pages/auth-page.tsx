
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EyeIcon, EyeOffIcon, UserIcon, LockIcon, MailIcon, BuildingIcon, UserPlusIcon, LogInIcon, SparklesIcon } from "lucide-react";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [, setLocation] = useLocation();
  const { user, login, logout } = useAuth();
  const { toast } = useToast();

  // Login form state
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register form state
  const [registerData, setRegisterData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    email: "",
    department: "",
  });
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Animation states
  const [isLoaded, setIsLoaded] = useState(false);
  const [floatingElements, setFloatingElements] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsLoaded(true), 100);
    
    // Generate floating elements
    const elements = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
    }));
    setFloatingElements(elements);

    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(loginData),
      });

      if (response.ok) {
        const userData = await response.json();
        login(userData);
        toast({
          title: "Login successful",
          description: `Welcome back, ${userData.firstName || userData.username}!`,
        });
        setLocation('/');
      } else {
        const errorData = await response.json();
        toast({
          title: "Login failed",
          description: errorData.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Registration failed",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setIsRegistering(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: registerData.username,
          password: registerData.password,
          firstName: registerData.firstName,
          lastName: registerData.lastName,
          email: registerData.email,
          department: registerData.department,
        }),
      });

      if (response.ok) {
        const userData = await response.json();
        login(userData);
        toast({
          title: "Registration successful",
          description: `Welcome, ${userData.firstName || userData.username}!`,
        });
        setLocation('/');
      } else {
        const errorData = await response.json();
        toast({
          title: "Registration failed",
          description: errorData.message || "Registration failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  // If user is already logged in, redirect to dashboard
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Floating background elements */}
      {floatingElements.map((element) => (
        <div
          key={element.id}
          className="absolute w-2 h-2 bg-primary/10 rounded-full animate-float"
          style={{
            left: `${element.x}%`,
            top: `${element.y}%`,
            animationDelay: `${element.delay}s`,
            animationDuration: `${4 + Math.random() * 4}s`,
          }}
        />
      ))}
      
      {/* Gradient orbs */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20 animate-pulse" />
      <div className="absolute bottom-20 right-20 w-24 h-24 bg-gradient-to-r from-pink-400 to-orange-400 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className={`max-w-md w-full space-y-8 relative z-10 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-full flex items-center justify-center animate-bounce-gentle shadow-lg backdrop-blur-sm border border-primary/20">
            <BuildingIcon className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <div className="relative">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white relative">
              SRPH-MIS
              <SparklesIcon className="absolute -top-2 -right-8 h-6 w-6 text-primary animate-sparkle" />
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              Management Information System
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              Streamline your asset management workflow
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
                <TabsTrigger value="login" className="flex items-center gap-2 transition-all duration-300 hover:scale-105 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <LogInIcon className="h-4 w-4 transition-transform duration-300" />
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="register" className="flex items-center gap-2 transition-all duration-300 hover:scale-105 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <UserPlusIcon className="h-4 w-4 transition-transform duration-300" />
                  Sign Up
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="space-y-6">
              <TabsContent value="login" className="space-y-4">
                <div className="text-center">
                  <CardTitle className="text-xl">Welcome back</CardTitle>
                  <CardDescription>
                    Sign in to your account to continue
                  </CardDescription>
                </div>
                
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Username
                    </Label>
                    <div className="relative group">
                      <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 transition-all duration-300 group-focus-within:text-primary group-focus-within:scale-110" />
                      <Input
                        id="username"
                        type="text"
                        placeholder="Enter your username"
                        className="pl-10 h-11 border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary focus:shadow-lg transition-all duration-300 hover:shadow-md"
                        value={loginData.username}
                        onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Password
                    </Label>
                    <div className="relative group">
                      <LockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 transition-all duration-300 group-focus-within:text-primary group-focus-within:scale-110" />
                      <Input
                        id="password"
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="pl-10 pr-10 h-11 border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary focus:shadow-lg transition-all duration-300 hover:shadow-md"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-gray-600 transition-all duration-300 hover:scale-110"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                      >
                        {showLoginPassword ? (
                          <EyeOffIcon className="h-4 w-4 transition-transform duration-300" />
                        ) : (
                          <EyeIcon className="h-4 w-4 transition-transform duration-300" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-medium transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
                    disabled={isLoggingIn}
                  >
                    {isLoggingIn ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        <span className="animate-pulse">Signing in...</span>
                      </>
                    ) : (
                      <>
                        <LogInIcon className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                        Sign In
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <div className="text-center">
                  <CardTitle className="text-xl">Create an account</CardTitle>
                  <CardDescription>
                    Get started with your new account
                  </CardDescription>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="John"
                        className="h-11 border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary"
                        value={registerData.firstName}
                        onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Doe"
                        className="h-11 border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary"
                        value={registerData.lastName}
                        onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email Address
                    </Label>
                    <div className="relative">
                      <MailIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="john.doe@company.com"
                        className="pl-10 h-11 border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Department
                    </Label>
                    <div className="relative">
                      <BuildingIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="department"
                        type="text"
                        placeholder="IT Department"
                        className="pl-10 h-11 border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary"
                        value={registerData.department}
                        onChange={(e) => setRegisterData({ ...registerData, department: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="regUsername" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Username
                    </Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="regUsername"
                        type="text"
                        placeholder="Choose a username"
                        className="pl-10 h-11 border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary"
                        value={registerData.username}
                        onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="regPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Password
                    </Label>
                    <div className="relative">
                      <LockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="regPassword"
                        type={showRegisterPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        className="pl-10 pr-10 h-11 border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      >
                        {showRegisterPassword ? (
                          <EyeOffIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <LockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        className="pl-10 pr-10 h-11 border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOffIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-medium"
                    disabled={isRegistering}
                  >
                    {isRegistering ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating account...
                      </>
                    ) : (
                      <>
                        <UserPlusIcon className="mr-2 h-4 w-4" />
                        Create Account
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {/* Footer */}
        <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © 2024 SRPH-MIS. Secure asset management platform.
          </p>
        </div>
      </div>
    </div>
  );
}
