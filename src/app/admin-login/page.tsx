import { currentAdmin } from "@/lib/auth";
import { AdminPortal } from "@/components/AdminPortal";
import { AdminLoginClient } from "./client";

// Hidden operator entry point. No link to this page exists anywhere on
// the player site, footer, login page or README.
export default async function AdminLoginPage() {
  const admin = await currentAdmin();
  if (admin) return <AdminPortal />;
  return <AdminLoginClient />;
}
