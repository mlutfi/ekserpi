"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";

export default function HomePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated() && user) {
      if (user.role === "OWNER" || user.role === "OPS") {
        router.replace("/admin");
      } else if (user.role === "CASHIER") {
        router.replace("/pos");
      } else if (
        user.role === "HR_ADMIN" ||
        user.role === "MANAGER" ||
        user.role === "EMPLOYEE"
      ) {
        router.replace("/hris");
      } else {
        router.replace("/login");
      }
    } else {
      router.replace("/login");
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
        <p className="text-sm text-slate-500">Memuat...</p>
      </div>
    </div>
  );
}
