// App.tsx
import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, Text, Image } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { LeadsScreen } from './src/screens/LeadsScreen';
import { ReviewsScreen } from './src/screens/ReviewsScreen';
import ContactsScreen from './src/screens/ContactsScreen';
import ReviewRequestScreen from './src/screens/ReviewRequestScreen';
import { Ionicons } from '@expo/vector-icons';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const SitrixxTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FFFFFF',
  },
};

const LoadingScreen = () => (
  <View
    style={{
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
    }}
  >
    <Image
      source={require('./assets/logo.png')}
      style={{ width: 96, height: 96, borderRadius: 24, marginBottom: 16 }}
      resizeMode="contain"
    />
    <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 4 }}>Sitrixx</Text>
    <Text style={{ color: '#6B7280', marginBottom: 12 }}>Loading your dashboard…</Text>
    <ActivityIndicator size="large" color="#7C3AED" />
  </View>
);

function AuthedTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#000000',
        headerTitleStyle: { fontWeight: '600', fontSize: 18 },
        tabBarActiveTintColor: '#7C3AED',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: '#E5E7EB' },
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Leads') {
            return <Ionicons name="people-outline" size={size} color={color} />;
          }
          if (route.name === 'Reviews') {
            return <Ionicons name="star-outline" size={size} color={color} />;
          }
          if (route.name === 'Requests') {
            return (
              <Ionicons name="chatbubbles-outline" size={size} color={color} />
            );
          }
          if (route.name === 'Contacts') {
            return <Ionicons name="book-outline" size={size} color={color} />;
            // or "person-add-outline" if you prefer
          }
          return null;
        },
      })}
    >
      <Tab.Screen name="Leads" component={LeadsScreen} />
      <Tab.Screen name="Reviews" component={ReviewsScreen} />
      <Tab.Screen
        name="Requests"
        component={ReviewRequestScreen}
        options={{ title: 'Review Requests' }}
      />
      <Tab.Screen
        name="Contacts"
        component={ContactsScreen}
        options={{ title: 'Contacts' }}
      />
    </Tab.Navigator>

  );
}

const RootNavigator = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {session ? (
        <Stack.Screen name="Main" component={AuthedTabs} />
      ) : (
        <Stack.Screen name="Auth" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer theme={SitrixxTheme}>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

