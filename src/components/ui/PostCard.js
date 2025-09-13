import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { APP_CONFIG } from '../../constants/config';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabase/client';

const { width } = Dimensions.get('window');

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

const PostCard = ({ 
  post, 
  onLike, 
  onComment, 
  onUserPress, 
  onNavigateToPost,
  showFullContent = false 
}) => {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [showReactions, setShowReactions] = useState(false);
  const [userReactions, setUserReactions] = useState({});
  const [reactionCounts, setReactionCounts] = useState({
    like: 0,
    love: 0,
    idea: 0,
    fire: 0
  });

  useEffect(() => {
    loadUserReactions();
    loadReactionCounts();
  }, [post.id, user.id]);

  const loadUserReactions = async () => {
    try {
      const { data, error } = await supabase
        .from('post_reactions')
        .select('reaction_type')
        .eq('post_id', post.id)
        .eq('user_id', user.id);

      if (!error && data) {
        const reactions = {};
        data.forEach(reaction => {
          reactions[reaction.reaction_type] = true;
        });
        setUserReactions(reactions);
      }

      // Also check for legacy likes
      const { data: likeData, error: likeError } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .single();

      if (!likeError && likeData) {
        setLiked(true);
      }
    } catch (error) {
      console.error('Error loading user reactions:', error);
    }
  };

  const loadReactionCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('post_reactions')
        .select('reaction_type')
        .eq('post_id', post.id);

      if (!error && data) {
        const counts = { like: 0, love: 0, idea: 0, fire: 0 };
        data.forEach(reaction => {
          counts[reaction.reaction_type] = (counts[reaction.reaction_type] || 0) + 1;
        });
        setReactionCounts(counts);
      }
    } catch (error) {
      console.error('Error loading reaction counts:', error);
    }
  };

  const handleLike = async () => {
    try {
      if (liked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', post.id);

        if (!error) {
          setLiked(false);
          setLikesCount(prev => Math.max(prev - 1, 0));
          onLike && onLike(post.id, false);
        }
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            post_id: post.id
          });

        if (!error) {
          setLiked(true);
          setLikesCount(prev => prev + 1);
          onLike && onLike(post.id, true);

          // Create notification for post author (if not self)
          if (post.users?.id && post.users.id !== user.id) {
            await supabase
              .from('notifications')
              .insert({
                user_id: post.users.id,
                type: 'like',
                title: 'New Like',
                message: `${user.display_name || user.username} liked your post`,
                data: {
                  post_id: post.id,
                  liker_id: user.id,
                  post_title: post.title
                }
              });
          }
        }
      }
    } catch (error) {
      console.error('Error updating like:', error);
      Alert.alert('Error', 'Failed to update like');
    }
  };

  const handleReaction = async (reactionType) => {
    try {
      const isActive = userReactions[reactionType];
      
      if (isActive) {
        // Remove reaction
        const { error } = await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .eq('reaction_type', reactionType);

        if (!error) {
          setUserReactions(prev => ({ ...prev, [reactionType]: false }));
          setReactionCounts(prev => ({ 
            ...prev, 
            [reactionType]: Math.max((prev[reactionType] || 0) - 1, 0)
          }));
        }
      } else {
        // Add reaction
        const { error } = await supabase
          .from('post_reactions')
          .insert({
            post_id: post.id,
            user_id: user.id,
            reaction_type: reactionType
          });

        if (!error) {
          setUserReactions(prev => ({ ...prev, [reactionType]: true }));
          setReactionCounts(prev => ({ 
            ...prev, 
            [reactionType]: (prev[reactionType] || 0) + 1
          }));

          // Create notification for post author (if not self)
          if (post.users?.id && post.users.id !== user.id) {
            const reactionEmoji = reactionType === 'like' ? '👍' : 
                                reactionType === 'love' ? '❤️' : 
                                reactionType === 'idea' ? '💡' : '🔥';
                                
            await supabase
              .from('notifications')
              .insert({
                user_id: post.users.id,
                type: 'post_reaction',
                title: 'New Reaction',
                message: `${user.display_name || user.username} reacted ${reactionEmoji} to your post`,
                data: {
                  post_id: post.id,
                  reactor_id: user.id,
                  reaction_type: reactionType,
                  post_title: post.title
                }
              });
          }
        }
      }
    } catch (error) {
      console.error('Error updating reaction:', error);
      Alert.alert('Error', 'Failed to update reaction');
    }
  };

  const handleComment = () => {
    if (onComment) {
      onComment(post);
    } else if (onNavigateToPost) {
      onNavigateToPost(post.id, true);
    }
  };

  const handleShare = () => {
    Alert.alert('Share Post', 'Sharing functionality coming soon!');
  };

  const handleUserPress = () => {
    onUserPress && onUserPress(post.users);
  };

  const handlePostPress = () => {
    if (onNavigateToPost) {
      onNavigateToPost(post.id);
    }
  };

  const formatTimeAgo = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'some time ago';
    }
  };

  const getTotalReactions = () => {
    return Object.values(reactionCounts).reduce((sum, count) => sum + count, 0);
  };

  const truncateContent = (content, maxLength = 200) => {
    if (showFullContent || content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + '...';
  };

  return (
    <View style={styles.container}>
      {/* Pinned Post Indicator */}
      {post.is_pinned && (
        <View style={styles.pinnedIndicator}>
          <Ionicons name="pin" size={14} color={APP_CONFIG.colors.primary} />
          <Text style={styles.pinnedText}>Pinned Post</Text>
        </View>
      )}

      {/* Header */}
      <TouchableOpacity 
        style={styles.header}
        onPress={handleUserPress}
        activeOpacity={0.7}
      >
        <Image
          source={{ 
            uri: post.users?.avatar_url || 'https://via.placeholder.com/40x40/E5E5EA/8E8E93?text=?' 
          }}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={styles.displayName}>{post.users?.display_name || 'Unknown User'}</Text>
          <Text style={styles.username}>@{post.users?.username || 'unknown'}</Text>
        </View>
        <View style={styles.timestampContainer}>
          <Text style={styles.timestamp}>
            {formatTimeAgo(post.created_at)}
          </Text>
          {post.users?.id === user?.id && (
            <TouchableOpacity style={styles.moreButton}>
              <Ionicons name="ellipsis-horizontal" size={20} color={APP_CONFIG.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      {/* Content */}
      <TouchableOpacity 
        style={styles.content}
        onPress={handlePostPress}
        activeOpacity={0.9}
      >
        <Text style={styles.title}>{post.title}</Text>
        <Text style={styles.text}>
          {truncateContent(post.content)}
        </Text>
        
        {!showFullContent && post.content && post.content.length > 200 && (
          <TouchableOpacity onPress={handlePostPress}>
            <Text style={styles.readMore}>Read more</Text>
          </TouchableOpacity>
        )}
        
        {/* Category */}
        {post.category && (
          <View style={styles.categoryContainer}>
            <Text style={styles.category}>{post.category}</Text>
          </View>
        )}
        
        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {post.tags.slice(0, 3).map((tag, index) => (
              <TouchableOpacity key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </TouchableOpacity>
            ))}
            {post.tags.length > 3 && (
              <Text style={styles.moreTagsText}>+{post.tags.length - 3} more</Text>
            )}
          </View>
        )}
      </TouchableOpacity>

      {/* Reaction Counts Display */}
      {getTotalReactions() > 0 && (
        <View style={styles.reactionsDisplay}>
          {Object.entries(reactionCounts).map(([type, count]) => 
            count > 0 && (
              <View key={type} style={styles.reactionDisplay}>
                <Text style={styles.reactionEmoji}>
                  {type === 'like' ? '👍' : type === 'love' ? '❤️' : type === 'idea' ? '💡' : '🔥'}
                </Text>
                <Text style={styles.reactionDisplayCount}>{count}</Text>
              </View>
            )
          )}
          <Text style={styles.totalReactions}>
            {getTotalReactions()} {getTotalReactions() === 1 ? 'reaction' : 'reactions'}
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleLike}
        >
          <Ionicons 
            name={liked ? 'heart' : 'heart-outline'} 
            size={20} 
            color={liked ? APP_CONFIG.colors.error : APP_CONFIG.colors.textSecondary} 
          />
          <Text style={[styles.actionText, liked && styles.likedText]}>
            {likesCount > 0 ? likesCount : 'Like'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowReactions(!showReactions)}
        >
          <Ionicons name="happy-outline" size={20} color={APP_CONFIG.colors.textSecondary} />
          <Text style={styles.actionText}>React</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleComment}
        >
          <Ionicons name="chatbubble-outline" size={20} color={APP_CONFIG.colors.textSecondary} />
          <Text style={styles.actionText}>
            {post.comments_count > 0 ? post.comments_count : 'Comment'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={20} color={APP_CONFIG.colors.textSecondary} />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Reaction Picker */}
      {showReactions && (
        <View style={styles.reactionPicker}>
          {['like', 'love', 'idea', 'fire'].map(type => (
            <ReactionButton
              key={type}
              type={type}
              count={reactionCounts[type] || 0}
              isActive={userReactions[type]}
              onPress={() => handleReaction(type)}
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
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: APP_CONFIG.colors.border,
    overflow: 'hidden',
  },
  pinnedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_CONFIG.colors.primary + '10',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: APP_CONFIG.colors.border,
  },
  pinnedText: {
    fontSize: 12,
    color: APP_CONFIG.colors.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: APP_CONFIG.colors.border,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_CONFIG.colors.text,
  },
  username: {
    fontSize: 14,
    color: APP_CONFIG.colors.textSecondary,
    marginTop: 2,
  },
  timestampContainer: {
    alignItems: 'flex-end',
  },
  timestamp: {
    fontSize: 12,
    color: APP_CONFIG.colors.textSecondary,
  },
  moreButton: {
    marginTop: 4,
    padding: 4,
  },
  content: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: APP_CONFIG.colors.text,
    marginBottom: 8,
    lineHeight: 24,
  },
  text: {
    fontSize: 16,
    color: APP_CONFIG.colors.text,
    lineHeight: 22,
    marginBottom: 10,
  },
  readMore: {
    fontSize: 14,
    color: APP_CONFIG.colors.primary,
    fontWeight: '600',
    marginTop: 5,
  },
  categoryContainer: {
    alignSelf: 'flex-start',
    backgroundColor: APP_CONFIG.colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  category: {
    fontSize: 12,
    color: APP_CONFIG.colors.primary,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 10,
  },
  tag: {
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 14,
    color: APP_CONFIG.colors.primary,
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 12,
    color: APP_CONFIG.colors.textSecondary,
    fontStyle: 'italic',
  },
  reactionsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingBottom: 10,
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
    fontWeight: '500',
  },
  totalReactions: {
    fontSize: 12,
    color: APP_CONFIG.colors.textSecondary,
    marginLeft: 'auto',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: APP_CONFIG.colors.border,
    justifyContent: 'space-around',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  actionText: {
    fontSize: 14,
    color: APP_CONFIG.colors.textSecondary,
    marginLeft: 5,
    fontWeight: '500',
  },
  likedText: {
    color: APP_CONFIG.colors.error,
  },
  reactionPicker: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: APP_CONFIG.colors.border,
    backgroundColor: APP_CONFIG.colors.background,
    justifyContent: 'space-around',
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: APP_CONFIG.colors.surface,
    borderWidth: 1,
    borderColor: APP_CONFIG.colors.border,
  },
  reactionButtonActive: {
    backgroundColor: APP_CONFIG.colors.primary + '20',
    borderColor: APP_CONFIG.colors.primary,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 12,
    color: APP_CONFIG.colors.text,
    marginLeft: 4,
    fontWeight: '600',
  },
});

export default PostCard;
