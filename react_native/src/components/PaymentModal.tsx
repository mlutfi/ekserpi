import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { formatCurrency } from '../theme/styles';

interface CartItemData {
  productId: string;
  name: string;
  price: number;
  qty: number;
}

interface PaymentModalProps {
  visible: boolean;
  total: number;
  items: CartItemData[];
  onClose: () => void;
  onPayCash: (amount: number) => Promise<void>;
  onPayQRIS: () => Promise<void>;
  onPayTransfer: (bankDetails: string) => Promise<void>;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  total,
  items,
  onClose,
  onPayCash,
  onPayQRIS,
  onPayTransfer,
}) => {
  const [method, setMethod] = useState<'select' | 'cash' | 'qris' | 'transfer'>('select');
  const [cashAmount, setCashAmount] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [processing, setProcessing] = useState(false);

  const quickAmounts = [
    total,
    Math.ceil(total / 10000) * 10000,
    Math.ceil(total / 50000) * 50000,
    Math.ceil(total / 100000) * 100000,
  ].filter((v, i, a) => a.indexOf(v) === i && v >= total);

  const cashValue = parseInt(cashAmount.replace(/\D/g, '') || '0');
  const change = cashValue - total;

  const handlePayCash = async () => {
    if (cashValue < total) {
      Alert.alert('Error', 'Jumlah bayar kurang dari total');
      return;
    }
    setProcessing(true);
    try {
      await onPayCash(cashValue);
      resetState();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Gagal memproses pembayaran');
    } finally {
      setProcessing(false);
    }
  };

  const handlePayQRIS = async () => {
    setProcessing(true);
    try {
      await onPayQRIS();
      resetState();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Gagal memproses QRIS');
    } finally {
      setProcessing(false);
    }
  };

  const handlePayTransfer = async () => {
    if (!bankDetails.trim()) {
      Alert.alert('Error', 'Masukkan detail bank');
      return;
    }
    setProcessing(true);
    try {
      await onPayTransfer(bankDetails.trim());
      resetState();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Gagal memproses transfer');
    } finally {
      setProcessing(false);
    }
  };

  const resetState = () => {
    setMethod('select');
    setCashAmount('');
    setBankDetails('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {method === 'select' ? 'Pembayaran' : method === 'cash' ? 'Bayar Tunai' : method === 'qris' ? 'Bayar QRIS' : 'Bayar Transfer'}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Total */}
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total Pembayaran</Text>
            <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
            <Text style={styles.itemCount}>{items.reduce((s, i) => s + i.qty, 0)} item</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {method === 'select' && (
              <View style={styles.methods}>
                {/* Cash */}
                <TouchableOpacity style={styles.methodCard} onPress={() => setMethod('cash')} activeOpacity={0.7}>
                  <View style={[styles.methodIcon, { backgroundColor: Colors.cash + '20' }]}>
                    <Ionicons name="cash-outline" size={28} color={Colors.cash} />
                  </View>
                  <Text style={styles.methodTitle}>Tunai</Text>
                  <Text style={styles.methodDesc}>Bayar dengan uang tunai</Text>
                </TouchableOpacity>

                {/* QRIS */}
                <TouchableOpacity style={styles.methodCard} onPress={() => setMethod('qris')} activeOpacity={0.7}>
                  <View style={[styles.methodIcon, { backgroundColor: Colors.qris + '20' }]}>
                    <Ionicons name="qr-code-outline" size={28} color={Colors.qris} />
                  </View>
                  <Text style={styles.methodTitle}>QRIS</Text>
                  <Text style={styles.methodDesc}>Scan QR Code</Text>
                </TouchableOpacity>

                {/* Transfer */}
                <TouchableOpacity style={styles.methodCard} onPress={() => setMethod('transfer')} activeOpacity={0.7}>
                  <View style={[styles.methodIcon, { backgroundColor: Colors.transfer + '20' }]}>
                    <Ionicons name="swap-horizontal-outline" size={28} color={Colors.transfer} />
                  </View>
                  <Text style={styles.methodTitle}>Transfer</Text>
                  <Text style={styles.methodDesc}>Transfer bank</Text>
                </TouchableOpacity>
              </View>
            )}

            {method === 'cash' && (
              <View style={styles.paymentForm}>
                <Text style={styles.inputLabel}>Jumlah Uang Diterima</Text>
                <TextInput
                  style={styles.cashInput}
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  value={cashAmount}
                  onChangeText={setCashAmount}
                  keyboardType="number-pad"
                  autoFocus
                />

                {/* Quick amounts */}
                <View style={styles.quickAmounts}>
                  {quickAmounts.map((amount) => (
                    <TouchableOpacity
                      key={amount}
                      style={[styles.quickBtn, cashValue === amount && styles.quickBtnActive]}
                      onPress={() => setCashAmount(amount.toString())}
                    >
                      <Text style={[styles.quickBtnText, cashValue === amount && styles.quickBtnTextActive]}>
                        {formatCurrency(amount)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {cashValue >= total && (
                  <View style={styles.changeCard}>
                    <Text style={styles.changeLabel}>Kembalian</Text>
                    <Text style={styles.changeValue}>{formatCurrency(change)}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.payBtn, cashValue < total && styles.payBtnDisabled]}
                  onPress={handlePayCash}
                  disabled={cashValue < total || processing}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={cashValue >= total ? [Colors.success, '#00C853'] : [Colors.textMuted, Colors.textMuted]} style={styles.payBtnGradient}>
                    <Ionicons name="checkmark-circle" size={22} color="#fff" />
                    <Text style={styles.payBtnText}>{processing ? 'Memproses...' : 'Bayar Tunai'}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setMethod('select')} style={styles.backLink}>
                  <Text style={styles.backLinkText}>← Pilih metode lain</Text>
                </TouchableOpacity>
              </View>
            )}

            {method === 'qris' && (
              <View style={styles.paymentForm}>
                <View style={styles.qrisInfo}>
                  <Ionicons name="information-circle" size={20} color={Colors.info} />
                  <Text style={styles.qrisInfoText}>QRIS statis akan digunakan. Pelanggan scan QR Code yang tersedia di kasir.</Text>
                </View>

                <TouchableOpacity
                  style={styles.payBtn}
                  onPress={handlePayQRIS}
                  disabled={processing}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={[Colors.qris, '#FFC107']} style={styles.payBtnGradient}>
                    <Ionicons name="qr-code" size={22} color={Colors.textInverse} />
                    <Text style={[styles.payBtnText, { color: Colors.textInverse }]}>{processing ? 'Memproses...' : 'Konfirmasi QRIS'}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setMethod('select')} style={styles.backLink}>
                  <Text style={styles.backLinkText}>← Pilih metode lain</Text>
                </TouchableOpacity>
              </View>
            )}

            {method === 'transfer' && (
              <View style={styles.paymentForm}>
                <Text style={styles.inputLabel}>Detail Bank / Referensi</Text>
                <TextInput
                  style={styles.cashInput}
                  placeholder="Nama bank, no rek, dll"
                  placeholderTextColor={Colors.textMuted}
                  value={bankDetails}
                  onChangeText={setBankDetails}
                  autoFocus
                />

                <TouchableOpacity
                  style={[styles.payBtn, !bankDetails.trim() && styles.payBtnDisabled]}
                  onPress={handlePayTransfer}
                  disabled={!bankDetails.trim() || processing}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={bankDetails.trim() ? [Colors.transfer, '#0288D1'] : [Colors.textMuted, Colors.textMuted]} style={styles.payBtnGradient}>
                    <Ionicons name="swap-horizontal" size={22} color="#fff" />
                    <Text style={styles.payBtnText}>{processing ? 'Memproses...' : 'Konfirmasi Transfer'}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setMethod('select')} style={styles.backLink}>
                  <Text style={styles.backLinkText}>← Pilih metode lain</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  totalLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  totalValue: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.primary,
    marginVertical: 4,
  },
  itemCount: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  methods: {
    gap: 12,
  },
  methodCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  methodIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  methodDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    position: 'absolute',
    right: 18,
  },
  paymentForm: {
    paddingTop: 4,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  cashInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 14,
    padding: 16,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  quickBtn: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickBtnActive: {
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary,
  },
  quickBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  quickBtnTextActive: {
    color: Colors.primary,
  },
  changeCard: {
    backgroundColor: Colors.success + '15',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  changeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.success,
  },
  changeValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.success,
  },
  payBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
  },
  payBtnDisabled: {
    opacity: 0.5,
  },
  payBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  payBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  qrisInfo: {
    backgroundColor: Colors.info + '15',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.info + '30',
  },
  qrisInfoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  backLink: {
    alignSelf: 'center',
    marginTop: 4,
  },
  backLinkText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default PaymentModal;
