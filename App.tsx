// App.tsx
import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, Text, Image, Pressable } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import ForceChangePasswordScreen from './src/screens/ForceChangePasswordScreen';
import { linking } from './src/navigation/linking';
import { LeadsScreen } from './src/screens/LeadsScreen';
import { ReviewsScreen } from './src/screens/ReviewsScreen';
import ContactsScreen from './src/screens/ContactsScreen';
import ReviewRequestScreen from './src/screens/ReviewRequestScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Admin screens
import AdminHomeScreen from './src/screens/admin/AdminHomeScreen';
import AdminClientsScreen from './src/screens/admin/AdminClientsScreen';
import AdminClientEditScreen from './src/screens/admin/AdminClientEditScreen';
import AdminClientUsersScreen from './src/screens/admin/AdminClientUsersScreen';
import AdminUserCreateScreen from './src/screens/admin/AdminUserCreateScreen';
import AdminUserEditScreen from './src/screens/admin/AdminUserEditScreen';
import { supabase } from './src/lib/supabase';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import VerifyCodeScreen from './src/screens/VerifyCodeScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const AdminStack = createNativeStackNavigator();

function AdminNavigator() {
  return (
    <AdminStack.Navigator>
      <AdminStack.Screen name="AdminHome" component={AdminHomeScreen} options={{ title: 'Admin' }} />
      <AdminStack.Screen name="AdminClients" component={AdminClientsScreen} options={{ title: 'Businesses' }} />
      <AdminStack.Screen name="AdminClientEdit" component={AdminClientEditScreen} options={{ title: 'Business' }} />
      <AdminStack.Screen name="AdminClientUsers" component={AdminClientUsersScreen} options={{ title: 'Users' }} />
      <AdminStack.Screen name="AdminUserCreate" component={AdminUserCreateScreen} options={{ title: 'Add user' }} />
      <AdminStack.Screen name="AdminUserEdit" component={AdminUserEditScreen} options={{ title: 'Edit user' }} />
    </AdminStack.Navigator>
  );
}

const SitrixxTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FFFFFF',
  },
};

const LoadingScreen = ({ label = 'Loading your dashboard…' }: { label?: string }) => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
    <Image
      source={require('./assets/logo.png')}
      style={{ width: 96, height: 96, borderRadius: 24, marginBottom: 16 }}
      resizeMode="contain"
    />
    <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 4 }}>Sitrixx</Text>
    <Text style={{ color: '#6B7280', marginBottom: 12 }}>{label}</Text>
    <ActivityIndicator size="large" color="#7C3AED" />
  </View>
);

const ProfileGate = () => {
  const { profileError, refreshProfile, signOut } = useAuth();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 18, backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 6 }}>Couldn’t load your account</Text>
      <Text style={{ color: '#6B7280', textAlign: 'center', marginBottom: 14 }}>
        {profileError || 'Profile not found. This usually means the profile row or RLS policies are misconfigured.'}
      </Text>

      <Pressable
        onPress={refreshProfile}
        style={{ backgroundColor: '#7C3AED', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999 }}
      >
        <Text style={{ color: '#fff', fontWeight: '800' }}>Retry</Text>
      </Pressable>

      <Pressable onPress={signOut} style={{ marginTop: 14 }}>
        <Text style={{ color: '#6B7280', textDecorationLine: 'underline' }}>Logout</Text>
      </Pressable>
    </View>
  );
};

function AuthedTabs() {
  const { profile } = useAuth();
  const isAdmin = (profile?.role || '').toLowerCase() === 'admin';

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
          if (route.name === 'Leads') return <Ionicons name="people-outline" size={size} color={color} />;
          if (route.name === 'Reviews') return <Ionicons name="star-outline" size={size} color={color} />;
          if (route.name === 'Requests') return <Ionicons name="chatbubbles-outline" size={size} color={color} />;
          if (route.name === 'Contacts') return <Ionicons name="book-outline" size={size} color={color} />;
          if (route.name === 'Settings') return <Ionicons name="settings-outline" size={size} color={color} />;
          if (route.name === 'Admin') return <Ionicons name="shield-outline" size={size} color={color} />;
          return null;
        },
      })}
    >
      <Tab.Screen name="Leads" component={LeadsScreen} />
      <Tab.Screen name="Reviews" component={ReviewsScreen} />
      <Tab.Screen name="Requests" component={ReviewRequestScreen} options={{ title: 'Messaging' }} />
      <Tab.Screen name="Contacts" component={ContactsScreen} options={{ title: 'Contacts' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} />

      {isAdmin ? (
        <Tab.Screen
          name="Admin"
          component={AdminNavigator}
          options={{ headerShown: false }}
        />
      ) : null}
    </Tab.Navigator>
  );
}

const RootNavigator = () => {
  const { session, loading, profileLoading, profile } = useAuth();

  if (loading) return <LoadingScreen label="Starting…" />;
  if (session && profileLoading) return <LoadingScreen label="Loading your account…" />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!session ? (
        <>
          <Stack.Screen name="Auth" component={LoginScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </>
      ) : !profile ? (
        <Stack.Screen name="ProfileGate" component={ProfileGate} />
      ) : profile.needs_password_change ? (
        <Stack.Screen name="ForceChangePassword" component={ForceChangePasswordScreen} />
      ) : (
        <Stack.Screen name="Main" component={AuthedTabs} />
      )}
    </Stack.Navigator>
  );
}
export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer theme={SitrixxTheme} linking={linking}>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
