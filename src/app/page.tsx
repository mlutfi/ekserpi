"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { PageLoading } from "@/components/ui/page-loading";

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
        user.role === "TEAM_LEADER" ||
        user.role === "EMPLOYEE" ||
        user.role === "STAFF"
      ) {
        router.replace("/hris");
      } else {
        router.replace("/login");
      }
    } else {
      router.replace("/login");
    }
  }, [isAuthenticated, user, router]);

  return <PageLoading fullScreen label="Memuat..." className="bg-slate-50" />;
}
