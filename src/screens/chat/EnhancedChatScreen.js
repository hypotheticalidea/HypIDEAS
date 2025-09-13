import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { APP_CONFIG } from '../../constants/config';
import { useAuth } from '../../hooks/useAuth';
import { ChatService } from '../../services/chat/ChatService';

// Components
import MessageBubble from '../../components/chat/MessageBubble';
import ChatInput from '../../components/chat/ChatInput';
import TypingIndicator from '../../components/chat/TypingIndicator';
import LoadingScreen from '../../components/common/LoadingScreen';

const EnhancedChatScreen = ({ route, navigation }) => {
  const { chatId, chatType, chatName, otherUser } = route.params;
  const { user } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    loadMessages();
    setupRealtimeSubscriptions();
    updatePresence('online');

    return () => {
      ChatService.cleanup();
      updatePresence('offline');
    };
  }, [chatId, chatType]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const result = await ChatService.getChatMessages(chatId, chatType);
      
      if (result.success) {
        setMessages(result.messages);
      } else {
        Alert.alert('Error', 'Failed to load messages');
      }
    } catch (error) {
      console.error('Load messages error:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    ChatService.subscribeToChat(chatId, chatType, (eventType, payload) => {
      switch (eventType) {
        case 'message':
          if (payload.eventType === 'INSERT') {
            setMessages(prev => [...prev, payload.new]);
            scrollToBottom();
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => 
              prev.map(msg => 
                msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
              )
            );
          }
          break;
          
        case 'typing':
          handleTypingUpdate(payload);
          break;
          
        case 'reaction':
          handleReactionUpdate(payload);
          break;
      }
    });
  };

  const handleTypingUpdate = (payload) => {
    if (payload.eventType === 'INSERT' && payload.new.user_id !== user.id) {
      setTypingUsers(prev => {
        const exists = prev.find(u => u.id === payload.new.user_id);
        if (!exists) {
          return [...prev, { id: payload.new.user_id, name: 'User' }];
        }
        return prev;
      });
    } else if (payload.eventType === 'DELETE') {
      setTypingUsers(prev => 
        prev.filter(u => u.id !== payload.old.user_id)
      );
    }
  };

  const handleReactionUpdate = (payload) => {
    // Update message reactions in real-time
    if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
      loadMessages(); // Refresh to get updated reaction counts
    }
  };

  const updatePresence = async (status) => {
    await ChatService.updatePresence(status);
  };

  const handleSendMessage = async (content, replyToId = null) => {
    const result = await ChatService.sendMessage(chatId, chatType, content, replyToId);
    
    if (result.success) {
      setReplyingTo(null);
      scrollToBottom();
    } else {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleSendFile = async () => {
    const result = await ChatService.pickAndSendFile(chatId, chatType);
    
    if (result.success) {
      scrollToBottom();
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const handleReplyToMessage = (message) => {
    setReplyingTo(message);
  };

  const handleTyping = (isTyping) => {
    ChatService.setTypingIndicator(chatId, chatType, isTyping);
    
    if (isTyping) {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing after 3 seconds
      typingTimeoutRef.current = setTimeout(() => {
        ChatService.setTypingIndicator(chatId, chatType, false);
      }, 3000);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessage = ({ item, index }) => {
    const isOwnMessage = item.sender_id === user.id;
    const prevMessage = messages[index - 1];
    const showAvatar = !isOwnMessage && (
      !prevMessage || 
      prevMessage.sender_id !== item.sender_id ||
      new Date(item.created_at).getTime() - new Date(prevMessage.created_at).getTime() > 300000 // 5 minutes
    );

    return (
      <MessageBubble
        message={item}
        isOwnMessage={isOwnMessage}
        showAvatar={showAvatar}
        onReply={handleReplyToMessage}
        onReaction={(messageId, reaction, isActive) => {
          // Handle reaction feedback
          console.log('Reaction:', { messageId, reaction, isActive });
        }}
      />
    );
  };

  if (loading) {
    return <LoadingScreen message="Loading chat..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Chat Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={APP_CONFIG.colors.text} />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{chatName}</Text>
            {chatType === 'private' && (
              <Text style={styles.headerSubtitle}>
                {onlineUsers.includes(otherUser?.id) ? 'Online' : 'Last seen recently'}
              </Text>
            )}
            {chatType === 'world' && (
              <Text style={styles.headerSubtitle}>
                {onlineUsers.length} members online
              </Text>
            )}
          </View>

          <TouchableOpacity style={styles.headerAction}>
            <Ionicons name="call" size={24} color={APP_CONFIG.colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.headerAction}>
            <Ionicons name="videocam" size={24} color={APP_CONFIG.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={scrollToBottom}
          showsVerticalScrollIndicator={false}
        />

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <TypingIndicator users={typingUsers} />
        )}

        {/* Reply Preview */}
        {replyingTo && (
          <View style={styles.replyPreview}>
            <View style={styles.replyContent}>
              <Text style={styles.replyLabel}>
                Replying to {replyingTo.users?.display_name}
              </Text>
              <Text style={styles.replyText} numberOfLines={2}>
                {replyingTo.content}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.cancelReply}
              onPress={() => setReplyingTo(null)}
            >
              <Ionicons name="close" size={20} color={APP_CONFIG.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Chat Input */}
        <ChatInput
          onSendMessage={(content) => handleSendMessage(content, replyingTo?.id)}
          onSendFile={handleSendFile}
          onTyping={handleTyping}
          placeholder={`Message ${chatName}...`}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_CONFIG.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: APP_CONFIG.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: APP_CONFIG.colors.border,
  },
  backButton: {
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: APP_CONFIG.colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: APP_CONFIG.colors.textSecondary,
    marginTop: 2,
  },
  headerAction: {
    marginLeft: 16,
    padding: 4,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 8,
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_CONFIG.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: APP_CONFIG.colors.border,
  },
  replyContent: {
    flex: 1,
  },
  replyLabel: {
    fontSize: 14,
    color: APP_CONFIG.colors.primary,
    fontWeight: '600',
  },
  replyText: {
    fontSize: 14,
    color: APP_CONFIG.colors.textSecondary,
    marginTop: 4,
  },
  cancelReply: {
    padding: 8,
  },
});

export default EnhancedChatScreen;
