import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { APP_CONFIG } from '../../constants/config';
import { supabase } from '../../services/supabase/client';
import { useAuth } from '../../hooks/useAuth';

// Components
import PostCard from '../../components/ui/PostCard';
import CommentCard from '../../components/comments/CommentCard';
import CommentInput from '../../components/comments/CommentInput';
import LoadingScreen from '../../components/common/LoadingScreen';

const PostDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { postId, openComments = false } = route.params;

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  useEffect(() => {
    loadPostAndComments();
    setupRealtimeSubscriptions();
  }, [postId]);

  const loadPostAndComments = async () => {
    try {
      setLoading(true);

      // Load post details
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select(`
          id, title, content, tags, likes_count, comments_count, 
          created_at, is_pinned,
          users (id, username, display_name, avatar_url)
        `)
        .eq('id', postId)
        .single();

      if (postError) throw postError;

      // Load comments with nested structure
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select(`
          id, content, created_at, depth, thread_root_id, 
          parent_comment_id, reaction_counts,
          users (id, username, display_name, avatar_url)
        `)
        .eq('post_id', postId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      // Build nested comment structure
      const nestedComments = buildCommentTree(commentsData);

      setPost(postData);
      setComments(nestedComments);
    } catch (error) {
      console.error('Error loading post:', error);
      Alert.alert('Error', 'Failed to load post details');
      navigation.goBack();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const buildCommentTree = (commentsArray) => {
    const commentMap = {};
    const rootComments = [];

    // Create a map of all comments
    commentsArray.forEach(comment => {
      comment.replies = [];
      commentMap[comment.id] = comment;
    });

    // Build the tree structure
    commentsArray.forEach(comment => {
      if (comment.parent_comment_id && commentMap[comment.parent_comment_id]) {
        commentMap[comment.parent_comment_id].replies.push(comment);
      } else {
        rootComments.push(comment);
      }
    });

    return rootComments;
  };

  const setupRealtimeSubscriptions = () => {
    const commentsSubscription = supabase
      .channel(`post_${postId}_comments`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'comments',
          filter: `post_id=eq.${postId}`
        }, 
        (payload) => {
          console.log('New comment:', payload.new);
          loadPostAndComments(); // Reload to get proper user data
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`
        },
        (payload) => {
          console.log('Comment updated:', payload.new);
          loadPostAndComments();
        }
      )
      .subscribe();

    return () => {
      commentsSubscription.unsubscribe();
    };
  };

  const handleCommentAdded = (newComment) => {
    // Refresh comments to get the nested structure
    loadPostAndComments();
  };

  const handleReply = (comment) => {
    setReplyingTo(comment);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleUserPress = (userData) => {
    // navigation.navigate('UserProfile', { userId: userData.id });
    Alert.alert('Coming Soon', `View profile for @${userData.username}`);
  };

  const renderComment = ({ item }) => (
    <CommentCard
      comment={item}
      onReply={handleReply}
      onUserPress={handleUserPress}
    />
  );

  if (loading) {
    return <LoadingScreen message="Loading post..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadPostAndComments} />
        }
      >
        {/* Post */}
        <View style={styles.postContainer}>
          <PostCard
            post={post}
            onUserPress={handleUserPress}
            showFullContent={true}
          />
        </View>

        {/* Comments List */}
        <View style={styles.commentsContainer}>
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyComments}>
                <Text style={styles.emptyCommentsText}>
                  No comments yet. Be the first to share your thoughts!
                </Text>
              </View>
            }
          />
        </View>
      </ScrollView>

      {/* Comment Input */}
      <CommentInput
        postId={postId}
        parentCommentId={replyingTo?.id}
        replyingTo={replyingTo}
        onCommentAdded={handleCommentAdded}
        onCancel={handleCancelReply}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_CONFIG.colors.background,
  },
  content: {
    flex: 1,
  },
  postContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: APP_CONFIG.colors.border,
  },
  commentsContainer: {
    padding: 15,
  },
  emptyComments: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyCommentsText: {
    fontSize: 16,
    color: APP_CONFIG.colors.textSecondary,
    textAlign: 'center',
  },
});

export default PostDetailScreen;
