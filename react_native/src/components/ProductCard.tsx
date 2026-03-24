import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Colors } from '../theme/colors';
import { formatCurrency } from '../theme/styles';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string | null;
    sku?: string | null;
    category?: { name: string } | null;
  };
  onPress: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>
              {product.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.price}>{formatCurrency(product.price)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    margin: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    maxWidth: '48%',
  },
  imageContainer: {
    height: 100,
    backgroundColor: Colors.surfaceLight,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
  },
  placeholderText: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.primary,
    opacity: 0.5,
  },
  info: {
    padding: 10,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
    lineHeight: 18,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.secondary,
  },
});

export default ProductCard;
