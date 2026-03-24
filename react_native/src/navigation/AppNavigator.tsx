import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/colors';

// Screens
import LoginScreen from '../screens/LoginScreen';
import PosScreen from '../screens/PosScreen';
import HistoryScreen from '../screens/HistoryScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ReportScreen from '../screens/ReportScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Cashier tabs: POS + History
const CashierTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: Colors.surface,
        borderTopColor: Colors.border,
        borderTopWidth: 1,
        height: 65,
        paddingBottom: 8,
        paddingTop: 8,
      },
      tabBarActiveTintColor: Colors.primary,
      tabBarInactiveTintColor: Colors.textMuted,
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '600',
      },
    }}
  >
    <Tab.Screen
      name="POS"
      component={PosScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="storefront" size={size} color={color} />
        ),
        tabBarLabel: 'Kasir',
      }}
    />
    <Tab.Screen
      name="History"
      component={HistoryScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="receipt-outline" size={size} color={color} />
        ),
        tabBarLabel: 'Riwayat',
      }}
    />
  </Tab.Navigator>
);

// Owner tabs: Dashboard + POS + History + Report
const OwnerTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: Colors.surface,
        borderTopColor: Colors.border,
        borderTopWidth: 1,
        height: 65,
        paddingBottom: 8,
        paddingTop: 8,
      },
      tabBarActiveTintColor: Colors.primary,
      tabBarInactiveTintColor: Colors.textMuted,
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
      },
    }}
  >
    <Tab.Screen
      name="Dashboard"
      component={DashboardScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="grid" size={size} color={color} />
        ),
        tabBarLabel: 'Dashboard',
      }}
    />
    <Tab.Screen
      name="POS"
      component={PosScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="storefront" size={size} color={color} />
        ),
        tabBarLabel: 'Kasir',
      }}
    />
    <Tab.Screen
      name="History"
      component={HistoryScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="receipt-outline" size={size} color={color} />
        ),
        tabBarLabel: 'Riwayat',
      }}
    />
    <Tab.Screen
      name="Reports"
      component={ReportScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="bar-chart" size={size} color={color} />
        ),
        tabBarLabel: 'Laporan',
      }}
    />
  </Tab.Navigator>
);

const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, isOwner } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : isOwner ? (
          <Stack.Screen name="OwnerMain" component={OwnerTabs} />
        ) : (
          <Stack.Screen name="CashierMain" component={CashierTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AppNavigator;
