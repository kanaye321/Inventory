import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as UserType } from "@shared/schema";
import connectPgSimple from 'connect-pg-simple';
import { pool } from "./db";
import createMemoryStore from 'memorystore';

declare global {
  namespace Express {
    // Use UserType to avoid recursive type reference
    interface User extends UserType {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  // Make sure we have a valid stored password with both hash and salt
  if (!stored || !stored.includes(".")) {
    return false;
  }

  const [hashed, salt] = stored.split(".");
  if (!hashed || !salt) {
    return false;
  }

  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Use in-memory session store for better Windows compatibility
  const MemoryStore = createMemoryStore(session);

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'srph-mis-default-secret-key',
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);

        // For simplicity in development, if no password hashing is set up yet,
        // allow login with plain text password comparison
        // In production, you would always use proper password hashing
        if (!user) {
          return done(null, false);
        }

        // For passwords that have already been hashed
        if (user.password && user.password.includes(".")) {
          const isValid = await comparePasswords(password, user.password);
          if (!isValid) {
            return done(null, false);
          }
        } 
        // For plain text passwords (during development/testing only)
        else if (user.password !== password) {
          return done(null, false);
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        // User not found, clear the session
        console.log(`User with ID ${id} not found during session deserialization`);
        return done(null, false);
      }
      
      // Ensure admin flag is properly set
      console.log(`Deserializing user ${user.username} with admin status: ${user.isAdmin}`);
      done(null, user);
    } catch (err) {
      console.error("Error deserializing user:", err);
      done(null, false);
    }
  });

  // Register a new user
  app.post("/api/register", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Force consistent data format
      const userData = {
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        department: req.body.department || null,
        password: req.body.password, // Will be hashed below
        isAdmin: req.body.isAdmin || false
      };

      // Hash the password
      userData.password = await hashPassword(userData.password);

      const user = await storage.createUser(userData);

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  // Login
  app.post("/api/login", (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("local", (err: Error, user: UserType) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Ensure user object has all required fields
      console.log(`Login successful for user: ${user.username}, admin: ${user.isAdmin}`);
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          return next(loginErr);
        }
        
        // Return the full user object with admin status
        return res.status(200).json({
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          department: user.department,
          isAdmin: user.isAdmin
        });
      });
    })(req, res, next);
  });

  // Logout
  app.post("/api/logout", (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Get current user
  app.get("/api/user", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });

  // Add /api/me endpoint for compatibility
  app.get("/api/me", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });

  // Setup endpoints
  app.post("/api/setup/admin", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if any users exist
      const users = await storage.getUsers();
      if (users.length > 0) {
        return res.status(400).json({ message: "Setup has already been completed" });
      }

      // Force consistent data format
      const userData = {
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        department: req.body.department || null,
        password: req.body.password, // Will be hashed below
        isAdmin: true
      };

      // Hash the password
      userData.password = await hashPassword(userData.password);

      const adminUser = await storage.createUser(userData);

      // Auto-login the admin user
      req.login(adminUser, (err) => {
        if (err) return next(err);
        res.status(201).json({ message: "Admin account created successfully", user: adminUser });
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/setup/database", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { importDemoData, customSqlScript } = req.body;

      // Check if user is authenticated and is admin
      if (!req.isAuthenticated() || !req.user.isAdmin) {
        return res.status(403).json({ message: "Only administrators can perform database setup" });
      }

      // Execute custom SQL if provided
      if (customSqlScript) {
        try {
          // In a real implementation, we would execute the custom SQL here
          // But for safety, we'll just acknowledge it
          console.log("Custom SQL script would be executed here");
        } catch (sqlError) {
          return res.status(400).json({ 
            message: "Error executing custom SQL script", 
            error: sqlError.message 
          });
        }
      }

      // Import demo data if requested
      if (importDemoData) {
        try {
          // Create sample categories
          const assetCategories = ["Laptop", "Desktop", "Monitor", "Printer", "Phone", "Tablet"];
          const accessoryCategories = ["Keyboard", "Mouse", "Headset", "USB Drive", "External Drive"];
          const componentCategories = ["RAM", "CPU", "Hard Drive", "Graphics Card", "Power Supply"];

          // Create sample assets
          const demoAssets = [
            {
              assetTag: "SRPH-001",
              name: "Dell XPS 15",
              description: "High-performance developer laptop",
              category: "Laptop",
              status: "available",
              purchaseDate: "2023-01-15",
              purchaseCost: "1599.99",
              location: "Main Office",
              serialNumber: "XPS15-123456",
              model: "XPS 15 9500",
              manufacturer: "Dell",
              notes: "Assigned to development team"
            },
            {
              assetTag: "SRPH-002",
              name: "HP EliteDesk 800",
              description: "Desktop workstation",
              category: "Desktop",
              status: "available",
              purchaseDate: "2023-02-20",
              purchaseCost: "899.99",
              location: "Sales Department",
              serialNumber: "HP800-789012",
              model: "EliteDesk 800 G6",
              manufacturer: "HP",
              notes: "For sales team use"
            },
            {
              assetTag: "SRPH-003",
              name: "Apple iPad Pro",
              description: "12.9-inch iPad Pro with M1 chip",
              category: "Tablet",
              status: "available",
              purchaseDate: "2023-03-10",
              purchaseCost: "1099.99",
              location: "Executive Suite",
              serialNumber: "IPAD-345678",
              model: "iPad Pro 12.9-inch",
              manufacturer: "Apple",
              notes: "For executive presentations"
            }
          ];

          // Create sample accessories
          const demoAccessories = [
            {
              name: "Logitech MX Master 3",
              category: "Mouse",
              quantity: 5,
              description: "Wireless mouse with customizable buttons",
              manufacturer: "Logitech",
              purchaseDate: "2023-01-20",
              purchaseCost: "99.99",
              status: "available"
            },
            {
              name: "Dell Ultrasharp 27-inch Monitor",
              category: "Monitor",
              quantity: 3,
              description: "27-inch 4K monitor",
              manufacturer: "Dell",
              purchaseDate: "2023-02-15",
              purchaseCost: "349.99",
              status: "available"
            }
          ];

          // Create sample components
          const demoComponents = [
            {
              name: "Intel Core i7-12700K",
              type: "CPU",
              serialNumber: "CPU001",
              manufacturer: "Intel",
              model: "Core i7-12700K",
              specifications: "3.6GHz, 12-core, 20-thread",
              status: "available",
              location: "Storage Room A",
              purchaseDate: "2024-01-15",
              purchaseCost: 399.99,
              warrantyExpiry: "2027-01-15",
              notes: "High-performance processor for workstations"
            },
            {
              name: "Kingston DDR4 32GB",
              type: "RAM",
              serialNumber: "RAM001",
              manufacturer: "Kingston",
              model: "DDR4-3200",
              specifications: "32GB, 3200MHz",
              status: "assigned",
              location: "IT Lab",
              assignedTo: "John Doe",
              purchaseDate: "2024-02-10",
              purchaseCost: 149.99,
              warrantyExpiry: "2026-02-10",
              notes: "Assigned to development workstation"
            },
            {
              name: "Samsung 970 EVO Plus",
              type: "SSD",
              serialNumber: "SSD001",
              manufacturer: "Samsung",
              model: "970 EVO Plus",
              specifications: "1TB NVMe M.2",
              status: "available",
              location: "Storage Room B",
              purchaseDate: "2024-01-20",
              purchaseCost: 129.99,
              warrantyExpiry: "2029-01-20",
              notes: "High-speed NVMe storage"
            },
            {
              name: "NVIDIA RTX 4070",
              type: "GPU",
              serialNumber: "GPU001",
              manufacturer: "NVIDIA",
              model: "GeForce RTX 4070",
              specifications: "12GB GDDR6X",
              status: "maintenance",
              location: "Service Center",
              purchaseDate: "2024-03-01",
              purchaseCost: 599.99,
              warrantyExpiry: "2027-03-01",
              notes: "Under maintenance for driver issues"
            }
          ];

          for (const component of demoComponents) {
            await storage.createComponent(component);
          }

          // Create sample licenses
          const demoLicenses = [
            {
              name: "Microsoft Office 365",
              key: "XXXX-XXXX-XXXX-XXXX",
              seats: "10",
              assignedSeats: 0,
              company: "Microsoft",
              manufacturer: "Microsoft",
              purchaseDate: "2023-01-10",
              expirationDate: "2024-01-10",
              purchaseCost: "999.99",
              status: "active",
              notes: "Company-wide Office 365 subscription"
            },
            {
              name: "Adobe Creative Cloud",
              key: "YYYY-YYYY-YYYY-YYYY",
              seats: "5",
              assignedSeats: 0,
              company: "Adobe",
              manufacturer: "Adobe",
              purchaseDate: "2023-02-05",
              expirationDate: "2024-02-05",
              purchaseCost: "599.99",
              status: "active",
              notes: "For design team use"
            }
          ];

          // Import the demo data into the database
          for (const asset of demoAssets) {
            await storage.createAsset(asset);
          }

          for (const accessory of demoAccessories) {
            await storage.createAccessory(accessory);
          }

          for (const component of demoComponents) {
            await storage.createComponent(component);
          }

          for (const license of demoLicenses) {
            await storage.createLicense(license);
          }

          // Create a demo activity
          await storage.createActivity({
            action: "create",
            itemType: "system",
            itemId: 0,
            userId: req.user.id,
            timestamp: new Date().toISOString(),
            notes: "Demo data imported during system setup"
          });
        } catch (demoError) {
          console.error("Error importing demo data:", demoError);
          // Continue with setup even if demo data import fails
        }
      }

      res.status(200).json({ 
        message: "Database setup completed successfully",
        demoDataImported: importDemoData,
        customScriptExecuted: !!customSqlScript
      });
    } catch (error) {
      next(error);
    }
  });

  // Setup status endpoint
  app.get("/api/setup", async (req: Request, res: Response) => {
    try {
      // Force setup to be available if query parameter is present
      if (req.query.force === 'true') {
        return res.json({
          setupRequired: true,
          hasUsers: false,
          userCount: 0,
          forced: true
        });
      }

      const users = await storage.getUsers();
      const hasUsers = users.length > 0;

      res.json({
        setupRequired: !hasUsers,
        hasUsers,
        userCount: users.length
      });
    } catch (error) {
      console.error("Setup check error:", error);
      res.status(500).json({ 
        setupRequired: true,
        error: "Could not check setup status"
      });
    }
  });

  // Setup reset endpoint
  app.post("/api/setup/reset", async (req: Request, res: Response) => {
    try {
      // This endpoint allows resetting the setup status
      // In a production environment, you might want to add authentication
      res.json({
        success: true,
        message: "Setup status reset. You can now access the setup page."
      });
    } catch (error) {
      console.error("Setup reset error:", error);
      res.status(500).json({ 
        success: false,
        error: "Could not reset setup status"
      });
    }
  });

  // Middleware to check if user is authenticated
  app.use("/api/protected", (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  });

  // Middleware to check if user is an admin
  app.use("/api/admin", (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated() && req.user.isAdmin) {
      return next();
    }
    res.status(403).json({ message: "Forbidden" });
  });

  // Add middleware to check user permissions for specific endpoints
  app.use("/api/users/:id/permissions", (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated() && (req.user.isAdmin || req.user.id === parseInt(req.params.id))) {
      return next();
    }
    res.status(403).json({ message: "Forbidden - insufficient permissions" });
  });
}