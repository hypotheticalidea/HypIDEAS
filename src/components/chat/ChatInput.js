import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { APP_CONFIG } from '../../constants/config';

const ChatInput = ({ 
  onSendMessage, 
  onSendFile, 
  onTyping, 
  placeholder = "Type a message..." 
}) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showFileOptions, setShowFileOptions] = useState(false);
  
  const recordAnimation = useRef(new Animated.Value(1)).current;
  const typingTimeoutRef = useRef(null);

  const handleTextChange = (text) => {
    setMessage(text);
    
    // Handle typing indicator
    if (text.length > 0) {
      onTyping && onTyping(true);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Stop typing after 1 second of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        onTyping && onTyping(false);
      }, 1000);
    } else {
      onTyping && onTyping(false);
    }
  };

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
      onTyping && onTyping(false);
    }
  };

  const handleVoiceRecord = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      Animated.timing(recordAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      
      // TODO: Implement voice recording stop and send
      Alert.alert('Voice Recording', 'Voice messages coming soon!');
    } else {
      // Start recording
      setIsRecording(true);
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordAnimation, {
            toValue: 0.5,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(recordAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
      
      // TODO: Implement voice recording start
      Alert.alert('Voice Recording', 'Hold to record voice message');
    }
  };

  const handleFileOptions = () => {
    setShowFileOptions(!showFileOptions);
  };

  const handleFileSelect = (type) => {
    setShowFileOptions(false);
    
    switch (type) {
      case 'camera':
        Alert.alert('Camera', 'Camera integration coming soon!');
        break;
      case 'gallery':
        Alert.alert('Gallery', 'Gallery integration coming soon!');
        break;
      case 'document':
        onSendFile && onSendFile();
        break;
      default:
        break;
    }
  };

  return (
    <View style={styles.container}>
      {/* File Options */}
      {showFileOptions && (
        <View style={styles.fileOptions}>
          <TouchableOpacity
            style={styles.fileOption}
            onPress={() => handleFileSelect('camera')}
          >
            <Ionicons name="camera" size={24} color={APP_CONFIG.colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.fileOption}
            onPress={() => handleFileSelect('gallery')}
          >
            <Ionicons name="image" size={24} color={APP_CONFIG.colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.fileOption}
            onPress={() => handleFileSelect('document')}
          >
            <Ionicons name="document" size={24} color={APP_CONFIG.colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Input Container */}
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.attachButton}
          onPress={handleFileOptions}
        >
          <Ionicons 
            name={showFileOptions ? "close" : "add"} 
            size={24} 
            color={APP_CONFIG.colors.textSecondary} 
          />
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor={APP_CONFIG.colors.textSecondary}
          value={message}
          onChangeText={handleTextChange}
          multiline
          maxLength={1000}
        />

        {message.trim() ? (
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSend}
          >
            <Ionicons name="send" size={24} color="white" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.voiceButton,
              isRecording && styles.recordingButton
            ]}
            onPress={handleVoiceRecord}
            onLongPress={handleVoiceRecord}
          >
            <Animated.View style={{ opacity: recordAnimation }}>
              <Ionicons 
                name="mic" 
                size={24} 
                color={isRecording ? "white" : APP_CONFIG.colors.textSecondary} 
              />
            </Animated.View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: APP_CONFIG.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: APP_CONFIG.colors.border,
  },
  fileOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: APP_CONFIG.colors.border,
    marginBottom: 8,
  },
  fileOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: APP_CONFIG.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    minHeight: 44,
  },
  attachButton: {
    padding: 10,
    alignSelf: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: APP_CONFIG.colors.border,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: APP_CONFIG.colors.text,
    maxHeight: 100,
    marginHorizontal: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: APP_CONFIG.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: APP_CONFIG.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: APP_CONFIG.colors.border,
  },
  recordingButton: {
    backgroundColor: APP_CONFIG.colors.error,
  },
});

export default ChatInput;
