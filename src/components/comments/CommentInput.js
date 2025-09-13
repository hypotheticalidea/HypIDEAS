import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { APP_CONFIG } from '../../constants/config';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabase/client';

const CommentInput = ({ 
  postId, 
  parentCommentId = null, 
  replyingTo = null,
  onCommentAdded,
  onCancel 
}) => {
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    setLoading(true);

    try {
      // Calculate depth for threading
      let depth = 0;
      let threadRootId = null;

      if (parentCommentId) {
        const { data: parentComment } = await supabase
          .from('comments')
          .select('depth, thread_root_id')
          .eq('id', parentCommentId)
          .single();

        if (parentComment) {
          depth = Math.min(parentComment.depth + 1, 3); // Max depth of 3
          threadRootId = parentComment.thread_root_id || parentCommentId;
        }
      }

      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          parent_comment_id: parentCommentId,
          content: comment.trim(),
          user_id: user.id,
          depth: depth,
          thread_root_id: threadRootId,
        })
        .select(`
          id, content, created_at, depth, thread_root_id,
          users (id, username, display_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      // Update post comment count
      await supabase.rpc('increment_post_comments', { post_id: postId });

      // Create notification for post author (if not self)
      if (postId && user.id !== data.user_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: data.user_id, // Post author
            type: 'comment',
            title: 'New Comment',
            message: `${user.display_name || user.username} commented on your post`,
            data: {
              post_id: postId,
              comment_id: data.id,
              commenter_id: user.id
            }
          });
      }

      setComment('');
      onCommentAdded && onCommentAdded(data);
      onCancel && onCancel();
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {replyingTo && (
        <View style={styles.replyingTo}>
          <Text style={styles.replyingToText}>
            Replying to @{replyingTo.users?.username}
          </Text>
          <TouchableOpacity onPress={onCancel}>
            <Ionicons name="close" size={20} color={APP_CONFIG.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
          placeholderTextColor={APP_CONFIG.colors.textSecondary}
          value={comment}
          onChangeText={setComment}
          multiline
          maxLength={1000}
          editable={!loading}
        />
        
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!comment.trim() || loading) && styles.sendButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!comment.trim() || loading}
        >
          <Ionicons 
            name={loading ? "hourglass" : "send"} 
            size={20} 
            color={comment.trim() && !loading ? APP_CONFIG.colors.primary : APP_CONFIG.colors.textSecondary} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: APP_CONFIG.colors.surface,
    borderTopWidth: 1,
    borderTopColor: APP_CONFIG.colors.border,
    padding: 15,
  },
  replyingTo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: APP_CONFIG.colors.background,
    borderRadius: 8,
    marginBottom: 10,
  },
  replyingToText: {
    fontSize: 14,
    color: APP_CONFIG.colors.textSecondary,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: APP_CONFIG.colors.border,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    color: APP_CONFIG.colors.text,
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: APP_CONFIG.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: APP_CONFIG.colors.border,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default CommentInput;
