import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminSession } from "@/lib/auth/admin";
import { dbStore } from "@/lib/mongodb/store";
import { parseClientContext } from "@/lib/auth/session";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized Super Admin access." }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "User ID is required." }, { status: 400 });
  }

  try {
    const user = await dbStore.findUserById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const [vault, items, devices, events] = await Promise.all([
      dbStore.getVault(id),
      dbStore.getVaultItems(id),
      dbStore.getDeviceSessions(id),
      dbStore.getSecurityEvents(id, 25),
    ]);

    const itemsByType: Record<string, number> = {
      login: 0,
      card: 0,
      note: 0,
      apiKey: 0,
      wifi: 0,
      identity: 0,
      custom: 0,
    };

    for (const it of items) {
      if (it.type in itemsByType) {
        itemsByType[it.type]++;
      } else {
        itemsByType.custom++;
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        twoFactorEnabled: !!user.twoFactorEnabled,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      vault: vault
        ? {
            vaultId: vault.vaultId,
            keyVersion: vault.keyVersion,
            encryptionVersion: vault.encryptionVersion,
            alg: vault.encryptedVaultKey.alg,
            iterations: vault.encryptedVaultKey.iterations,
            createdAt: vault.createdAt,
            updatedAt: vault.updatedAt,
          }
        : null,
      stats: {
        totalItems: items.length,
        itemsByType,
        activeDevicesCount: devices.length,
      },
      devices,
      events,
    });
  } catch (error) {
    console.error("Admin get user details error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized Super Admin access." }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "User ID is required." }, { status: 400 });
  }

  try {
    const user = await dbStore.findUserById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const body = await req.json();
    const { name, email, status, twoFactorEnabled } = body;

    const updates: Record<string, any> = {};

    if (typeof name === "string" && name.trim()) {
      updates.name = name.trim();
    }

    if (typeof email === "string" && email.trim()) {
      const newEmail = email.toLowerCase().trim();
      if (newEmail !== user.email.toLowerCase()) {
        const existing = await dbStore.findUserByEmail(newEmail);
        if (existing && existing.id !== id) {
          return NextResponse.json(
            { error: "Another user already uses this email address." },
            { status: 409 }
          );
        }
        updates.email = newEmail;
      }
    }

    if (status && ["active", "locked", "suspended"].includes(status)) {
      updates.status = status;
    }

    if (typeof twoFactorEnabled === "boolean") {
      updates.twoFactorEnabled = twoFactorEnabled;
      if (!twoFactorEnabled) {
        updates.twoFactorSecret = undefined;
        updates.recoveryCodes = [];
      }
    }

    await dbStore.updateUser(id, updates);

    const context = parseClientContext(req.headers);
    await dbStore.recordSecurityEvent({
      id: crypto.randomUUID(),
      userId: id,
      type: "vault_item_updated",
      ip: context.ip,
      userAgent: context.userAgent,
      timestamp: new Date().toISOString(),
      status: "warning",
      details: `Profile updated by Super Admin (${admin.email})`,
    });

    const updatedUser = await dbStore.findUserById(id);

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser!.id,
        name: updatedUser!.name,
        email: updatedUser!.email,
        status: updatedUser!.status,
        twoFactorEnabled: !!updatedUser!.twoFactorEnabled,
        createdAt: updatedUser!.createdAt,
        updatedAt: updatedUser!.updatedAt,
      },
    });
  } catch (error) {
    console.error("Admin patch user error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized Super Admin access." }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "User ID is required." }, { status: 400 });
  }

  try {
    const user = await dbStore.findUserById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const deleted = await dbStore.deleteUserAndData(id);
    if (!deleted) {
      return NextResponse.json({ error: "Failed to delete user." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `User ${user.email} and all associated vault data successfully deleted.`,
    });
  } catch (error) {
    console.error("Admin delete user error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
