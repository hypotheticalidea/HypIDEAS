import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Platform } from 'react-native';
import { APP_CONFIG } from '../../constants/config';

// For web, we'll use a simple text input with phone formatting
// For mobile, we can add more sophisticated validation later

const PhoneInputField = ({ 
  value, 
  onChangeText, 
  onChangeFormattedText,
  placeholder = "Enter phone number",
  autoFocus = false 
}) => {
  const [formattedValue, setFormattedValue] = useState('');

  const formatPhoneNumber = (text) => {
    // Remove all non-digits
    const digitsOnly = text.replace(/\D/g, '');
    
    // Format for display
    let formatted = digitsOnly;
    if (digitsOnly.length >= 1) {
      if (digitsOnly.startsWith('1')) {
        // US format: +1 (XXX) XXX-XXXX
        formatted = digitsOnly.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '+$1 ($2) $3-$4');
      } else if (digitsOnly.startsWith('91')) {
        // India format: +91 XXXXX XXXXX
        formatted = digitsOnly.replace(/(\d{2})(\d{5})(\d{5})/, '+$1 $2 $3');
      } else {
        // Generic international format
        formatted = '+' + digitsOnly;
      }
    }

    return { raw: digitsOnly, formatted };
  };

  const handleTextChange = (text) => {
    const { raw, formatted } = formatPhoneNumber(text);
    
    setFormattedValue(formatted);
    onChangeText && onChangeText(raw);
    onChangeFormattedText && onChangeFormattedText('+' + raw);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={APP_CONFIG.colors.textSecondary}
        value={formattedValue}
        onChangeText={handleTextChange}
        keyboardType="phone-pad"
        autoFocus={autoFocus}
        maxLength={20}
      />
      <Text style={styles.helperText}>
        Enter your phone number with country code
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_CONFIG.colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: APP_CONFIG.colors.surface,
    borderWidth: 1,
    borderColor: APP_CONFIG.colors.border,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: APP_CONFIG.colors.text,
  },
  helperText: {
    fontSize: 12,
    color: APP_CONFIG.colors.textSecondary,
    marginTop: 5,
  },
});

export default PhoneInputField;
