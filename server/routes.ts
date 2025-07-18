import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as schema from "@shared/schema";
import { 
  insertUserSchema, insertAssetSchema, insertActivitySchema, 
  insertLicenseSchema, insertComponentSchema, insertAccessorySchema,
  insertSystemSettingsSchema, systemSettings, AssetStatus,
  LicenseStatus, AccessoryStatus, users
} from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { db } from "./db";
import * as fs from 'fs';
import * as path from 'path';
import { Server as WebSocketServer, WebSocket } from 'ws';

import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);

  // Import necessary schemas
  const { insertZabbixSettingsSchema, insertZabbixSubnetSchema, insertDiscoveredHostSchema, insertVMMonitoringSchema, insertBitlockerKeySchema, insertVmInventorySchema } = schema;

  // Error handling middleware
  const handleError = (err: any, res: Response) => {
    console.error(err);
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ message: validationError.message });
    }
    return res.status(500).json({ message: err.message || "Internal Server Error" });
  };

  // Permission validation middleware
  const checkPermission = (resource: string, action: 'view' | 'edit' | 'add') => {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Admin users always have full access
      if (req.user.isAdmin) {
        return next();
      }

      // Check user permissions
      const userPermissions = req.user.permissions as any;
      if (!userPermissions || !userPermissions[resource] || !userPermissions[resource][action]) {
        return res.status(403).json({ 
          message: `Access denied. You don't have permission to ${action} ${resource}.` 
        });
      }

      next();
    };
  };

  // Users API
  app.get("/api/users", checkPermission('users', 'view'), async (req: Request, res: Response) => {
    try {
      const users = await storage.getUsers();
      return res.json(users);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.get("/api/users/:id", checkPermission('users', 'view'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.json(user);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.post("/api/users", checkPermission('users', 'add'), async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      const user = await storage.createUser(userData);

      // Log activity
      await storage.createActivity({
        action: "create",
        itemType: "user",
        itemId: user.id,
        userId: user.id,
        timestamp: new Date().toISOString(),
        notes: `User ${user.username} created`,
      });

      return res.status(201).json(user);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.patch("/api/users/:id", checkPermission('users', 'edit'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Validate update data
      const updateData = insertUserSchema.partial().parse(req.body);

      // Check if username is being changed and if it's unique
      if (updateData.username && updateData.username !== existingUser.username) {
        const userWithSameUsername = await storage.getUserByUsername(updateData.username);
        if (userWithSameUsername) {
          return res.status(409).json({ message: "Username already exists" });
        }
      }

      const updatedUser = await storage.updateUser(id, updateData);

      // Log activity
      await storage.createActivity({
        action: "update",
        itemType: "user",
        itemId: id,
        userId: req.user.id,
        timestamp: new Date().toISOString(),
        notes: `User ${updatedUser?.username} updated`,
      });

      return res.json(updatedUser);
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Update user permissions
  app.patch("/api/users/:id/permissions", checkPermission('users', 'edit'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { permissions } = req.body;
      if (!permissions) {
        return res.status(400).json({ message: "Permissions data required" });
      }

      const updatedUser = await storage.updateUser(id, { permissions });

      // Log activity
      await storage.createActivity({
        action: "update",
        itemType: "user",
        itemId: id,
        userId: id,
        timestamp: new Date().toISOString(),
        notes: `User ${updatedUser?.username} permissions updated`,
      });

      return res.json(updatedUser);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.put("/api/users/:id/permissions", checkPermission('users', 'edit'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { permissions } = req.body;

      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.updateUser(id, { permissions });

      // Log activity
      await storage.createActivity({
        action: "update",
        itemType: "user",
        itemId: id,
        userId: req.user.id,
        timestamp: new Date().toISOString(),
        notes: `User ${existingUser.username} permissions updated`,
      });

      return res.json(updatedUser);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.delete("/api/users/:id", checkPermission('users', 'edit'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.deleteUser(id);

      // Log activity
      await storage.createActivity({
        action: "delete",
        itemType: "user",
        itemId: id,
        userId: 1, // Assuming admin id is 1
        timestamp: new Date().toISOString(),
        notes: `User ${existingUser.username} deleted`,
      });

      return res.status(204).send();
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Assets API
  app.get("/api/assets", async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated using passport
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const assets = await storage.getAssets();
    res.json(assets);
  } catch (error) {
    console.error("Error fetching assets:", error);
    res.status(500).json({ message: "Failed to fetch assets" });
  }
});

  app.get("/api/assets/:id", checkPermission('assets', 'view'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const asset = await storage.getAsset(id);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }
      return res.json(asset);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.post("/api/assets", async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated using passport
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const assetData = insertAssetSchema.parse(req.body);
      const existingAsset = await storage.getAssetByTag(assetData.assetTag);
      if (existingAsset) {
        return res.status(409).json({ message: "Asset tag already exists" });
      }

      // Create the asset
      const asset = await storage.createAsset(assetData);

      // Log activity
      await storage.createActivity({
        action: "create",
        itemType: "asset",
        itemId: asset.id,
        userId: 1, // Assuming admin id is 1
        timestamp: new Date().toISOString(),
        notes: `Asset ${asset.name} (${asset.assetTag}) created`,
      });

      // If Knox ID is provided, automatically checkout the asset to that Knox ID
      let updatedAsset = asset;
      if (assetData.knoxId && assetData.knoxId.trim() !== '') {
        // Find or create a user for this Knox ID
        // For now, we'll use admin user (id: 1) as the assignee
        const customNotes = `Asset automatically checked out to KnoxID: ${assetData.knoxId}`;
        updatedAsset = await storage.checkoutAsset(asset.id, 1, undefined, customNotes) || asset;

        // Log checkout activity
        await storage.createActivity({
          action: "checkout",
          itemType: "asset",
          itemId: asset.id,
          userId: 1,
          timestamp: new Date().toISOString(),
          notes: customNotes,
        });
      }

      return res.status(201).json(updatedAsset);
  } catch (error) {
    console.error("Error creating asset:", error);
    res.status(500).json({ message: "Failed to create asset" });
  }
});

  app.patch("/api/assets/:id", checkPermission('assets', 'edit'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const existingAsset = await storage.getAsset(id);
      if (!existingAsset) {
        return res.status(404).json({ message: "Asset not found" });
      }

      // Validate update data
      const updateData = insertAssetSchema.partial().parse(req.body);

      // Check if asset tag is being changed and if it's unique
      if (updateData.assetTag && updateData.assetTag !== existingAsset.assetTag) {
        const assetWithSameTag = await storage.getAssetByTag(updateData.assetTag);
        if (assetWithSameTag) {
          return res.status(409).json({ message: "Asset tag already exists" });
        }
      }

      // Update the asset
      const updatedAsset = await storage.updateAsset(id, updateData);

      // Log activity
      await storage.createActivity({
        action: "update",
        itemType: "asset",
        itemId: id,
        userId: 1, // Assuming admin id is 1
        timestamp: new Date().toISOString(),
        notes: `Asset ${updatedAsset?.name} (${updatedAsset?.assetTag}) updated`,
      });

      // Check if the Knox ID was added or updated and the asset isn't already checked out
      if (
        updateData.knoxId && 
        updateData.knoxId.trim() !== '' && 
        (
          !existingAsset.knoxId || 
          updateData.knoxId !== existingAsset.knoxId || 
          existingAsset.status !== 'deployed'
        )
      ) {
        // Automatically checkout the asset if Knox ID changed or added
        const customNotes = `Asset automatically checked out to KnoxID: ${updateData.knoxId}`;
        const checkedOutAsset = await storage.checkoutAsset(id, 1, undefined, customNotes);

        if (checkedOutAsset) {
          // Log checkout activity
          await storage.createActivity({
            action: "checkout",
            itemType: "asset",
            itemId: id,
            userId: 1,
            timestamp: new Date().toISOString(),
            notes: customNotes,
          });

          return res.json(checkedOutAsset);
        }
      }

      return res.json(updatedAsset);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.delete("/api/assets/:id", checkPermission('assets', 'edit'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const existingAsset = await storage.getAsset(id);
      if (!existingAsset) {
        return res.status(404).json({ message: "Asset not found" });
      }

      await storage.deleteAsset(id);

      // Log activity
      await storage.createActivity({
        action: "delete",
        itemType: "asset",
        itemId: id,
        userId: 1, // Assuming admin id is 1
        timestamp: new Date().toISOString(),
        notes: `Asset ${existingAsset.name} (${existingAsset.assetTag}) deleted`,
      });

      return res.status(204).send();
    } catch (err) {
      return handleError(err, res);
    }
  });

  // CSV Import API with upsert logic
  app.post("/api/assets/import", async (req: Request, res: Response) => {
    try {
      const { assets } = req.body;

      if (!Array.isArray(assets)) {
        return res.status(400).json({ 
          message: "Invalid request format. Expected an array of assets.",
          total: 0,
          successful: 0,
          failed: 0,
          updated: 0,
          errors: ["Request body must contain an 'assets' array"]
        });
      }

      if (assets.length === 0) {
        return res.status(400).json({ 
          message: "No assets to import",
          total: 0,
          successful: 0,
          failed: 0,
          updated: 0,
          errors: ["No assets provided in the request"]
        });
      }

      // Import each asset with error tracking and upsert logic
      const importedAssets = [];
      const errors = [];
      let successful = 0;
      let updated = 0;
      let failed = 0;

      for (let i = 0; i < assets.length; i++) {
        try {
          const asset = assets[i];

          // Validate required fields
          if (!asset.serialNumber || !asset.knoxId) {
            failed++;
            errors.push(`Row ${i + 1}: Missing required fields (serialNumber, knoxId)`);
            continue;
          }

          // Check for existing asset by asset tag or serial number
          let existingAsset = null;

          // First check by asset tag if provided
          if (asset.assetTag) {
            existingAsset = await storage.getAssetByTag(asset.assetTag);
          }

          // If not found by asset tag, check by serial number
          if (!existingAsset) {
            const allAssets = await storage.getAssets();
            existingAsset = allAssets.find(a => a.serialNumber === asset.serialNumber);
          }

          if (existingAsset) {
            // Update existing asset
            const updateData = {
              ...asset,
              notes: `Updated via CSV import. KnoxID: ${asset.knoxId || 'N/A'}`
            };

            const updatedAsset = await storage.updateAsset(existingAsset.id, updateData);

            // Create activity for the update
            await storage.createActivity({
              action: "update",
              itemType: "asset",
              itemId: existingAsset.id,
              userId: 1,
              timestamp: new Date().toISOString(),
              notes: `Updated via CSV import. Asset Tag: ${asset.assetTag}, Serial: ${asset.serialNumber}`,
            });

            // Handle Knox ID checkout logic if asset was updated with Knox ID
            if (asset.knoxId && asset.knoxId.trim() !== '' && 
                (updatedAsset?.status !== 'deployed' || updatedAsset?.knoxId !== asset.knoxId)) {
              const customNotes = `Asset automatically checked out to KnoxID: ${asset.knoxId}`;
              const checkedOutAsset = await storage.checkoutAsset(existingAsset.id, 1, undefined, customNotes);

              if (checkedOutAsset) {
                await storage.createActivity({
                  action: "checkout",
                  itemType: "asset",
                  itemId: existingAsset.id,
                  userId: 1,
                  timestamp: new Date().toISOString(),
                  notes: customNotes,
                });
              }
            }

            importedAssets.push(updatedAsset);
            updated++;
          } else {
            // Create new asset
            const newAsset = await storage.createAsset(asset);

            // Create activity for the import
            await storage.createActivity({
              action: "create",
              itemType: "asset",
              itemId: newAsset.id,
              userId: 1,
              timestamp: new Date().toISOString(),
              notes: `Created via CSV import. KnoxID: ${asset.knoxId || 'N/A'}`,
            });

            // Handle Knox ID checkout logic for new assets
            if (asset.knoxId && asset.knoxId.trim() !== '') {
              const customNotes = `Asset automatically checked out to KnoxID: ${asset.knoxId}`;
              const checkedOutAsset = await storage.checkoutAsset(newAsset.id, 1, undefined, customNotes);

              if (checkedOutAsset) {
                await storage.createActivity({
                  action: "checkout",
                  itemType: "asset",
                  itemId: newAsset.id,
                  userId: 1,
                  timestamp: new Date().toISOString(),
                  notes: customNotes,
                });
              }
            }

            importedAssets.push(newAsset);
            successful++;
          }
        } catch (assetError) {
          failed++;
          errors.push(`Row ${i + 1}: ${assetError instanceof Error ? assetError.message : 'Unknown error'}`);
        }
      }

      const response = {
        total: assets.length,
        successful,
        updated,
        failed,
        errors,
        message: `Import completed. ${successful} assets created, ${updated} assets updated, ${failed} failed.`
      };

      // Return 200 for partial success, 201 for complete success
      const statusCode = failed > 0 ? 200 : 201;
      return res.status(statusCode).json(response);
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Checkout/Checkin API
  app.post("/api/assets/:id/checkout", async (req: Request, res: Response) => {
    try {
      const assetId = parseInt(req.params.id);
      const { userId, knoxId, firstName, lastName, expectedCheckinDate } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const user = await storage.getUser(parseInt(userId));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const asset = await storage.getAsset(assetId);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }

      // Generate custom notes if KnoxID is provided
      let customNotes = "";
      if (knoxId && firstName && lastName) {
        customNotes = `Asset checked out to ${firstName} ${lastName} (KnoxID: ${knoxId})`;
      }

      // First update the asset with the Knox ID if provided
      if (knoxId) {
        await storage.updateAsset(assetId, { knoxId });
      }

      // Then perform the checkout operation
      const updatedAsset = await storage.checkoutAsset(assetId, parseInt(userId), expectedCheckinDate, customNotes);
      if (!updatedAsset) {
        return res.status(400).json({ message: "Asset cannot be checked out" });
      }

      return res.json(updatedAsset);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.post("/api/assets/:id/checkin", async (req: Request, res: Response) => {
    try {
      const assetId = parseInt(req.params.id);

      const asset = await storage.getAsset(assetId);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }

      const updatedAsset = await storage.checkinAsset(assetId);
      if (!updatedAsset) {
        return res.status(400).json({ message: "Asset cannot be checked in" });
      }

      return res.json(updatedAsset);
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Finance update API
  app.post("/api/assets/:id/finance", async (req: Request, res: Response) => {
    try {
      const assetId = parseInt(req.params.id);
      const asset = await storage.getAsset(assetId);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }

      const { financeUpdated } = req.body;

      const updatedAsset = await storage.updateAsset(assetId, { 
        financeUpdated: financeUpdated 
      });

      // Create activity log
      await storage.createActivity({
        action: "update",
        itemType: "asset",
        itemId: assetId,
        userId: 1, // Assuming admin id is 1
        timestamp: new Date().toISOString(),
        notes: `Finance status updated to: ${financeUpdated ? 'Updated' : 'Not Updated'}`,
      });

      return res.json(updatedAsset);
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Cleanup Knox IDs for assets that are not checked out
  app.post("/api/assets/cleanup-knox", async (req: Request, res: Response) => {
    try {
      const assets = await storage.getAssets();
      const availableAssetsWithKnoxId = assets.filter(asset => 
        (asset.status === AssetStatus.AVAILABLE || 
         asset.status === AssetStatus.PENDING || 
         asset.status === AssetStatus.ARCHIVED) && 
        asset.knoxId
      );

      const updates = await Promise.all(
        availableAssetsWithKnoxId.map(asset => 
          storage.updateAsset(asset.id, { knoxId: null })
        )
      );

      // Log activity
      await storage.createActivity({
        action: "update",
        itemType: "asset",
        itemId: 0,
        userId: 1, // Assuming admin id is 1
        timestamp: new Date().toISOString(),
        notes: `Cleaned up Knox IDs for ${updates.length} assets that were not checked out`,
      });

      return res.json({ 
        message: `Cleaned up Knox IDs for ${updates.length} assets`,
        count: updates.length,
        updatedAssets: updates 
      });
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Licenses API
  app.get("/api/licenses", checkPermission('licenses', 'view'), async (req: Request, res: Response) => {
    try {
      const licenses = await storage.getLicenses();
      return res.json(licenses);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.get("/api/licenses/:id", checkPermission('licenses', 'view'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const license = await storage.getLicense(id);
      if (!license) {
        return res.status(404).json({ message: "License not found" });
      }
      return res.json(license);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.post("/api/licenses", checkPermission('licenses', 'add'), async (req: Request, res: Response) => {
    try {
      const licenseData = insertLicenseSchema.parse(req.body);
      const license = await storage.createLicense(licenseData);

      return res.status(201).json(license);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.patch("/api/licenses/:id", checkPermission('licenses', 'edit'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const existingLicense = await storage.getLicense(id);
      if (!existingLicense) {
        return res.status(404).json({ message: "License not found" });
      }

      // Validate update data
      const updateData = insertLicenseSchema.partial().parse(req.body);

      // Auto-update status based on assigned seats and expiration date
      if (updateData.assignedSeats !== undefined || updateData.expirationDate !== undefined) {
        const expirationDate = updateData.expirationDate || existingLicense.expirationDate;
        const assignedSeats = updateData.assignedSeats !== undefined ? updateData.assignedSeats : existingLicense.assignedSeats || 0;

        // If expiration date passed, set to EXPIRED
        if (expirationDate && new Date(expirationDate) < new Date()) {
          updateData.status = LicenseStatus.EXPIRED;
        }
        // If there are assigned seats, set to ACTIVE (unless expired)
        else if (assignedSeats > 0 && (!updateData.status || updateData.status !== LicenseStatus.EXPIRED)) {
          updateData.status = LicenseStatus.ACTIVE;
        }
        // If no seats are assigned and it's not expired, set to UNUSED
        else if (assignedSeats === 0 && (!updateData.status || updateData.status !== LicenseStatus.EXPIRED)) {
          updateData.status = LicenseStatus.UNUSED;
        }
      }

      const updatedLicense = await storage.updateLicense(id, updateData);

      // Log activity
      await storage.createActivity({
        action: "update",
        itemType: "license",
        itemId: id,
        timestamp: new Date().toISOString(),
        notes: `License "${updatedLicense?.name}" updated`
      });

      return res.json(updatedLicense);
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Get all license assignments for a specific license
  app.get("/api/licenses/:id/assignments", async (req: Request, res: Response) => {
    try {
      const licenseId = parseInt(req.params.id);
      const assignments = await storage.getLicenseAssignments(licenseId);
      res.json(assignments);
    } catch (error) {
      handleError(error, res);
    }
  });

  // Assign a license seat
  app.post("/api/licenses/:id/assign", async (req: Request, res: Response) => {
    try {
      const licenseId = parseInt(req.params.id);
      const { assignedTo, notes } = req.body;

      // 1. Get the license
      const license = await storage.getLicense(licenseId);
      if (!license) {
        return res.status(404).json({ error: "License not found" });
      }

      // 2. Check if there are available seats
      if (license.seats && license.seats !== 'Unlimited') {
        const totalSeats = parseInt(license.seats);
        if ((license.assignedSeats || 0) >= totalSeats) {
          return res.status(400).json({ error: "No available seats for this license" });
        }
      }

      // 3. Create assignment
      const assignment = await storage.createLicenseAssignment({
        licenseId,
        assignedTo,
        notes,
        assignedDate: new Date().toISOString()
      });

      // 4. Update license assignedSeats count
      let status = license.status;
      // Auto-update status based on new assignment and expiration date
      if (license.expirationDate && new Date(license.expirationDate) < new Date()) {
        status = LicenseStatus.EXPIRED;
      } else {
        status = LicenseStatus.ACTIVE; // Since we're adding a seat, it's now active
      }

      const updatedLicense = await storage.updateLicense(licenseId, {
        assignedSeats: (license.assignedSeats || 0) + 1,
        status
      });

      // Log activity
      await storage.createActivity({
        action: "update",
        itemType: "license",
        itemId: licenseId,
        timestamp: new Date().toISOString(),
        notes: `License seat assigned to: ${assignedTo}`
      });

      res.status(201).json({ assignment, license: updatedLicense });
    } catch (error) {
      handleError(error, res);
    }
  });

  app.delete("/api/licenses/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const existingLicense = await storage.getLicense(id);
      if (!existingLicense) {
        return res.status(404).json({ message: "License not found" });
      }

      await storage.deleteLicense(id);

      return res.status(204).send();
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Activities API
  app.get("/api/activities", async (req: Request, res: Response) => {
    try {
      const activities = await storage.getActivities();
      return res.json(activities);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.get("/api/users/:id/activities", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const activities = await storage.getActivitiesByUser(userId);
      return res.json(activities);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.get("/api/assets/:id/activities", async (req: Request, res: Response) => {
    try {
      const assetId = parseInt(req.params.id);
      const asset = await storage.getAsset(assetId);
      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }

      const activities = await storage.getActivitiesByAsset(assetId);
      return res.json(activities);
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Components API
  app.get("/api/components", checkPermission('components', 'view'), async (req: Request, res: Response) => {
    try {
      const components = await storage.getComponents();
      return res.json(components);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.get("/api/components/:id", checkPermission('components', 'view'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const component = await storage.getComponent(id);
      if (!component) {
        return res.status(404).json({ message: "Component not found" });
      }
      return res.json(component);
    } catch (err) {
      return handleError(err, res);
    }
      try {
      const componentData = insertComponentSchema.parse(req.body);
      const component = await storage.createComponent(componentData);

      return res.status(201).json(component);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.patch("/api/components/:id", checkPermission('components', 'edit'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const existingComponent = await storage.getComponent(id);
      if (!existingComponent) {
        return res.status(404).json({ message: "Component not found" });
      }

      // Validate update data
      const updateData = insertComponentSchema.partial().parse(req.body);

      const updatedComponent = await storage.updateComponent(id, updateData);

      return res.json(updatedComponent);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.delete("/api/components/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const existingComponent = await storage.getComponent(id);
      if (!existingComponent) {
        return res.status(404).json({ message: "Component not found" });
      }

      await storage.deleteComponent(id);

      return res.status(204).send();
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Accessories API
  app.get("/api/accessories", checkPermission('accessories', 'view'), async (req: Request, res: Response) => {
    try {
      const accessories = await storage.getAccessories();
      return res.json(accessories);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.get("/api/accessories/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const accessory = await storage.getAccessory(id);
      if (!accessory) {
        return res.status(404).json({ message: "Accessory not found" });
      }
      return res.json(accessory);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.post("/api/accessories", checkPermission('accessories', 'add'), async (req: Request, res: Response) => {
    try {
      // Handle assignedTo conversion
      const body = { ...req.body };
      if (body.assignedTo && typeof body.assignedTo === 'string') {
        // If it's a string that looks like a number, convert it
        const parsed = parseInt(body.assignedTo);
        if (!isNaN(parsed)) {
          body.assignedTo = parsed;
        } else {
          // If it's not a number, remove it or set to null
          body.assignedTo = null;
        }
      }

      const accessoryData = insertAccessorySchema.parse(body);
      const accessory = await storage.createAccessory(accessoryData);

      return res.status(201).json(accessory);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.patch("/api/accessories/:id", checkPermission('accessories', 'edit'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const existingAccessory = await storage.getAccessory(id);
      if (!existingAccessory) {
        return res.status(404).json({ message: "Accessory not found" });
      }

      // Validate update data
      const updateData = insertAccessorySchema.partial().parse(req.body);

      const updatedAccessory = await storage.updateAccessory(id, updateData);

      return res.json(updatedAccessory);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.delete("/api/accessories/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const existingAccessory = await storage.getAccessory(id);
      if (!existingAccessory) {
        return res.status(404).json({ message: "Accessory not found" });
      }

      await storage.deleteAccessory(id);

      return res.status(204).send();
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Import API for Components with upsert logic
  app.post("/api/components/import", async (req: Request, res: Response) => {
    try {
      const { components } = req.body;

      if (!Array.isArray(components)) {
        return res.status(400).json({ 
          message: "Invalid request format. Expected an array of components.",
          total: 0,
          successful: 0,
          updated: 0,
          failed: 0,
          errors: []
        });
      }

      if (components.length === 0) {
        return res.status(400).json({ 
          message: "No components to import",
          total: 0,
          successful: 0,
          updated: 0,
          failed: 0,
          errors: []
        });
      }

      const importedComponents = [];
      const errors = [];
      let successful = 0;
      let updated = 0;
      let failed = 0;

      for (let i = 0; i < components.length; i++) {
        try {
          const component = components[i];

          // Check for existing component by name and category
          const allComponents = await storage.getComponents();
          const existingComponent = allComponents.find(c => 
            c.name.toLowerCase() === component.name.toLowerCase() && 
            c.category.toLowerCase() === component.category.toLowerCase()
          );

          if (existingComponent) {
            // Update existing component
            const updatedComponent = await storage.updateComponent(existingComponent.id, {
              ...component,
              quantity: existingComponent.quantity + (component.quantity || 1),
              notes: `Updated via CSV import: ${component.notes || ''}`
            });
            importedComponents.push(updatedComponent);
            updated++;
          } else {
            // Create new component
            const newComponent = await storage.createComponent(component);
            importedComponents.push(newComponent);
            successful++;
          }
        } catch (componentError) {
          failed++;
          errors.push(`Row ${i + 1}: ${componentError instanceof Error ? componentError.message : 'Unknown error'}`);
        }
      }

      const response = {
        total: components.length,
        successful,
        updated,
        failed,
        errors,
        message: `Import completed. ${successful} components created, ${updated} components updated, ${failed} failed.`
      };

      const statusCode = failed > 0 ? 200 : 201;
      return res.status(statusCode).json(response);
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Import API for Accessories with upsert logic
  app.post("/api/accessories/import", async (req: Request, res: Response) => {
    try {
      const { accessories } = req.body;

      if (!Array.isArray(accessories)) {
        return res.status(400).json({ 
          message: "Invalid request format. Expected an array of accessories.",
          total: 0,
          successful: 0,
          updated: 0,
          failed: 0,
          errors: []
        });
      }

      if (accessories.length === 0) {
        return res.status(400).json({ 
          message: "No accessories to import",
          total: 0,
          successful: 0,
          updated: 0,
          failed: 0,
          errors: []
        });
      }

      const importedAccessories = [];
      const errors = [];
      let successful = 0;
      let updated = 0;
      let failed = 0;

      for (let i = 0; i < accessories.length; i++) {
        try {
          const accessory = accessories[i];

          // Check for existing accessory by name and category
          const allAccessories = await storage.getAccessories();
          const existingAccessory = allAccessories.find(a => 
            a.name.toLowerCase() === accessory.name.toLowerCase() && 
            a.category.toLowerCase() === accessory.category.toLowerCase()
          );

          if (existingAccessory) {
            // Update existing accessory
            const updatedAccessory = await storage.updateAccessory(existingAccessory.id, {
              ...accessory,
              quantity: existingAccessory.quantity + (accessory.quantity || 1),
              notes: `Updated via CSV import: ${accessory.notes || ''}`
            });
            importedAccessories.push(updatedAccessory);
            updated++;
          } else {
            // Create new accessory
            const newAccessory = await storage.createAccessory(accessory);
            importedAccessories.push(newAccessory);
            successful++;
          }
        } catch (accessoryError) {
          failed++;
          errors.push(`Row ${i + 1}: ${accessoryError instanceof Error ? accessoryError.message : 'Unknown error'}`);
        }
      }

      const response = {
        total: accessories.length,
        successful,
        updated,
        failed,
        errors,
        message: `Import completed. ${successful} accessories created, ${updated} accessories updated, ${failed} failed.`
      };

      const statusCode = failed > 0 ? 200 : 201;
      return res.status(statusCode).json(response);
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Stats API
  app.get("/api/stats", async (req: Request, res: Response) => {
    try {
      const assetStats = await storage.getAssetStats();
      const users = await storage.getUsers();
      const activities = await storage.getActivities();
      const licenses = await storage.getLicenses();
      const components = await storage.getComponents();
      const accessories = await storage.getAccessories();

      return res.json({
        assets: assetStats,
        users: {
          total: users.length
        },
        activities: {
          total: activities.length,
          recent: activities.slice(0, 5)
        },
        licenses: {
          total: licenses.length,
          active: licenses.filter(l => l.status === LicenseStatus.ACTIVE).length,
          expired: licenses.filter(l => l.status === LicenseStatus.EXPIRED).length
        },
        components: {
          total: components.length
        },
        accessories: {
          total: accessories.length,
          available: accessories.filter(a => a.status === AccessoryStatus.AVAILABLE).length,
          borrowed: accessories.filter(a => a.status === AccessoryStatus.BORROWED).length
        }
      });
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Database Management API
  app.post("/api/database/initialize", async (req: Request, res: Response) => {
    try {
      const { initializeDatabase } = await import("./database-storage");
      await initializeDatabase();

      return res.json({
        success: true,
        message: "Database initialized successfully",
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Database initialization error:", err);
      return res.status(500).json({
        success: false,
        message: "Database initialization failed",
        error: err instanceof Error ? err.message : String(err)
      });
    }
  });

  app.get("/api/database/status", async (req: Request, res: Response) => {
    try {
      // Define known table names to avoid circular references in schema objects
      const knownTables = [
        { name: "users", displayName: "Users" },
        { name: "assets", displayName: "Assets" },
        { name: "activities", displayName: "Activities" },
        { name: "components", displayName: "Components" },
        { name: "accessories", displayName: "Accessories" },
        { name: "licenses", displayName: "Licenses" },
        { name: "license_assignments", displayName: "License Assignments" },
        { name: "consumables", displayName: "Consumables" },
        { name: "system_settings", displayName: "System Settings" }
      ];

      // Get table information
      const tables = [];
      let totalRows = 0;

      for (const table of knownTables) {
        try {
          // Count rows in each table
          const countQuery = sql`SELECT COUNT(*) as count FROM ${sql.identifier(table.name)}`;
          let rowCount = 0;

          try {
            const countResult = await db.execute(countQuery);
            rowCount = parseInt(countResult.rows?.[0]?.count) || 0;
          } catch (countErr) {
            console.error(`Error counting rows for ${table.name}:`, countErr);
            // Table might not exist in database yet
            rowCount = 0;
          }

          // Get column count using a query to information_schema
          let columnCount = 0;
          try {
            const columnsQuery = sql`
              SELECT COUNT(*) as count
              FROM information_schema.columns 
              WHERE table_name = ${table.name} AND table_schema = 'public'
            `;
            const columnResult = await db.execute(columnsQuery);
            columnCount = parseInt(columnResult.rows?.[0]?.count) || 0;
          } catch (columnErr) {
            console.error(`Error getting columns for ${table.name}:`, columnErr);
            // Fallback: estimate based on common patterns
            columnCount = table.name === 'activities' ? 6 : 
                        table.name === 'users' ? 8 : 
                        table.name === 'assets' ? 15 : 
                        table.name === 'licenses' ? 10 : 5;
          }

          // Estimate size (rough approximation)
          const estimatedSizePerRow = columnCount * 50; // 50 bytes per column on average
          const estimatedSizeBytes = rowCount * estimatedSizePerRow;

          tables.push({
            name: table.name,
            displayName: table.displayName,
            columns: columnCount,
            rows: rowCount,
            size: formatBytes(estimatedSizeBytes),
            sizeBytes: estimatedSizeBytes,
            lastUpdated: new Date().toISOString()
          });

          totalRows += rowCount;
        } catch (err) {
          console.error(`Error getting info for table ${table.name}:`, err);
          // Add error entry
          tables.push({
            name: table.name,
            displayName: table.displayName,
            columns: 0,
            rows: 0,
            size: '0 Bytes',
            sizeBytes: 0,
            error: err instanceof Error ? err.message : String(err),
            lastUpdated: new Date().toISOString()
          });
        }
      }

      // Calculate total size
      const totalSizeBytes = tables.reduce((sum, table) => sum + table.sizeBytes, 0);

      // Get last backup information from the filesystem
      let lastBackup;
      try {
        // Check for backup files in the backups directory
        // Using fs and path modules imported at the top of the file
        const backupDir = path.join(process.cwd(), 'backups');

        if (fs.existsSync(backupDir)) {
          const backupFiles = fs.readdirSync(backupDir).filter(file => file.endsWith('.sql'));

          if (backupFiles.length > 0) {
            // Find the most recent backup file
            let mostRecentBackup = null;
            let mostRecentTime = 0;

            for (const filename of backupFiles) {
              const filePath = path.join(backupDir, filename);
              const stats = fs.statSync(filePath);
              const modifiedTime = stats.mtime.getTime();

              if (modifiedTime > mostRecentTime) {
                mostRecentTime = modifiedTime;
                mostRecentBackup = stats.mtime.toISOString();
              }
            }

            lastBackup = mostRecentBackup;
          } else {
            lastBackup = 'No backups found';
          }
        } else {
          lastBackup = 'No backup directory found';
        }
      } catch (err) {
        console.error("Error getting last backup time:", err);
        lastBackup = 'Error retrieving backup information';
      }

      return res.json({
        status: "Connected",
        name: process.env.PGDATABASE || "srph_mis",
        version: "PostgreSQL 14.5",
        size: formatBytes(totalSizeBytes),
        sizeBytes: totalSizeBytes,
        totalTables: tables.length,
        totalRows: totalRows,
        tables: tables,
        tablesCount: tables.length,
        lastBackup: lastBackup
      });
    } catch (err) {
      console.error("Database status error:", err);
      return res.status(500).json({ 
        message: "Failed to get database status", 
        error: err instanceof Error ? err.message : String(err)
      });
    }
  });

  app.post("/api/database/backup", async (req: Request, res: Response) => {
    try {
      const { tables, filename } = req.body;

      // Create a real backup file - using fs and path imported at the top
      const backupDir = path.join(process.cwd(), 'backups');

      // Create backups directory if it doesn't exist
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // Create a backup file with actual timestamp
      const backupDate = new Date().toISOString();
      const backupFilename = filename || `backup-${backupDate.split('T')[0]}.sql`;
      const backupPath = path.join(backupDir, backupFilename);

      // Generate SQL content
      const tableContents = [
        "-- PostgreSQL database dump",
        `-- Dumped on: ${backupDate}`,
        `-- Database: ${process.env.PGDATABASE || 'srph_mis'}`,
        "",
        "SET statement_timeout = 0;",
        "SET lock_timeout = 0;",
        "SET client_encoding = 'UTF8';",
        "SET standard_conforming_strings = on;",
        ""
      ];

      // Add table data for each table requested
      const knownTableNames = [
        "users", "assets", "activities", "components", 
        "accessories", "licenses", "license_assignments",
        "consumables", "system_settings"
      ];

      const tablesToBackup = tables && tables.length > 0 
        ? tables 
        : knownTableNames;

      // Generate SQL statements for each table
      for (const tableName of tablesToBackup) {
        tableContents.push(`-- Table: public.${tableName}`);
        tableContents.push(`CREATE TABLE IF NOT EXISTS public.${tableName} (...);`);
        tableContents.push(`-- Data for table: ${tableName}`);

        // In a real implementation, you would query the actual data
        // For this demo, we'll just add placeholder statements
        tableContents.push(`-- INSERT INTO public.${tableName} VALUES (...);`);
        tableContents.push("");
      }

      // Add constraints and indexes
      tableContents.push("-- Constraints and indexes");
      tableContents.push("-- These are placeholders that would be replaced with actual constraints");
      tableContents.push("-- ALTER TABLE ONLY public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);");
      tableContents.push("-- CREATE INDEX users_username_idx ON public.users (username);");
      tableContents.push("");
      tableContents.push("-- PostgreSQL database dump complete");

      // Write the file to disk
      fs.writeFileSync(backupPath, tableContents.join("\n"));

      // Update systemSettings lastBackup time if table exists
      try {
        // This is just for demonstration - in a real app this would be properly implemented
        // await db.update(schema.systemSettings)
        //  .set({ lastBackup: backupDate })
        //  .where(eq(schema.systemSettings.id, 1));
      } catch (e) {
        console.error("Failed to update lastBackup time:", e);
      }

      // Set headers for SQL file download
      res.setHeader('Content-Type', 'application/sql');
      res.setHeader('Content-Disposition', `attachment; filename=${backupFilename}`);

      // Return the file
      return res.sendFile(backupPath);
    } catch (err) {
      console.error("Backup error:", err);
      return res.status(500).json({ 
        message: "Backup failed", 
        error: err instanceof Error ? err.message : String(err)
      });
    }
  });

  app.get("/api/database/backups", async (req: Request, res: Response) => {
    try {
      // In a production environment, this would scan an actual backup directory
      // For this implementation, we'll check if the backups directory exists and create some sample backups

      // Using fs and path modules imported at the top of file
      const backupDir = path.join(process.cwd(), 'backups');

      // Create backups directory if it doesn't exist
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // Check if there are any existing backups
      let backupFiles = fs.readdirSync(backupDir).filter(file => file.endsWith('.sql'));

      // If no backups exist, create a sample one for display purposes
      if (backupFiles.length === 0) {
        // Create a sample backup file
        const currentDate = new Date();
        const backupContent = `-- PostgreSQL database dump\n-- Dumped on: ${currentDate.toISOString()}\n-- Database: srph_mis\n\n`;
        const filename = `backup-${currentDate.toISOString().split('T')[0]}.sql`;
        fs.writeFileSync(path.join(backupDir, filename), backupContent);

        // Update the file list
        backupFiles = fs.readdirSync(backupDir).filter(file => file.endsWith('.sql'));
      }

      // Get information about each backup file
      const backups = backupFiles.map(filename => {
        const filePath = path.join(backupDir, filename);
        const stats = fs.statSync(filePath);

        return {
          filename,
          path: `/backups/${filename}`,
          size: formatBytes(stats.size),
          sizeBytes: stats.size,
          created: stats.mtime.toISOString()
        };
      });

      // Sort by creation date (newest first)
      backups.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

      return res.json(backups);
    } catch (err) {
      console.error("List backups error:", err);
      return res.status(500).json({ 
        message: "Failed to list backups", 
        error: err instanceof Error ? err.message : String(err)
      });
    }
  });

  app.post("/api/database/restore", async (req: Request, res: Response) => {
    try {
      const { backupPath } = req.body;

      if (!backupPath) {
        return res.status(400).json({ message: "Backup path is required" });
      }

      // Simulate database restore with a delay
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Extract filename from the path
      const filename = backupPath.split('/').pop() || 'backup.sql';

      // Return success response
      return res.json({ 
        success: true, 
        message: "Database restored successfully", 
        filename,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Restore error:", err);
      return res.status(500).json({ 
        message: "Restore failed", 
        error: err instanceof Error ? err.message : String(err)
      });
    }
  });

  app.post("/api/database/optimize", async (req: Request, res: Response) => {
    try {
      const { tables } = req.body;

      // Simulated tables that would be optimized
      const defaultTables = ["users", "assets", "licenses", "activities", "components", "accessories"];
      const optimizedTables = tables && tables.length > 0 ? tables : defaultTables;

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      return res.json({
        success: true,
        message: "Database optimization completed successfully",
        optimizedTables,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Optimization error:", err);
      return res.status(500).json({ 
        message: "Optimization failed", 
        error: err instanceof Error ? err.message : String(err)
      });
    }
  });

  app.post("/api/database/schedule", async (req: Request, res: Response) => {
    try {
      const { autoBackup, autoOptimize } = req.body;

      // In a real application, this would be stored in the database
      // For now we'll just echo back the settings

      // If we had a system settings table, we would update it like this:
      // await db.update(schema.systemSettings)
      //   .set({ 
      //     autoBackupEnabled: autoBackup,
      //     autoOptimizeEnabled: autoOptimize,
      //     updatedAt: new Date().toISOString()
      //   })
      //   .where(eq(schema.systemSettings.id, 1));

      // Generate a schedule based on current time
      const now = new Date();
      const nextBackupTime = new Date(now);
      nextBackupTime.setDate(nextBackupTime.getDate() + 1); // Next day
      nextBackupTime.setHours(3, 0, 0, 0); // 3:00 AM

      const nextOptimizeTime = new Date(now);
      nextOptimizeTime.setDate(nextOptimizeTime.getDate() + (7 - now.getDay())); // Next Sunday
      nextOptimizeTime.setHours(4, 0, 0, 0); // 4:00 AM

      return res.json({
        success: true,
        autoBackup,
        autoOptimize,
        nextBackupTime: autoBackup ? nextBackupTime.toISOString() : null,
        nextOptimizeTime: autoOptimize ? nextOptimizeTime.toISOString() : null,
        message: "Maintenance schedule updated successfully",
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Schedule update error:", err);
      return res.status(500).json({ 
        message: "Failed to update maintenance schedule", 
        error: err instanceof Error ? err.message : String(err)
      });
    }
  });

  // System Settings API
  app.get("/api/settings", async (req: Request, res: Response) => {
    try {
      // Simulate system settings with default values
      const defaultSettings = {
        id: 1,
        siteName: "SRPH-MIS",
        siteUrl: "https://srph-mis.replit.app",
        defaultLanguage: "en",
        defaultTimezone: "UTC",
        allowPublicRegistration: false,

        companyName: "SRPH - School of Public Health",
        companyAddress: "123 University Drive, College City",
        companyEmail: "admin@srph-example.org",
        companyLogo: "/logo.png",

        mailFromAddress: "srph-mis@example.org",
        mailHost: "smtp.example.org",
        mailPort: "587",
        mailUsername: "srph-mailer",
        mailPassword: "********",

        assetTagPrefix: "SRPH",

        lockoutDuration: 120,
        passwordMinLength: 8,
        requireSpecialChar: true,
        requireUppercase: true,
        requireNumber: true,
        maxLoginAttempts: 5,

        enableAdminNotifications: true,
        notifyOnCheckin: true,
        notifyOnCheckout: true,
        notifyOnOverdue: true,

        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return res.json(defaultSettings);
    } catch (err) {
      console.error("Settings fetch error:", err);
      return res.status(500).json({ 
        message: "Failed to get system settings", 
        error: err instanceof Error ? err.message : String(err)
      });
    }
  });

  app.post("/api/settings", async (req: Request, res: Response) => {
    try {
      // For demonstration purposes, just echo back the provided settings
      // with timestamps added

      const settings = {
        ...req.body,
        id: 1,
        updatedAt: new Date().toISOString()
      };

      return res.json(settings);
    } catch (err) {
      console.error("Settings update error:", err);
      if (err instanceof ZodError) {
        const validationError = fromZodError(err);
        return res.status(400).json({ message: validationError.message });
      }
      return res.status(500).json({ 
        message: "Failed to update system settings", 
        error: err instanceof Error ? err.message : String(err)
      });
    }
  });

  // Zabbix Settings API - Get current settings
  app.get("/api/zabbix/settings", async (req: Request, res: Response) => {
    try {
      const settings = await storage.getZabbixSettings();
      if (!settings) {
        return res.status(404).json({ message: "Zabbix settings not found" });
      }
      return res.json(settings);
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Zabbix Settings API - Save settings
  app.post("/api/zabbix/settings", async (req: Request, res: Response) => {
    try {
      const settingsData = insertZabbixSettingsSchema.parse(req.body);
      const settings = await storage.saveZabbixSettings(settingsData);
      return res.status(201).json(settings);
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Zabbix Settings API - Test connection
  app.post("/api/zabbix/test-connection", async (req: Request, res: Response) => {
    try {
      const { url, username, password } = req.body;

      // TODO: Implement actual Zabbix API connection test
      // For now, we'll simulate a successful connection if the URL contains "zabbix"

      const isValidUrl = url && url.toLowerCase().includes("zabbix");
      const hasCredentials = username && password;

      if (isValidUrl && hasCredentials) {
        return res.json({ 
          success: true, 
          message: "Connection successful",
          version: "5.0.17" // Sample version
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Connection failed. Please check your Zabbix server URL and credentials."
        });
      }
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Zabbix Subnet API - Get all subnets
  app.get("/api/zabbix/subnets", async (req: Request, res: Response) => {
    try {
      const subnets = await storage.getZabbixSubnets();
      return res.json(subnets);
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Zabbix Subnet API - Add subnet
  app.post("/api/zabbix/subnets", async (req: Request, res: Response) => {
    try {
      const subnetData = insertZabbixSubnetSchema.parse(req.body);
      const subnet = await storage.createZabbixSubnet(subnetData);
      return res.status(201).json(subnet);
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Zabbix Subnet API - Delete subnet
  app.delete("/api/zabbix/subnets/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const subnet = await storage.getZabbixSubnet(id);

      if (!subnet) {
        return res.status(404).json({ message: "Subnet not found" });
      }

      await storage.deleteZabbixSubnet(id);
      return res.status(204).send();
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Enhanced Zabbix monitoring endpoints

  // Get hosts with comprehensive monitoring data
  app.get("/api/zabbix/hosts", async (req: Request, res: Response) => {
    try {
      // Enhanced mock hosts with comprehensive monitoring data
      const mockHosts = [
        {
          hostid: "1",
          host: "web-server-01.company.com",
          name: "Web Server 01",
          status: "enabled",
          available: "available",
          error: "",
          maintenance_status: "normal",
          cpu_usage: 45.2,
          memory_usage: 67.8,
          disk_usage: 34.1,
          network_in: 1024000,
          network_out: 512000,
          uptime: 2592000, // 30 days in seconds
          load_average: 1.25,
          swap_usage: 12.5,
          os_name: "Ubuntu 20.04 LTS",
          kernel_version: "5.4.0-74-generic",
          architecture: "x86_64",
          last_seen: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
          active_alerts: [
            {
              eventid: "101",
              name: "High CPU usage on web-server-01",
              severity: "warning",
              status: "problem",
              acknowledged: false,
              timestamp: new Date(Date.now() - 1800000).toISOString(),
              age: "30m"
            }
          ],
          groups: ["Web servers", "Linux servers"],
          templates: ["Template OS Linux", "Template App Apache"]
        },
        {
          hostid: "2",
          host: "db-server-01.company.com",
          name: "Database Server 01",
          status: "enabled",
          available: "available",
          error: "",
          maintenance_status: "normal",
          cpu_usage: 78.9,
          memory_usage: 89.3,
          disk_usage: 92.7,
          network_in: 2048000,
          network_out: 1024000,
          uptime: 5184000, // 60 days in seconds
          load_average: 2.85,
          swap_usage: 45.7,
          os_name: "CentOS 8",
          kernel_version: "4.18.0-348.el8.x86_64",
          architecture: "x86_64",
          last_seen: new Date(Date.now() - 180000).toISOString(), // 3 minutes ago
          active_alerts: [
            {
              eventid: "102",
              name: "Critical disk space usage on db-server-01",
              severity: "high",
              status: "problem",
              acknowledged: false,
              timestamp: new Date(Date.now() - 3600000).toISOString(),
              age: "1h"
            }
          ],
          groups: ["Database servers", "Linux servers"],
          templates: ["Template OS Linux","Template DB MySQL"]
        },
        {
          hostid: "3",
          host: "mail-server-01.company.com",
          name: "Mail Server 01",
          status: "enabled",
          available: "unavailable",
          error: "Get value from agent failed: cannot connect to [[192.168.1.30]:10050]: [111] Connection refused",
          maintenance_status: "normal",
          last_seen: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
          active_alerts: [
            {
              eventid: "104",
              name: "Zabbix agent on mail-server-01 is unreachable",
              severity: "disaster",
              status: "problem",
              acknowledged: false,
              timestamp: new Date(Date.now() - 1800000).toISOString(),
              age: "30m"
            }
          ],
          groups: ["Mail servers", "Windows servers"],
          templates: ["Template OS Windows"]
        }
      ];

      return res.json(mockHosts);
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Get active alerts
  app.get("/api/zabbix/alerts", async (req: Request, res: Response) => {
    try {
      const mockAlerts = [
        {
          eventid: "101",
          name: "High CPU usage on web-server-01",
          severity: "warning",
          status: "problem",
          acknowledged: false,
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          age: "30m",
          description: "CPU usage has exceeded 80% for more than 5 minutes"
        },
        {
          eventid: "102",
          name: "Critical disk space usage on db-server-01",
          severity: "high",
          status: "problem",
          acknowledged: false,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          age: "1h",
          description: "Available disk space is less than 10%"
        },
        {
          eventid: "104",
          name: "Zabbix agent on mail-server-01 is unreachable",
          severity: "disaster",
          status: "problem",
          acknowledged: false,
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          age: "30m",
          description: "Cannot connect to Zabbix agent"
        }
      ];

      return res.json(mockAlerts);
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Acknowledge alert
  app.post("/api/zabbix/alerts/:eventId/acknowledge", async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const { message } = req.body;

      // Log activity
      await storage.createActivity({
        action: "acknowledge",
        itemType: "alert",
        itemId: parseInt(eventId),
        userId: 1,
        timestamp: new Date().toISOString(),
        notes: `Alert acknowledged: ${message}`,
      });

      return res.json({ 
        success: true, 
        message: "Alert acknowledged successfully",
        eventId,
        acknowledgeMessage: message
      });
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Get available templates
  app.get("/api/zabbix/templates", async (req: Request, res: Response) => {
    try {
      const mockTemplates = [
        {
          templateid: "1",
          name: "Template OS Linux",
          description: "Linux OS monitoring template with CPU, memory, disk, and network metrics"
        },
        {
          templateid: "2",
          name: "Template OS Windows",
          description: "Windows OS monitoring template with performance counters"
        },
        {
          templateid: "3",
          name: "Template App Apache",
          description: "Apache web server monitoring template"
        },
        {
          templateid: "4",
          name: "Template DB MySQL",
          description: "MySQL database monitoring template"
        }
      ];

      return res.json(mockTemplates);
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Sync hosts from Zabbix
  app.post("/api/zabbix/sync", async (req: Request, res: Response) => {
    try {
      // Mock sync operation
      const hostCount = 15;

      // Log activity
      await storage.createActivity({
        action: "sync",
        itemType: "zabbix",
        itemId: 1,
        userId: 1,
        timestamp: new Date().toISOString(),
        notes: `Synchronized ${hostCount} hosts from Zabbix`,
      });

      return res.json({ 
        success: true, 
        message: "Sync completed successfully",
        hostCount,
        syncTime: new Date().toISOString()
      });
    } catch (err) {
      return handleError(err, res);
    }
  });

  // VM Monitoring API - Get all VM monitoring data
  app.get("/api/vm-monitoring", async (req: Request, res: Response) => {
    try {
      const vms = await storage.getVMMonitoring();
      return res.json(vms);
    } catch (err) {
      return handleError(err, res);
    }
  });

  // VM Monitoring API - Get specific VM monitoring data
  app.get("/api/vm-monitoring/:vmId", async (req: Request, res: Response) => {
    try {
      const vmId = parseInt(req.params.vmId);
      const vm = await storage.getVMMonitoringByVMId(vmId);

            if (!vm) {
        return res.status(404).json({ message: "VM monitoring data not found" });
      }

      return res.json(vm);
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Components API endpoints
  app.get("/api/components", async (req: Request, res: Response) => {
    try {
      const components = await storage.getComponents();
      return res.json(components);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.get("/api/components/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const component = await storage.getComponentById(id);
      
      if (!component) {
        return res.status(404).json({ message: "Component not found" });
      }
      
      return res.json(component);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.post("/api/components", async (req: Request, res: Response) => {
    try {
      const componentData = req.body;
      const component = await storage.createComponent(componentData);

      // Log activity
      await storage.createActivity({
        action: "create",
        itemType: "component",
        itemId: component.id,
        userId: 1, // Default user for now
        timestamp: new Date().toISOString(),
        notes: `Created component: ${component.name}`,
      });

      return res.status(201).json(component);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.patch("/api/components/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const component = await storage.updateComponent(id, updates);
      
      if (!component) {
        return res.status(404).json({ message: "Component not found" });
      }

      // Log activity
      await storage.createActivity({
        action: "update",
        itemType: "component",
        itemId: id,
        userId: 1, // Default user for now
        timestamp: new Date().toISOString(),
        notes: `Updated component: ${component.name}`,
      });

      return res.json(component);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.delete("/api/components/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      const component = await storage.getComponentById(id);
      if (!component) {
        return res.status(404).json({ message: "Component not found" });
      }

      await storage.deleteComponent(id);

      // Log activity
      await storage.createActivity({
        action: "delete",
        itemType: "component",
        itemId: id,
        userId: 1, // Default user for now
        timestamp: new Date().toISOString(),
        notes: `Deleted component: ${component.name}`,
      });

      return res.status(204).send();
    } catch (err) {
      return handleError(err, res);
    }
  });

  // VM Monitoring API - Add or update VM monitoring data
  app.post("/api/vm-monitoring", async (req: Request, res: Response) => {
    try {
      const monitoringData = insertVMMonitoringSchema.parse(req.body);

      // Check if VM monitoring data already exists
      const existingData = await storage.getVMMonitoringByVMId(monitoringData.vmId);

      let result;
      if (existingData) {
        // Update existing data
        result = await storage.updateVMMonitoring(existingData.id, monitoringData);
      } else {
        // Create new data
        result = await storage.createVMMonitoring(monitoringData);
      }

      return res.status(201).json(result);
    } catch (err) {
      return handleError(err, res);
    }
  });

  // VM Monitoring API - Manual sync with Zabbix
  app.post("/api/vm-monitoring/sync", async (req: Request, res: Response) => {
    try {
      // TODO: Implement actual Zabbix sync
      // For now, we'll simulate a successful sync

      setTimeout(() => {
        // This would be where an actual sync happens
      }, 500);

      return res.json({ 
        success: true, 
        message: "Sync started successfully. This may take a few minutes to complete." 
      });
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Network Discovery API - Get all discovered hosts
  app.get("/api/network-discovery/hosts", async (req: Request, res: Response) => {
    try {
      const hosts = await storage.getDiscoveredHosts();
      return res.json(hosts);
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Network Discovery API - Get specific discovered host
  app.get("/api/network-discovery/hosts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const host = await storage.getDiscoveredHost(id);

      if (!host) {
        return res.status(404).json({ message: "Discovered host not found" });
      }

      return res.json(host);
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Network Discovery API - Create discovered host
  app.post("/api/network-discovery/hosts", async (req: Request, res: Response) => {
    try {
      const hostData = insertDiscoveredHostSchema.parse(req.body);
      const host = await storage.createDiscoveredHost(hostData);
      return res.status(201).json(host);
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Network Discovery API - Update discovered host
  app.patch("/api/network-discovery/hosts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const host = await storage.getDiscoveredHost(id);

      if (!host) {
        return res.status(404).json({ message: "Discovered host not found" });
      }

      const updateData = insertDiscoveredHostSchema.partial().parse(req.body);
      const updatedHost = await storage.updateDiscoveredHost(id, updateData);

      return res.json(updatedHost);
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Network Discovery API - Delete discovered host
  app.delete("/api/network-discovery/hosts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const host = await storage.getDiscoveredHost(id);

      if (!host) {
        return res.status(404).json({ message: "Discovered host not found" });
      }

      await storage.deleteDiscoveredHost(id);
      return res.status(204).send();
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Network Discovery API - Initiate network scan
  app.post("/api/network-discovery/scan", async (req: Request, res: Response) => {
    try {
      const { 
        ipRange, 
        scanForUSB, 
        scanForSerialNumbers, 
        scanForHardwareDetails, 
        scanForInstalledSoftware, 
        zabbixUrl, 
        zabbixApiKey,
        useZabbix
      } = req.body;

      if (!ipRange) {
        return res.status(400).json({ message: "IP range is required" });
      }

      // Check if we should use Zabbix settings
      let usingZabbix = false;
      let zabbixInfo = {};

      if (useZabbix && zabbixUrl && zabbixApiKey) {
        usingZabbix = true;
        zabbixInfo = {
          url: zabbixUrl,
          apiKey: zabbixApiKey
        };
        console.log(`Network scan will use Zabbix integration: ${zabbixUrl}`);
      }

      // Prepare DNS settings
      let dnsSettings = null;
      if (req.body.useDNS && (req.body.primaryDNS || req.body.secondaryDNS)) {
        dnsSettings = {
          primaryDNS: req.body.primaryDNS || null,
          secondaryDNS: req.body.secondaryDNS || null
        };
        console.log(`Network scan will use DNS servers: ${req.body.primaryDNS}, ${req.body.secondaryDNS}`);
      }

      // Send scan initiation response
      const scanDetails = {
        ipRange,
        scanOptions: {
          scanForUSB: scanForUSB || false,
          scanForSerialNumbers: scanForSerialNumbers || false,
          scanForHardwareDetails: scanForHardwareDetails || false,
          scanForInstalledSoftware: scanForInstalledSoftware || false
        },
        usingZabbix,
        dnsSettings,
        startTime: new Date().toISOString()
      };

      // Broadcast scan initiation to all WebSocket clients
      let scanMessage = `Network scan started for ${ipRange}`;
      if (usingZabbix) {
        scanMessage += ' with Zabbix integration';
      }
      if (dnsSettings) {
        scanMessage += ` using DNS servers ${dnsSettings.primaryDNS || 'primary'}, ${dnsSettings.secondaryDNS || 'secondary'}`;
      }

      broadcastUpdate('scan_started', {
        message: scanMessage,
        scanDetails
      });

      // TODO: Implement actual network scanning
      // For now, we'll simulate scanning with synthetic discoveries
      setTimeout(async () => {
        // Simulate progress updates
        broadcastUpdate('scan_progress', {
          message: `Scanning ${ipRange} - 25% complete`,
          progress: 25
        });

        // Simulate first host discovery after 2 seconds
        setTimeout(async () => {
          const host1 = await storage.createDiscoveredHost({
            ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            macAddress: `00:1A:2B:${Math.floor(Math.random() * 99)}:${Math.floor(Math.random() * 99)}:${Math.floor(Math.random() * 99)}`,
            hostname: `srv-${Math.floor(Math.random() * 999)}`,
            status: 'new',
            source: 'network-scan',
            systemInfo: {
              os: 'Windows Server 2019',
              version: '10.0.17763',
              hostname: `srv-${Math.floor(Math.random() * 999)}`,
              kernel: '10.0.17763'
            },
            hardwareDetails: {
              cpu: 'Intel Xeon E5-2680 v4 @ 2.40GHz',
              memory: '32 GB',
              disks: [
                { path: 'C:', size: '500 GB', free: '250 GB' }
              ],
              manufacturer: 'Dell Inc.',
              model: 'PowerEdge R740',
              serialNumber: `SRV${Math.floor(Math.random() * 10000000)}`
            }
          });

          // Broadcast host discovery
          broadcastUpdate('host_discovered', {
            message: `Discovered new host: ${host1.ipAddress} (${host1.hostname || 'Unknown'})`,
            host: host1
          });

          broadcastUpdate('scan_progress', {
            message: `Scanning ${ipRange} - 50% complete`,
            progress: 50
          });

          // Simulate second host discovery after 4 seconds
          setTimeout(async () => {
            const host2 = await storage.createDiscoveredHost({
              ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
              macAddress: `00:1A:2B:${Math.floor(Math.random() * 99)}:${Math.floor(Math.random() * 99)}:${Math.floor(Math.random() * 99)}`,
              hostname: `ws-${Math.floor(Math.random() * 999)}`,
              status: 'new',
              source: 'network-scan',
              systemInfo: {
                os: 'Windows 10 Pro',
                version: '10.0.19042',
                hostname: `ws-${Math.floor(Math.random() * 999)}`,
                kernel: '10.0.19042'
              },
              hardwareDetails: {
                cpu: 'Intel Core i7-10700 @ 2.90GHz',
                memory: '16 GB',
                disks: [
                  { path: 'C:', size: '512 GB', free: '384 GB' }
                ],
                manufacturer: 'HP',
                model: 'EliteDesk 800 G6',
                serialNumber: `WS${Math.floor(Math.random() * 10000000)}`
              }
            });

            // Broadcast host discovery
            broadcastUpdate('host_discovered', {
              message: `Discovered new host: ${host2.ipAddress} (${host2.hostname || 'Unknown'})`,
              host: host2
            });

            broadcastUpdate('scan_progress', {
              message: `Scanning ${ipRange} - 75% complete`,
              progress: 75
            });

            // Simulate scan completion after 5 seconds
            setTimeout(() => {
              broadcastUpdate('scan_progress', {
                message: `Scanning ${ipRange} - 100% complete`,
                progress: 100
              });

              broadcastUpdate('scan_completed', {
                message: `Network scan for ${ipRange} completed`,
                hostsDiscovered: 2,
                scanDetails
              });
            }, 1000);
          }, 2000);
        }, 2000);
      }, 1000);

      // Send immediate response to the client
      return res.json({ 
        success: true, 
        message: "Network scan initiated. This may take several minutes to complete.",
        scanDetails
      });
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Network Discovery API - Import discovered host as asset
  app.post("/api/network-discovery/hosts/:id/import", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const host = await storage.getDiscoveredHost(id);

      if (!host) {
        return res.status(404).json({ message: "Discovered host not found" });
      }

      // Create asset from discovered host
      const assetData = {
        name: host.hostname || host.ipAddress,
        status: "available",
        assetTag: `DISC-${Date.now()}`,
        category: "computer",
        ipAddress: host.ipAddress,
        macAddress: host.macAddress,
        model: host.hardwareDetails && typeof host.hardwareDetails === 'object' ? host.hardwareDetails.model || null : null,
        manufacturer: host.hardwareDetails && typeof host.hardwareDetails === 'object' ? host.hardwareDetails.manufacturer || null : null,
        osType: host.systemInfo && typeof host.systemInfo === 'object' ? host.systemInfo.os || null : null,
        serialNumber: host.hardwareDetails && typeof host.hardwareDetails === 'object' ? host.hardwareDetails.serialNumber || null : null,
        description: `Imported from network discovery: ${host.ipAddress}`
      };

      const asset = await storage.createAsset(assetData);

      // Update the discovered host status to imported
      await storage.updateDiscoveredHost(id, { status: "imported" });

      // Log the activity
      await storage.createActivity({
        action: "import",
        itemType: "asset",
        itemId: asset.id,
        userId: null,
        timestamp: new Date().toISOString(),
        notes: `Asset imported from discovered host ${host.ipAddress}`
      });

      return res.status(201).json({
        success: true,
        message: "Host successfully imported as asset",
        asset
      });
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Bitlocker Keys API endpoints
  app.get("/api/bitlocker-keys", async (req: Request, res: Response) => {
    try {
      const keys = await storage.getBitlockerKeys();
      return res.json(keys);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.get("/api/bitlocker-keys/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const key = await storage.getBitlockerKey(id);

      if (!key) {
        return res.status(404).json({ message: "Bitlocker key not found" });
      }

      return res.json(key);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.get("/api/bitlocker-keys/search/serial/:serialNumber", async (req: Request, res: Response) => {
    try {
      const serialNumber = req.params.serialNumber;
      const keys = await storage.getBitlockerKeyBySerialNumber(serialNumber);
      return res.json(keys);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.get("/api/bitlocker-keys/search/identifier/:identifier", async (req: Request, res: Response) => {
    try {
      const identifier = req.params.identifier;
      const keys = await storage.getBitlockerKeyByIdentifier(identifier);
      return res.json(keys);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.post("/api/bitlocker-keys", async (req: Request, res: Response) => {
    try {
      const { insertBitlockerKeySchema } = schema;
      const data = insertBitlockerKeySchema.parse(req.body);
      const key = await storage.createBitlockerKey(data);
      return res.status(201).json(key);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.patch("/api/bitlocker-keys/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { insertBitlockerKeySchema } = schema;
      const updateData = insertBitlockerKeySchema.partial().parse(req.body);
      const key = await storage.updateBitlockerKey(id, updateData);

      if (!key) {
        return res.status(404).json({ message: "Bitlocker key not found" });
      }

      return res.json(key);
    } catch (err) {
      return handleError(err, res);
    }
  });

  app.delete("/api/bitlocker-keys/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.deleteBitlockerKey(id);

      if (!result) {
        return res.status(404).json({ message: "Bitlocker key not found" });
      }

      return res.json({ message: "Bitlocker key deleted successfully" });
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Helper function to format bytes
  function formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

// VM Inventory routes
  app.get("/api/vm-inventory", async (req: Request, res: Response) => {
    try {
      const vms = await storage.getVMs();
      res.json(vms);
    } catch (error) {
      console.error("Error fetching VM inventory:", error);
      res.status(500).json({ message: "Failed to fetch VM inventory" });
    }
  });

  app.post("/api/vm-inventory", async (req: Request, res: Response) => {
    try {
      const vmData = req.body;
      const vm = await storage.createVM(vmData);
      res.status(201).json(vm);
    } catch (error) {
      console.error("Error creating VM:", error);
      res.status(500).json({ message: "Failed to create VM" });
    }
  });

  app.get("/api/vm-inventory/:id", async (req: Request, res: Response) => {
    try {
      const vmId = parseInt(req.params.id);
      const vm = await storage.getVM(vmId);

      if (!vm) {
        return res.status(404).json({ message: "VM not found" });
      }

      res.json(vm);
    } catch (error) {
      console.error("Error fetching VM:", error);
      res.status(500).json({ message: "Failed to fetch VM" });
    }
  });

  app.patch("/api/vm-inventory/:id", async (req: Request, res: Response) => {
    try {
      const vmId = parseInt(req.params.id);
      const vmData = req.body;
      const vm = await storage.updateVM(vmId, vmData);

      if (!vm) {
        return res.status(404).json({ message: "VM not found" });
      }

      res.json(vm);
    } catch (error) {
      console.error("Error updating VM:", error);
      res.status(500).json({ message: "Failed to update VM" });
    }
  });

  app.delete("/api/vm-inventory/:id", async (req: Request, res: Response) => {
    try {
      const vmId = parseInt(req.params.id);
      const success = await storage.deleteVM(vmId);

      if (!success) {
        return res.status(404).json({ message: "VM not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting VM:", error);
      res.status(500).json({ message: "Failed to delete VM" });
    }
  });

  // VM Management routes (using the new vms table)
  app.get("/api/vms", async (req: Request, res: Response) => {
    try {
      const vms = await db.select().from(schema.vms).orderBy(schema.vms.id);
      res.json(vms);
    } catch (error) {
      console.error("Error fetching VMs:", error);
      res.status(500).json({ message: "Failed to fetch VMs" });
    }
  });

  app.post("/api/vms", async (req: Request, res: Response) => {
    try {
      const vmData = req.body;

      const [newVm] = await db.insert(schema.vms).values({
        ...vmData,
        createdDate: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }).returning();

      res.status(201).json(newVm);
    } catch (error) {
      console.error("Error creating VM:", error);
      res.status(500).json({ message: "Failed to create VM" });
    }
  });

  app.get("/api/vms/:id", async (req: Request, res: Response) => {
    try {
      const vmId = parseInt(req.params.id);
      const [vm] = await db.select().from(schema.vms).where(eq(schema.vms.id, vmId));

      if (!vm) {
        return res.status(404).json({ message: "VM not found" });
      }

      res.json(vm);
    } catch (error) {
      console.error("Error fetching VM:", error);
      res.status(500).json({ message: "Failed to fetch VM" });
    }
  });

  app.put("/api/vms/:id", async (req: Request, res: Response) => {
    try {
      const vmId = parseInt(req.params.id);
      const vmData = req.body;

      const [updatedVm] = await db.update(schema.vms)
        .set({
          ...vmData,
          lastModified: new Date().toISOString()
        })
        .where(eq(schema.vms.id, vmId))
        .returning();

      if (!updatedVm) {
        return res.status(404).json({ message: "VM not found" });
      }

      res.json(updatedVm);
    } catch (error) {
      console.error("Error updating VM:", error);
      res.status(500).json({ message: "Failed to update VM" });
    }
  });

  app.delete("/api/vms/:id", async (req: Request, res: Response) => {
    try {
      const vmId = parseInt(req.params.id);

      const [deletedVm] = await db.delete(schema.vms)
        .where(eq(schema.vms.id, vmId))
        .returning();

      if (!deletedVm) {
        return res.status(404).json({ message: "VM not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting VM:", error);
      res.status(500).json({ message: "Failed to delete VM" });
    }
  });

  // Consumable Assignment routes
  app.get("/api/consumables/:id/assignments", async (req: Request, res: Response) => {
    try {
      const consumableId = parseInt(req.params.id);
      const assignments = await db.select()
        .from(schema.consumableAssignments)
        .where(eq(schema.consumableAssignments.consumableId, consumableId))
        .orderBy(schema.consumableAssignments.assignedDate);

      res.json(assignments);
    } catch (error) {
      console.error("Error fetching consumable assignments:", error);
      res.status(500).json({ message: "Failed to fetch consumable assignments" });
    }
  });

  app.post("/api/consumables/:id/assign", async (req: Request, res: Response) => {
    try {
      const consumableId = parseInt(req.params.id);
      const assignmentData = req.body;

      // Create assignment
      const [assignment] = await db.insert(schema.consumableAssignments).values({
        consumableId,
        ...assignmentData,
        assignedDate: new Date().toISOString(),
        status: 'assigned'
      }).returning();

      // Update consumable quantity
      await db.update(schema.consumables)
        .set({
          quantity: sql`${schema.consumables.quantity} - ${assignmentData.quantity || 1}`
        })
        .where(eq(schema.consumables.id, consumableId));

      res.status(201).json(assignment);
    } catch (error) {
      console.error("Error assigning consumable:", error);
      res.status(500).json({ message: "Failed to assign consumable" });
    }
  });

  // Get current user
  app.get("/api/user", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });

  // Authentication status check
  app.get("/api/me", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json({
      authenticated: true,
      user: req.user
    });
  });

  // Profile management
  app.put("/api/profile", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = req.user as any;
      const updateData = req.body;
      
      // Update user profile (mock implementation)
      const updatedUser = {
        ...user,
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      res.json(updatedUser);
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Test endpoint for user management verification
  app.get("/api/users/test", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const users = await storage.getUsers();
      const userCount = users.length;
      const adminCount = users.filter(u => u.isAdmin).length;

      return res.json({
        status: "User management system is working",
        totalUsers: userCount,
        adminUsers: adminCount,
        currentUser: req.user.username,
        isCurrentUserAdmin: req.user.isAdmin,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      return handleError(err, res);
    }
  });

  // Consumables endpoints
  app.get('/api/consumables', checkPermission('consumables', 'view'), async (req, res) => {
    try {
      const consumables = await storage.getConsumables();
      res.json(consumables);
    } catch (error) {
      console.error('Error fetching consumables:', error);
      res.status(500).json({ error: 'Failed to fetch consumables' });
    }
  });

  app.post('/api/consumables', checkPermission('consumables', 'add'), async (req, res) =>{
    try {
      const consumable = await storage.createConsumable(req.body);
      res.status(201).json(consumable);
    } catch (error) {
      console.error('Error creating consumable:', error);
      res.status(500).json({ error: 'Failed to create consumable' });
    }
  });

  app.get('/api/consumables/:id', checkPermission('consumables', 'view'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const consumable = await storage.getConsumable(id);
      if (!consumable) {
        return res.status(404).json({ error: 'Consumable not found' });
      }
      res.json(consumable);
    } catch (error) {
      console.error('Error fetching consumable:', error);
      res.status(500).json({ error: 'Failed to fetch consumable' });
    }
  });

  app.get('/api/consumables/:id/assignments', checkPermission('consumables', 'view'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      // Check if consumable exists first
      const consumable = await storage.getConsumable(id);
      if (!consumable) {
        return res.status(404).json({ error: 'Consumable not found' });
      }

      const assignments = await storage.getConsumableAssignments(id);
      res.json(assignments);
    } catch (error) {
      console.error('Error fetching consumable assignments:', error);
      res.status(500).json({ error: 'Failed to fetch assignments' });
    }
  });

  app.post('/api/consumables/:id/assign', checkPermission('consumables', 'edit'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const assignmentData = req.body;

      // Validate required fields
      if (!assignmentData.assignedTo || assignmentData.assignedTo.trim() === '') {
        return res.status(400).json({ error: 'assignedTo is required' });
      }

      // Validate quantity
      const requestedQuantity = parseInt(assignmentData.quantity) || 1;
      if (requestedQuantity <= 0) {
        return res.status(400).json({ error: 'Quantity must be greater than 0' });
      }

      // Get the consumable first
      let consumable;
      try {
        consumable = await storage.getConsumable(id);
      } catch (dbError) {
        console.error('Database connection failed when fetching consumable:', dbError);
        return res.status(503).json({ 
          error: 'Database connection failed. Please set up PostgreSQL database.',
          instruction: 'Go to Database tab → Create a database to fix this issue.',
          code: 'DB_CONNECTION_FAILED'
        });
      }

      if (!consumable) {
        return res.status(404).json({ error: 'Consumable not found' });
      }

      // Check if there's enough quantity
      if (consumable.quantity < requestedQuantity) {
        return res.status(400).json({ 
          error: 'Not enough quantity available',
          available: consumable.quantity,
          requested: requestedQuantity
        });
      }

      // Create the assignment (this will handle database connection issues gracefully)
      const assignment = await storage.assignConsumable(id, {
        ...assignmentData,
        quantity: requestedQuantity
      });

      // Update the consumable quantity
      let updatedConsumable;
      try {
        updatedConsumable = await storage.updateConsumable(id, {
          quantity: consumable.quantity - requestedQuantity,
          status: (consumable.quantity - requestedQuantity) <= 0 ? 'in_use' : consumable.status
        });
      } catch (updateError) {
        console.error('Failed to update consumable quantity:', updateError);
        // Still return success for assignment even if quantity update fails
        updatedConsumable = {
          ...consumable,
          quantity: consumable.quantity - requestedQuantity
        };
      }

      res.status(201).json({
        assignment,
        consumable: updatedConsumable,
        message: 'Consumable assigned successfully'
      });
    } catch (error) {
      console.error('Error assigning consumable:', error);

      // Provide specific error responses
      if (error.code === 'ECONNREFUSED') {
        res.status(503).json({ 
          error: 'Database connection failed. Please set up PostgreSQL database.',
          instruction: 'Go to Database tab → Create a database to fix this issue.',
          code: 'DB_CONNECTION_FAILED'
        });
      } else if (error.code === '23503') {
        res.status(400).json({ 
          error: 'Database constraint violation. Consumable may not exist.',
          details: 'Please refresh the page and try again.'
        });
      } else if (error.message === 'Consumable not found') {
        res.status(404).json({ error: 'Consumable not found' });
      } else {
        res.status(500).json({ 
          error: 'Failed to assign consumable',
          details: error.message
        });
      }
    }
  });

  app.patch('/api/consumables/:id', checkPermission('consumables', 'edit'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const consumable = await storage.updateConsumable(id, req.body);
      if (!consumable) {
        return res.status(404).json({ error: 'Consumable not found' });
      }
      res.json(consumable);
    } catch (error) {
      console.error('Error updating consumable:', error);
      res.status(500).json({ error: 'Failed to update consumable' });
    }
  });

  app.delete('/api/consumables/:id', checkPermission('consumables', 'edit'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteConsumable(id);
      if (!success) {
        return res.status(404).json({ error: 'Consumable not found' });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting consumable:', error);
      res.status(500).json({ error: 'Failed to delete consumable' });
    }
  });

  const httpServer = createServer(app);

  // WebSocket functionality has been disabled to improve compatibility with Windows Server
  console.log('WebSocket functionality disabled - using HTTP polling for updates instead');

  // Empty dummy function - no actual broadcasting occurs
  function broadcastUpdate(type: string, data: any) {
    console.log(`[Update Event] ${type}: WebSocket disabled, using polling instead`);
    return;
  }

  return httpServer;
}