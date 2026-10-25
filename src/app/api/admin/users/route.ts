import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminSession } from "@/lib/auth/admin";
import { dbStore, UserRecord, VaultRecord } from "@/lib/mongodb/store";
import { hashPassword } from "@/lib/auth/password";
import { registerSchema } from "@/lib/validation/schemas";
import { parseClientContext } from "@/lib/auth/session";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized Super Admin access." }, { status: 401 });
  }

  try {
    const users = await dbStore.getAllUsersWithStats();
    return NextResponse.json({ users });
  } catch (error) {
    console.error("Failed to fetch users for admin:", error);
    return NextResponse.json({ error: "Failed to load users." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized Super Admin access." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.format() },
        { status: 400 }
      );
    }

    const { name, email, authHash, wrappedVaultKey, recoveryKeyHash } = validated.data;

    const existingUser = await dbStore.findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email address already exists." },
        { status: 409 }
      );
    }

    const { hash, salt } = await hashPassword(authHash);

    const userId = crypto.randomUUID();
    const vaultId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newUser: UserRecord = {
      id: userId,
      name,
      email: email.toLowerCase().trim(),
      passwordHash: hash,
      salt,
      status: "active",
      twoFactorEnabled: false,
      recoveryKeyHash,
      createdAt: now,
      updatedAt: now,
    };

    await dbStore.createUser(newUser);

    const vaultRecord: VaultRecord = {
      userId,
      vaultId,
      encryptedVaultKey: wrappedVaultKey,
      keyVersion: 1,
      encryptionVersion: 1,
      createdAt: now,
      updatedAt: now,
    };

    await dbStore.createVault(vaultRecord);

    const context = parseClientContext(req.headers);
    await dbStore.recordSecurityEvent({
      id: crypto.randomUUID(),
      userId,
      type: "login_success",
      ip: context.ip,
      userAgent: context.userAgent,
      timestamp: now,
      status: "success",
      details: `Account created by Super Admin (${admin.email})`,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        name: newUser.name,
        email: newUser.email,
        status: newUser.status,
        twoFactorEnabled: false,
        vaultItemsCount: 0,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
    });
  } catch (error) {
    console.error("Admin create user error:", error);
    return NextResponse.json(
      { error: "Internal error creating user." },
      { status: 500 }
    );
  }
}
