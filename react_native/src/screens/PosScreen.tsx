import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { productAPI, categoryAPI, saleAPI, locationAPI } from '../services/api';
import { Colors } from '../theme/colors';
import { formatCurrency } from '../theme/styles';
import ProductCard from '../components/ProductCard';
import CartItem from '../components/CartItem';
import PaymentModal from '../components/PaymentModal';
import LoadingOverlay from '../components/LoadingOverlay';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  sku?: string | null;
  barcode?: string | null;
  categoryId?: string | null;
  category?: { id: string; name: string } | null;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
}

interface CartItemData {
  productId: string;
  name: string;
  price: number;
  qty: number;
}

const PosScreen: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItemData[]>([]);
  const [locationId, setLocationId] = useState<string>('');
  const [showCart, setShowCart] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchProducts(searchQuery);
    } else {
      loadProducts(selectedCategory || undefined);
    }
  }, [searchQuery, selectedCategory]);

  const loadInitialData = async () => {
    try {
      const [catRes, locRes] = await Promise.all([
        categoryAPI.getAll(),
        locationAPI.getAll(),
      ]);
      const cats = catRes.data?.data || [];
      setCategories(cats);

      const locs = locRes.data?.data || [];
      const defaultLoc = locs.find((l: any) => l.isDefault) || locs[0];
      if (defaultLoc) setLocationId(defaultLoc.id);

      await loadProducts();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async (categoryId?: string) => {
    try {
      const res = await productAPI.getByCategory(categoryId);
      const data = res.data?.data || [];
      setProducts(data.filter((p: Product) => p.isActive));
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const searchProducts = async (q: string) => {
    try {
      const res = await productAPI.search(q);
      const data = res.data?.data || [];
      setProducts(data.filter((p: Product) => p.isActive));
    } catch (error) {
      console.error('Error searching products:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProducts(selectedCategory || undefined);
    setRefreshing(false);
  }, [selectedCategory]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === product.id);
      if (existing) {
        return prev.map((c) =>
          c.productId === product.id ? { ...c, qty: c.qty + 1 } : c
        );
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, qty: 1 }];
    });
  };

  const increaseQty = (productId: string) => {
    setCart((prev) =>
      prev.map((c) => (c.productId === productId ? { ...c, qty: c.qty + 1 } : c))
    );
  };

  const decreaseQty = (productId: string) => {
    setCart((prev) =>
      prev.map((c) => (c.productId === productId ? { ...c, qty: Math.max(1, c.qty - 1) } : c))
    );
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const handleCheckout = () => {
    if (cart.length === 0) {
      Alert.alert('Keranjang Kosong', 'Tambahkan produk ke keranjang terlebih dahulu');
      return;
    }
    setShowPayment(true);
  };

  const createSaleAndPay = async (payFn: (saleId: string) => Promise<void>) => {
    if (!locationId) {
      Alert.alert('Error', 'Lokasi tidak ditemukan');
      return;
    }
    setProcessing(true);
    try {
      const saleRes = await saleAPI.create({
        locationId,
        items: cart.map((c) => ({ productId: c.productId, qty: c.qty })),
      });
      const saleId = saleRes.data?.data?.id;
      if (!saleId) throw new Error('Gagal membuat penjualan');

      await payFn(saleId);

      Alert.alert('Sukses! ✅', 'Transaksi berhasil diproses', [
        { text: 'OK', onPress: () => { setCart([]); setShowPayment(false); setShowCart(false); } },
      ]);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Gagal memproses transaksi';
      Alert.alert('Error', msg);
    } finally {
      setProcessing(false);
    }
  };

  const handlePayCash = async (amount: number) => {
    await createSaleAndPay(async (saleId) => { await saleAPI.payCash(saleId, amount); });
  };

  const handlePayQRIS = async () => {
    await createSaleAndPay(async (saleId) => { await saleAPI.payQRISStatic(saleId); });
  };

  const handlePayTransfer = async (bankDetails: string) => {
    await createSaleAndPay(async (saleId) => { await saleAPI.payTransfer(saleId, bankDetails); });
  };

  const selectCategory = (catId: string | null) => {
    setSelectedCategory(catId);
    setSearchQuery('');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Halo, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.headerSub}>Siap melayani hari ini</Text>
        </View>
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => setShowCart(!showCart)}
          activeOpacity={0.7}
        >
          <Ionicons name="cart" size={24} color={Colors.textPrimary} />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari produk..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
          <TouchableOpacity
            style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
            onPress={() => selectCategory(null)}
          >
            <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>
              Semua
            </Text>
          </TouchableOpacity>
          {categories.map((cat, idx) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                selectedCategory === cat.id && styles.categoryChipActive,
                selectedCategory === cat.id && { backgroundColor: Colors.categoryColors[idx % Colors.categoryColors.length] },
              ]}
              onPress={() => selectCategory(cat.id)}
            >
              <Text style={[styles.categoryChipText, selectedCategory === cat.id && styles.categoryChipTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Product Grid */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.productGrid}
        renderItem={({ item }) => (
          <ProductCard product={item} onPress={() => addToCart(item)} />
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Tidak ada produk</Text>
            </View>
          ) : null
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      />

      {/* Cart Summary Bar */}
      {cart.length > 0 && !showCart && (
        <TouchableOpacity style={styles.cartBar} onPress={() => setShowCart(true)} activeOpacity={0.9}>
          <View style={styles.cartBarLeft}>
            <View style={styles.cartBarBadge}>
              <Text style={styles.cartBarBadgeText}>{cartCount}</Text>
            </View>
            <Text style={styles.cartBarText}>item di keranjang</Text>
          </View>
          <Text style={styles.cartBarTotal}>{formatCurrency(cartTotal)}</Text>
        </TouchableOpacity>
      )}

      {/* Cart Drawer */}
      {showCart && (
        <View style={styles.cartDrawer}>
          <View style={styles.cartDrawerHeader}>
            <Text style={styles.cartDrawerTitle}>Keranjang ({cartCount})</Text>
            <TouchableOpacity onPress={() => setShowCart(false)}>
              <Ionicons name="chevron-down" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.cartList}>
            {cart.map((item) => (
              <CartItem
                key={item.productId}
                item={item}
                onIncrease={() => increaseQty(item.productId)}
                onDecrease={() => decreaseQty(item.productId)}
                onRemove={() => removeItem(item.productId)}
              />
            ))}
          </ScrollView>

          <View style={styles.cartFooter}>
            <View style={styles.cartTotalRow}>
              <Text style={styles.cartTotalLabel}>Total</Text>
              <Text style={styles.cartTotalValue}>{formatCurrency(cartTotal)}</Text>
            </View>
            <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout} activeOpacity={0.8}>
              <Ionicons name="card" size={20} color="#fff" />
              <Text style={styles.checkoutText}>Bayar Sekarang</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Payment Modal */}
      <PaymentModal
        visible={showPayment}
        total={cartTotal}
        items={cart}
        onClose={() => setShowPayment(false)}
        onPayCash={handlePayCash}
        onPayQRIS={handlePayQRIS}
        onPayTransfer={handlePayTransfer}
      />

      <LoadingOverlay visible={processing || loading} message={processing ? 'Memproses transaksi...' : 'Memuat data...'} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  headerSub: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  cartButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  categoriesContainer: {
    marginBottom: 8,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 6,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  productGrid: {
    paddingHorizontal: 14,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textMuted,
    marginTop: 12,
  },
  cartBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  cartBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cartBarBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  cartBarBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  cartBarText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  cartBarTotal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  cartDrawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: Colors.border,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  cartDrawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cartDrawerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cartList: {
    paddingHorizontal: 16,
    maxHeight: 200,
  },
  cartFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cartTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cartTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  cartTotalValue: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.primary,
  },
  checkoutBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  checkoutText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
});

export default PosScreen;
