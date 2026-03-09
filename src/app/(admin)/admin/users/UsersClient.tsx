"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Plus, Edit, Trash2, Users, Shield, UserCog, User, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { rolesApi, type RoleSummary, usersApi, type User as ApiUser } from "@/lib/api"
import { PageLoading } from "@/components/ui/page-loading"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface User extends ApiUser {
  createdAt?: string
}

export default function UsersAdminPage() {
  // const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [availableRoles, setAvailableRoles] = useState<RoleSummary[]>([])
  const [teamLeaders, setTeamLeaders] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "STAFF",
    teamLeaderId: "",
  })

  useEffect(() => {
    void loadInitialData()
  }, [])

  async function loadInitialData() {
    try {
      setLoading(true)
      await Promise.all([fetchUsers(), fetchRoles()])
    } finally {
      setLoading(false)
    }
  }

  async function fetchUsers() {
    try {
      const data = await usersApi.getAll()
      setUsers(data ?? [])
      setTeamLeaders((data ?? []).filter((user) => user.role === "TEAM_LEADER"))
    } catch (error) {
      toast.error("Error", {
        description: "Gagal memuat data pengguna",
      })
    }
  }

  async function fetchRoles() {
    try {
      const data = await rolesApi.getAll()
      setAvailableRoles(data ?? [])
    } catch (error) {
      toast.error("Error", {
        description: "Gagal memuat data role",
      })
    }
  }

  function openCreateModal() {
    const defaultRole = availableRoles.find((role) => role.role === "STAFF")?.role
      ?? availableRoles[0]?.role
      ?? "STAFF"

    setEditingUser(null)
    setFormData({
      name: "",
      email: "",
      password: "",
      role: defaultRole,
      teamLeaderId: "",
    })
    setShowModal(true)
  }

  function openEditModal(user: User) {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      teamLeaderId: user.teamLeaderId || "",
    })
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const payload: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      }

      // Only include teamLeaderId for STAFF role
      if (formData.role === "STAFF" && formData.teamLeaderId) {
        payload.teamLeaderId = formData.teamLeaderId
      }

      if (editingUser) {
        if (formData.password) {
          payload.password = formData.password
        }
        await usersApi.update(editingUser.id, payload)
        toast.success("Berhasil", {
          description: "Pengguna berhasil diperbarui",
        })
      } else {
        payload.password = formData.password
        await usersApi.create(payload)
        toast.success("Berhasil", {
          description: "Pengguna berhasil dibuat",
        })
      }
      setShowModal(false)
      fetchUsers()
    } catch (error: any) {
      toast.error("Error", {
        description: error.response?.data?.message || "Gagal menyimpan pengguna",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(user: User) {
    if (!confirm(`Hapus pengguna "${user.name}"?`)) return

    try {
      await usersApi.delete(user.id)
      toast.success("Berhasil", {
        description: "Pengguna berhasil dihapus",
      })
      fetchUsers()
    } catch (error: any) {
      toast.error("Error", {
        description: error.response?.data?.message || "Gagal menghapus pengguna",
      })
    }
  }

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      OWNER: "border border-zinc-200 bg-zinc-900 text-white",
      OPS: "border border-zinc-200 bg-white text-zinc-700",
      CASHIER: "border border-zinc-200 bg-white text-zinc-700",
      HR_ADMIN: "border border-zinc-200 bg-white text-zinc-700",
      MANAGER: "border border-zinc-200 bg-white text-zinc-700",
      TEAM_LEADER: "border border-zinc-200 bg-white text-zinc-700",
      STAFF: "border border-zinc-200 bg-white text-zinc-700",
      BACKEND: "border border-zinc-200 bg-white text-zinc-700",
      FRONTEND: "border border-zinc-200 bg-white text-zinc-700",
    }
    return styles[role] || "border border-zinc-200 bg-white text-zinc-700"
  }

  const getRoleLabel = (roleCode: string) => {
    return availableRoles.find((role) => role.role === roleCode)?.label ?? roleCode
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "OWNER":
        return Shield
      case "OPS":
        return UserCog
      case "HR_ADMIN":
        return Shield
      case "MANAGER":
        return Shield
      case "TEAM_LEADER":
        return UserPlus
      case "BACKEND":
        return Shield
      case "FRONTEND":
        return Shield
      default:
        return User
    }
  }

  if (loading) {
    return <PageLoading />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Pengguna</h1>
          <p className="text-sm text-zinc-500">
            Kelola pengguna dan hak akses
          </p>
        </div>
        <Button
          onClick={openCreateModal}
        >
          <Plus className="h-4 w-4" />
          Tambah Pengguna
        </Button>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-zinc-200 bg-zinc-50/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">
                  Pengguna
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {users.map((user) => {
                const RoleIcon = getRoleIcon(user.role)
                return (
                  <tr key={user.id} className="hover:bg-zinc-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-100">
                          <RoleIcon className="h-4 w-4 text-zinc-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-900">
                            {user.name}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {user.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold tracking-wide uppercase ${getRoleBadge(
                          user.role
                        )}`}
                      >
                        <RoleIcon className="h-3 w-3" />
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.mustChangePassword ? (
                        <span className="inline-flex rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold tracking-wide uppercase text-amber-600">
                          Perlu Ganti Password
                        </span>
                      ) : (
                        <span className="inline-flex rounded-md border border-zinc-200 bg-white px-2 py-1 text-[10px] font-semibold tracking-wide uppercase text-zinc-700">
                          Aktif
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(user)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Users className="h-10 w-10 text-zinc-300" />
            <p className="mt-2 text-sm text-zinc-500">Tidak ada pengguna</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Edit Pengguna" : "Tambah Pengguna"}
            </DialogTitle>
            <DialogDescription>
              {editingUser ? "Perbarui data pengguna" : "Tambahkan pengguna baru ke sistem"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Nama *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-300 focus:ring-2 focus:ring-zinc-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-300 focus:ring-2 focus:ring-zinc-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Password {editingUser ? "(kosongkan jika tidak diubah)" : "*"}
              </label>
              <input
                type="password"
                required={!editingUser}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-300 focus:ring-2 focus:ring-zinc-100"
                placeholder="Minimal 6 karakter"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Role *
              </label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value, teamLeaderId: "" })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Role" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role.role} value={role.role}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Team Leader Dropdown - Only show for STAFF role */}
            {(formData.role === "STAFF") && (
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Team Leader
                </label>
                <Select
                  value={formData.teamLeaderId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, teamLeaderId: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Team Leader" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamLeaders.map((leader) => (
                      <SelectItem key={leader.id} value={leader.id}>
                        {leader.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
                className="flex-1"
              >
                {editingUser ? "Perbarui" : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
