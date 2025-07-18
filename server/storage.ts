import { 
  users, activities, assets, licenses, accessories, components, consumables,
  zabbixSettings, zabbixSubnets, vmMonitoring, discoveredHosts, bitlockerKeys, vmInventory,
  type User, type InsertUser, 
  type Asset, type InsertAsset,
  type Activity, type InsertActivity,
  type License, type InsertLicense,
  type Accessory, type InsertAccessory,
  type Component, type InsertComponent,
  type Consumable, type InsertConsumable,
  type ZabbixSettings, type InsertZabbixSettings,
  type ZabbixSubnet, type InsertZabbixSubnet,
  type VMMonitoring, type InsertVMMonitoring,
  type VmInventory, type InsertVmInventory,
  type DiscoveredHost, type InsertDiscoveredHost,
  type LicenseAssignment, type InsertLicenseAssignment,
  type BitlockerKey, type InsertBitlockerKey,
  AssetStatus, LicenseStatus, AccessoryStatus, ConsumableStatus,
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Asset operations
  getAssets(): Promise<Asset[]>;
  getAsset(id: number): Promise<Asset | undefined>;
  getAssetByTag(assetTag: string): Promise<Asset | undefined>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  updateAsset(id: number, asset: Partial<InsertAsset>): Promise<Asset | undefined>;
  deleteAsset(id: number): Promise<boolean>;

  // Component operations
  getComponents(): Promise<Component[]>;
  getComponent(id: number): Promise<Component | undefined>;
  createComponent(component: InsertComponent): Promise<Component>;
  updateComponent(id: number, component: Partial<InsertComponent>): Promise<Component | undefined>;
  deleteComponent(id: number): Promise<boolean>;

  // Accessory operations
  getAccessories(): Promise<Accessory[]>;
  getAccessory(id: number): Promise<Accessory | undefined>;
  createAccessory(accessory: InsertAccessory): Promise<Accessory>;
  updateAccessory(id: number, accessory: Partial<InsertAccessory>): Promise<Accessory | undefined>;
  deleteAccessory(id: number): Promise<boolean>;

  // Consumable operations
  getConsumables(): Promise<Consumable[]>;
  getConsumable(id: number): Promise<Consumable | undefined>;
  createConsumable(consumable: InsertConsumable): Promise<Consumable>;
  updateConsumable(id: number, consumable: Partial<InsertConsumable>): Promise<Consumable | undefined>;
  deleteConsumable(id: number): Promise<boolean>;

  // License operations
  getLicenses(): Promise<License[]>;
  getLicense(id: number): Promise<License | undefined>;
  createLicense(license: InsertLicense): Promise<License>;
  updateLicense(id: number, license: Partial<InsertLicense>): Promise<License | undefined>;
  deleteLicense(id: number): Promise<boolean>;

  // License assignment operations
  getLicenseAssignments(licenseId: number): Promise<LicenseAssignment[]>;
  createLicenseAssignment(assignment: InsertLicenseAssignment): Promise<LicenseAssignment>;

  // Checkout/checkin operations
  checkoutAsset(assetId: number, userId: number, expectedCheckinDate?: string, customNotes?: string): Promise<Asset | undefined>;
  checkinAsset(assetId: number): Promise<Asset | undefined>;

  // Activity operations
  getActivities(): Promise<Activity[]>;
  getActivitiesByUser(userId: number): Promise<Activity[]>;
  getActivitiesByAsset(assetId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Zabbix settings operations
  getZabbixSettings(): Promise<ZabbixSettings | undefined>;
  saveZabbixSettings(settings: InsertZabbixSettings): Promise<ZabbixSettings>;

  // Zabbix subnet operations
  getZabbixSubnets(): Promise<ZabbixSubnet[]>;
  getZabbixSubnet(id: number): Promise<ZabbixSubnet | undefined>;
  createZabbixSubnet(subnet: InsertZabbixSubnet): Promise<ZabbixSubnet>;
  deleteZabbixSubnet(id: number): Promise<boolean>;

  // VM monitoring operations
  getVMMonitoring(): Promise<VMMonitoring[]>;
  getVMMonitoringByVMId(vmId: number): Promise<VMMonitoring | undefined>;
  createVMMonitoring(monitoring: InsertVMMonitoring): Promise<VMMonitoring>;
  updateVMMonitoring(id: number, monitoring: Partial<InsertVMMonitoring>): Promise<VMMonitoring | undefined>;

  // Discovered hosts operations
  getDiscoveredHosts(): Promise<DiscoveredHost[]>;
  getDiscoveredHost(id: number): Promise<DiscoveredHost | undefined>;
  createDiscoveredHost(host: InsertDiscoveredHost): Promise<DiscoveredHost>;
  updateDiscoveredHost(id: number, host: Partial<InsertDiscoveredHost>): Promise<DiscoveredHost | undefined>;
  deleteDiscoveredHost(id: number): Promise<boolean>;

  // Bitlocker keys operations
  getBitlockerKeys(): Promise<BitlockerKey[]>;
  getBitlockerKey(id: number): Promise<BitlockerKey | undefined>;
  getBitlockerKeyBySerialNumber(serialNumber: string): Promise<BitlockerKey[]>;
  getBitlockerKeyByIdentifier(identifier: string): Promise<BitlockerKey[]>;
  createBitlockerKey(key: InsertBitlockerKey): Promise<BitlockerKey>;
  updateBitlockerKey(id: number, key: Partial<InsertBitlockerKey>): Promise<BitlockerKey | undefined>;
  deleteBitlockerKey(id: number): Promise<boolean>;

  // VM Inventory operations
  getVmInventory(): Promise<VmInventory[]>;
  getVmInventoryItem(id: number): Promise<VmInventory | undefined>;
  createVmInventoryItem(vm: InsertVmInventory): Promise<VmInventory>;
  updateVmInventoryItem(id: number, vm: Partial<InsertVmInventory>): Promise<VmInventory | undefined>;
  deleteVmInventoryItem(id: number): Promise<boolean>;

  // Stats and summaries
  getAssetStats(): Promise<AssetStats>;

    // VM operations
    getVMs(): Promise<any[]>;
    getVM(id: number): Promise<any | null>;
    createVM(vmData: any): Promise<any>;
    updateVM(id: number, vmData: any): Promise<any | null>;
    deleteVM(id: number): Promise<boolean>;

    // System Settings methods
    getSystemSettings(): Promise<any>;
    updateSystemSettings(id: number, data: any): Promise<any>;
}

export interface AssetStats {
  total: number;
  checkedOut: number;
  available: number;
  pending: number;
  overdue: number;
  archived: number;
}

export class MemStorage implements IStorage {
  private usersData: Map<number, User>;
  private assetsData: Map<number, Asset>;
  private licensesData: Map<number, License>;
  private licenseAssignmentsData: Map<number, LicenseAssignment>;
  private activitiesData: Map<number, Activity>;
  private accessoriesData: Map<number, Accessory>;
  private componentsData: Map<number, Component>;
  private consumablesData: Map<number, Consumable>;
  private zabbixSettingsData: ZabbixSettings | undefined;
  private zabbixSubnetsData: Map<number, ZabbixSubnet>;
  private vmMonitoringData: Map<number, VMMonitoring>;
  private discoveredHostsData: Map<number, DiscoveredHost>;
  private bitlockerKeysData: Map<number, BitlockerKey>;
  private vmInventoryData: Map<number, VmInventory>;
  private zabbixSettings: any = null;
  private zabbixSubnets = new Map<number, any>();
  private consumableAssignments: any[] = [];

  private userCurrentId: number;
  private assetCurrentId: number;
  private licenseCurrentId: number;
  private licenseAssignmentCurrentId: number;
  private activityCurrentId: number;
  private accessoryCurrentId: number;
  private componentCurrentId: number;
  private consumableCurrentId: number;
  private zabbixSubnetCurrentId: number;
  private vmMonitoringCurrentId: number;
  private discoveredHostCurrentId: number;
  private bitlockerKeyCurrentId: number;
  private vmInventoryCurrentId: number;

  // VM Management
  private vms: any[] = [];

  constructor() {
    this.usersData = new Map();
    this.assetsData = new Map();
    this.licensesData = new Map();
    this.licenseAssignmentsData = new Map();
    this.activitiesData = new Map();
    this.accessoriesData = new Map();
    this.componentsData = new Map();
    this.consumablesData = new Map();
    this.zabbixSettingsData = undefined;
    this.zabbixSubnetsData = new Map();
    this.vmMonitoringData = new Map();
    this.discoveredHostsData = new Map();
    this.bitlockerKeysData = new Map();
    this.vmInventoryData = new Map();
    this.zabbixSettings = null;
    this.zabbixSubnets = new Map();

    this.userCurrentId = 1;
    this.assetCurrentId = 1;
    this.licenseCurrentId = 1;
    this.licenseAssignmentCurrentId = 1;
    this.activityCurrentId = 1;
    this.accessoryCurrentId = 1;
    this.componentCurrentId = 1;
    this.consumableCurrentId = 1;
    this.zabbixSubnetCurrentId = 1;
    this.vmMonitoringCurrentId = 1;
    this.discoveredHostCurrentId = 1;
    this.bitlockerKeyCurrentId = 1;
    this.vmInventoryCurrentId = 1;

    // Initialize with sample admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      firstName: "Admin",
      lastName: "User",
      email: "admin@example.com",
      isAdmin: true,
      department: "IT"
    });
  }

  // User operations
  async getUsers(): Promise<User[]> {
    return Array.from(this.usersData.values());
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.usersData.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersData.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { 
      ...insertUser, 
      id,
      department: insertUser.department || null,
      isAdmin: insertUser.isAdmin || false,
      roleId: insertUser.roleId || null
    };
    this.usersData.set(id, user);
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.usersData.get(id);
    if (!user) return undefined;

    const updatedUser: User = { ...user, ...updateData };
    this.usersData.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.usersData.delete(id);
  }

  // Asset operations
  async getAssets(): Promise<Asset[]> {
    return Array.from(this.assetsData.values());
  }

  async getAsset(id: number): Promise<Asset | undefined> {
    return this.assetsData.get(id);
  }

  async getAssetByTag(assetTag: string): Promise<Asset | undefined> {
    return Array.from(this.assetsData.values()).find(
      (asset) => asset.assetTag === assetTag,
    );
  }

  async createAsset(insertAsset: InsertAsset): Promise<Asset> {
    const id = this.assetCurrentId++;
    const asset: Asset = { 
      ...insertAsset, 
      id,
      description: insertAsset.description || null,
      purchaseDate: insertAsset.purchaseDate || null,
      purchaseCost: insertAsset.purchaseCost || null,
      location: insertAsset.location || null,
      serialNumber: insertAsset.serialNumber || null,
      model: insertAsset.model || null,
      manufacturer: insertAsset.manufacturer || null,
      notes: insertAsset.notes || null,
      knoxId: insertAsset.knoxId || null,
      ipAddress: insertAsset.ipAddress || null,
      macAddress: insertAsset.macAddress || null,
      osType: insertAsset.osType || null,
      assignedTo: insertAsset.assignedTo || null,
      checkoutDate: insertAsset.checkoutDate || null,
      expectedCheckinDate: insertAsset.expectedCheckinDate || null,
      financeUpdated: insertAsset.financeUpdated || false
    };
    this.assetsData.set(id, asset);
    return asset;
  }

  async updateAsset(id: number, updateData: Partial<InsertAsset>): Promise<Asset | undefined> {
    const asset = this.assetsData.get(id);
    if (!asset) return undefined;

    const updatedAsset: Asset = { ...asset, ...updateData };
    this.assetsData.set(id, updatedAsset);
    return updatedAsset;
  }

  async deleteAsset(id: number): Promise<boolean> {
    return this.assetsData.delete(id);
  }

  // Component operations
  async getComponents(): Promise<Component[]> {
    return Array.from(this.componentsData.values());
  }

  async getComponent(id: number): Promise<Component | undefined> {
    return this.componentsData.get(id);
  }

  async createComponent(insertComponent: InsertComponent): Promise<Component> {
    const id = this.componentCurrentId++;
    const component: Component = { 
      ...insertComponent, 
      id,
      description: insertComponent.description || null,
      location: insertComponent.location || null,
      serialNumber: insertComponent.serialNumber || null,
      model: insertComponent.model || null,
      manufacturer: insertComponent.manufacturer || null,
      purchaseDate: insertComponent.purchaseDate || null,
      purchaseCost: insertComponent.purchaseCost || null,
      dateReleased: insertComponent.dateReleased || null,
      dateReturned: insertComponent.dateReturned || null,
      releasedBy: insertComponent.releasedBy || null,
      returnedTo: insertComponent.returnedTo || null,
      notes: insertComponent.notes || null
    };
    this.componentsData.set(id, component);

    // Create activity record
    this.createActivity({
      action: "create",
      itemType: "component",
      itemId: id,
      userId: null,
      timestamp: new Date().toISOString(),
      notes: `Component "${component.name}" created`,
    });

    return component;
  }

  async updateComponent(id: number, updateData: Partial<InsertComponent>): Promise<Component | undefined> {
    const component = this.componentsData.get(id);
    if (!component) return undefined;

    const updatedComponent: Component = { ...component, ...updateData };
    this.componentsData.set(id, updatedComponent);

    // Create activity record
    this.createActivity({
      action: "update",
      itemType: "component",
      itemId: id,
      userId: null,
      timestamp: new Date().toISOString(),
      notes: `Component "${component.name}" updated`,
    });

    return updatedComponent;
  }

  async deleteComponent(id: number): Promise<boolean> {
    const component = this.componentsData.get(id);
    if (!component) return false;

    const result = this.componentsData.delete(id);

    if (result) {
      // Create activity record
      this.createActivity({
        action: "delete",
        itemType: "component",
        itemId: id,
        userId: null,
        timestamp: new Date().toISOString(),
        notes: `Component "${component.name}" deleted`,
      });
    }

    return result;
  }

  // Accessory operations
  async getAccessories(): Promise<Accessory[]> {
    return Array.from(this.accessoriesData.values());
  }

  async getAccessory(id: number): Promise<Accessory | undefined> {
    return this.accessoriesData.get(id);
  }

  async createAccessory(insertAccessory: InsertAccessory): Promise<Accessory> {
    const id = this.accessoryCurrentId++;
    const accessory: Accessory = { 
      ...insertAccessory, 
      id,
      description: insertAccessory.description || null,
      location: insertAccessory.location || null,
      serialNumber: insertAccessory.serialNumber || null,
      model: insertAccessory.model || null,
      manufacturer: insertAccessory.manufacturer || null,
      purchaseDate: insertAccessory.purchaseDate || null,
      purchaseCost: insertAccessory.purchaseCost || null,
      assignedTo: insertAccessory.assignedTo || null,
      knoxId: insertAccessory.knoxId || null,
      dateReleased: insertAccessory.dateReleased || null,
      dateReturned: insertAccessory.dateReturned || null,
      releasedBy: insertAccessory.releasedBy || null,
      returnedTo: insertAccessory.returnedTo || null,
      notes: insertAccessory.notes || null
    };
    this.accessoriesData.set(id, accessory);

    // Create activity record
    this.createActivity({
      action: "create",
      itemType: "accessory",
      itemId: id,
      userId: null,
      timestamp: new Date().toISOString(),
      notes: `Accessory "${accessory.name}" created`,
    });

    return accessory;
  }

  async updateAccessory(id: number, updateData: Partial<InsertAccessory>): Promise<Accessory | undefined> {
    const accessory = this.accessoriesData.get(id);
    if (!accessory) return undefined;

    const updatedAccessory: Accessory = { ...accessory, ...updateData };
    this.accessoriesData.set(id, updatedAccessory);

    // Create activity record
    this.createActivity({
      action: "update",
      itemType: "accessory",
      itemId: id,
      userId: null,
      timestamp: new Date().toISOString(),
      notes: `Accessory "${accessory.name}" updated`,
    });

    return updatedAccessory;
  }

  async deleteAccessory(id: number): Promise<boolean> {
    const accessory = this.accessoriesData.get(id);
    if (!accessory) return false;

    const result = this.accessoriesData.delete(id);

    if (result) {
      // Create activity record
      this.createActivity({
        action: "delete",
        itemType: "accessory",
        itemId: id,
        userId: null,
        timestamp: new Date().toISOString(),
        notes: `Accessory "${accessory.name}" deleted`,
      });
    }

    return result;
  }

  // Consumable operations
  async getConsumables(): Promise<Consumable[]> {
    return Array.from(this.consumablesData.values());
  }

  async getConsumable(id: number): Promise<Consumable | undefined> {
    return this.consumablesData.get(id);
  }

  async createConsumable(insertConsumable: InsertConsumable): Promise<Consumable> {
    const id = this.consumableCurrentId++;
    const consumable: Consumable = { 
      ...insertConsumable, 
      id,
      status: insertConsumable.status || ConsumableStatus.AVAILABLE,
      location: insertConsumable.location || null,
      modelNumber: insertConsumable.modelNumber || null,
      manufacturer: insertConsumable.manufacturer || null,
      purchaseDate: insertConsumable.purchaseDate || null,
      purchaseCost: insertConsumable.purchaseCost || null,
      notes: insertConsumable.notes || null,
      quantity: insertConsumable.quantity || 1
    };
    this.consumablesData.set(id, consumable);

    // Create activity record
    this.createActivity({
      action: "create",
      itemType: "consumable",
      itemId: id,
      userId: null,
      timestamp: new Date().toISOString(),
      notes: `Consumable "${consumable.name}" created`,
    });

    return consumable;
  }

  async updateConsumable(id: number, updateData: Partial<InsertConsumable>): Promise<Consumable | undefined> {
    const consumable = this.consumablesData.get(id);
    if (!consumable) return undefined;

    const updatedConsumable: Consumable = { ...consumable, ...updateData };
    this.consumablesData.set(id, updatedConsumable);

    // Create activity record
    this.createActivity({
      action: "update",
      itemType: "consumable",
      itemId: id,
      userId: null,
      timestamp: new Date().toISOString(),
      notes: `Consumable "${consumable.name}" updated`,
    });

    return updatedConsumable;
  }

  async deleteConsumable(id: number): Promise<boolean> {
    try {
      const consumables = this.getConsumables();
      this.consumables = this.consumables.filter(c => c.id !== id);
      return true;
    } catch (error) {
      console.error('Error deleting consumable:', error);
      return false;
    }
  }

  async assignConsumable(consumableId: number, assignmentData: any): Promise<any> {
    const assignment = {
      id: this.consumableAssignments.length + 1,
      consumableId,
      assignedTo: assignmentData.assignedTo,
      serialNumber: assignmentData.serialNumber,
      knoxId: assignmentData.knoxId,
      quantity: assignmentData.quantity || 1,
      assignedDate: new Date().toISOString(),
      status: 'assigned',
      notes: assignmentData.notes
    };

    this.consumableAssignments.push(assignment);
    return assignment;
  }

  // System Settings methods
  async getSystemSettings(): Promise<any> {
    // For in-memory storage, return default settings
    return {
      id: 1,
      siteName: "SRPH-MIS",
      defaultLanguage: "english",
      defaultTimezone: "UTC",
      dateFormat: "yyyy-mm-dd",
      autoBackupEnabled: false,
      cacheEnabled: true,
      colorScheme: "default",
      enableAdminNotifications: true,
      notifyOnCheckout: true,
      notifyOnOverdue: true,
      passwordMinLength: 8,
      requireSpecialChar: false,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      maxLoginAttempts: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async updateSystemSettings(id: number, data: any): Promise<any> {
    // For in-memory storage, just return the updated data
    return {
      ...data,
      id,
      updatedAt: new Date().toISOString()
    };
  }

  // License operations
  async getLicenses(): Promise<License[]> {
    return Array.from(this.licensesData.values());
  }

  async getLicense(id: number): Promise<License | undefined> {
    return this.licensesData.get(id);
  }

  async createLicense(insertLicense: InsertLicense): Promise<License> {
    const id = this.licenseCurrentId++;
    const license: License = { 
      ...insertLicense, 
      id,
      purchaseDate: insertLicense.purchaseDate || null,
      purchaseCost: insertLicense.purchaseCost || null,
      manufacturer: insertLicense.manufacturer || null,
      notes: insertLicense.notes || null,
      assignedTo: insertLicense.assignedTo || null,
      seats: insertLicense.seats || null,
      assignedSeats: insertLicense.assignedSeats || 0,
      company: insertLicense.company || null,
      expirationDate: insertLicense.expirationDate || null
    };
    this.licensesData.set(id, license);

    // Create activity record
    this.createActivity({
      action: "create",
      itemType: "license",
      itemId: id,
      userId: null,
      timestamp: new Date().toISOString(),
      notes: `License "${license.name}" created`,
    });

    return license;
  }

  async updateLicense(id: number, updateData: Partial<InsertLicense>): Promise<License | undefined> {
    const license = this.licensesData.get(id);
    if (!license) return undefined;

    const updatedLicense: License = { ...license, ...updateData };
    this.licensesData.set(id, updatedLicense);

    // Create activity record
    this.createActivity({
      action: "update",
      itemType: "license",
      itemId: id,
      userId: null,
      timestamp: new Date().toISOString(),
      notes: `License "${license.name}" updated`,
    });

    return updatedLicense;
  }

  async deleteLicense(id: number): Promise<boolean> {
    const license = this.licensesData.get(id);
    if (!license) return false;

    const result = this.licensesData.delete(id);

    if (result) {
      // Create activity record
      this.createActivity({
        action: "delete",
        itemType: "license",
        itemId: id,
        userId: null,
        timestamp: new Date().toISOString(),
        notes: `License "${license.name}" deleted`,
      });
    }

    return result;
  }

  // License assignment operations  
  async getLicenseAssignments(licenseId: number): Promise<LicenseAssignment[]> {
    return Array.from(this.licenseAssignmentsData.values())
      .filter(assignment => assignment.licenseId === licenseId);
  }

  async createLicenseAssignment(insertAssignment: InsertLicenseAssignment): Promise<LicenseAssignment> {
    const id = this.licenseAssignmentCurrentId++;
    const assignment: LicenseAssignment = { 
      ...insertAssignment, 
      id,
      notes: insertAssignment.notes || null
    };
    this.licenseAssignmentsData.set(id, assignment);

    const license = await this.getLicense(assignment.licenseId);
    if (license) {
      // Increment the assignedSeats count
      await this.updateLicense(license.id, {
        assignedSeats: (license.assignedSeats || 0) + 1
      });
    }

    return assignment;
  }

  // Checkout/Checkin operations
  async checkoutAsset(assetId: number, userId: number, expectedCheckinDate?: string, customNotes?: string): Promise<Asset | undefined> {
    const asset = await this.getAsset(assetId);
    if (!asset) return undefined;

    // Cannot checkout an asset that is already checked out
    if (asset.status === AssetStatus.DEPLOYED) return undefined;

    // Update the asset
    const updatedAsset: Asset = { 
      ...asset,
      status: AssetStatus.DEPLOYED,
      assignedTo: userId,
      checkoutDate: new Date().toISOString(),
      expectedCheckinDate: expectedCheckinDate || null
    };

    this.assetsData.set(assetId, updatedAsset);

    // Create activity record
    await this.createActivity({
      action: "checkout",
      itemType: "asset",
      itemId: assetId,
      userId,
      timestamp: new Date().toISOString(),
      notes: customNotes || `Asset checked out to user ID: ${userId}`
    });

    return updatedAsset;
  }

  async checkinAsset(assetId: number): Promise<Asset | undefined> {
    const asset = await this.getAsset(assetId);
    if (!asset) return undefined;

    // Cannot checkin an asset that is not checked out
    if (asset.status !== AssetStatus.DEPLOYED) return undefined;

    const userId = asset.assignedTo;

    // Update the asset
    const updatedAsset: Asset = { 
      ...asset,
      status: AssetStatus.AVAILABLE,
      assignedTo: null,
      checkoutDate: null,
      expectedCheckinDate: null
    };

    this.assetsData.set(assetId, updatedAsset);

    // Create activity record
    await this.createActivity({
      action: "checkin",
      itemType: "asset",
      itemId: assetId,
      userId: userId || null,
      timestamp: new Date().toISOString(),
      notes: `Asset checked in from user ID: ${userId || 'Unknown'}`
    });

    return updatedAsset;
  }

  // Activity operations
  async getActivities(): Promise<Activity[]> {
    return Array.from(this.activitiesData.values());
  }

  async getActivitiesByUser(userId: number): Promise<Activity[]> {
    return Array.from(this.activitiesData.values())
      .filter(activity => activity.userId === userId);
  }

  async getActivitiesByAsset(assetId: number): Promise<Activity[]> {
    return Array.from(this.activitiesData.values())
      .filter(activity => activity.itemType === 'asset' && activity.itemId === assetId);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.activityCurrentId++;
    const activity: Activity = { 
      ...insertActivity, 
      id,
      notes: insertActivity.notes || null,
      userId: insertActivity.userId !== undefined ? insertActivity.userId : null
    };
    this.activitiesData.set(id, activity);
    return activity;
  }

  // Bitlocker keys operations
  async getBitlockerKeys(): Promise<BitlockerKey[]> {
    return Array.from(this.bitlockerKeysData.values());
  }

  async getBitlockerKey(id: number): Promise<BitlockerKey | undefined> {
    return this.bitlockerKeysData.get(id);
  }

  async getBitlockerKeyBySerialNumber(serialNumber: string): Promise<BitlockerKey[]> {
    return Array.from(this.bitlockerKeysData.values()).filter(
      (key) => key.serialNumber.toLowerCase().includes(serialNumber.toLowerCase())
    );
  }

  async getBitlockerKeyByIdentifier(identifier: string): Promise<BitlockerKey[]> {
    return Array.from(this.bitlockerKeysData.values()).filter(
      (key) => key.identifier.toLowerCase().includes(identifier.toLowerCase())
    );
  }

  async createBitlockerKey(insertKey: InsertBitlockerKey): Promise<BitlockerKey> {
    const id = this.bitlockerKeyCurrentId++;
    const now = new Date();

    const bitlockerKey: BitlockerKey = { 
      ...insertKey, 
      id,
      assetId: insertKey.assetId || null,
      notes: insertKey.notes || null,
      dateAdded: insertKey.dateAdded || now,
      updatedAt: insertKey.updatedAt || now
    };

    this.bitlockerKeysData.set(id, bitlockerKey);

    // Create activity record
    this.createActivity({
      action: "create",
      itemType: "bitlocker",
      itemId: id,
      userId: null,
      timestamp: new Date().toISOString(),
      notes: `Bitlocker key for serial "${bitlockerKey.serialNumber}" created`,
    });

    return bitlockerKey;
  }

  async updateBitlockerKey(id: number, updateData: Partial<InsertBitlockerKey>): Promise<BitlockerKey | undefined> {
    const key = this.bitlockerKeysData.get(id);
    if (!key) return undefined;

    const updatedKey: BitlockerKey = { 
      ...key, 
      ...updateData,
      updatedAt: new Date()
    };

    this.bitlockerKeysData.set(id, updatedKey);

    // Create activity record
    this.createActivity({
      action: "update",
      itemType: "bitlocker",
      itemId: id,
      userId: null,
      timestamp: new Date().toISOString(),
      notes: `Bitlocker key for serial "${key.serialNumber}" updated`,
    });

    return updatedKey;
  }

  async deleteBitlockerKey(id: number): Promise<boolean> {
    const key = this.bitlockerKeysData.get(id);
    if (!key) return false;

    const result = this.bitlockerKeysData.delete(id);

    if (result) {
      // Create activity record
      this.createActivity({
        action: "delete",
        itemType: "bitlocker",
        itemId: id,
        userId: null,
        timestamp: new Date().toISOString(),
        notes: `Bitlocker key for serial "${key.serialNumber}" deleted`,
      });
    }

    return result;
  }

  // VM Inventory operations
  async getVmInventory(): Promise<VmInventory[]> {
    return Array.from(this.vmInventoryData.values());
  }

  async getVmInventoryItem(id: number): Promise<VmInventory | undefined> {
    return this.vmInventoryData.get(id);
  }

  async createVmInventoryItem(vm: InsertVmInventory): Promise<VmInventory> {
    const id = this.vmInventoryCurrentId++;
    const now = new Date().toISOString();

    const newVm: VmInventory = {
      id,
      ...vm,
      lastModified: now,
    };

    this.vmInventoryData.set(id, newVm);

    // Create activity record
    this.createActivity({
      action: "create",
      itemType: "vm",
      itemId: id,
      userId: null,
      timestamp: now,
      notes: `VM "${vm.vmName}" added to inventory`,
    });

    return newVm;
  }

  async updateVmInventoryItem(id: number, vm: Partial<InsertVmInventory>): Promise<VmInventory | undefined> {
    const existingVm = this.vmInventoryData.get(id);
    if (!existingVm) return undefined;

    const now = new Date().toISOString();
    const updatedVm: VmInventory = {
      ...existingVm,
      ...vm,
      lastModified: now,
    };

    this.vmInventoryData.set(id, updatedVm);

    // Create activity record
    this.createActivity({
      action: "update",
      itemType: "vm",
      itemId: id,
      userId: null,
      timestamp: now,
      notes: `VM "${updatedVm.vmName}" updated`,
    });

    return updatedVm;
  }

  async deleteVmInventoryItem(id: number): Promise<boolean> {
    const vm = this.vmInventoryData.get(id);
    if (!vm) return false;

    const result = this.vmInventoryData.delete(id);

    if (result) {
      // Create activity record
      this.createActivity({
        action: "delete",
        itemType: "vm",
        itemId: id,
        userId: null,
        timestamp: new Date().toISOString(),
        notes: `VM "${vm.vmName}" deleted from inventory`,
      });
    }

    return result;
  }

  // VM Management methods
  async getVMs(): Promise<any[]> {
    return this.vms;
  }

  async getVM(id: number): Promise<any | null> {
    return this.vms.find(vm => vm.id === id) || null;
  }

  async createVM(vmData: any): Promise<any> {
    const vm = {
      id: this.vms.length + 1,
      ...vmData,
      createdDate: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    this.vms.push(vm);
    return vm;
  }

  async updateVM(id: number, vmData: any): Promise<any | null> {
    const index = this.vms.findIndex(vm => vm.id === id);
    if (index === -1) return null;

    this.vms[index] = {
      ...this.vms[index],
      ...vmData,
      lastModified: new Date().toISOString()
    };

    return this.vms[index];
  }

  async deleteVM(id: number): Promise<boolean> {
    const index = this.vms.findIndex(vm => vm.id === id);
    if (index === -1) return false;

    this.vms.splice(index, 1);
    return true;
  }

  // Stats operations
  async getAssetStats(): Promise<AssetStats> {
    const assets = await this.getAssets();
    return {
      total: assets.length,
      checkedOut: assets.filter(asset => asset.status === AssetStatus.DEPLOYED).length,
      available: assets.filter(asset => asset.status === AssetStatus.AVAILABLE).length,      pending: assets.filter(asset => asset.status === AssetStatus.PENDING).length,
      overdue: assets.filter(asset => asset.status === AssetStatus.OVERDUE).length,
      archived: assets.filter(asset => asset.status === AssetStatus.ARCHIVED).length,
    };
  }

  // Zabbix settings operations
  async getZabbixSettings(): Promise<ZabbixSettings | undefined> {
    return this.zabbixSettingsData;
  }

  async saveZabbixSettings(settings: InsertZabbixSettings): Promise<ZabbixSettings> {
    const zabbixSettings: ZabbixSettings = {
      ...settings,
      id: 1, // Only one row for settings
      updatedAt: new Date().toISOString()
    };
    this.zabbixSettingsData = zabbixSettings;

    // Create activity record
    this.createActivity({
      action: "update",
      itemType: "settings",
      itemId: 1,
      userId: null,
      timestamp: new Date().toISOString(),
      notes: "Zabbix integration settings updated",
    });

    return zabbixSettings;
  }

  // Zabbix subnet operations
  async getZabbixSubnets(): Promise<ZabbixSubnet[]> {
    return Array.from(this.zabbixSubnetsData.values());
  }

  async getZabbixSubnet(id: number): Promise<ZabbixSubnet | undefined> {
    return this.zabbixSubnetsData.get(id);
  }

  async createZabbixSubnet(subnet: InsertZabbixSubnet): Promise<ZabbixSubnet> {
    const id = this.zabbixSubnetCurrentId++;
    const zabbixSubnet: ZabbixSubnet = {
      ...subnet,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.zabbixSubnetsData.set(id, zabbixSubnet);

    // Create activity record
    this.createActivity({
      action: "create",
      itemType: "subnet",
      itemId: id,
      userId: null,
      timestamp: new Date().toISOString(),
      notes: `CIDR range "${subnet.cidrRange}" added for monitoring`,
    });

    return zabbixSubnet;
  }

  async deleteZabbixSubnet(id: number): Promise<boolean> {
    const subnet = this.zabbixSubnetsData.get(id);
    if (!subnet) return false;

    const result = this.zabbixSubnetsData.delete(id);

    if (result) {
      // Create activity record
      this.createActivity({
        action: "delete",
        itemType: "subnet",
        itemId: id,
        userId: null,
        timestamp: new Date().toISOString(),
        notes: `CIDR range "${subnet.cidrRange}" removed from monitoring`,
      });
    }

    return result;
  }

  // VM monitoring operations
  async getVMMonitoring(): Promise<VMMonitoring[]> {
    return Array.from(this.vmMonitoringData.values());
  }

  async getVMMonitoringByVMId(vmId: number): Promise<VMMonitoring | undefined> {
    return Array.from(this.vmMonitoringData.values()).find(vm => vm.vmId === vmId);
  }

  async createVMMonitoring(monitoring: InsertVMMonitoring): Promise<VMMonitoring> {
    const id = this.vmMonitoringCurrentId++;
    const vmMonitoring: VMMonitoring = {
      ...monitoring,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.vmMonitoringData.set(id, vmMonitoring);

    return vmMonitoring;
  }

  async updateVMMonitoring(id: number, updateData: Partial<InsertVMMonitoring>): Promise<VMMonitoring | undefined> {
    const vmMonitoring = this.vmMonitoringData.get(id);
    if (!vmMonitoring) return undefined;

    const updatedVMMonitoring: VMMonitoring = {
      ...vmMonitoring,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    this.vmMonitoringData.set(id, updatedVMMonitoring);

    return updatedVMMonitoring;
  }

  // Discovered hosts operations
  async getDiscoveredHosts(): Promise<DiscoveredHost[]> {
    return Array.from(this.discoveredHostsData.values());
  }

  async getDiscoveredHost(id: number): Promise<DiscoveredHost | undefined> {
    return this.discoveredHostsData.get(id);
  }

  async createDiscoveredHost(host: InsertDiscoveredHost): Promise<DiscoveredHost> {
    const id = this.discoveredHostCurrentId++;
    const discoveredHost: DiscoveredHost = {
      ...host,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.discoveredHostsData.set(id, discoveredHost);

    return discoveredHost;
  }

  async updateDiscoveredHost(id: number, updateData: Partial<InsertDiscoveredHost>): Promise<DiscoveredHost | undefined> {
    const discoveredHost = this.discoveredHostsData.get(id);
    if (!discoveredHost) return undefined;

    const updatedDiscoveredHost: DiscoveredHost = {
      ...discoveredHost,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    this.discoveredHostsData.set(id, updatedDiscoveredHost);

    return updatedDiscoveredHost;
  }

  async deleteDiscoveredHost(id: number): Promise<boolean> {
    return this.discoveredHostsData.delete(id);
  }
}

// Use the MemStorage for persistence (with better data handling)
export const storage = new MemStorage();