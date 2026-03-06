"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Plus, Edit, Trash2, Users, Shield, UserCog, User, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
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

interface User {
  id: string
  name: string
  email: string
  role: string
  mustChangePassword: boolean
  teamLeaderId?: string | null
  createdAt: string
}

export default function UsersAdminPage() {
  // const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
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
    fetchUsers()
  }, [])

  useEffect(() => {
    // Fetch team leaders when modal opens
    if (showModal) {
      fetchTeamLeaders()
    }
  }, [showModal])

  async function fetchUsers() {
    try {
      const response = await api.get("/users")
      setUsers(response.data.data ?? [])
    } catch (error) {
      toast.error("Error", {
        description: "Gagal memuat data pengguna",
      })
    } finally {
      setLoading(false)
    }
  }

  async function fetchTeamLeaders() {
    try {
      const response = await api.get("/users")
      const allUsers = response.data.data ?? []
      // Filter only TEAM_LEADER role
      const leaders = allUsers.filter((u: User) => u.role === "TEAM_LEADER")
      setTeamLeaders(leaders)
    } catch (error) {
      console.error("Failed to fetch team leaders:", error)
    }
  }

  function openCreateModal() {
    setEditingUser(null)
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "STAFF",
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
        await api.put(`/users/${editingUser.id}`, payload)
        toast.success("Berhasil", {
          description: "Pengguna berhasil diperbarui",
        })
      } else {
        payload.password = formData.password
        await api.post("/users", payload)
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
      await api.delete(`/users/${user.id}`)
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
      OWNER: "bg-purple-100 text-purple-700",
      OPS: "bg-blue-100 text-blue-700",
      CASHIER: "bg-green-100 text-green-700",
      HR_ADMIN: "bg-orange-100 text-orange-700",
      MANAGER: "bg-indigo-100 text-indigo-700",
      TEAM_LEADER: "bg-teal-100 text-teal-700",
      STAFF: "bg-cyan-100 text-cyan-700",
      BACKEND: "bg-slate-100 text-slate-700",
      FRONTEND: "bg-pink-100 text-pink-700",
    }
    return styles[role] || "bg-slate-100 text-slate-700"
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
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pengguna</h1>
          <p className="text-sm text-slate-500">
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
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                  Pengguna
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => {
                const RoleIcon = getRoleIcon(user.role)
                return (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                          <RoleIcon className="h-5 w-5 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {user.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {user.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${getRoleBadge(
                          user.role
                        )}`}
                      >
                        <RoleIcon className="h-3 w-3" />
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.mustChangePassword ? (
                        <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                          Perlu Ganti Password
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
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
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
            <Users className="h-12 w-12 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">Tidak ada pengguna</p>
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
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Nama *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Password {editingUser ? "(kosongkan jika tidak diubah)" : "*"}
              </label>
              <input
                type="password"
                required={!editingUser}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                placeholder="Minimal 6 karakter"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
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
                  <SelectItem value="OWNER">Owner</SelectItem>
                  <SelectItem value="HR_ADMIN">HR Admin</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="TEAM_LEADER">Team Leader</SelectItem>
                  <SelectItem value="STAFF">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Team Leader Dropdown - Only show for STAFF role */}
            {(formData.role === "STAFF") && (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
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