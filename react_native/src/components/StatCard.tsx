import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

interface StatCardProps {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, iconColor, subtitle }) => {
  return (
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: (iconColor || Colors.primary) + '20' }]}>
        <Ionicons name={icon} size={22} color={iconColor || Colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    flex: 1,
    margin: 5,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});

export default StatCard;
