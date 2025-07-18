import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  department: text("department"),
  isAdmin: boolean("is_admin").default(false),
  roleId: integer("role_id"),
  permissions: json("permissions").$type<UserPermissions>().default({
    assets: { view: true, edit: false, add: false },
    components: { view: true, edit: false, add: false },
    accessories: { view: true, edit: false, add: false },
    consumables: { view: true, edit: false, add: false },
    licenses: { view: true, edit: false, add: false },
    users: { view: false, edit: false, add: false },
    reports: { view: true, edit: false, add: false },
    vmMonitoring: { view: true, edit: false, add: false },
    networkDiscovery: { view: true, edit: false, add: false },
    bitlockerKeys: { view: false, edit: false, add: false },
    admin: { view: false, edit: false, add: false }
  }),
});

// Permission types
export type PagePermission = {
  view: boolean;
  edit: boolean;
  add: boolean;
};

export type UserPermissions = {
  assets: PagePermission;
  components: PagePermission;
  accessories: PagePermission;
  consumables: PagePermission;
  licenses: PagePermission;
  users: PagePermission;
  reports: PagePermission;
  vmMonitoring: PagePermission;
  networkDiscovery: PagePermission;
  bitlockerKeys: PagePermission;
  admin: PagePermission;
};

// Asset schema
export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  assetTag: text("asset_tag").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  status: text("status").notNull(), // available, deployed, pending, overdue, archived, defective
  condition: text("condition").notNull().default("Good"), // Good, Bad
  purchaseDate: text("purchase_date"),
  purchaseCost: text("purchase_cost"),
  location: text("location"),
  serialNumber: text("serial_number"),
  model: text("model"),
  manufacturer: text("manufacturer"),
  notes: text("notes"),
  knoxId: text("knox_id"),
  ipAddress: text("ip_address"),
  macAddress: text("mac_address"),
  osType: text("os_type"),
  assignedTo: integer("assigned_to").references(() => users.id),
  checkoutDate: text("checkout_date"),
  expectedCheckinDate: text("expected_checkin_date"),
  financeUpdated: boolean("finance_updated").default(false),
  department: text("department"),
});

// Components schema
export const components = pgTable("components", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  quantity: integer("quantity").notNull().default(0),
  description: text("description"),
  location: text("location"),
  serialNumber: text("serial_number"),
  model: text("model"),
  manufacturer: text("manufacturer"),
  purchaseDate: text("purchase_date"),
  purchaseCost: text("purchase_cost"),
  dateReleased: text("date_released"),
  dateReturned: text("date_returned"),
  releasedBy: text("released_by"),
  returnedTo: text("returned_to"),
  notes: text("notes"),
});

// Accessories schema
export const accessories = pgTable("accessories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  status: text("status").notNull(), // available, borrowed, returned, defective
  quantity: integer("quantity").notNull().default(1),
  description: text("description"),
  location: text("location"),
  serialNumber: text("serial_number"),
  model: text("model"),
  manufacturer: text("manufacturer"),
  purchaseDate: text("purchase_cost"),
  purchaseCost: text("purchase_cost"),
  assignedTo: integer("assigned_to").references(() => users.id),
  knoxId: text("knox_id"),  // Added KnoxID field
  dateReleased: text("date_released"),
  dateReturned: text("date_returned"),
  releasedBy: text("released_by"),
  returnedTo: text("returned_to"),
  notes: text("notes"),
});

// Consumables schema
export const consumables = pgTable("consumables", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  quantity: integer("quantity").notNull().default(1),
  status: text("status").notNull().default('available'), // available, in_use
  location: text("location"),
  modelNumber: text("model_number"),
  manufacturer: text("manufacturer"),
  purchaseDate: text("purchase_date"),
  purchaseCost: text("purchase_cost"),
  notes: text("notes"),
});

// Licenses schema
export const licenses = pgTable("licenses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  key: text("key").notNull(),
  seats: text("seats"),
  assignedSeats: integer("assigned_seats").default(0),
  company: text("company"),
  manufacturer: text("manufacturer"),
  purchaseDate: text("purchase_date"),
  expirationDate: text("expiration_date"),
  purchaseCost: text("purchase_cost"),
  status: text("status").notNull(), // active, expired, unused
  notes: text("notes"),
  assignedTo: integer("assigned_to").references(() => users.id),
});

// License Assignments schema
export const licenseAssignments = pgTable("license_assignments", {
  id: serial("id").primaryKey(),
  licenseId: integer("license_id").references(() => licenses.id).notNull(),
  assignedTo: text("assigned_to").notNull(),
  notes: text("notes"),
  assignedDate: text("assigned_date").notNull(),
});

// Consumable Assignments schema
export const consumableAssignments = pgTable("consumable_assignments", {
  id: serial("id").primaryKey(),
  consumableId: integer("consumable_id").references(() => consumables.id).notNull(),
  assignedTo: text("assigned_to").notNull(),
  serialNumber: text("serial_number"),
  knoxId: text("knox_id"),
  quantity: integer("quantity").notNull().default(1),
  assignedDate: text("assigned_date").notNull(),
  returnedDate: text("returned_date"),
  status: text("status").notNull().default('assigned'), // assigned, returned
  notes: text("notes"),
});

// Activities schema
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(), // checkout, checkin, create, update, delete
  itemType: text("item_type").notNull(), // asset, user, license, component, accessory
  itemId: integer("item_id").notNull(),
  userId: integer("user_id").references(() => users.id),
  timestamp: text("timestamp").notNull(),
  notes: text("notes"),
});

// VM Inventory schema
export const vmInventory = pgTable("vm_inventory", {
  id: serial("id").primaryKey(),
  vmName: text("vm_name").notNull(),
  hostName: text("host_name").notNull(),
  guestOs: text("guest_os").notNull(),
  powerState: text("power_state").notNull(),
  cpuCount: integer("cpu_count"),
  memoryMB: integer("memory_mb"),
  diskGB: integer("disk_gb"),
  ipAddress: text("ip_address"),
  macAddress: text("mac_address"),
  vmwareTools: text("vmware_tools"),
  cluster: text("cluster"),
  datastore: text("datastore"),
  createdDate: text("created_date"),
  lastModified: text("last_modified"),
  notes: text("notes"),
});

// VM Table - for proper VM management and assignments
export const vms = pgTable("vms", {
  id: serial("id").primaryKey(),
  vmName: text("vm_name").notNull(),
  hostName: text("host_name").notNull(),
  guestOs: text("guest_os").notNull(),
  powerState: text("power_state").notNull().default("stopped"),
  cpuCount: integer("cpu_count").default(1),
  memoryMB: integer("memory_mb").default(1024),
  diskGB: integer("disk_gb").default(20),
  ipAddress: text("ip_address"),
  macAddress: text("mac_address"),
  vmwareTools: text("vmware_tools"),
  cluster: text("cluster"),
  datastore: text("datastore"),
  status: text("status").notNull().default("available"), // available, deployed, maintenance
  assignedTo: integer("assigned_to").references(() => users.id),
  location: text("location"),
  serialNumber: text("serial_number"),
  model: text("model"),
  manufacturer: text("manufacturer"),
  purchaseDate: text("purchase_date"),
  purchaseCost: text("purchase_cost"),
  department: text("department"),
  description: text("description"),
  createdDate: text("created_date").default(new Date().toISOString()),
  lastModified: text("last_modified").default(new Date().toISOString()),
  notes: text("notes"),
});



// Status and category enums - moved before usage
export const AssetStatus = {
  AVAILABLE: "available",
  DEPLOYED: "deployed", 
  PENDING: "pending",
  OVERDUE: "overdue",
  ARCHIVED: "archived",
  ON_HAND: "on-hand",
} as const;

export const AccessoryStatus = {
  AVAILABLE: "available",
  BORROWED: "borrowed",
  RETURNED: "returned",
  DEFECTIVE: "defective",
} as const;

export const ConsumableStatus = {
  AVAILABLE: "available",
  IN_USE: "in_use",
} as const;

export const LicenseStatus = {
  ACTIVE: "active",
  EXPIRED: "expired",
  UNUSED: "unused",
} as const;

export const AssetCategories = {
  LAPTOP: "Laptop",
  DESKTOP: "Desktop",
  MOBILE: "Mobile",
  MONITOR: "Monitor",
  TABLET: "Tablet",
  ACCESSORY: "Accessory",
  LICENSE: "License",
  OTHER: "Other",
} as const;

export const AssetConditions = {
  GOOD: "Good",
  BAD: "Bad",
} as const;

export const ActivityTypes = {
  CHECKOUT: "checkout",
  CHECKIN: "checkin",
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
} as const;

export type AssetStatusType = typeof AssetStatus[keyof typeof AssetStatus];
export type AccessoryStatusType = typeof AccessoryStatus[keyof typeof AccessoryStatus];
export type ConsumableStatusType = typeof ConsumableStatus[keyof typeof ConsumableStatus];
export type LicenseStatusType = typeof LicenseStatus[keyof typeof LicenseStatus];
export type AssetCategoryType = typeof AssetCategories[keyof typeof AssetCategories];
export type AssetConditionType = typeof AssetConditions[keyof typeof AssetConditions];
export type ActivityType = typeof ActivityTypes[keyof typeof ActivityTypes];

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertAssetSchema = z.object({
  assetTag: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(Object.values(AssetCategories) as [string, ...string[]]),
  status: z.enum(Object.values(AssetStatus) as [string, ...string[]]),
  condition: z.enum(Object.values(AssetConditions) as [string, ...string[]]),
  purchaseDate: z.string().optional(),
  purchaseCost: z.string().optional(),
  location: z.string().optional(),
  serialNumber: z.string().optional(),
  model: z.string().optional(),
  manufacturer: z.string().optional(),
  notes: z.string().optional(),
  knoxId: z.string().optional(),
  ipAddress: z.string().optional(),
  macAddress: z.string().optional(),
  osType: z.string().optional(),
  department: z.string().optional(),
});
export const insertComponentSchema = createInsertSchema(components).omit({ id: true });
export const insertAccessorySchema = createInsertSchema(accessories).omit({ id: true });
export const insertConsumableSchema = createInsertSchema(consumables).omit({ id: true });
export const insertLicenseSchema = createInsertSchema(licenses).omit({ id: true });
export const insertLicenseAssignmentSchema = createInsertSchema(licenseAssignments).omit({ id: true });
export const insertActivitySchema = createInsertSchema(activities).omit({ id: true });
export const insertVmInventorySchema = createInsertSchema(vmInventory).omit({ id: true });
export const insertVmSchema = createInsertSchema(vms).omit({ id: true });
export const insertConsumableAssignmentSchema = createInsertSchema(consumableAssignments).omit({ id: true });

// Types
export type User = typeof users.$inferSelect;
export type Asset = typeof assets.$inferSelect;
export type Component = typeof components.$inferSelect;
export type Accessory = typeof accessories.$inferSelect;
export type Consumable = typeof consumables.$inferSelect;
export type License = typeof licenses.$inferSelect;
export type LicenseAssignment = typeof licenseAssignments.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type VmInventory = typeof vmInventory.$inferSelect;
export type Vm = typeof vms.$inferSelect;
export type ConsumableAssignment = typeof consumableAssignments.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type InsertComponent = z.infer<typeof insertComponentSchema>;
export type InsertAccessory = z.infer<typeof insertAccessorySchema>;
export type InsertConsumable = z.infer<typeof insertConsumableSchema>;
export type InsertLicense = z.infer<typeof insertLicenseSchema>;
export type InsertLicenseAssignment = z.infer<typeof insertLicenseAssignmentSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type InsertVmInventory = z.infer<typeof insertVmInventorySchema>;
export type InsertVm = z.infer<typeof insertVmSchema>;
export type InsertConsumableAssignment = z.infer<typeof insertConsumableAssignmentSchema>;

// System Settings schema
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  // General Settings
  siteName: text("site_name").notNull().default("SRPH-MIS"),
  siteUrl: text("site_url").notNull().default(""),
  defaultLanguage: text("default_language").notNull().default("en"),
  defaultTimezone: text("default_timezone").notNull().default("UTC"),
  allowPublicRegistration: boolean("allow_public_registration").default(false),

  // Company Information
  companyName: text("company_name").notNull().default("SRPH"),
  companyAddress: text("company_address").default(""),
  companyPhone: text("company_phone").default(""),
  companyEmail: text("company_email").default(""),
  companyLogo: text("company_logo").default(""),

  // Email Configuration
  mailDriver: text("mail_driver").default(""),
  mailHost: text("mail_host").default(""),
  mailPort: text("mail_port").default(""),
  mailUsername: text("mail_username").default(""),
  mailPassword: text("mail_password").default(""),
  mailFromAddress: text("mail_from_address").default(""),
  mailFromName: text("mail_from_name").default(""),

  // Asset Settings
  assetTagPrefix: text("asset_tag_prefix").default("SRPH"),
  assetTagZeros: integer("asset_tag_zeros").default(5),
  assetAutoIncrement: boolean("asset_auto_increment").default(true),
  assetCheckoutPolicy: text("asset_checkout_policy").default(""),
  assetCheckoutDuration: integer("asset_checkout_duration").default(30),

  // Security Settings
  enableLoginAttempts: boolean("enable_login_attempts").default(true),
  maxLoginAttempts: integer("max_login_attempts").default(5),
  lockoutDuration: integer("lockout_duration").default(30),
  passwordMinLength: integer("password_min_length").default(8),
  requireSpecialChar: boolean("require_special_char").default(true),
  requireUppercase: boolean("require_uppercase").default(true),
  requireNumber: boolean("require_number").default(true),
  passwordExpiryDays: integer("password_expiry_days").default(90),

  // Notification Settings
  enableAdminNotifications: boolean("enable_admin_notifications").default(true),
  enableUserNotifications: boolean("enable_user_notifications").default(true),
  notifyOnCheckout: boolean("notify_on_checkout").default(true),
  notifyOnCheckin: boolean("notify_on_checkin").default(true),
  notifyOnOverdue: boolean("notify_on_overdue").default(true),

  // Maintenance Settings
  automaticBackups: boolean("automatic_backups").default(false),
  backupFrequency: text("backup_frequency").default("daily"),
  backupTime: text("backup_time").default("00:00"),
  backupRetention: integer("backup_retention").default(30),
  maintenanceMode: boolean("maintenance_mode").default(false),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertSystemSettingsSchema = createInsertSchema(systemSettings);

export type SystemSettings = typeof systemSettings.$inferSelect;
export type InsertSystemSettings = z.infer<typeof insertSystemSettingsSchema>;

// Zabbix Settings schema
export const zabbixSettings = pgTable("zabbix_settings", {
  id: serial("id").primaryKey(),
  serverUrl: text("server_url").notNull().default(""),
  username: text("username").notNull().default(""),
  password: text("password").notNull().default(""),
  apiToken: text("api_token").default(""),
  lastSync: timestamp("last_sync"),
  syncInterval: integer("sync_interval").default(30), // in minutes
  enabled: boolean("enabled").default(false),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Zabbix Subnet schema for monitoring ranges
export const zabbixSubnets = pgTable("zabbix_subnets", {
  id: serial("id").primaryKey(),
  cidrRange: text("cidr_range").notNull(),
  description: text("description"),
  enabled: boolean("enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Discovered hosts schema
export const discoveredHosts = pgTable("discovered_hosts", {
  id: serial("id").primaryKey(),
  hostname: text("hostname"),
  ipAddress: text("ip_address").notNull(),
  macAddress: text("mac_address"),
  status: text("status").notNull().default("new"), // new, imported, ignored
  lastSeen: timestamp("last_seen").defaultNow(),
  source: text("source").notNull().default("zabbix"), // zabbix, network_scan
  systemInfo: json("system_info").default({}),
  hardwareDetails: json("hardware_details").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// VM Monitoring schema
export const vmMonitoring = pgTable("vm_monitoring", {
  id: serial("id").primaryKey(),
  vmId: integer("vm_id").references(() => assets.id),
  zabbixId: text("zabbix_id"),
  status: text("status").default("unknown"), // running, stopped, unknown
  uptime: text("uptime"),
  lastChecked: timestamp("last_checked").defaultNow(),
  monitoringEnabled: boolean("monitoring_enabled").default(true),
  alertsEnabled: boolean("alerts_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Insert schemas for new tables
export const insertZabbixSettingsSchema = createInsertSchema(zabbixSettings).omit({ id: true });
export const insertZabbixSubnetSchema = createInsertSchema(zabbixSubnets).omit({ id: true });
export const insertDiscoveredHostSchema = createInsertSchema(discoveredHosts).omit({ id: true });
export const insertVMMonitoringSchema = createInsertSchema(vmMonitoring).omit({ id: true });

// Bitlocker Keys schema
export const bitlockerKeys = pgTable("bitlocker_keys", {
  id: serial("id").primaryKey(),
  serialNumber: text("serial_number").notNull(),
  identifier: text("identifier").notNull(),
  recoveryKey: text("recovery_key").notNull(),
  assetId: integer("asset_id").references(() => assets.id),
  notes: text("notes"),
  dateAdded: timestamp("date_added").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertBitlockerKeySchema = createInsertSchema(bitlockerKeys).omit({ id: true });

// Types for new schemas
export type ZabbixSettings = typeof zabbixSettings.$inferSelect;
export type ZabbixSubnet = typeof zabbixSubnets.$inferSelect;
export type DiscoveredHost = typeof discoveredHosts.$inferSelect;
export type VMMonitoring = typeof vmMonitoring.$inferSelect;
export type BitlockerKey = typeof bitlockerKeys.$inferSelect;

export type InsertZabbixSettings = z.infer<typeof insertZabbixSettingsSchema>;
export type InsertZabbixSubnet = z.infer<typeof insertZabbixSubnetSchema>;
export type InsertDiscoveredHost = z.infer<typeof insertDiscoveredHostSchema>;
export type InsertVMMonitoring = z.infer<typeof insertVMMonitoringSchema>;
export type InsertBitlockerKey = z.infer<typeof insertBitlockerKeySchema>;