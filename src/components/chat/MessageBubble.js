import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { APP_CONFIG } from '../../constants/config';
import { useAuth } from '../../hooks/useAuth';
import { ChatService } from '../../services/chat/ChatService';

const { width } = Dimensions.get('window');

const MessageReaction = ({ reaction, count, isActive, onPress }) => {
  const getEmoji = (type) => {
    const emojis = {
      like: '👍',
      love: '❤️',
      laugh: '😂',
      angry: '😠',
      sad: '😢',
      wow: '😮'
    };
    return emojis[type] || '👍';
  };

  return (
    <TouchableOpacity
      style={[styles.reactionBubble, isActive && styles.activeReaction]}
      onPress={onPress}
    >
      <Text style={styles.reactionEmoji}>{getEmoji(reaction)}</Text>
      {count > 0 && <Text style={styles.reactionCount}>{count}</Text>}
    </TouchableOpacity>
  );
};

const MessageBubble = ({ 
  message, 
  isOwnMessage, 
  onReply, 
  onReaction,
  showAvatar = true 
}) => {
  const { user } = useAuth();
  const [showReactions, setShowReactions] = useState(false);
  const [userReactions, setUserReactions] = useState({});

  const handleReaction = async (reactionType) => {
    try {
      const isActive = userReactions[reactionType];
      
      if (isActive) {
        await ChatService.removeMessageReaction(message.id, reactionType);
        setUserReactions(prev => ({ ...prev, [reactionType]: false }));
      } else {
        await ChatService.addMessageReaction(message.id, reactionType);
        setUserReactions(prev => ({ ...prev, [reactionType]: true }));
      }
      
      onReaction && onReaction(message.id, reactionType, !isActive);
    } catch (error) {
      Alert.alert('Error', 'Failed to update reaction');
    }
  };

  const handleLongPress = () => {
    setShowReactions(!showReactions);
  };

  const renderFileContent = () => {
    if (message.message_type === 'image' && message.file_url) {
      return (
        <TouchableOpacity style={styles.imageContainer}>
          <Image
            source={{ uri: message.file_url }}
            style={styles.messageImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      );
    }

    if (message.message_type === 'file' && message.file_url) {
      return (
        <TouchableOpacity style={styles.fileContainer}>
          <Ionicons name="document" size={24} color={APP_CONFIG.colors.primary} />
          <View style={styles.fileInfo}>
            <Text style={styles.fileName}>{message.file_name}</Text>
            <Text style={styles.fileType}>{message.file_type}</Text>
          </View>
          <Ionicons name="download" size={20} color={APP_CONFIG.colors.textSecondary} />
        </TouchableOpacity>
      );
    }

    return null;
  };

  const renderReplyPreview = () => {
    if (!message.reply_to) return null;

    return (
      <View style={styles.replyPreview}>
        <View style={styles.replyLine} />
        <View style={styles.replyContent}>
          <Text style={styles.replyUser}>
            @{message.reply_to.users.username}
          </Text>
          <Text style={styles.replyText} numberOfLines={2}>
            {message.reply_to.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[
      styles.container, 
      isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
    ]}>
      {/* Avatar for other users */}
      {!isOwnMessage && showAvatar && (
        <Image
          source={{ 
            uri: message.users?.avatar_url || 'https://via.placeholder.com/32x32/E5E5EA/8E8E93?text=?' 
          }}
          style={styles.avatar}
        />
      )}

      <TouchableOpacity
        style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownMessage : styles.otherMessage
        ]}
        onLongPress={handleLongPress}
        delayLongPress={500}
      >
        {/* Reply Preview */}
        {renderReplyPreview()}

        {/* User name for other users in groups */}
        {!isOwnMessage && (
          <Text style={styles.senderName}>
            {message.users?.display_name || message.users?.username}
          </Text>
        )}

        {/* File Content */}
        {renderFileContent()}

        {/* Text Content */}
        {message.content && (
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {message.content}
          </Text>
        )}

        {/* Message Info */}
        <View style={styles.messageInfo}>
          <Text style={[
            styles.timestamp,
            isOwnMessage ? styles.ownTimestamp : styles.otherTimestamp
          ]}>
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: false })}
          </Text>
          
          {message.is_edited && (
            <Text style={styles.editedLabel}>edited</Text>
          )}

          {isOwnMessage && (
            <Ionicons 
              name="checkmark-done" 
              size={16} 
              color={APP_CONFIG.colors.success}
              style={styles.readIcon}
            />
          )}
        </View>

        {/* Message Reactions Display */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <View style={styles.reactionsContainer}>
            {Object.entries(message.reactions).map(([reaction, count]) => 
              count > 0 && (
                <MessageReaction
                  key={reaction}
                  reaction={reaction}
                  count={count}
                  isActive={userReactions[reaction]}
                  onPress={() => handleReaction(reaction)}
                />
              )
            )}
          </View>
        )}
      </TouchableOpacity>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => onReply && onReply(message)}
        >
          <Ionicons name="arrow-undo" size={16} color={APP_CONFIG.colors.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={handleLongPress}
        >
          <Ionicons name="happy-outline" size={16} color={APP_CONFIG.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Reaction Picker */}
      {showReactions && (
        <View style={[
          styles.reactionPicker,
          isOwnMessage ? styles.ownReactionPicker : styles.otherReactionPicker
        ]}>
          {['like', 'love', 'laugh', 'wow', 'sad', 'angry'].map(reaction => (
            <MessageReaction
              key={reaction}
              reaction={reaction}
              count={0}
              isActive={userReactions[reaction]}
              onPress={() => handleReaction(reaction)}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  messageBubble: {
    maxWidth: width * 0.75,
    padding: 12,
    borderRadius: 18,
    position: 'relative',
  },
  ownMessage: {
    backgroundColor: APP_CONFIG.colors.primary,
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: APP_CONFIG.colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: APP_CONFIG.colors.border,
  },
  senderName: {
    fontSize: 12,
    color: APP_CONFIG.colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  ownMessageText: {
    color: 'white',
  },
  otherMessageText: {
    color: APP_CONFIG.colors.text,
  },
  messageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  timestamp: {
    fontSize: 11,
    marginRight: 6,
  },
  ownTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimestamp: {
    color: APP_CONFIG.colors.textSecondary,
  },
  editedLabel: {
    fontSize: 10,
    fontStyle: 'italic',
    color: APP_CONFIG.colors.textSecondary,
    marginRight: 6,
  },
  readIcon: {
    marginLeft: 'auto',
  },
  replyPreview: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  replyLine: {
    width: 3,
    backgroundColor: APP_CONFIG.colors.primary,
    borderRadius: 2,
    marginRight: 8,
  },
  replyContent: {
    flex: 1,
  },
  replyUser: {
    fontSize: 12,
    color: APP_CONFIG.colors.primary,
    fontWeight: '600',
  },
  replyText: {
    fontSize: 13,
    color: APP_CONFIG.colors.textSecondary,
    marginTop: 2,
  },
  imageContainer: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: APP_CONFIG.colors.background,
    borderRadius: 12,
    marginBottom: 8,
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_CONFIG.colors.text,
  },
  fileType: {
    fontSize: 12,
    color: APP_CONFIG.colors.textSecondary,
    marginTop: 2,
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_CONFIG.colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  activeReaction: {
    backgroundColor: APP_CONFIG.colors.primary + '20',
    borderWidth: 1,
    borderColor: APP_CONFIG.colors.primary,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    color: APP_CONFIG.colors.text,
    marginLeft: 4,
    fontWeight: '600',
  },
  quickActions: {
    justifyContent: 'center',
    marginLeft: 8,
  },
  quickActionButton: {
    padding: 8,
    marginVertical: 2,
  },
  reactionPicker: {
    position: 'absolute',
    top: -50,
    flexDirection: 'row',
    backgroundColor: APP_CONFIG.colors.surface,
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  ownReactionPicker: {
    right: 0,
  },
  otherReactionPicker: {
    left: 40,
  },
});

export default MessageBubble;
