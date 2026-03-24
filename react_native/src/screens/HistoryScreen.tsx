import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { saleAPI } from '../services/api';
import { Colors } from '../theme/colors';
import { formatCurrency, formatDate } from '../theme/styles';

interface SaleItem {
  id: string;
  cashierName: string;
  total: number;
  status: string;
  createdAt: string;
  items: { productName: string; qty: number; price: number }[];
}

const HistoryScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await saleAPI.findAll({ date: today, limit: 50 });
      setSales(res.data?.data || []);
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSales();
    setRefreshing(false);
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PAID':
        return { bg: Colors.success + '20', color: Colors.success, icon: 'checkmark-circle' as const, label: 'Lunas' };
      case 'PENDING':
        return { bg: Colors.warning + '20', color: Colors.warning, icon: 'time' as const, label: 'Pending' };
      case 'CANCELLED':
        return { bg: Colors.error + '20', color: Colors.error, icon: 'close-circle' as const, label: 'Batal' };
      default:
        return { bg: Colors.textMuted + '20', color: Colors.textMuted, icon: 'help-circle' as const, label: status };
    }
  };

  const renderSaleItem = ({ item }: { item: SaleItem }) => {
    const status = getStatusStyle(item.status);
    return (
      <TouchableOpacity
        style={styles.saleCard}
        activeOpacity={0.7}
        onPress={() => navigation?.navigate?.('SaleDetail', { saleId: item.id })}
      >
        <View style={styles.saleHeader}>
          <View style={styles.saleIdContainer}>
            <Ionicons name="receipt-outline" size={18} color={Colors.primary} />
            <Text style={styles.saleId}>#{item.id.slice(-6).toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Ionicons name={status.icon} size={14} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.saleInfo}>
          <View style={styles.saleInfoRow}>
            <Ionicons name="person-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.saleInfoText}>{item.cashierName}</Text>
          </View>
          <View style={styles.saleInfoRow}>
            <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.saleInfoText}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.saleDivider} />

        <View style={styles.saleFooter}>
          <Text style={styles.itemCount}>
            {item.items?.length || 0} produk
          </Text>
          <Text style={styles.saleTotal}>{formatCurrency(item.total)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <View style={styles.header}>
        <Text style={styles.title}>Riwayat Transaksi</Text>
        <Text style={styles.subtitle}>Hari ini</Text>
      </View>

      <FlatList
        data={sales}
        keyExtractor={(item) => item.id}
        renderItem={renderSaleItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="receipt-outline" size={48} color={Colors.textMuted} />
              </View>
              <Text style={styles.emptyText}>Belum ada transaksi hari ini</Text>
              <Text style={styles.emptySubtext}>Transaksi akan muncul di sini setelah pembayaran</Text>
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  saleCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  saleIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saleId: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontFamily: 'monospace',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  saleInfo: {
    gap: 6,
  },
  saleInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saleInfoText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  saleDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  saleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCount: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  saleTotal: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.secondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textMuted,
  },
});

export default HistoryScreen;
