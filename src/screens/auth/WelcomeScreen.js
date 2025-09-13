import React from 'react';
import { Platform } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { APP_CONFIG } from '../../constants/config';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Text style={styles.logoText}>HypIDEAS</Text>
          <Text style={styles.taglineText}>
            {APP_CONFIG.tagline}
          </Text>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.featureText}>💡 Share your innovative ideas</Text>
          <Text style={styles.featureText}>🤝 Connect with like-minded thinkers</Text>
          <Text style={styles.featureText}>🌍 Join global community channels</Text>
          <Text style={styles.featureText}>📄 Publish your research</Text>
          <Text style={styles.featureText}>💰 Monetize your patents</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate('PhoneAuth', { isSignUp: true })}
          >
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('PhoneAuth', { isSignUp: false })}
          >
            <Text style={styles.secondaryButtonText}>I have an account</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>
          By continuing, you agree to our Terms & Privacy Policy
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'space-between',
    paddingTop: height * 0.1,
    paddingBottom: 50,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 50,
  },
  logoText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 2,
  },
  taglineText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 24,
  },
  featuresSection: {
    alignItems: 'flex-start',
  },
  featureText: {
    fontSize: 16,
    color: 'white',
    marginBottom: 15,
    lineHeight: 24,
  },
  actionSection: {
    width: '100%',
  },
  primaryButton: {
  backgroundColor: 'white',
  paddingVertical: 16,
  borderRadius: 25,
  alignItems: 'center',
  marginBottom: 15,
  ...(Platform.OS === 'web' ? {
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
  } : {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  }),
  },
  primaryButtonText: {
    color: '#667eea',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: 'white',
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  footerText: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    lineHeight: 18,
  },
});

export default WelcomeScreen;
