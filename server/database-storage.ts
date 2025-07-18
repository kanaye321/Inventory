import {
  users, assets, components, accessories, licenses, activities, consumables, licenseAssignments, consumableAssignments,
  type User, type InsertUser, 
  type Asset, type InsertAsset,
  type Activity, type InsertActivity,
  type License, type InsertLicense,
  type Accessory, type InsertAccessory,
  type Component, type InsertComponent,
  type Consumable, type InsertConsumable,
  type LicenseAssignment, type InsertLicenseAssignment,
  AssetStatus, LicenseStatus, AccessoryStatus, ConsumableStatus,
} from "@shared/schema";
import { db } from "./db";
import type { 
  User, Asset, Activity, License, Component, Accessory, AssetStatus, LicenseStatus,
  InsertUser, InsertAsset, InsertActivity, InsertLicense, InsertComponent, InsertAccessory,
  InsertZabbixSettings, InsertZabbixSubnet, InsertDiscoveredHost, InsertVMMonitoring, InsertBitlockerKey,
  Consumable, InsertConsumable
} from "@shared/schema";
import * as schema from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function initializeDatabase() {
  try {
    console.log("🔄 Initializing database tables...");

    // Test database connection first
    await db.execute(sql`SELECT 1 as test`);
    console.log("✅ Database connection established/verified");

    // Check if tables already exist to avoid data loss
    const tablesExist = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'assets', 'components', 'accessories', 'consumables', 'licenses')
    `);

    if (tablesExist.rows.length > 0) {
      console.log("✅ Database tables already exist, skipping initialization to preserve data");
      return;
    }

    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL,
        department TEXT,
        is_admin BOOLEAN DEFAULT FALSE,
        role_id INTEGER,
        permissions JSON DEFAULT '{"assets":{"view":true,"edit":false,"add":false},"components":{"view":true,"edit":false,"add":false},"accessories":{"view":true,"edit":false,"add":false},"consumables":{"view":true,"edit":false,"add":false},"licenses":{"view":true,"edit":false,"add":false},"users":{"view":false,"edit":false,"add":false},"reports":{"view":true,"edit":false,"add":false},"vmMonitoring":{"view":true,"edit":false,"add":false},"networkDiscovery":{"view":true,"edit":false,"add":false},"bitlockerKeys":{"view":false,"edit":false,"add":false},"admin":{"view":false,"edit":false,"add":false}}'
      )
    `);
    console.log("✅ Users table created/verified");

    // Create assets table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS assets (
        id SERIAL PRIMARY KEY,
        asset_tag TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'available',
        purchase_date TEXT,
        purchase_cost TEXT,
        location TEXT,
        serial_number TEXT,
        model TEXT,
        manufacturer TEXT,
        notes TEXT,
        knox_id TEXT,
        ip_address TEXT,
        mac_address TEXT,
        os_type TEXT,
        assigned_to INTEGER REFERENCES users(id),
        checkout_date TEXT,
        expected_checkin_date TEXT,
        finance_updated BOOLEAN DEFAULT FALSE,
        department TEXT
      )
    `);
    console.log("✅ Assets table created/verified");

    // Create consumables table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS consumables (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        quantity INTEGER DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'available',
        location TEXT,
        model_number TEXT,
        manufacturer TEXT,
        purchase_date TEXT,
        purchase_cost TEXT,
        notes TEXT
      )
    `);
    console.log("✅ Consumables table created/verified");

    // Create components table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS components (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        description TEXT,
        location TEXT,
        serial_number TEXT,
        model TEXT,
        manufacturer TEXT,
        purchase_date TEXT,
        purchase_cost TEXT,
        date_released TEXT,
        date_returned TEXT,
        released_by TEXT,
        returned_to TEXT,
        notes TEXT
      )
    `);
    console.log("✅ Components table created/verified");

    // Create accessories table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS accessories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        description TEXT,
        location TEXT,
        serial_number TEXT,
        model TEXT,
        manufacturer TEXT,
        purchase_date TEXT,
        purchase_cost TEXT,
        assigned_to INTEGER REFERENCES users(id),
        knox_id TEXT,
        date_released TEXT,
        date_returned TEXT,
        released_by TEXT,
        returned_to TEXT,
        notes TEXT
      )
    `);
    console.log("✅ Accessories table created/verified");

    // Create licenses table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS licenses (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        key TEXT NOT NULL,
        seats TEXT,
        assigned_seats INTEGER DEFAULT 0,
        company TEXT,
        manufacturer TEXT,
        purchase_date TEXT,
        expiration_date TEXT,
        purchase_cost TEXT,
        status TEXT NOT NULL,
        notes TEXT,
        assigned_to INTEGER REFERENCES users(id)
      )
    `);
    console.log("✅ Licenses table created/verified");

    // Create license assignments table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS license_assignments (
        id SERIAL PRIMARY KEY,
        license_id INTEGER REFERENCES licenses(id) NOT NULL,
        assigned_to TEXT NOT NULL,
        notes TEXT,
        assigned_date TEXT NOT NULL
      )
    `);
    console.log("✅ License assignments table created/verified");

    // Create consumable assignments table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS consumable_assignments (
        id SERIAL PRIMARY KEY,
        consumable_id INTEGER NOT NULL,
        assigned_to TEXT NOT NULL,
        serial_number TEXT,
        knox_id TEXT,
        quantity INTEGER NOT NULL DEFAULT 1,
        assigned_date TEXT NOT NULL,
        returned_date TEXT,
        status TEXT NOT NULL DEFAULT 'assigned',
        notes TEXT
      )
    `);
    
    // Add foreign key constraint separately to avoid issues if table already exists
    await db.execute(sql`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'consumable_assignments_consumable_id_fkey'
        ) THEN
          ALTER TABLE consumable_assignments 
          ADD CONSTRAINT consumable_assignments_consumable_id_fkey 
          FOREIGN KEY (consumable_id) REFERENCES consumables(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);
    console.log("✅ Consumable assignments table created/verified");

    // Create VMs table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS vms (
        id SERIAL PRIMARY KEY,
        vm_name TEXT NOT NULL,
        host_name TEXT NOT NULL,
        guest_os TEXT NOT NULL,
        power_state TEXT NOT NULL DEFAULT 'stopped',
        cpu_count INTEGER DEFAULT 1,
        memory_mb INTEGER DEFAULT 1024,
        disk_gb INTEGER DEFAULT 20,
        ip_address TEXT,
        mac_address TEXT,
        vmware_tools TEXT,
        cluster TEXT,
        datastore TEXT,
        status TEXT NOT NULL DEFAULT 'available',
        assigned_to INTEGER REFERENCES users(id),
        location TEXT,
        serial_number TEXT,
        model TEXT,
        manufacturer TEXT,
        purchase_date TEXT,
        purchase_cost TEXT,
        department TEXT,
        description TEXT,
        created_date TEXT,
        last_modified TEXT,
        notes TEXT
      )
    `);
    console.log("✅ VMs table created/verified");

    // Create activities table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        action TEXT NOT NULL,
        item_type TEXT NOT NULL,
        item_id INTEGER NOT NULL,
        user_id INTEGER REFERENCES users(id),
        timestamp TEXT NOT NULL,
        notes TEXT
      )
    `);
    console.log("✅ Activities table created/verified");

    console.log("🎉 Database initialization completed successfully!");
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    // Get the current user if we need to return without updates
    if (Object.keys(updateData).length === 0) {
      return await this.getUser(id);
    }

    const [updated] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async deleteUser(id: number): Promise<boolean> {
    const [deleted] = await db.delete(users)
      .where(eq(users.id, id))
      .returning();
    return !!deleted;
  }

  // Asset operations
  async getAssets(): Promise<Asset[]> {
    return await db.select().from(assets);
  }

  async getAsset(id: number): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.id, id));
    return asset;
  }

  async getAssetByTag(assetTag: string): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.assetTag, assetTag));
    return asset;
  }

  async createAsset(insertAsset: InsertAsset): Promise<Asset> {
    const [asset] = await db.insert(assets).values(insertAsset).returning();
    return asset;
  }

  async updateAsset(id: number, updateData: Partial<InsertAsset>): Promise<Asset | undefined> {
    const [updated] = await db.update(assets)
      .set(updateData)
      .where(eq(assets.id, id))
      .returning();
    return updated;
  }

  async deleteAsset(id: number): Promise<boolean> {
    const [deleted] = await db.delete(assets)
      .where(eq(assets.id, id))
      .returning();
    return !!deleted;
  }

  // Component operations
  async getComponents(): Promise<Component[]> {
    try {
      return await db.select().from(components);
    } catch (error) {
      console.error('Error fetching components:', error);
      return [];
    }
  }

  async getComponent(id: number): Promise<Component | undefined> {
    try {
      const [component] = await db.select().from(components).where(eq(components.id, id));
      return component;
    } catch (error) {
      console.error('Error fetching component:', error);
      return undefined;
    }
  }

  async createComponent(insertComponent: InsertComponent): Promise<Component> {
    try {
      // Ensure quantity is a number
      const processedComponent = {
        ...insertComponent,
        quantity: typeof insertComponent.quantity === 'string' 
          ? parseInt(insertComponent.quantity) 
          : insertComponent.quantity || 1
      };

      const [component] = await db.insert(components).values(processedComponent).returning();

      // Create activity record
      await this.createActivity({
        action: "create",
        itemType: "component",
        itemId: component.id,
        userId: null,
        timestamp: new Date().toISOString(),
        notes: `Component "${component.name}" created`,
      });

      return component;
    } catch (error) {
      console.error('Error creating component:', error);
      throw error;
    }
  }

  async updateComponent(id: number, updateData: Partial<InsertComponent>): Promise<Component | undefined> {
    try {
      const [component] = await db.select().from(components).where(eq(components.id, id));
      if (!component) return undefined;

      // Convert quantity from string to number if needed
      if (typeof updateData.quantity === 'string') {
        updateData.quantity = parseInt(updateData.quantity);
      }

      const [updated] = await db.update(components)
        .set(updateData)
        .where(eq(components.id, id))
        .returning();

      if (updated) {
        // Create activity record
        await this.createActivity({
          action: "update",
          itemType: "component",
          itemId: id,
          userId: null,
          timestamp: new Date().toISOString(),
          notes: `Component "${component.name}" updated`,
        });
      }

      return updated;
    } catch (error) {
      console.error('Error updating component:', error);
      throw error;
    }
  }

  async deleteComponent(id: number): Promise<boolean> {
    try {
      const [component] = await db.select().from(components).where(eq(components.id, id));
      if (!component) return false;

      const [deleted] = await db.delete(components)
        .where(eq(components.id, id))
        .returning();

      if (deleted) {
        // Create activity record
        await this.createActivity({
          action: "delete",
          itemType: "component",
          itemId: id,
          userId: null,
          timestamp: new Date().toISOString(),
          notes: `Component "${component.name}" deleted`,
        });
      }

      return !!deleted;
    } catch (error) {
      console.error('Error deleting component:', error);
      return false;
    }
  }

  // Accessory operations
  async getAccessories(): Promise<Accessory[]> {
    return await db.select().from(accessories);
  }

  async getAccessory(id: number): Promise<Accessory | undefined> {
    const [accessory] = await db.select().from(accessories).where(eq(accessories.id, id));
    return accessory;
  }

  async createAccessory(insertAccessory: InsertAccessory): Promise<Accessory> {
    // Make sure quantity is a number
    const processedAccessory = {
      ...insertAccessory,
      quantity: typeof insertAccessory.quantity === 'string' 
        ? parseInt(insertAccessory.quantity) 
        : insertAccessory.quantity
    };

    const [accessory] = await db.insert(accessories).values(processedAccessory).returning();

    // Create activity record
    await this.createActivity({
      action: "create",
      itemType: "accessory",
      itemId: accessory.id,
      userId: null,
      timestamp: new Date().toISOString(),
      notes: `Accessory "${accessory.name}" created`,
    });

    return accessory;
  }

  async updateAccessory(id: number, updateData: Partial<InsertAccessory>): Promise<Accessory | undefined> {
    const [accessory] = await db.select().from(accessories).where(eq(accessories.id, id));
    if (!accessory) return undefined;

    // Convert quantity from string to number if needed
    if (typeof updateData.quantity === 'string') {
      updateData.quantity = parseInt(updateData.quantity);
    }

    const [updated] = await db.update(accessories)
      .set(updateData)
      .where(eq(accessories.id, id))
      .returning();

    if (updated) {
      // Create activity record
      await this.createActivity({
        action: "update",
        itemType: "accessory",
        itemId: id,
        userId: null,
        timestamp: new Date().toISOString(),
        notes: `Accessory "${accessory.name}" updated`,
      });
    }

    return updated;
  }

  async deleteAccessory(id: number): Promise<boolean> {
    const [accessory] = await db.select().from(accessories).where(eq(accessories.id, id));
    if (!accessory) return false;

    const [deleted] = await db.delete(accessories)
      .where(eq(accessories.id, id))
      .returning();

    if (deleted) {
      // Create activity record
      await this.createActivity({
        action: "delete",
        itemType: "accessory",
        itemId: id,
        userId: null,
        timestamp: new Date().toISOString(),
        notes: `Accessory "${accessory.name}" deleted`,
      });
    }

    return !!deleted;
  }

  // Consumable operations
  async getConsumables(): Promise<Consumable[]> {
    try {
      // Try database first
      const dbConsumables = await db.select().from(consumables);

      // If database has data, use it and sync to memory
      if (dbConsumables.length > 0) {
        // Update memory storage with database data
        this.consumablesData.clear();
        dbConsumables.forEach(consumable => {
          this.consumablesData.set(consumable.id, consumable);
          // Update the current ID to avoid conflicts
          if (consumable.id >= this.consumableCurrentId) {
            this.consumableCurrentId = consumable.id + 1;
          }
        });
        return dbConsumables;
      }

      // If no database data but memory has data, sync memory to database
      const memoryConsumables = Array.from(this.consumablesData.values());
      if (memoryConsumables.length > 0) {
        try {
          // Sync memory consumables to database
          for (const consumable of memoryConsumables) {
            await db.insert(consumables).values(consumable).onConflictDoNothing();
          }
          console.log(`Synced ${memoryConsumables.length} consumables from memory to database`);
        } catch (syncError) {
          console.error('Failed to sync memory consumables to database:', syncError);
        }
      }

      return memoryConsumables;
    } catch (error) {
      console.error('Error fetching consumables from database:', error);
      // Fallback to memory storage
      return Array.from(this.consumablesData.values());
    }
  }

  async getConsumable(id: number): Promise<Consumable | undefined> {
    try {
      const [consumable] = await db.select().from(consumables).where(eq(consumables.id, id));
      return consumable;
    } catch (error) {
      console.error('Error fetching consumable:', error);
      return undefined;
    }
  }

  async createConsumable(insertConsumable: InsertConsumable): Promise<Consumable> {
    try {
      // Make sure quantity is a number
      const processedConsumable = {
        ...insertConsumable,
        quantity: typeof insertConsumable.quantity === 'string' 
          ? parseInt(insertConsumable.quantity) 
          : insertConsumable.quantity || 1
      };

      const [consumable] = await db.insert(consumables).values(processedConsumable).returning();

      // Create activity record
      await this.createActivity({
        action: "create",
        itemType: "consumable",
        itemId: consumable.id,
        userId: null,
        timestamp: new Date().toISOString(),
        notes: `Consumable "${consumable.name}" created`,
      });

      return consumable;
    } catch (error) {
      console.error('Error creating consumable:', error);
      throw error;
    }
  }

  async updateConsumable(id: number, updateData: Partial<InsertConsumable>): Promise<Consumable | undefined> {
    const [consumable] = await db.select().from(consumables).where(eq(consumables.id, id));
    if (!consumable) return undefined;

    // Convert quantity from string to number if needed
    if (typeof updateData.quantity === 'string') {
      updateData.quantity = parseInt(updateData.quantity);
    }

    const [updated] = await db.update(consumables)
      .set(updateData)
      .where(eq(consumables.id, id))
      .returning();

    if (updated) {
      // Create activity record
      await this.createActivity({
        action: "update",
        itemType: "consumable",
        itemId: id,
        userId: null,
        timestamp: new Date().toISOString(),
        notes: `Consumable "${consumable.name}" updated`,
      });
    }

    return updated;
  }

  async deleteConsumable(id: number): Promise<boolean> {
    try {
      const consumable = await this.getConsumable(id);
      if (!consumable) return false;

      await db.delete(consumables).where(eq(consumables.id, id));

      // Create activity record
      await this.createActivity({
        action: "delete",
        itemType: "consumable",
        itemId: id,
        userId: null,
        timestamp: new Date().toISOString(),
        notes: `Consumable "${consumable.name}" deleted`,
      });

      return true;
    } catch (error) {
      console.error('Error deleting consumable:', error);
      return false;
    }
  }

  async getConsumableAssignments(consumableId: number): Promise<any[]> {
    try {
      // First try to test the database connection
      await db.execute(sql`SELECT 1`);

      // Check if table exists
      const tableExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_name = 'consumable_assignments'
        );
      `);

      if (!tableExists.rows?.[0]?.exists) {
        console.log('Consumable assignments table does not exist, returning empty array');
        return [];
      }

      const assignments = await db.select()
        .from(schema.consumableAssignments)
        .where(eq(schema.consumableAssignments.consumableId, consumableId))
        .orderBy(desc(schema.consumableAssignments.assignedDate));
      return assignments;
    } catch (error) {
      console.error('Error fetching consumable assignments:', error);
      // Return empty array if database connection fails
      return [];
    }
  }

  async assignConsumable(consumableId: number, assignmentData: any): Promise<any> {
    try {
      // First check if consumable exists using the memory fallback
      let consumable;
      try {
        consumable = await this.getConsumable(consumableId);
      } catch (dbError) {
        // If database is down, check memory storage
        const memoryConsumables = Array.from(this.consumablesData.values());
        consumable = memoryConsumables.find(c => c.id === consumableId);
      }
      
      if (!consumable) {
        throw new Error('Consumable not found');
      }

      // Try database assignment first
      try {
        // Test database connection
        await db.execute(sql`SELECT 1`);

        // Ensure consumable_assignments table exists
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS consumable_assignments (
            id SERIAL PRIMARY KEY,
            consumable_id INTEGER NOT NULL,
            assigned_to TEXT NOT NULL,
            serial_number TEXT,
            knox_id TEXT,
            quantity INTEGER NOT NULL DEFAULT 1,
            assigned_date TEXT NOT NULL,
            returned_date TEXT,
            status TEXT NOT NULL DEFAULT 'assigned',
            notes TEXT,
            CONSTRAINT fk_consumable_assignment FOREIGN KEY (consumable_id) REFERENCES consumables(id) ON DELETE CASCADE
          );
        `);

        // Create assignment record
        const [assignment] = await db.insert(schema.consumableAssignments).values({
          consumableId,
          assignedTo: assignmentData.assignedTo,
          serialNumber: assignmentData.serialNumber || null,
          knoxId: assignmentData.knoxId || null,
          quantity: assignmentData.quantity || 1,
          assignedDate: new Date().toISOString(),
          status: 'assigned',
          notes: assignmentData.notes || null
        }).returning();

        // Create activity record
        try {
          await this.createActivity({
            action: "checkout",
            itemType: "consumable",
            itemId: consumableId,
            userId: null,
            timestamp: new Date().toISOString(),
            notes: `Consumable assigned to ${assignmentData.assignedTo}`,
          });
        } catch (activityError) {
          console.warn('Failed to create activity record:', activityError);
        }

        return assignment;
      } catch (dbError) {
        console.warn('Database assignment failed, using fallback mode:', dbError);
        
        // Fallback assignment mode
        const fallbackAssignment = {
          id: Date.now(),
          consumableId,
          assignedTo: assignmentData.assignedTo,
          serialNumber: assignmentData.serialNumber || null,
          knoxId: assignmentData.knoxId || null,
          quantity: assignmentData.quantity || 1,
          assignedDate: new Date().toISOString(),
          status: 'assigned',
          notes: assignmentData.notes || null
        };

        console.log('Assignment created in fallback mode:', fallbackAssignment);
        return fallbackAssignment;
      }
    } catch (error) {
      console.error('Error assigning consumable:', error);
      throw error;
    }
  }

  // License operations
  async getLicenses(): Promise<License[]> {
    return await db.select().from(licenses);
  }

  async getLicense(id: number): Promise<License | undefined> {
    const [license] = await db.select().from(licenses).where(eq(licenses.id, id));
    return license;
  }

  async createLicense(insertLicense: InsertLicense): Promise<License> {
    const [license] = await db.insert(licenses).values(insertLicense).returning();

    // Create activity record
    await this.createActivity({
      action: "create",
      itemType: "license",
      itemId: license.id,
      userId: null,
      timestamp: new Date().toISOString(),
      notes: `License "${license.name}" created`,
    });

    return license;
  }

  async updateLicense(id: number, updateData: Partial<InsertLicense>): Promise<License | undefined> {
    const [license] = await db.select().from(licenses).where(eq(licenses.id, id));
    if (!license) return undefined;

    const [updated] = await db.update(licenses)
      .set(updateData)
      .where(eq(licenses.id, id))
      .returning();

    if (updated) {
      // Create activity record
      await this.createActivity({
        action: "update",
        itemType: "license",
        itemId: id,
        userId: null,
        timestamp: new Date().toISOString(),
        notes: `License "${license.name}" updated`,
      });
    }

    return updated;
  }

  async deleteLicense(id: number): Promise<boolean> {
    const [license] = await db.select().from(licenses).where(eq(licenses.id, id));
    if (!license) return false;

    try {
      // First delete all license assignments related to this license
      await db.delete(licenseAssignments)
        .where(eq(licenseAssignments.licenseId, id));

      // Then delete the license
      const [deleted] = await db.delete(licenses)
        .where(eq(licenses.id, id))
        .returning();

      if (deleted) {
        // Create activity record
        await this.createActivity({
          action: "delete",
          itemType: "license",
          itemId: id,
          userId: null,
          timestamp: new Date().toISOString(),
          notes: `License "${license.name}" deleted`,
        });
      }

      return !!deleted;
    } catch (error) {
      console.error("Error deleting license:", error);
      throw error;
    }
  }

  // License assignment operations
  async getLicenseAssignments(licenseId: number): Promise<LicenseAssignment[]> {
    return await db.select()
      .from(licenseAssignments)
      .where(eq(licenseAssignments.licenseId, licenseId))
      .orderBy(licenseAssignments.assignedDate);
  }

  async createLicenseAssignment(insertAssignment: InsertLicenseAssignment): Promise<LicenseAssignment> {
    const [assignment] = await db
      .insert(licenseAssignments)
      .values(insertAssignment)
      .returning();

    // Create activity record
    await this.createActivity({
      action: "update",
      itemType: "license",
      itemId: insertAssignment.licenseId,
      userId: null,
      timestamp: new Date().toISOString(),
      notes: `License seat assigned to: ${insertAssignment.assignedTo}`,
    });

    return assignment;
  }

  // Checkout/checkin operations
  async checkoutAsset(assetId: number, userId: number, expectedCheckinDate?: string, customNotes?: string): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.id, assetId));
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!asset || !user) return undefined;
    if (asset.status !== AssetStatus.AVAILABLE) return undefined;

    const today = new Date().toISOString().split("T")[0];

    const [updatedAsset] = await db.update(assets)
      .set({
        status: AssetStatus.DEPLOYED,
        assignedTo: userId,
        checkoutDate: today,
        expectedCheckinDate: expectedCheckinDate || null,
      })
      .where(eq(assets.id, assetId))
      .returning();

    if (updatedAsset) {
      // Create activity record
      await this.createActivity({
        action: "checkout",
        itemType: "asset",
        itemId: assetId,
        userId,
        timestamp: new Date().toISOString(),
        notes: customNotes || `Asset ${asset.name} (${asset.assetTag}) checked out to ${user.firstName} ${user.lastName}`,
      });
    }

    return updatedAsset;
  }

  async checkinAsset(assetId: number): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.id, assetId));

    if (!asset) return undefined;
    if (asset.status !== AssetStatus.DEPLOYED && asset.status !== AssetStatus.OVERDUE) return undefined;

    const [updatedAsset] = await db.update(assets)
      .set({
        status: AssetStatus.AVAILABLE,
        assignedTo: null,
        checkoutDate: null,
        expectedCheckinDate: null,
        knoxId: null, // Clear the Knox ID when checking in
      })
      .where(eq(assets.id, assetId))
      .returning();

    if (updatedAsset) {
      // Create activity record
      await this.createActivity({
        action: "checkin",
        itemType: "asset",
        itemId: assetId,
        userId: asset.assignedTo,
        timestamp: new Date().toISOString(),
        notes: `Asset ${asset.name} (${asset.assetTag}) checked in`,
      });
    }

    return updatedAsset;
  }

  // Activity operations
  async getActivities(): Promise<Activity[]> {
    // Order by timestamp descending for newest first
    return await db.select()
      .from(activities)
      .orderBy(activities.timestamp);
  }

  async getActivitiesByUser(userId: number): Promise<Activity[]> {
    return await db.select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(activities.timestamp);
  }

  async getActivitiesByAsset(assetId: number): Promise<Activity[]> {
    return await db.select()
      .from(activities)
      .where(eq(activities.itemId, assetId))
      .orderBy(activities.timestamp);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db.insert(activities).values(insertActivity).returning();
    return activity;
  }

  // Stats and summaries
  async getAssetStats(): Promise<AssetStats> {
    const allAssets = await db.select().from(assets);

    return {
      total: allAssets.length,
      checkedOut: allAssets.filter(asset => asset.status === AssetStatus.DEPLOYED).length,
      available: allAssets.filter(asset => asset.status === AssetStatus.AVAILABLE).length,
      pending: allAssets.filter(asset => asset.status === AssetStatus.PENDING).length,
      overdue: allAssets.filter(asset => asset.status === AssetStatus.OVERDUE).length,
      archived: allAssets.filter(asset => asset.status === AssetStatus.ARCHIVED).length,
    };
  }

  // Zabbix settings operations (stub implementations for now)
  async getZabbixSettings(): Promise<any> {
    return undefined;
  }

  async saveZabbixSettings(settings: any): Promise<any> {
    return settings;
  }

  // Zabbix subnet operations (stub implementations)
  async getZabbixSubnets(): Promise<any[]> {
    return [];
  }

  async getZabbixSubnet(id: number): Promise<any> {
    return undefined;
  }

  async createZabbixSubnet(subnet: any): Promise<any> {
    return subnet;
  }

  async deleteZabbixSubnet(id: number): Promise<boolean> {
    return true;
  }

  // VM monitoring operations (stub implementations)
  async getVMMonitoring(): Promise<any[]> {
    return [];
  }

  async getVMMonitoringByVMId(vmId: number): Promise<any> {
    return undefined;
  }

  async createVMMonitoring(monitoring: any): Promise<any> {
    return monitoring;
  }

  async updateVMMonitoring(id: number, monitoring: any): Promise<any> {
    return monitoring;
  }

  // Discovered hosts operations (stub implementations)
  async getDiscoveredHosts(): Promise<any[]> {
    return [];
  }

  async getDiscoveredHost(id: number): Promise<any> {
    return undefined;
  }

  async createDiscoveredHost(host: any): Promise<any> {
    return host;
  }

  async updateDiscoveredHost(id: number, host: any): Promise<any> {
    return host;
  }

  async deleteDiscoveredHost(id: number): Promise<boolean> {
    return true;
  }

  // BitLocker keys operations (stub implementations)
  async getBitlockerKeys(): Promise<any[]> {
    return [];
  }

  async getBitlockerKey(id: number): Promise<any> {
    return undefined;
  }

  async getBitlockerKeyBySerialNumber(serialNumber: string): Promise<any[]> {
    return [];
  }

  async getBitlockerKeyByIdentifier(identifier: string): Promise<any[]> {
    return [];
  }

  async createBitlockerKey(key: any): Promise<any> {
    return key;
  }

  async updateBitlockerKey(id: number, key: any): Promise<any> {
    return key;
  }

  async deleteBitlockerKey(id: number): Promise<boolean> {
    return true;
  }

  // VM Inventory operations - using PostgreSQL tables
  async getVmInventory(): Promise<any[]> {
    try {
      return await db.select().from(schema.vms);
    } catch (error) {
      console.error('Error fetching VM inventory:', error);
      return [];
    }
  }

  async getVmInventoryItem(id: number): Promise<any> {
    try {
      const [vm] = await db.select().from(schema.vms).where(eq(schema.vms.id, id));
      return vm;
    } catch (error) {
      console.error('Error fetching VM inventory item:', error);
      return undefined;
    }
  }

  async createVmInventoryItem(vm: any): Promise<any> {
    try {
      const [newVM] = await db.insert(schema.vms).values({
        vmName: vm.vmName,
        hostName: vm.hostName || vm.hostServer,
        guestOs: vm.guestOs || vm.operatingSystem,
        powerState: vm.powerState || vm.status || 'stopped',
        cpuCount: vm.cpuCount || vm.cpuCores,
        memoryMB: vm.memoryMB ? vm.memoryMB : (vm.memoryGb ? vm.memoryGb * 1024 : 1024),
        diskGB: vm.diskGB || vm.storageGb,
        ipAddress: vm.ipAddress,
        macAddress: vm.macAddress,
        vmwareTools: vm.vmwareTools,
        cluster: vm.cluster,
        datastore: vm.datastore,
        status: vm.status || 'available',
        assignedTo: vm.assignedTo,
        location: vm.location,
        serialNumber: vm.serialNumber,
        model: vm.model,
        manufacturer: vm.manufacturer,
        purchaseDate: vm.purchaseDate,
        purchaseCost: vm.purchaseCost,
        department: vm.department,
        description: vm.description || vm.purpose,
        createdDate: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        notes: vm.notes
      }).returning();

      // Create activity record
      await this.createActivity({
        action: "create",
        itemType: "vm",
        itemId: newVM.id,
        userId: null,
        timestamp: new Date().toISOString(),
        notes: `VM "${newVM.vmName}" created`,
      });

      return newVM;
    } catch (error) {
      console.error('Error creating VM inventory item:', error);
      throw error;
    }
  }

  async updateVmInventoryItem(id: number, vm: any): Promise<any> {
    try {
      const [existingVM] = await db.select().from(schema.vms).where(eq(schema.vms.id, id));
      if (!existingVM) return undefined;

      const updateData: any = {
        lastModified: new Date().toISOString()
      };

      // Map fields properly
      if (vm.vmName) updateData.vmName = vm.vmName;
      if (vm.hostName || vm.hostServer) updateData.hostName = vm.hostName || vm.hostServer;
      if (vm.guestOs || vm.operatingSystem) updateData.guestOs = vm.guestOs || vm.operatingSystem;
      if (vm.powerState || vm.status) updateData.powerState = vm.powerState || vm.status;
      if (vm.cpuCount || vm.cpuCores) updateData.cpuCount = vm.cpuCount || vm.cpuCores;
      if (vm.memoryMB) updateData.memoryMB = vm.memoryMB;
      else if (vm.memoryGb) updateData.memoryMB = vm.memoryGb * 1024;
      if (vm.diskGB || vm.storageGb) updateData.diskGB = vm.diskGB || vm.storageGb;
      if (vm.ipAddress) updateData.ipAddress = vm.ipAddress;
      if (vm.macAddress) updateData.macAddress = vm.macAddress;
      if (vm.vmwareTools) updateData.vmwareTools = vm.vmwareTools;
      if (vm.cluster) updateData.cluster = vm.cluster;
      if (vm.datastore) updateData.datastore = vm.datastore;
      if (vm.status) updateData.status = vm.status;
      if (vm.assignedTo) updateData.assignedTo = vm.assignedTo;
      if (vm.location) updateData.location = vm.location;
      if (vm.serialNumber) updateData.serialNumber = vm.serialNumber;
      if (vm.model) updateData.model = vm.model;
      if (vm.manufacturer) updateData.manufacturer = vm.manufacturer;
      if (vm.purchaseDate) updateData.purchaseDate = vm.purchaseDate;
      if (vm.purchaseCost) updateData.purchaseCost = vm.purchaseCost;
      if (vm.department) updateData.department = vm.department;
      if (vm.description || vm.purpose) updateData.description = vm.description || vm.purpose;
      if (vm.notes) updateData.notes = vm.notes;

      const [updatedVM] = await db.update(schema.vms)
        .set(updateData)
        .where(eq(schema.vms.id, id))
        .returning();

      // Create activity record
      await this.createActivity({
        action: "update",
        itemType: "vm",
        itemId: id,
        userId: null,
        timestamp: new Date().toISOString(),
        notes: `VM "${updatedVM.vmName}" updated`,
      });

      return updatedVM;
    } catch (error) {
      console.error('Error updating VM inventory item:', error);
      throw error;
    }
  }

  async deleteVmInventoryItem(id: number): Promise<boolean> {
    try {
      const [vm] = await db.select().from(schema.vms).where(eq(schema.vms.id, id));
      if (!vm) return false;

      await db.delete(schema.vms).where(eq(schema.vms.id, id));

      // Create activity record
      await this.createActivity({
        action: "delete",
        itemType: "vm",
        itemId: id,
        userId: null,
        timestamp: new Date().toISOString(),
        notes: `VM "${vm.vmName}" deleted`,
      });

      return true;
    } catch (error) {
      console.error('Error deleting VM inventory item:', error);
      return false;
    }
  }
}

// Removed duplicate initializeDatabase function - using the one from the DatabaseStorage class above