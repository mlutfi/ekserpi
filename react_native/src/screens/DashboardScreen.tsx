import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { saleAPI, reportAPI } from '../services/api';
import { Colors } from '../theme/colors';
import { formatCurrency } from '../theme/styles';
import StatCard from '../components/StatCard';

const DashboardScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [dailyReport, setDailyReport] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [dailyRes, topRes] = await Promise.all([
        saleAPI.getDailyReport({ date: today }),
        reportAPI.getTopProducts({ limit: 5, startDate: today, endDate: today }).catch(() => null),
      ]);
      setDailyReport(dailyRes.data?.data || null);
      if (topRes) setTopProducts(topRes.data?.data || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()} 👋</Text>
            <Text style={styles.userName}>{user?.name}</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Ionicons name="log-out-outline" size={22} color={Colors.error} />
          </TouchableOpacity>
        </View>

        {/* Revenue Card */}
        <View style={styles.revenueCard}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            style={styles.revenueGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.revenueLabel}>Pendapatan Hari Ini</Text>
            <Text style={styles.revenueValue}>
              {formatCurrency(dailyReport?.totalRevenue || 0)}
            </Text>
            <View style={styles.revenueDivider} />
            <View style={styles.revenueStats}>
              <View style={styles.revenueStat}>
                <Text style={styles.revenueStatValue}>{dailyReport?.totalSales || 0}</Text>
                <Text style={styles.revenueStatLabel}>Transaksi</Text>
              </View>
              <View style={styles.revenueStat}>
                <Text style={styles.revenueStatValue}>{dailyReport?.totalItems || 0}</Text>
                <Text style={styles.revenueStatLabel}>Item Terjual</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Stats */}
        <Text style={styles.sectionTitle}>Metode Pembayaran</Text>
        <View style={styles.statsRow}>
          <StatCard
            title="Tunai"
            value={String(dailyReport?.cashSales || 0)}
            icon="cash-outline"
            iconColor={Colors.cash}
            subtitle="transaksi"
          />
          <StatCard
            title="QRIS"
            value={String(dailyReport?.qrisSales || 0)}
            icon="qr-code-outline"
            iconColor={Colors.qris}
            subtitle="transaksi"
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            title="Transfer"
            value={String(dailyReport?.transferSales || 0)}
            icon="swap-horizontal-outline"
            iconColor={Colors.transfer}
            subtitle="transaksi"
          />
          <StatCard
            title="Total"
            value={String(dailyReport?.totalSales || 0)}
            icon="bar-chart-outline"
            iconColor={Colors.primary}
            subtitle="transaksi"
          />
        </View>

        {/* Top Products */}
        {topProducts.length > 0 && (
          <View style={styles.topProductsSection}>
            <Text style={styles.sectionTitle}>Produk Terlaris</Text>
            {topProducts.map((product: any, index: number) => (
              <View key={index} style={styles.topProductItem}>
                <View style={[styles.rankBadge, index === 0 && styles.rankBadgeGold]}>
                  <Text style={[styles.rankText, index === 0 && styles.rankTextGold]}>
                    {index + 1}
                  </Text>
                </View>
                <View style={styles.topProductInfo}>
                  <Text style={styles.topProductName} numberOfLines={1}>{product.productName || product.name}</Text>
                  <Text style={styles.topProductQty}>{product.totalQty || product.qty} terjual</Text>
                </View>
                <Text style={styles.topProductRevenue}>
                  {formatCurrency(product.totalRevenue || product.revenue || 0)}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
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
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  revenueCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 24,
    overflow: 'hidden',
  },
  revenueGradient: {
    padding: 24,
  },
  revenueLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  revenueValue: {
    fontSize: 34,
    fontWeight: '900',
    color: '#fff',
    marginTop: 4,
  },
  revenueDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 16,
  },
  revenueStats: {
    flexDirection: 'row',
    gap: 40,
  },
  revenueStat: {},
  revenueStatValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  revenueStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 11,
  },
  topProductsSection: {
    paddingBottom: 10,
  },
  topProductItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rankBadgeGold: {
    backgroundColor: Colors.warning + '20',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  rankTextGold: {
    color: Colors.warning,
  },
  topProductInfo: {
    flex: 1,
    marginRight: 10,
  },
  topProductName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  topProductQty: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  topProductRevenue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.secondary,
  },
});

export default DashboardScreen;
