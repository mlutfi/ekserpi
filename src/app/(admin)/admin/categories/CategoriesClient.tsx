"use client"

import { useState, useEffect } from "react"
import { categoriesApi, Category } from "@/lib/api"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2, FolderTree } from "lucide-react"

export default function CategoriesAdminPage() {
  // const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({ name: "" })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const data = await categoriesApi.getAll()
      setCategories(data ?? [])
    } catch (error) {
      toast.error("Error", {
        description: "Gagal memuat data",
      })
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setEditingCategory(null)
    setFormData({ name: "" })
    setShowModal(true)
  }

  function openEditModal(category: Category) {
    setEditingCategory(category)
    setFormData({ name: category.name })
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (editingCategory) {
        await categoriesApi.update(editingCategory.id, formData.name)
        toast.success("Berhasil", {
          description: "Kategori berhasil diperbarui",
        })
      } else {
        await categoriesApi.create(formData.name)
        toast.success("Berhasil", {
          description: "Kategori berhasil dibuat",
        })
      }
      setShowModal(false)
      fetchData()
    } catch (error: any) {
      toast.error("Error", {
        description: error.response?.data?.message || "Gagal menyimpan kategori",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(category: Category) {
    if (!confirm(`Hapus kategori "${category.name}"?`)) return

    try {
      await categoriesApi.delete(category.id)
      toast.success("Berhasil", {
        description: "Kategori berhasil dihapus",
      })
      fetchData()
    } catch (error: any) {
      toast.error("Error", {
        description: error.response?.data?.message || "Gagal menghapus kategori",
      })
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
          <h1 className="text-2xl font-bold text-slate-900">Kategori</h1>
          <p className="text-sm text-slate-500">
            Kelola kategori produk Anda
          </p>
        </div>
        <Button
          onClick={openCreateModal}
        >
          <Plus className="h-4 w-4" />
          Tambah Kategori
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <div
            key={category.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                  <FolderTree className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {category.name}
                  </h3>
                  <p className="text-xs text-slate-500">ID: {category.id.slice(0, 8)}...</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEditModal(category)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(category)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-12">
          <FolderTree className="h-12 w-12 text-slate-300" />
          <p className="mt-2 text-sm text-slate-500">Tidak ada kategori</p>
          <Button
            variant="link"
            onClick={openCreateModal}
            className="mt-4 text-amber-600 hover:text-amber-700"
          >
            Tambah kategori pertama
          </Button>
        </div>
      )}

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Kategori" : "Tambah Kategori"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory ? "Perbarui nama kategori" : "Tambahkan kategori produk baru"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Nama Kategori *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                placeholder="Contoh: Makanan"
              />
            </div>

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
                {editingCategory ? "Perbarui" : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}