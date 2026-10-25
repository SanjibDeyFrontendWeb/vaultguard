import { MongoClient, Db } from "mongodb";
import fs from "fs";
import path from "path";
import {
  StoredVaultItem,
  SecurityEvent,
  DeviceSession,
  AdminUserView,
  AdminSystemStats,
} from "@/types";
import { WrappedVaultKey } from "@/lib/crypto/types";

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  status: "active" | "locked" | "suspended";
  twoFactorEnabled: boolean;
  twoFactorSecret?: string; // Encrypted with server secret
  recoveryCodes?: string[];  // Hashed
  recoveryKeyHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface VaultRecord {
  userId: string;
  vaultId: string;
  encryptedVaultKey: WrappedVaultKey;
  keyVersion: number;
  encryptionVersion: number;
  createdAt: string;
  updatedAt: string;
}

interface InMemoryDB {
  users: UserRecord[];
  vaults: VaultRecord[];
  vault_items: StoredVaultItem[];
  security_events: SecurityEvent[];
  devices: DeviceSession[];
}

let client: MongoClient | null = null;
let db: Db | null = null;
let useFallback = false;

const FALLBACK_DIR = path.join(process.cwd(), ".data");
const FALLBACK_FILE = path.join(FALLBACK_DIR, "vaultguard_db.json");

let cachedData: InMemoryDB | null = null;
let saveTimer: NodeJS.Timeout | null = null;

function getFallbackData(): InMemoryDB {
  if (cachedData) return cachedData;

  if (!fs.existsSync(FALLBACK_DIR)) {
    fs.mkdirSync(FALLBACK_DIR, { recursive: true });
  }
  if (!fs.existsSync(FALLBACK_FILE)) {
    const initial: InMemoryDB = {
      users: [],
      vaults: [],
      vault_items: [],
      security_events: [],
      devices: [],
    };
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(initial, null, 2), "utf8");
    cachedData = initial;
    return initial;
  }
  try {
    cachedData = JSON.parse(fs.readFileSync(FALLBACK_FILE, "utf8"));
    return cachedData!;
  } catch {
    cachedData = {
      users: [],
      vaults: [],
      vault_items: [],
      security_events: [],
      devices: [],
    };
    return cachedData;
  }
}

function saveFallbackData(data: InMemoryDB) {
  cachedData = data;
  if (!saveTimer) {
    saveTimer = setTimeout(() => {
      saveTimer = null;
      try {
        if (!fs.existsSync(FALLBACK_DIR)) {
          fs.mkdirSync(FALLBACK_DIR, { recursive: true });
        }
        fs.writeFile(FALLBACK_FILE, JSON.stringify(cachedData, null, 2), "utf8", () => {});
      } catch (err) {
        console.error("Failed to persist data asynchronously:", err);
      }
    }, 40);
  }
}

export async function getDb(): Promise<{ db: Db | null; isFallback: boolean }> {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === "" || useFallback) {
    return { db: null, isFallback: true };
  }

  if (db) {
    return { db, isFallback: false };
  }

  try {
    if (!client) {
      client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
        maxPoolSize: 10,
      });
      await client.connect();
    }
    db = client.db("vaultguard");
    return { db, isFallback: false };
  } catch (err) {
    console.warn("MongoDB connection failed or timed out. Using local persistent storage fallback.", err);
    return { db: null, isFallback: true };
  }
}

export const dbStore = {
  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const { db, isFallback } = await getDb();
    if (!isFallback && db) {
      const user = await db.collection<UserRecord>("users").findOne({ email: email.toLowerCase() });
      return user;
    }
    const data = getFallbackData();
    return data.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async findUserById(id: string): Promise<UserRecord | null> {
    const { db, isFallback } = await getDb();
    if (!isFallback && db) {
      return await db.collection<UserRecord>("users").findOne({ id });
    }
    const data = getFallbackData();
    return data.users.find((u) => u.id === id) || null;
  },

  async createUser(user: UserRecord): Promise<void> {
    const { db, isFallback } = await getDb();
    if (!isFallback && db) {
      await db.collection("users").insertOne(user as any);
      return;
    }
    const data = getFallbackData();
    data.users.push(user);
    saveFallbackData(data);
  },

  async updateUser(id: string, updates: Partial<UserRecord>): Promise<void> {
    const { db, isFallback } = await getDb();
    if (!isFallback && db) {
      await db.collection("users").updateOne({ id }, { $set: updates });
      return;
    }
    const data = getFallbackData();
    const idx = data.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      data.users[idx] = { ...data.users[idx], ...updates, updatedAt: new Date().toISOString() };
      saveFallbackData(data);
    }
  },

  async getVault(userId: string): Promise<VaultRecord | null> {
    const { db, isFallback } = await getDb();
    if (!isFallback && db) {
      return await db.collection<VaultRecord>("vaults").findOne({ userId });
    }
    const data = getFallbackData();
    return data.vaults.find((v) => v.userId === userId) || null;
  },

  async createVault(vault: VaultRecord): Promise<void> {
    const { db, isFallback } = await getDb();
    if (!isFallback && db) {
      await db.collection("vaults").insertOne(vault as any);
      return;
    }
    const data = getFallbackData();
    data.vaults.push(vault);
    saveFallbackData(data);
  },

  async updateVaultKey(userId: string, encryptedVaultKey: WrappedVaultKey): Promise<void> {
    const { db, isFallback } = await getDb();
    if (!isFallback && db) {
      await db.collection("vaults").updateOne(
        { userId },
        {
          $set: {
            encryptedVaultKey,
            updatedAt: new Date().toISOString(),
          },
          $inc: { keyVersion: 1 },
        }
      );
      return;
    }
    const data = getFallbackData();
    const idx = data.vaults.findIndex((v) => v.userId === userId);
    if (idx !== -1) {
      data.vaults[idx].encryptedVaultKey = encryptedVaultKey;
      data.vaults[idx].keyVersion = (data.vaults[idx].keyVersion || 1) + 1;
      data.vaults[idx].updatedAt = new Date().toISOString();
      saveFallbackData(data);
    }
  },

  async getVaultItems(userId: string): Promise<StoredVaultItem[]> {
    const { db, isFallback } = await getDb();
    if (!isFallback && db) {
      return await db.collection<StoredVaultItem>("vault_items").find({ userId }).sort({ createdAt: -1 }).toArray();
    }
    const data = getFallbackData();
    return data.vault_items.filter((item) => item.userId === userId);
  },

  async getVaultItemById(id: string, userId: string): Promise<StoredVaultItem | null> {
    const { db, isFallback } = await getDb();
    if (!isFallback && db) {
      return await db.collection<StoredVaultItem>("vault_items").findOne({ id, userId });
    }
    const data = getFallbackData();
    return data.vault_items.find((item) => item.id === id && item.userId === userId) || null;
  },

  async createVaultItem(item: StoredVaultItem): Promise<void> {
    const { db, isFallback } = await getDb();
    if (!isFallback && db) {
      await db.collection("vault_items").insertOne(item as any);
      return;
    }
    const data = getFallbackData();
    data.vault_items.unshift(item);
    saveFallbackData(data);
  },

  async updateVaultItem(id: string, userId: string, updates: Partial<StoredVaultItem>): Promise<boolean> {
    const { db, isFallback } = await getDb();
    if (!isFallback && db) {
      const res = await db.collection("vault_items").updateOne(
        { id, userId },
        { $set: { ...updates, updatedAt: new Date().toISOString() } }
      );
      return res.matchedCount > 0;
    }
    const data = getFallbackData();
    const idx = data.vault_items.findIndex((item) => item.id === id && item.userId === userId);
    if (idx !== -1) {
      data.vault_items[idx] = {
        ...data.vault_items[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      saveFallbackData(data);
      return true;
    }
    return false;
  },

  async deleteVaultItem(id: string, userId: string): Promise<boolean> {
    const { db, isFallback } = await getDb();
    if (!isFallback && db) {
      const res = await db.collection("vault_items").deleteOne({ id, userId });
      return res.deletedCount > 0;
    }
    const data = getFallbackData();
    const initialLen = data.vault_items.length;
    data.vault_items = data.vault_items.filter((item) => !(item.id === id && item.userId === userId));
    saveFallbackData(data);
    return data.vault_items.length < initialLen;
  },

  async recordSecurityEvent(event: SecurityEvent): Promise<void> {
    const { db, isFallback } = await getDb();
    if (!isFallback && db) {
      await db.collection("security_events").insertOne(event as any);
      return;
    }
    const data = getFallbackData();
    data.security_events.unshift(event);
    if (data.security_events.length > 200) data.security_events.pop();
    saveFallbackData(data);
  },

  async getSecurityEvents(userId: string, limit = 50): Promise<SecurityEvent[]> {
    const { db, isFallback } = await getDb();
    if (!isFallback && db) {
      return await db
        .collection<SecurityEvent>("security_events")
        .find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
    }
    const data = getFallbackData();
    return data.security_events
      .filter((e) => e.userId === userId)
      .slice(0, limit);
  },

  async recordDeviceSession(device: DeviceSession): Promise<void> {
    const { db, isFallback } = await getDb();
    if (!isFallback && db) {
      await db.collection("devices").updateOne(
        { id: device.id },
        { $set: device },
        { upsert: true }
      );
      return;
    }
    const data = getFallbackData();
    const idx = data.devices.findIndex((d) => d.id === device.id);
    if (idx !== -1) {
      data.devices[idx] = device;
    } else {
      data.devices.unshift(device);
    }
    saveFallbackData(data);
  },

  async getDeviceSessions(userId: string, currentSessionId?: string): Promise<DeviceSession[]> {
    const { db, isFallback } = await getDb();
    let devices: DeviceSession[] = [];
    if (!isFallback && db) {
      devices = await db.collection<DeviceSession>("devices").find({ userId }).sort({ lastActive: -1 }).toArray();
    } else {
      const data = getFallbackData();
      devices = data.devices.filter((d) => d.userId === userId);
    }
    return devices.map((d) => ({
      ...d,
      current: d.id === currentSessionId,
    }));
  },

  async revokeDeviceSession(sessionId: string, userId: string): Promise<boolean> {
    const { db, isFallback } = await getDb();
    if (!isFallback && db) {
      const res = await db.collection("devices").deleteOne({ id: sessionId, userId });
      return res.deletedCount > 0;
    }
    const data = getFallbackData();
    const initialLen = data.devices.length;
    data.devices = data.devices.filter((d) => !(d.id === sessionId && d.userId === userId));
    saveFallbackData(data);
    return data.devices.length < initialLen;
  },

  async revokeAllOtherSessions(userId: string, keepSessionId: string): Promise<void> {
    const { db, isFallback } = await getDb();
    if (!isFallback && db) {
      await db.collection("devices").deleteMany({ userId, id: { $ne: keepSessionId } });
      return;
    }
    const data = getFallbackData();
    data.devices = data.devices.filter((d) => d.userId === userId && d.id === keepSessionId);
    saveFallbackData(data);
  },

  async getAllUsersWithStats(): Promise<AdminUserView[]> {
    const { db, isFallback } = await getDb();
    if (!isFallback && db) {
      const users = await db.collection<UserRecord>("users").find({}).sort({ createdAt: -1 }).toArray();
      const vaultItems = await db.collection<StoredVaultItem>("vault_items").find({}).toArray();
      const countsMap = new Map<string, number>();
      for (const item of vaultItems) {
        countsMap.set(item.userId, (countsMap.get(item.userId) || 0) + 1);
      }
      return users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        status: u.status,
        twoFactorEnabled: !!u.twoFactorEnabled,
        vaultItemsCount: countsMap.get(u.id) || 0,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      }));
    }
    const data = getFallbackData();
    return data.users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      status: u.status,
      twoFactorEnabled: !!u.twoFactorEnabled,
      vaultItemsCount: data.vault_items.filter((item) => item.userId === u.id).length,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));
  },

  async deleteUserAndData(userId: string): Promise<boolean> {
    const { db, isFallback } = await getDb();
    if (!isFallback && db) {
      const res = await db.collection("users").deleteOne({ id: userId });
      await db.collection("vaults").deleteOne({ userId });
      await db.collection("vault_items").deleteMany({ userId });
      await db.collection("devices").deleteMany({ userId });
      await db.collection("security_events").deleteMany({ userId });
      return res.deletedCount > 0;
    }
    const data = getFallbackData();
    const initUsersLen = data.users.length;
    data.users = data.users.filter((u) => u.id !== userId);
    data.vaults = data.vaults.filter((v) => v.userId !== userId);
    data.vault_items = data.vault_items.filter((item) => item.userId !== userId);
    data.devices = data.devices.filter((d) => d.userId !== userId);
    data.security_events = data.security_events.filter((e) => e.userId !== userId);
    saveFallbackData(data);
    return data.users.length < initUsersLen;
  },

  async getAdminStats(): Promise<AdminSystemStats> {
    const { db, isFallback } = await getDb();
    let users: UserRecord[] = [];
    let vaultItems: StoredVaultItem[] = [];
    let devices: DeviceSession[] = [];
    let events: SecurityEvent[] = [];

    if (!isFallback && db) {
      users = await db.collection<UserRecord>("users").find({}).toArray();
      vaultItems = await db.collection<StoredVaultItem>("vault_items").find({}).toArray();
      devices = await db.collection<DeviceSession>("devices").find({}).toArray();
      events = await db.collection<SecurityEvent>("security_events").find({}).sort({ timestamp: -1 }).limit(25).toArray();
    } else {
      const data = getFallbackData();
      users = data.users;
      vaultItems = data.vault_items;
      devices = data.devices;
      events = data.security_events.slice(0, 25);
    }

    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.status === "active").length;
    const twoFactorCount = users.filter((u) => u.twoFactorEnabled).length;
    const twoFactorAdoptionRate = totalUsers > 0 ? Math.round((twoFactorCount / totalUsers) * 100) : 0;

    const itemsByType: Record<string, number> = {
      login: 0,
      card: 0,
      note: 0,
      apiKey: 0,
      wifi: 0,
      identity: 0,
      custom: 0,
    };

    for (const item of vaultItems) {
      if (item.type in itemsByType) {
        itemsByType[item.type]++;
      } else {
        itemsByType.custom++;
      }
    }

    return {
      totalUsers,
      activeUsers,
      totalVaultItems: vaultItems.length,
      twoFactorAdoptionRate,
      totalDevices: devices.length,
      itemsByType,
      recentEvents: events,
    };
  },
};
