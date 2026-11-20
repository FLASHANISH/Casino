"use client";

import { AdminLogin } from "@/components/AdminPortal";

export function AdminLoginClient() {
  return <AdminLogin onDone={() => window.location.reload()} />;
}
