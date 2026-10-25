import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { dbStore } from "@/lib/mongodb/store";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ authenticated: false, user: null, vault: null }, { status: 200 });
    }

    const user = await dbStore.findUserById(session.userId);
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null, vault: null }, { status: 200 });
    }

    const vault = await dbStore.getVault(user.id);

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        twoFactorEnabled: user.twoFactorEnabled,
        createdAt: user.createdAt,
      },
      vault: vault
        ? {
            encryptedVaultKey: vault.encryptedVaultKey,
            keyVersion: vault.keyVersion,
            encryptionVersion: vault.encryptionVersion,
          }
        : null,
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
