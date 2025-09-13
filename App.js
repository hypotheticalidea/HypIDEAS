import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import './src/utils/polyfills'; // Import polyfills first
import { AuthProvider } from './src/context/AuthContext';
import { useAuth } from './src/hooks/useAuth';
import LoadingScreen from './src/components/common/LoadingScreen';
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';
import { testConnection } from './src/services/supabase/client';
import { createSampleData } from './src/utils/sampleData';

function AppContent() {
  const { user, loading } = useAuth();

  React.useEffect(() => {
    const initializeApp = async () => {
      await testConnection();
      if (user) {
        // Create sample data for new users
        await createSampleData();
      }
    };
    
    initializeApp();
  }, [user]);

  if (loading) {
    return <LoadingScreen message="Initializing HypIDEAS..." />;
  }

  return (
    <NavigationContainer>
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
