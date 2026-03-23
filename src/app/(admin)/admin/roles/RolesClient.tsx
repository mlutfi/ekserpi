"use client"

import { useEffect, useMemo, useState } from "react"
import { Shield, Settings, Users, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { RolePermission, RoleSummary, rolesApi } from "@/lib/api"
import { PageLoading } from "@/components/ui/page-loading"

export default function RolesClient() {
    const [roles, setRoles] = useState<RoleSummary[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedRole, setSelectedRole] = useState<RoleSummary | null>(null)
    const [permissions, setPermissions] = useState<RolePermission[]>([])
    const [permissionLoading, setPermissionLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [open, setOpen] = useState(false)

    async function fetchRoles() {
        try {
            setLoading(true)
            const data = await rolesApi.getAll()
            setRoles(data)
        } catch (error) {
            toast.error("Gagal memuat role")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRoles()
    }, [])

    const groupedPermissions = useMemo(() => {
        const grouped = permissions.reduce((acc, permission) => {
            if (!acc[permission.resource]) {
                acc[permission.resource] = []
            }
            acc[permission.resource].push(permission)
            return acc
        }, {} as Record<string, RolePermission[]>)

        return Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([resource, items]) => ({
                resource,
                items: [...items].sort((a, b) => a.action.localeCompare(b.action)),
            }))
    }, [permissions])

    async function openPermissionDialog(role: RoleSummary) {
        try {
            setSelectedRole(role)
            setOpen(true)
            setPermissionLoading(true)

            const response = await rolesApi.getPermissions(role.role)
            setPermissions(response.permissions ?? [])
        } catch (error) {
            toast.error("Gagal memuat permissions role")
        } finally {
            setPermissionLoading(false)
        }
    }

    function togglePermission(code: string, checked: boolean) {
        setPermissions((prev) =>
            prev.map((item) => (item.code === code ? { ...item, isAllowed: checked } : item))
        )
    }

    async function savePermissions() {
        if (!selectedRole) return

        try {
            setSaving(true)
            await rolesApi.updatePermissions(
                selectedRole.role,
                permissions.map((item) => ({
                    resource: item.resource,
                    action: item.action,
                    isAllowed: item.isAllowed,
                    description: item.description,
                }))
            )
            toast.success("Hak akses role berhasil diperbarui")
            await fetchRoles()
            setOpen(false)
        } catch (error: any) {
            toast.error("Gagal menyimpan hak akses", {
                description: error?.response?.data?.message ?? "Terjadi kesalahan saat menyimpan perubahan",
            })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <PageLoading />
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Role Management</h1>
                    <p className="text-sm text-zinc-500">Atur hak akses role (single role per user)</p>
                </div>
                <Button variant="outline" onClick={fetchRoles}>
                    <RefreshCw className="h-4 w-4" />
                    Muat Ulang
                </Button>
            </div>

            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-zinc-200 bg-zinc-50/60">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">Role</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">Kode</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">Jumlah User</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {roles.map((role) => (
                                <tr key={role.role} className="hover:bg-zinc-50/60">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-100">
                                                <Shield className="h-4 w-4 text-zinc-600" />
                                            </div>
                                            <span className="text-sm font-medium text-zinc-900">{role.label}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-zinc-600">{role.role}</td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center gap-1 rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-700">
                                            <Users className="h-3 w-3" />
                                            {role.userCount}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button variant="outline" size="sm" onClick={() => openPermissionDialog(role)}>
                                            <Settings className="h-4 w-4" />
                                            Atur Akses
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader className="mb-2 pb-3 border-b border-zinc-200">
                        <DialogTitle>Role Permission</DialogTitle>
                        <DialogDescription>
                            {selectedRole ? `Kelola permission untuk ${selectedRole.label} (${selectedRole.role})` : ""}
                        </DialogDescription>
                    </DialogHeader>

                    {permissionLoading ? (
                        <div className="flex items-center justify-center py-10">
                            <div className="h-6 w-6 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />
                        </div>
                    ) : (
                        <>
                            <ScrollArea className="h-[480px] rounded-md border border-zinc-200 p-4">
                                <div className="space-y-5">
                                    {groupedPermissions.map((group) => (
                                        <div key={group.resource} className="rounded-md border border-zinc-200">
                                            <div className="border-b border-zinc-200 bg-zinc-50 px-3 py-2">
                                                <p className="text-sm font-semibold uppercase tracking-wide text-zinc-700">
                                                    {group.resource.replace(/_/g, " ")}
                                                </p>
                                            </div>
                                            <div className="divide-y divide-zinc-100">
                                                {group.items.map((permission) => (
                                                    <label
                                                        key={permission.code}
                                                        className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5"
                                                    >
                                                        <div>
                                                            <p className="text-sm font-medium text-zinc-900">
                                                                {permission.action.toUpperCase()}
                                                            </p>
                                                            <p className="text-xs text-zinc-500">{permission.description || permission.code}</p>
                                                        </div>
                                                        <Switch
                                                            checked={permission.isAllowed}
                                                            onCheckedChange={(checked) =>
                                                                togglePermission(permission.code, Boolean(checked))
                                                            }
                                                        />
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                                    Batal
                                </Button>
                                <Button onClick={savePermissions} loading={saving}>
                                    Simpan Perubahan
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
