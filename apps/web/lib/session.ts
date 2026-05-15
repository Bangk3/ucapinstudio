import type { Session, User } from "@invyte/db";
import { headers } from "next/headers";
import { auth } from "./auth";

export type AuthSession = {
  session: Session;
  user: User;
};

export async function getServerSession(): Promise<AuthSession | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  return session as AuthSession;
}

export async function requireSession(): Promise<AuthSession> {
  const session = await getServerSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
