"use client";

import { useState, useEffect } from "react";
import { productsApi, categoriesApi, Product, Category } from "@/lib/api";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  MoreVertical,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageLoading } from "@/components/ui/page-loading";

// Helper to resolve image URL with backend base
const getImageUrl = (url?: string | null) => {
  if (!url) return "";

  // Handle case where database stored malformed URL like "https:/pos..."
  let path = url;
  if (path.startsWith("http")) {
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    // Extract path from malformed URL if matching /uploads/
    const match = path.match(/\/uploads\/.*/);
    if (match) {
      path = match[0];
    } else {
      return path;
    }
  }

  // Get base URL from env or fallback
  const imageBase = process.env.NEXT_PUBLIC_IMAGE_URL ||
    (process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') : 'http://localhost:4001');

  // Ensure path starts with /
  path = path.startsWith("/") ? path : `/${path}`;
  return `${imageBase}${path}`;
};

export default function ProductsAdminPage() {
  // const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    categoryId: "",
    sku: "",
    barcode: "",
    cost: "",
    isActive: true,
    imageUrl: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [productsData, categoriesData] = await Promise.all([
        productsApi.getAll(),
        categoriesApi.getAll(),
      ]);
      setProducts(productsData ?? []);
      setCategories(categoriesData ?? []);
    } catch (error) {
      toast.error("Error", {
        description: "Gagal memuat data",
      });
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(search.toLowerCase()),
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  function openCreateModal() {
    setEditingProduct(null);
    setFormData({
      name: "",
      price: "",
      categoryId: "",
      sku: "",
      barcode: "",
      cost: "",
      isActive: true,
      imageUrl: "",
    });
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      categoryId: product.categoryId || "",
      sku: product.sku || "",
      barcode: product.barcode || "",
      cost: product.cost?.toString() || "",
      isActive: product.isActive,
      imageUrl: product.imageUrl || "",
    });
    setImageFile(null);
    setImagePreview(product.imageUrl || null);
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsUploading(true);

    try {
      let finalImageUrl = formData.imageUrl;

      // Upload image if a new file is selected
      if (imageFile) {
        finalImageUrl = await productsApi.uploadImage(imageFile);
      }

      const data = {
        name: formData.name,
        price: parseInt(formData.price),
        categoryId: formData.categoryId || undefined,
        sku: formData.sku || undefined,
        barcode: formData.barcode || undefined,
        cost: formData.cost ? parseInt(formData.cost) : undefined,
        isActive: formData.isActive,
        imageUrl: finalImageUrl || undefined,
      };

      if (editingProduct) {
        await productsApi.update(editingProduct.id, data);
        toast.success("Berhasil", {
          description: "Produk berhasil diperbarui",
        });
      } else {
        await productsApi.create(data);
        toast.success("Berhasil", {
          description: "Produk berhasil dibuat",
        });
      }
      setShowModal(false);
      fetchData();
    } catch (error: any) {
      toast.error("Error", {
        description: error.response?.data?.message || "Gagal menyimpan produk",
      });
    } finally {
      setIsUploading(false);
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("Error", {
          description: "Ukuran file maksimal 5MB",
        });
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  async function handleDelete(product: Product) {
    if (!confirm(`Hapus produk "${product.name}"?`)) return;

    try {
      await productsApi.delete(product.id);
      toast.success("Berhasil", {
        description: "Produk berhasil dihapus",
      });
      fetchData();
    } catch (error: any) {
      toast.error("Error", {
        description: error.response?.data?.message || "Gagal menghapus produk",
      });
    }
  }

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Produk</h1>
          <p className="text-sm text-zinc-500">
            Kelola produk dan inventori Anda
          </p>
        </div>
        <Button
          onClick={openCreateModal}
        >
          <Plus className="h-4 w-4" />
          Tambah Produk
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Cari produk..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm text-zinc-900 outline-none transition focus:border-zinc-300 focus:ring-2 focus:ring-zinc-100"
        />
      </div>

      {/* Products Table */}
      <div className="rounded-lg border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-zinc-200 bg-zinc-50/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">
                  Produk
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">
                  Kategori
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">
                  Harga
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">
                  Stok
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
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-zinc-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-100 border border-zinc-200 overflow-hidden">
                        {product.imageUrl ? (
                          <img
                            src={getImageUrl(product.imageUrl)}
                            alt={product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="h-4 w-4 text-zinc-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-900">
                          {product.name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {product.sku || product.barcode || "-"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600">
                    {product.category || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-zinc-900">
                    {formatPrice(product.price)}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600">
                    {product.qtyOnHand ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center border rounded-md px-2 py-1 text-[10px] font-semibold tracking-wide uppercase ${product.isActive
                        ? "border-zinc-200 bg-white text-zinc-700"
                        : "border-zinc-200 bg-zinc-100 text-zinc-500"
                        }`}
                    >
                      {product.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Package className="h-10 w-10 text-zinc-300" />
            <p className="mt-2 text-sm text-zinc-500">Tidak ada produk</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-[900px]">
          <DialogHeader className="mb-2 pb-3 border-b border-zinc-200">
            <DialogTitle>
              {editingProduct ? "Edit Produk" : "Tambah Produk"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? "Perbarui data produk" : "Tambahkan produk baru ke inventori"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-6">
              {/* Image Upload Column */}
              <div className="w-1/3 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">
                    Gambar Produk
                  </label>
                  <div className="relative aspect-square w-full flex-col flex items-center justify-center overflow-hidden rounded-md border border-dashed border-zinc-300 bg-zinc-50 transition-colors hover:border-zinc-400 hover:bg-zinc-100 group">
                    {imagePreview ? (
                      <>
                        <img
                          src={imagePreview.startsWith('blob:') ? imagePreview : getImageUrl(imagePreview)}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white text-xs font-semibold px-3 py-1 bg-black/50 rounded-full">Ubah Gambar</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4 text-center">
                        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-md bg-zinc-200">
                          <ImageIcon className="h-4 w-4 text-zinc-500" />
                        </div>
                        <span className="text-xs font-medium text-zinc-600">
                          Pilih atau tarik gambar ke sini
                        </span>
                        <span className="mt-1 text-[10px] text-zinc-400">
                          JPG, PNG, WEBP (Max 5MB)
                        </span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                  </div>
                </div>
              </div>

              {/* Form Fields Column */}
              <div className="w-2/3 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">
                    Nama Produk *
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">
                      Harga Jual *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-300 focus:ring-2 focus:ring-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">
                      Harga Modal
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.cost}
                      onChange={(e) =>
                        setFormData({ ...formData, cost: e.target.value })
                      }
                      className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-300 focus:ring-2 focus:ring-zinc-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">
                    Kategori
                  </label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, categoryId: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">
                      SKU
                    </label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) =>
                        setFormData({ ...formData, sku: e.target.value })
                      }
                      className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-300 focus:ring-2 focus:ring-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700">
                      Barcode
                    </label>
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) =>
                        setFormData({ ...formData, barcode: e.target.value })
                      }
                      className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-300 focus:ring-2 focus:ring-zinc-100"
                    />
                  </div>
                </div>



                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                  />
                  <label htmlFor="isActive" className="text-sm text-zinc-700">
                    Produk Aktif
                  </label>
                </div>
              </div> {/* End Fields Column */}
            </div> {/* End Flex Container */}

            <div className="flex gap-3 pt-4 border-t border-zinc-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
                disabled={isUploading}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                type="submit"
                loading={isUploading}
                className="flex-1"
              >
                {editingProduct ? "Perbarui" : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
