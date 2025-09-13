import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { APP_CONFIG } from '../../constants/config';

const LoadingScreen = ({ message = 'Loading...' }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={APP_CONFIG.colors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: APP_CONFIG.colors.background,
  },
  message: {
    marginTop: 20,
    fontSize: 16,
    color: APP_CONFIG.colors.textSecondary,
  },
});

export default LoadingScreen;
