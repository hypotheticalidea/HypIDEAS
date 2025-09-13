import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  FlatList,
} from 'react-native';
import { AuthService } from '../../services/auth/authService';
import { supabase } from '../../services/supabase/client';
import { APP_CONFIG } from '../../constants/config';
import LoadingScreen from '../../components/common/LoadingScreen';

const ProfileSetupScreen = ({ route, navigation }) => {
  const { userId, phoneNumber } = route.params;
  const [step, setStep] = useState('displayName'); // 'displayName' | 'interests'
  const [displayName, setDisplayName] = useState('');
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [availableInterests, setAvailableInterests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInterestCategories();
  }, []);

  const loadInterestCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('interest_categories')
        .select('name, description')
        .order('name');

      if (error) throw error;
      setAvailableInterests(data);
    } catch (error) {
      console.error('Load Interests Error:', error);
      Alert.alert('Error', 'Failed to load interests');
    }
  };

  const handleContinue = () => {
    if (step === 'displayName') {
      if (!displayName.trim()) {
        Alert.alert('Error', 'Please enter your display name');
        return;
      }
      setStep('interests');
    } else {
      handleCompleteSetup();
    }
  };

  const handleCompleteSetup = async () => {
    if (selectedInterests.length === 0) {
      Alert.alert('Error', 'Please select at least one interest');
      return;
    }

    setLoading(true);

    try {
      const result = await AuthService.updateUserProfile(userId, {
        displayName: displayName.trim(),
        interests: selectedInterests,
      });

      if (result.success) {
        Alert.alert(
          'Welcome to HypIDEAS!', 
          `Your unique username is: ${result.username}`,
          [{ text: 'Get Started', onPress: () => {
            // Navigation will be handled by AuthContext
          }}]
        );
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to complete setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interestName) => {
    setSelectedInterests(prev => {
      if (prev.includes(interestName)) {
        return prev.filter(interest => interest !== interestName);
      } else {
        return [...prev, interestName];
      }
    });
  };

  const renderInterestItem = ({ item }) => {
    const isSelected = selectedInterests.includes(item.name);
    
    return (
      <TouchableOpacity
        style={[
          styles.interestItem,
          isSelected && styles.selectedInterestItem
        ]}
        onPress={() => toggleInterest(item.name)}
      >
        <Text style={[
          styles.interestText,
          isSelected && styles.selectedInterestText
        ]}>
          {item.name}
        </Text>
        <Text style={[
          styles.interestDescription,
          isSelected && styles.selectedInterestDescription
        ]}>
          {item.description}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <LoadingScreen message="Setting up your profile..." />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContainer}>
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressStep, step === 'displayName' && styles.activeStep]} />
          <View style={[styles.progressStep, step === 'interests' && styles.activeStep]} />
        </View>
        
        <Text style={styles.title}>
          {step === 'displayName' ? 'What should we call you?' : 'What interests you?'}
        </Text>
        
        <Text style={styles.subtitle}>
          {step === 'displayName' 
            ? 'Enter a display name that others will see on your profile'
            : 'Select your interests to help us generate your unique username'
          }
        </Text>
      </View>

      {step === 'displayName' ? (
        <View style={styles.formContainer}>
          <TextInput
            style={styles.displayNameInput}
            placeholder="Enter your display name"
            placeholderTextColor={APP_CONFIG.colors.textSecondary}
            value={displayName}
            onChangeText={setDisplayName}
            maxLength={50}
            autoFocus
          />
          
          <Text style={styles.helperText}>
            This name will be shown on your profile and posts
          </Text>
        </View>
      ) : (
        <View style={styles.formContainer}>
          <FlatList
            data={availableInterests}
            renderItem={renderInterestItem}
            keyExtractor={(item) => item.name}
            numColumns={2}
            columnWrapperStyle={styles.interestRow}
            showsVerticalScrollIndicator={false}
          />
          
          <Text style={styles.selectionCounter}>
            {selectedInterests.length} selected (minimum 1)
          </Text>
        </View>
      )}

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleContinue}
        >
          <Text style={styles.primaryButtonText}>
            {step === 'displayName' ? 'Continue' : 'Complete Setup'}
          </Text>
        </TouchableOpacity>

        {step === 'interests' && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep('displayName')}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
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
    marginBottom: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  progressStep: {
    width: 60,
    height: 4,
    backgroundColor: APP_CONFIG.colors.border,
    marginHorizontal: 5,
    borderRadius: 2,
  },
  activeStep: {
    backgroundColor: APP_CONFIG.colors.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: APP_CONFIG.colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: APP_CONFIG.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    flex: 1,
    marginBottom: 30,
  },
  displayNameInput: {
    backgroundColor: APP_CONFIG.colors.surface,
    borderWidth: 1,
    borderColor: APP_CONFIG.colors.border,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: APP_CONFIG.colors.text,
    marginBottom: 15,
  },
  helperText: {
    fontSize: 14,
    color: APP_CONFIG.colors.textSecondary,
    textAlign: 'center',
  },
  interestRow: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  interestItem: {
    flex: 0.48,
    backgroundColor: APP_CONFIG.colors.surface,
    borderWidth: 1,
    borderColor: APP_CONFIG.colors.border,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  selectedInterestItem: {
    backgroundColor: APP_CONFIG.colors.primary,
    borderColor: APP_CONFIG.colors.primary,
  },
  interestText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: APP_CONFIG.colors.text,
    marginBottom: 5,
    textAlign: 'center',
  },
  selectedInterestText: {
    color: 'white',
  },
  interestDescription: {
    fontSize: 12,
    color: APP_CONFIG.colors.textSecondary,
    textAlign: 'center',
  },
  selectedInterestDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  selectionCounter: {
    fontSize: 14,
    color: APP_CONFIG.colors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
  },
  actionContainer: {
    paddingBottom: 50,
  },
  primaryButton: {
    backgroundColor: APP_CONFIG.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    alignItems: 'center',
  },
  backButtonText: {
    color: APP_CONFIG.colors.textSecondary,
    fontSize: 16,
  },
});

export default ProfileSetupScreen;
