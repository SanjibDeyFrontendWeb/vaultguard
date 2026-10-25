import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSession } from "@/lib/auth/session";
import { dbStore } from "@/lib/mongodb/store";
import { createVaultItemSchema } from "@/lib/validation/schemas";
import { StoredVaultItem } from "@/types";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const items = await dbStore.getVaultItems(session.userId);
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json({ error: "Failed to retrieve vault items." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = createVaultItemSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid vault item payload", details: validated.error.format() },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    const newItem: StoredVaultItem = {
      id,
      userId: session.userId,
      type: validated.data.type,
      isFavorite: validated.data.isFavorite,
      tags: validated.data.tags,
      encryptedPayload: validated.data.encryptedPayload,
      createdAt: now,
      updatedAt: now,
    };

    await dbStore.createVaultItem(newItem);

    return NextResponse.json({ success: true, item: newItem }, { status: 201 });
  } catch (error) {
    console.error("Create vault item error:", error);
    return NextResponse.json({ error: "Failed to create vault item." }, { status: 500 });
  }
}
