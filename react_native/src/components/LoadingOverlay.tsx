import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Colors } from '../theme/colors';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible, message }) => {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color={Colors.primary} />
        {message && <Text style={styles.message}>{message}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  message: {
    marginTop: 16,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});

export default LoadingOverlay;
