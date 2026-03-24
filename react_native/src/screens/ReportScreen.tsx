import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { reportAPI } from '../services/api';
import { Colors } from '../theme/colors';
import { formatCurrency } from '../theme/styles';
import StatCard from '../components/StatCard';

type Period = 'today' | 'week' | 'month';

const ReportScreen: React.FC = () => {
  const [period, setPeriod] = useState<Period>('today');
  const [summary, setSummary] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [period]);

  const getDateRange = () => {
    const now = new Date();
    const end = now.toISOString().split('T')[0];
    let start = end;

    if (period === 'week') {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      start = d.toISOString().split('T')[0];
    } else if (period === 'month') {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      start = d.toISOString().split('T')[0];
    }
    return { startDate: start, endDate: end };
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      const range = getDateRange();
      const [summaryRes, topRes] = await Promise.all([
        reportAPI.getSummary(range),
        reportAPI.getTopProducts({ ...range, limit: 10 }),
      ]);
      setSummary(summaryRes.data?.data || null);
      setTopProducts(topRes.data?.data || []);
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  const periods: { key: Period; label: string }[] = [
    { key: 'today', label: 'Hari Ini' },
    { key: 'week', label: '7 Hari' },
    { key: 'month', label: '30 Hari' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <View style={styles.header}>
        <Text style={styles.title}>Laporan</Text>
        <Text style={styles.subtitle}>Analisis penjualan</Text>
      </View>

      {/* Period Tabs */}
      <View style={styles.periodTabs}>
        {periods.map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[styles.periodTab, period === p.key && styles.periodTabActive]}
            onPress={() => setPeriod(p.key)}
          >
            <Text style={[styles.periodTabText, period === p.key && styles.periodTabTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Summary Stats */}
          <View style={styles.statsRow}>
            <StatCard
              title="Total Penjualan"
              value={String(summary?.totalSales || 0)}
              icon="receipt-outline"
              iconColor={Colors.primary}
            />
            <StatCard
              title="Pendapatan"
              value={formatCurrency(summary?.totalRevenue || 0)}
              icon="wallet-outline"
              iconColor={Colors.success}
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              title="Item Terjual"
              value={String(summary?.totalItems || 0)}
              icon="cube-outline"
              iconColor={Colors.info}
            />
            <StatCard
              title="Rata-rata"
              value={formatCurrency(
                summary?.totalSales
                  ? Math.round((summary?.totalRevenue || 0) / summary.totalSales)
                  : 0
              )}
              icon="trending-up-outline"
              iconColor={Colors.warning}
            />
          </View>

          {/* Payment Breakdown */}
          <Text style={styles.sectionTitle}>Pembayaran</Text>
          <View style={styles.paymentCards}>
            <View style={styles.paymentCard}>
              <View style={[styles.paymentDot, { backgroundColor: Colors.cash }]} />
              <Text style={styles.paymentLabel}>Tunai</Text>
              <Text style={styles.paymentValue}>{summary?.cashSales || 0}</Text>
            </View>
            <View style={styles.paymentCard}>
              <View style={[styles.paymentDot, { backgroundColor: Colors.qris }]} />
              <Text style={styles.paymentLabel}>QRIS</Text>
              <Text style={styles.paymentValue}>{summary?.qrisSales || 0}</Text>
            </View>
            <View style={styles.paymentCard}>
              <View style={[styles.paymentDot, { backgroundColor: Colors.transfer }]} />
              <Text style={styles.paymentLabel}>Transfer</Text>
              <Text style={styles.paymentValue}>{summary?.transferSales || 0}</Text>
            </View>
          </View>

          {/* Top Products */}
          {topProducts.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Produk Terlaris</Text>
              {topProducts.map((product: any, index: number) => (
                <View key={index} style={styles.topProductItem}>
                  <View style={[styles.rankCircle, { backgroundColor: Colors.categoryColors[index % 10] + '20' }]}>
                    <Text style={[styles.rankNumber, { color: Colors.categoryColors[index % 10] }]}>
                      {index + 1}
                    </Text>
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={1}>
                      {product.productName || product.name}
                    </Text>
                    <Text style={styles.productQty}>{product.totalQty || product.qty} terjual</Text>
                  </View>
                  <Text style={styles.productRevenue}>
                    {formatCurrency(product.totalRevenue || product.revenue || 0)}
                  </Text>
                </View>
              ))}
            </>
          )}

          <View style={{ height: 30 }} />
        </ScrollView>
      )}
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
    paddingBottom: 8,
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
  periodTabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 11,
  },
  periodTabActive: {
    backgroundColor: Colors.primary,
  },
  periodTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  periodTabTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 11,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  paymentCards: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  paymentCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  paymentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
    marginBottom: 4,
  },
  paymentValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
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
  rankCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rankNumber: {
    fontSize: 15,
    fontWeight: '800',
  },
  productInfo: {
    flex: 1,
    marginRight: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  productQty: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  productRevenue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.secondary,
  },
});

export default ReportScreen;
