import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { APP_CONFIG } from '../../constants/config';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabase/client';

const ReactionButton = ({ type, count, isActive, onPress }) => {
  const getReactionEmoji = (type) => {
    switch (type) {
      case 'like': return '👍';
      case 'love': return '❤️';
      case 'idea': return '💡';
      case 'fire': return '🔥';
      default: return '👍';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.reactionButton, isActive && styles.reactionButtonActive]}
      onPress={onPress}
    >
      <Text style={styles.reactionEmoji}>{getReactionEmoji(type)}</Text>
      {count > 0 && <Text style={styles.reactionCount}>{count}</Text>}
    </TouchableOpacity>
  );
};

const CommentCard = ({ 
  comment, 
  depth = 0, 
  onReply, 
  onReaction, 
  onUserPress,
  showReplies = true 
}) => {
  const { user } = useAuth();
  const [showReactions, setShowReactions] = useState(false);
  const [userReaction, setUserReaction] = useState(null);

  const maxDepth = 3; // Maximum nesting level
  const indentSize = depth * 20;

  const handleReaction = async (reactionType) => {
    try {
      if (userReaction === reactionType) {
        // Remove reaction
        const { error } = await supabase
          .from('comment_reactions')
          .delete()
          .eq('comment_id', comment.id)
          .eq('user_id', user.id)
          .eq('reaction_type', reactionType);

        if (!error) {
          setUserReaction(null);
          onReaction && onReaction(comment.id, reactionType, false);
        }
      } else {
        // Add/change reaction
        const { error } = await supabase
          .from('comment_reactions')
          .upsert({
            comment_id: comment.id,
            user_id: user.id,
            reaction_type: reactionType
          });

        if (!error) {
          setUserReaction(reactionType);
          onReaction && onReaction(comment.id, reactionType, true);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update reaction');
    }
  };

  const formatTimeAgo = (dateString) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  return (
    <View style={[styles.container, { marginLeft: indentSize }]}>
      {/* Comment Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => onUserPress && onUserPress(comment.users)}
        >
          <Image
            source={{ 
              uri: comment.users?.avatar_url || 'https://via.placeholder.com/32x32/E5E5EA/8E8E93?text=?' 
            }}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.displayName}>{comment.users?.display_name}</Text>
            <Text style={styles.username}>@{comment.users?.username}</Text>
          </View>
        </TouchableOpacity>
        
        <Text style={styles.timestamp}>
          {formatTimeAgo(comment.created_at)}
        </Text>
      </View>

      {/* Comment Content */}
      <View style={styles.content}>
        <Text style={styles.commentText}>{comment.content}</Text>
      </View>

      {/* Reactions Display */}
      {comment.reaction_counts && Object.values(comment.reaction_counts).some(count => count > 0) && (
        <View style={styles.reactionsDisplay}>
          {Object.entries(comment.reaction_counts).map(([type, count]) => 
            count > 0 && (
              <View key={type} style={styles.reactionDisplay}>
                <Text style={styles.reactionEmoji}>
                  {type === 'like' ? '👍' : type === 'love' ? '❤️' : type === 'idea' ? '💡' : '🔥'}
                </Text>
                <Text style={styles.reactionDisplayCount}>{count}</Text>
              </View>
            )
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowReactions(!showReactions)}
        >
          <Ionicons name="heart-outline" size={16} color={APP_CONFIG.colors.textSecondary} />
          <Text style={styles.actionText}>React</Text>
        </TouchableOpacity>

        {depth < maxDepth && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onReply && onReply(comment)}
          >
            <Ionicons name="chatbubble-outline" size={16} color={APP_CONFIG.colors.textSecondary} />
            <Text style={styles.actionText}>Reply</Text>
          </TouchableOpacity>
        )}

        {comment.users?.id === user?.id && (
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="ellipsis-horizontal" size={16} color={APP_CONFIG.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Reaction Picker */}
      {showReactions && (
        <View style={styles.reactionPicker}>
          {['like', 'love', 'idea', 'fire'].map(type => (
            <ReactionButton
              key={type}
              type={type}
              count={comment.reaction_counts?.[type] || 0}
              isActive={userReaction === type}
              onPress={() => handleReaction(type)}
            />
          ))}
        </View>
      )}

      {/* Replies */}
      {showReplies && comment.replies && comment.replies.length > 0 && (
        <View style={styles.replies}>
          {comment.replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onReply={onReply}
              onReaction={onReaction}
              onUserPress={onUserPress}
              showReplies={depth < maxDepth - 1}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: APP_CONFIG.colors.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 2,
    borderLeftColor: APP_CONFIG.colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: APP_CONFIG.colors.border,
  },
  displayName: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_CONFIG.colors.text,
  },
  username: {
    fontSize: 12,
    color: APP_CONFIG.colors.textSecondary,
  },
  timestamp: {
    fontSize: 12,
    color: APP_CONFIG.colors.textSecondary,
  },
  content: {
    marginBottom: 8,
  },
  commentText: {
    fontSize: 14,
    color: APP_CONFIG.colors.text,
    lineHeight: 20,
  },
  reactionsDisplay: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  reactionDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: APP_CONFIG.colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  reactionDisplayCount: {
    fontSize: 12,
    color: APP_CONFIG.colors.text,
    marginLeft: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 12,
    color: APP_CONFIG.colors.textSecondary,
    marginLeft: 4,
  },
  reactionPicker: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: APP_CONFIG.colors.border,
    marginTop: 8,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: APP_CONFIG.colors.background,
  },
  reactionButtonActive: {
    backgroundColor: APP_CONFIG.colors.primary + '20',
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 12,
    color: APP_CONFIG.colors.text,
    marginLeft: 4,
  },
  replies: {
    marginTop: 8,
  },
});

export default CommentCard;
