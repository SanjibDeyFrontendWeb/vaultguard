import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { dbStore } from "@/lib/mongodb/store";
import { updateVaultItemSchema } from "@/lib/validation/schemas";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const validated = updateVaultItemSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ error: "Invalid update data" }, { status: 400 });
    }

    const updated = await dbStore.updateVaultItem(id, session.userId, validated.data);
    if (!updated) {
      return NextResponse.json({ error: "Item not found or unauthorized" }, { status: 404 });
    }

    const item = await dbStore.getVaultItemById(id, session.userId);
    return NextResponse.json({ success: true, item });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update vault item" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await dbStore.deleteVaultItem(id, session.userId);
    if (!deleted) {
      return NextResponse.json({ error: "Item not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete vault item" }, { status: 500 });
  }
}
