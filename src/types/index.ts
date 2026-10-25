export type VaultItemType =
  | "login"
  | "note"
  | "card"
  | "apiKey"
  | "wifi"
  | "identity"
  | "custom";

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  tag?: string;
  version: number;
  alg: string;
}

export interface StoredVaultItem {
  id: string;
  userId: string;
  type: VaultItemType;
  isFavorite: boolean;
  tags: string[];
  encryptedPayload: EncryptedPayload;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
}

export interface LoginItemData {
  username: string;
  password: string;
  url?: string;
  notes?: string;
}

export interface NoteItemData {
  notes: string;
}

export interface CardItemData {
  cardholderName: string;
  cardNumber: string;
  expiry: string;
  cvvPin: string;
  cardType?: string;
  notes?: string;
}

export interface ApiKeyItemData {
  service: string;
  environment: "production" | "staging" | "development" | "test";
  apiKey: string;
  secret?: string;
  endpoint?: string;
  notes?: string;
}

export interface WifiItemData {
  ssid: string;
  password: string;
  securityType: "WPA2" | "WPA3" | "WEP" | "Open";
  notes?: string;
}

export interface IdentityItemData {
  fullName: string;
  email?: string;
  phone?: string;
  passportId?: string;
  address?: string;
  notes?: string;
}

export interface CustomField {
  id: string;
  label: string;
  value: string;
  isSecret: boolean;
}

export interface CustomItemData {
  fields: CustomField[];
  notes?: string;
}

export type VaultItemData =
  | LoginItemData
  | NoteItemData
  | CardItemData
  | ApiKeyItemData
  | WifiItemData
  | IdentityItemData
  | CustomItemData;

export interface DecryptedVaultItem {
  id: string;
  type: VaultItemType;
  name: string;
  isFavorite: boolean;
  tags: string[];
  data: VaultItemData;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
}

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  sessionId: string;
  createdAt: string;
  expiresAt: string;
  requiresTwoFactor?: boolean;
}

export interface SecurityEvent {
  id: string;
  userId: string;
  type:
    | "login_success"
    | "login_failed"
    | "logout"
    | "password_change"
    | "two_factor_enabled"
    | "two_factor_disabled"
    | "vault_locked"
    | "vault_unlocked"
    | "recovery_key_generated"
    | "session_revoked"
    | "vault_item_created"
    | "vault_item_updated"
    | "vault_item_deleted";
  ip?: string;
  userAgent?: string;
  timestamp: string;
  status: "success" | "warning" | "danger";
  details?: string;
}

export interface DeviceSession {
  id: string;
  userId: string;
  deviceName: string;
  browser: string;
  os: string;
  ip: string;
  current: boolean;
  createdAt: string;
  lastActive: string;
}

export interface PasswordHealthCheck {
  overallScore: number;
  totalPasswords: number;
  weakCount: number;
  reusedCount: number;
  oldCount: number;
  twoFactorEnabled: boolean;
  recoveryKeyConfigured: boolean;
  weakItems: Array<{ id: string; name: string; reason: string }>;
  reusedItems: Array<{ id: string; name: string; username: string }>;
  oldItems: Array<{ id: string; name: string; ageDays: number }>;
}

export interface AdminUserView {
  id: string;
  name: string;
  email: string;
  status: "active" | "locked" | "suspended";
  twoFactorEnabled: boolean;
  vaultItemsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSystemStats {
  totalUsers: number;
  activeUsers: number;
  totalVaultItems: number;
  twoFactorAdoptionRate: number;
  totalDevices: number;
  itemsByType: Record<string, number>;
  recentEvents: SecurityEvent[];
}

export interface AdminSession {
  adminId: string;
  email: string;
  role: "superadmin";
  createdAt: string;
  expiresAt: string;
}
