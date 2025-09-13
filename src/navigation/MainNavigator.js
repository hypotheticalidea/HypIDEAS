import React from 'react';
import { View, Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { APP_CONFIG } from '../constants/config';
import PostDetailScreen from '../screens/posts/PostDetailScreen';
import EnhancedChatScreen from '../screens/chat/EnhancedChatScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminUserManagementScreen from '../screens/admin/AdminUserManagementScreen';

// Import the actual screens
import HomeScreen from '../screens/home/HomeScreen';
import CreatePostScreen from '../screens/home/CreatePostScreen';

// Placeholder screens for now (renamed to avoid duplicates)
const ProfileScreenPlaceholder = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: APP_CONFIG.colors.background }}>
      <Ionicons name="person-circle" size={64} color={APP_CONFIG.colors.textSecondary} />
      <Text style={{ fontSize: 18, color: APP_CONFIG.colors.text, marginTop: 15 }}>
        Profile Screen - Coming Soon!
      </Text>
    </View>
  );
};

const ChatScreenPlaceholder = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: APP_CONFIG.colors.background }}>
      <Ionicons name="chatbubbles" size={64} color={APP_CONFIG.colors.textSecondary} />
      <Text style={{ fontSize: 18, color: APP_CONFIG.colors.text, marginTop: 15 }}>
        Full Chat Screen - Coming Soon!
      </Text>
    </View>
  );
};

const NotificationsScreenPlaceholder = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: APP_CONFIG.colors.background }}>
      <Ionicons name="notifications" size={64} color={APP_CONFIG.colors.textSecondary} />
      <Text style={{ fontSize: 18, color: APP_CONFIG.colors.text, marginTop: 15 }}>
        Notifications Screen - Coming Soon!
      </Text>
    </View>
  );
};

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Notifications') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: APP_CONFIG.colors.primary,
        tabBarInactiveTintColor: APP_CONFIG.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: APP_CONFIG.colors.surface,
          borderTopColor: APP_CONFIG.colors.border,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Chat" component={ChatScreenPlaceholder} />
      <Tab.Screen name="Notifications" component={NotificationsScreenPlaceholder} />
      <Tab.Screen name="Profile" component={ProfileScreenPlaceholder} />
    </Tab.Navigator>
  );
};

const MainNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {Platform.OS === 'web' ? (
        // Web uses single home screen with integrated chat
        <Stack.Screen name="Home" component={HomeScreen} />
      ) : (
        // Mobile uses tab navigation
        <Stack.Screen name="MainTabs" component={TabNavigator} />
      )}
      
      <Stack.Screen 
        name="CreatePost" 
        component={CreatePostScreen}
        options={{
          presentation: 'modal',
        }}
      />

      <Stack.Screen 
        name="PostDetail" 
        component={PostDetailScreen}
        options={{
          title: 'Post Details',
        headerShown: true,
        }}
      />

      <Stack.Screen 
        name="EnhancedChat" 
        component={EnhancedChatScreen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen 
        name="AdminDashboard" 
        component={AdminDashboardScreen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen 
        name="AdminUserManagement" 
        component={AdminUserManagementScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;
