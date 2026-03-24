import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { formatCurrency } from '../theme/styles';

interface CartItemProps {
  item: {
    productId: string;
    name: string;
    price: number;
    qty: number;
  };
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, onIncrease, onDecrease, onRemove }) => {
  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.price}>{formatCurrency(item.price)}</Text>
      </View>
      <View style={styles.controls}>
        <TouchableOpacity onPress={item.qty <= 1 ? onRemove : onDecrease} style={styles.btn}>
          <Ionicons name={item.qty <= 1 ? "trash-outline" : "remove"} size={16} color={item.qty <= 1 ? Colors.error : Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.qty}>{item.qty}</Text>
        <TouchableOpacity onPress={onIncrease} style={styles.btn}>
          <Ionicons name="add" size={16} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>
      <Text style={styles.subtotal}>{formatCurrency(item.price * item.qty)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  price: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginRight: 12,
  },
  btn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    minWidth: 24,
    textAlign: 'center',
  },
  subtotal: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.secondary,
    minWidth: 80,
    textAlign: 'right',
  },
});

export default CartItem;
