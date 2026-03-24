import { StyleSheet, Platform } from 'react-native';
import { Colors } from './colors';

export const Typography = StyleSheet.create({
  h1: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  bodyBold: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textMuted,
    letterSpacing: 0.3,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  priceSmall: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryLight,
  },
  priceLarge: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
  },
});

export const SharedStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardElevated: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadowLight,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  button: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  buttonPrimary: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputFocused: {
    borderColor: Colors.primary,
    borderWidth: 1.5,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  spaceBetween: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  center: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center' as const,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
});

export const formatCurrency = (amount: number): string => {
  return 'Rp ' + amount.toLocaleString('id-ID');
};

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
