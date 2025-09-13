import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { APP_CONFIG } from '../../constants/config';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabase/client';
import { AdminService } from '../../services/admin/AdminService';

// Components
import SearchBar from '../../components/ui/SearchBar';
import PostCard from '../../components/ui/PostCard';
import ChatPanel from '../../components/ui/ChatPanel';
import LoadingScreen from '../../components/common/LoadingScreen';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Layout calculations
  const feedWidth = width * (APP_CONFIG.layout.feedWidth / 100);
  const chatWidth = width * (APP_CONFIG.layout.chatWidth / 100);
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    console.log('HomeScreen mounted, loading posts...');
    loadPosts();
    checkAdminAccess();
    setupRealtimeSubscriptions();

    return () => {
      // Cleanup subscriptions when component unmounts
      if (postsSubscription) {
        postsSubscription.unsubscribe();
      }
    };
  }, []);

  let postsSubscription = null;

  const loadPosts = async () => {
    try {
      setLoading(true);
      console.log('Fetching posts from Supabase...');
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id, title, content, tags, likes_count, comments_count, 
          created_at, is_pinned, category,
          users (
            id, username, display_name, avatar_url
          )
        `)
        .eq('is_deleted', false)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20);

      console.log('Posts fetched:', data?.length || 0, 'posts');

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      setPosts(data || []);
    } catch (error) {
      console.error('Error loading posts:', error);
      Alert.alert('Error', 'Failed to load posts. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to real-time updates for posts
    postsSubscription = supabase
      .channel('posts')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'posts' }, 
        (payload) => {
          console.log('New post received:', payload.new);
          loadPosts(); // Reload posts to get complete data with user info
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'posts' },
        (payload) => {
          console.log('Post updated:', payload.new);
          // Update specific post in state
          setPosts(prevPosts => 
            prevPosts.map(post => 
              post.id === payload.new.id 
                ? { ...post, ...payload.new }
                : post
            )
          );
        }
      )
      .subscribe();
  };

  const checkAdminAccess = async () => {
    try {
      const adminCheck = await AdminService.checkAdminAccess();
      setIsAdmin(adminCheck.isAdmin);
    } catch (error) {
      console.error('Admin check error:', error);
    }
  };

  const handleRefresh = () => {
    console.log('Refreshing posts...');
    setRefreshing(true);
    loadPosts();
  };

  const handleCreatePost = () => {
    navigation.navigate('CreatePost');
  };

  const handleUserSelect = (userData) => {
    console.log('User selected:', userData);
    // navigation.navigate('UserProfile', { userId: userData.id });
    Alert.alert('Coming Soon', `View profile for @${userData.username}`);
  };

  const handlePostSearch = (postData) => {
    console.log('Post searched:', postData);
    // navigation.navigate('PostDetail', { postId: postData.id });
    Alert.alert('Coming Soon', `View post: ${postData.title}`);
  };

  const handlePostLike = (postId, liked) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { 
              ...post, 
              likes_count: liked ? post.likes_count + 1 : Math.max(post.likes_count - 1, 0)
            }
          : post
      )
    );
  };

  const handlePostComment = (post) => {
    console.log('Comment on post:', post.title);
    navigation.navigate('PostDetail', { 
      postId: post.id, 
      openComments: true 
    });
  };

  const handleAdminDashboard = () => {
    navigation.navigate('AdminDashboard');
  };

  const renderPost = ({ item }) => (
    <PostCard
      post={item}
      onLike={handlePostLike}
      onComment={handlePostComment}
      onUserPress={handleUserSelect}
      onNavigateToPost={(postId, openComments = false) => {
        navigation.navigate('PostDetail', { postId, openComments });
      }}
    />
  );

  // Show loading screen while fetching data
  if (loading && posts.length === 0) {
    return <LoadingScreen message="Loading your feed..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Navigation Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.logoContainer}>
            <Ionicons name="bulb" size={28} color={APP_CONFIG.colors.primary} />
            <Text style={styles.logoText}>HypIDEAS</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerCenter}>
          <SearchBar
            onUserSelect={handleUserSelect}
            onPostSearch={handlePostSearch}
          />
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleCreatePost}
          >
            <Ionicons name="add-circle" size={28} color={APP_CONFIG.colors.primary} />
          </TouchableOpacity>
          
          {/* Admin Dashboard Access - Only visible to admins */}
          {isAdmin && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleAdminDashboard}
            >
              <Ionicons name="shield-checkmark" size={28} color="#f44336" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => Alert.alert('Coming Soon', 'Profile screen in development')}
          >
            <Ionicons name="person-circle" size={28} color={APP_CONFIG.colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={signOut}
          >
            <Ionicons name="log-out" size={24} color={APP_CONFIG.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        {isWeb ? (
          // Web Layout: Side-by-side feed and chat
          <View style={styles.webLayout}>
            {/* Feed Section - 60% */}
            <View style={[styles.feedSection, { width: feedWidth }]}>
              {posts.length === 0 ? (
                <View style={styles.emptyFeed}>
                  <Ionicons name="documents-outline" size={64} color={APP_CONFIG.colors.textSecondary} />
                  <Text style={styles.emptyFeedText}>
                    No posts yet. Be the first to share your ideas!
                  </Text>
                  <TouchableOpacity
                    style={styles.createFirstPostButton}
                    onPress={handleCreatePost}
                  >
                    <Text style={styles.createFirstPostText}>Create Post</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <FlatList
                  data={posts}
                  renderItem={renderPost}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.feedContent}
                  showsVerticalScrollIndicator={false}
                  refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                  }
                />
              )}
            </View>

            {/* Chat Section - 40% */}
            <ChatPanel style={[styles.chatSection, { width: chatWidth }]} />
          </View>
        ) : (
          // Mobile Layout: Single column feed only
          <View style={styles.mobileLayout}>
            <View style={styles.feedSection}>
              {posts.length === 0 ? (
                <View style={styles.emptyFeed}>
                  <Ionicons name="documents-outline" size={64} color={APP_CONFIG.colors.textSecondary} />
                  <Text style={styles.emptyFeedText}>
                    No posts yet. Be the first to share your ideas!
                  </Text>
                  <TouchableOpacity
                    style={styles.createFirstPostButton}
                    onPress={handleCreatePost}
                  >
                    <Text style={styles.createFirstPostText}>Create Post</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <FlatList
                  data={posts}
                  renderItem={renderPost}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.feedContent}
                  showsVerticalScrollIndicator={false}
                  refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                  }
                />
              )}
            </View>
          </View>
        )}
      </View>

      {/* Admin Powers Notice - Only visible to admins */}
      {isAdmin && (
        <View style={styles.adminNotice}>
          <Ionicons name="shield-checkmark" size={16} color="#f44336" />
          <Text style={styles.adminNoticeText}>Admin Mode Active</Text>
        </View>
      )}
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: APP_CONFIG.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: APP_CONFIG.colors.border,
    minHeight: 70,
  },
  headerLeft: {
    flex: 0.2,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: APP_CONFIG.colors.primary,
    marginLeft: 8,
  },
  headerCenter: {
    flex: 0.6,
    paddingHorizontal: 20,
  },
  headerRight: {
    flex: 0.2,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 15,
  },
  mainContent: {
    flex: 1,
  },
  webLayout: {
    flexDirection: 'row',
    flex: 1,
  },
  mobileLayout: {
    flex: 1,
  },
  feedSection: {
    flex: 1,
    borderRightWidth: Platform.OS === 'web' ? 1 : 0,
    borderRightColor: APP_CONFIG.colors.border,
  },
  feedContent: {
    padding: 20,
    paddingBottom: 100, // Extra padding for mobile tab navigation
  },
  chatSection: {
    borderLeftWidth: 1,
    borderLeftColor: APP_CONFIG.colors.border,
  },
  emptyFeed: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyFeedText: {
    fontSize: 16,
    color: APP_CONFIG.colors.textSecondary,
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 30,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  createFirstPostButton: {
    backgroundColor: APP_CONFIG.colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  createFirstPostText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  adminNotice: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 20 : 90,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f44336',
  },
  adminNoticeText: {
    fontSize: 12,
    color: '#f44336',
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default HomeScreen;
