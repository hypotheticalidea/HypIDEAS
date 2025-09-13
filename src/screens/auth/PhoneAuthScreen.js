import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import PhoneInputField from '../../components/common/PhoneInputField';
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field';
import { AuthService } from '../../services/auth/authService';
import { APP_CONFIG } from '../../constants/config';
import LoadingScreen from '../../components/common/LoadingScreen';

const CELL_COUNT = 6;

const PhoneAuthScreen = ({ route, navigation }) => {
  const { isSignUp } = route.params;
  const [step, setStep] = useState('phone'); // 'phone' | 'otp' | 'profile'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [formattedValue, setFormattedValue] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);

  const phoneRef = useRef(null);
  const otpRef = useBlurOnFulfill({ value: otpValue, cellCount: CELL_COUNT });
  const [otpProps, getCellOnLayoutHandler] = useClearByFocusCell({
    value: otpValue,
    setValue: setOtpValue,
  });

  const handleSendOTP = async () => {
  // Simple validation - check if we have at least 10 digits
  if (!formattedValue || formattedValue.replace(/\D/g, '').length < 10) {
    Alert.alert('Error', 'Please enter a valid phone number');
    return;
  }

  setLoading(true);

  try {
    // Check if user exists (only for sign up)
    if (isSignUp) {
      const { exists, userData } = await AuthService.checkUserExists(formattedValue);
      if (exists) {
        Alert.alert(
          'Account Exists', 
          'An account with this phone number already exists. Please sign in instead.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign In', onPress: () => navigation.replace('PhoneAuth', { isSignUp: false }) }
          ]
        );
        setLoading(false);
        return;
      }
    }

    const result = await AuthService.sendPhoneOTP(formattedValue);
    
    if (result.success) {
      setStep('otp');
      Alert.alert('OTP Sent', 'Please check your phone for the verification code');
    } else {
      Alert.alert('Error', result.error);
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to send OTP. Please try again.');
  } finally {
    setLoading(false);
  }
};


  const handleVerifyOTP = async () => {
    if (otpValue.length !== CELL_COUNT) {
      Alert.alert('Error', 'Please enter the complete OTP');
      return;
    }

    setLoading(true);

    try {
      const result = await AuthService.verifyPhoneOTP(formattedValue, otpValue);
      
      if (result.success) {
        if (isSignUp) {
          // New user - go to profile setup
          navigation.replace('ProfileSetup', { 
            userId: result.user.id,
            phoneNumber: formattedValue 
          });
        } else {
          // Existing user - login successful
          Alert.alert('Success', 'Welcome back!');
          // Navigation will be handled by AuthContext
        }
      } else {
        Alert.alert('Error', result.error);
        setOtpValue('');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify OTP. Please try again.');
      setOtpValue('');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await AuthService.signInWithGoogle();
      if (result.success) {
        Alert.alert('Success', 'Signed in with Google successfully!');
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Google sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen message={step === 'phone' ? 'Sending OTP...' : 'Verifying...'} />;
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'phone' 
              ? (isSignUp ? 'Enter your phone number to get started' : 'Enter your phone number to sign in')
              : 'Enter the 6-digit code sent to your phone'
            }
          </Text>
        </View>

        {step === 'phone' ? (
          <View style={styles.formContainer}>
            <PhoneInputField
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              onChangeFormattedText={setFormattedValue}
              autoFocus={true}
              placeholder="Enter your phone number"
            />

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSendOTP}
            >
              <Text style={styles.primaryButtonText}>
                {isSignUp ? 'Send Verification Code' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
            >
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formContainer}>
            <Text style={styles.otpLabel}>
              Verification code sent to {formattedValue}
            </Text>

            <CodeField
              ref={otpRef}
              {...otpProps}
              value={otpValue}
              onChangeText={setOtpValue}
              cellCount={CELL_COUNT}
              rootStyle={styles.codeFieldRoot}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              renderCell={({ index, symbol, isFocused }) => (
                <View
                  key={index}
                  style={[styles.otpCell, isFocused && styles.focusCell]}
                  onLayout={getCellOnLayoutHandler(index)}
                >
                  <Text style={styles.otpCellText}>
                    {symbol || (isFocused ? <Cursor /> : null)}
                  </Text>
                </View>
              )}
            />

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleVerifyOTP}
            >
              <Text style={styles.primaryButtonText}>Verify Code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleSendOTP}
            >
              <Text style={styles.secondaryButtonText}>Resend Code</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (step === 'otp') {
              setStep('phone');
              setOtpValue('');
            } else {
              navigation.goBack();
            }
          }}
        >
          <Text style={styles.backButtonText}>
            {step === 'otp' ? 'Back to Phone' : 'Back'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_CONFIG.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: APP_CONFIG.colors.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: APP_CONFIG.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    width: '100%',
  },
  primaryButton: {
    backgroundColor: APP_CONFIG.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: APP_CONFIG.colors.border,
  },
  dividerText: {
    marginHorizontal: 15,
    color: APP_CONFIG.colors.textSecondary,
    fontSize: 14,
  },
  googleButton: {
    backgroundColor: APP_CONFIG.colors.surface,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: APP_CONFIG.colors.border,
    marginBottom: 30,
  },
  googleButtonText: {
    color: APP_CONFIG.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  otpLabel: {
    fontSize: 16,
    color: APP_CONFIG.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  codeFieldRoot: {
    marginBottom: 30,
  },
  otpCell: {
    width: 45,
    height: 55,
    lineHeight: 50,
    fontSize: 24,
    borderWidth: 2,
    borderColor: APP_CONFIG.colors.border,
    backgroundColor: APP_CONFIG.colors.surface,
    textAlign: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusCell: {
    borderColor: APP_CONFIG.colors.primary,
  },
  otpCellText: {
    fontSize: 24,
    color: APP_CONFIG.colors.text,
    textAlign: 'center',
  },
  secondaryButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: APP_CONFIG.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  backButtonText: {
    color: APP_CONFIG.colors.textSecondary,
    fontSize: 16,
  },
});

export default PhoneAuthScreen;
