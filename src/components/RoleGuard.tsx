"use client"

import { useAuthStore } from "@/lib/store"
import { Role, hasRole, hasRoleGroup, RoleGroups } from "@/lib/roles"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface RoleGuardProps {
    children: React.ReactNode
    allowedRoles: Role[]
    fallbackPath?: string
}

export function RoleGuard({
    children,
    allowedRoles,
    fallbackPath = "/"
}: RoleGuardProps) {
    const user = useAuthStore((state) => state.user)
    const router = useRouter()

    useEffect(() => {
        if (user && !hasRole(user.role, allowedRoles)) {
            router.push(fallbackPath)
        }
    }, [user, allowedRoles, fallbackPath, router])

    if (!user || !hasRole(user.role, allowedRoles)) {
        return null
    }

    return <>{children}</>
}

interface RoleGroupGuardProps {
    children: React.ReactNode
    roleGroup: keyof typeof RoleGroups
    fallbackPath?: string
}

export function RoleGroupGuard({
    children,
    roleGroup,
    fallbackPath = "/"
}: RoleGroupGuardProps) {
    const user = useAuthStore((state) => state.user)
    const router = useRouter()

    useEffect(() => {
        if (user && !hasRoleGroup(user.role, RoleGroups[roleGroup])) {
            router.push(fallbackPath)
        }
    }, [user, roleGroup, fallbackPath, router])

    if (!user || !hasRoleGroup(user.role, RoleGroups[roleGroup])) {
        return null
    }

    return <>{children}</>
}

// Hook for checking role access in components
export function useHasRole(allowedRoles: Role[]): boolean {
    const user = useAuthStore((state) => state.user)
    return hasRole(user?.role, allowedRoles)
}

export function useHasRoleGroup(group: keyof typeof RoleGroups): boolean {
    const user = useAuthStore((state) => state.user)
    return hasRoleGroup(user?.role, RoleGroups[group])
}

export function useUserRole(): string | undefined {
    return useAuthStore((state) => state.user?.role)
}
