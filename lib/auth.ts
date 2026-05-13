/**
 * NextAuth v5 (Auth.js) untuk admin Dinas PUPR — Node runtime only.
 */
import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { adminLoginSchema } from "@/lib/validation";
import { authConfig } from "@/lib/auth.config";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "super_admin" | "verifikator" | "operator";
      nama: string;
    } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = adminLoginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = (
          await db
            .select()
            .from(adminUsers)
            .where(eq(adminUsers.email, email.toLowerCase()))
        )[0];
        if (!user || !user.aktif) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        await db
          .update(adminUsers)
          .set({ lastLoginAt: new Date() })
          .where(eq(adminUsers.id, user.id));

        return {
          id: user.id,
          email: user.email,
          name: user.nama,
          role: user.role,
          nama: user.nama,
        } as unknown as { id: string; email: string; name: string };
      },
    }),
  ],
});
