import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CartProvider } from './src/context/CartContext';
import HomeScreen from './src/screens/HomeScreen';
import CartScreen from './src/screens/CartScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import OrderSuccessScreen from './src/screens/OrderSuccessScreen';
import MyOrdersScreen from './src/screens/MyOrdersScreen';
import TrackDeliveryScreen from './src/screens/TrackDeliveryScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ACTIVE = '#FF6B35';
const TAB_INACTIVE = '#9CA3AF';

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: '#FFFBF7', elevation: 0, shadowOpacity: 0 },
        headerTintColor: TAB_ACTIVE,
        headerTitleStyle: { fontWeight: '800' },
        tabBarActiveTintColor: TAB_ACTIVE,
        tabBarInactiveTintColor: TAB_INACTIVE,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F0E8E0',
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 8,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        tabBarIcon: ({ color, focused }) => {
          const size = 24;
          const map = {
            Home: focused ? 'home' : 'home-outline',
            MyOrders: focused ? 'receipt' : 'receipt-outline',
            Cart: focused ? 'bag-handle' : 'bag-handle-outline',
          };
          const name = map[route.name] || 'ellipse';
          return <Ionicons name={name} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false, tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="MyOrders"
        component={MyOrdersScreen}
        options={{ title: 'My Orders', tabBarLabel: 'My Orders' }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{ title: 'My Cart', tabBarLabel: 'Cart' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <CartProvider>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: '#FFFBF7', elevation: 0, shadowOpacity: 0 },
              headerTintColor: '#FF6B35',
              headerTitleStyle: { fontWeight: '800' },
            }}
          >
            <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
            <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} options={{ headerShown: false }} />
            <Stack.Screen name="TrackDelivery" component={TrackDeliveryScreen} options={{ title: 'Track Delivery' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </CartProvider>
    </SafeAreaProvider>
  );
}
