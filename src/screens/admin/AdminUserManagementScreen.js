import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { APP_CONFIG } from '../../constants/config';
import { AdminService } from '../../services/admin/AdminService';

const UserCard = ({ user, onAction }) => {
  const isOnline = user.last_seen && 
    new Date() - new Date(user.last_seen) < 5 * 60 * 1000; // 5 minutes

  const isBanned = user.user_bans && user.user_bans.some(ban => ban.is_active);

  return (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <Image
          source={{ 
            uri: user.avatar_url || 'https://via.placeholder.com/48x48/E5E5EA/8E8E93?text=?' 
          }}
          style={styles.userAvatar}
        />
        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={styles.userName}>{user.display_name}</Text>
            {isOnline && <View style={styles.onlineIndicator} />}
            {isBanned && (
              <View style={styles.bannedBadge}>
                <Text style={styles.bannedText}>BANNED</Text>
              </View>
            )}
          </View>
          <Text style={styles.userUsername}>@{user.username}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => onAction(user)}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={APP_CONFIG.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.userStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user.posts_count || 0}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user.followers_count || 0}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {user.user_violations ? user.user_violations.length : 0}
          </Text>
          <Text style={styles.statLabel}>Violations</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
          </Text>
          <Text style={styles.statLabel}>Joined</Text>
        </View>
      </View>
    </View>
  );
};

const AdminUserManagementScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, banned, recent
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [filterType, searchQuery]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      const filters = {};
      if (searchQuery) filters.search = searchQuery;
      if (filterType === 'banned') filters.banned = true;

      const result = await AdminService.getUsers(filters, 50, 0);
      
      if (result.success) {
        setUsers(result.users);
      } else {
        Alert.alert('Error', 'Failed to load users');
      }
    } catch (error) {
      console.error('Load users error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = (user) => {
    setSelectedUser(user);
    setActionModalVisible(true);
  };

  const handleBanUser = () => {
    Alert.alert(
      'Ban User',
      `Are you sure you want to ban @${selectedUser.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Temporary Ban',
          onPress: () => banUser('temporary', 7 * 24 * 60 * 60 * 1000) // 7 days
        },
        {
          text: 'Permanent Ban',
          style: 'destructive',
          onPress: () => banUser('permanent')
        }
      ]
    );
  };

  const banUser = async (banType, duration = null) => {
    try {
      const reason = 'Admin action'; // In real app, prompt for reason
      const result = await AdminService.banUser(selectedUser.id, banType, reason, duration);
      
      if (result.success) {
        Alert.alert('Success', `User has been ${banType === 'permanent' ? 'permanently' : 'temporarily'} banned`);
        setActionModalVisible(false);
        loadUsers(); // Refresh list
      } else {
        Alert.alert('Error', 'Failed to ban user');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to ban user');
    }
  };

  const handleUnbanUser = async () => {
    try {
      const result = await AdminService.unbanUser(selectedUser.id, 'Admin review');
      
      if (result.success) {
        Alert.alert('Success', 'User has been unbanned');
        setActionModalVisible(false);
        loadUsers(); // Refresh list
      } else {
        Alert.alert('Error', 'Failed to unban user');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to unban user');
    }
  };

  const renderUser = ({ item }) => (
    <UserCard user={item} onAction={handleUserAction} />
  );

  const renderFilterButton = (type, label) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filterType === type && styles.activeFilterButton
      ]}
      onPress={() => setFilterType(type)}
    >
      <Text style={[
        styles.filterButtonText,
        filterType === type && styles.activeFilterButtonText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const isBanned = selectedUser?.user_bans?.some(ban => ban.is_active);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={APP_CONFIG.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Management</Text>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={APP_CONFIG.colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor={APP_CONFIG.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <View style={styles.filtersContainer}>
          {renderFilterButton('all', 'All Users')}
          {renderFilterButton('recent', 'Recent')}
          {renderFilterButton('banned', 'Banned')}
        </View>
      </View>

      {/* Users List */}
      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        style={styles.usersList}
        contentContainerStyle={styles.usersListContent}
        refreshing={loading}
        onRefresh={loadUsers}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={APP_CONFIG.colors.textSecondary} />
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
      />

      {/* User Action Modal */}
      <Modal
        visible={actionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setActionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                User Actions: @{selectedUser?.username}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setActionModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={APP_CONFIG.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="person-outline" size={20} color="#2196F3" />
                <Text style={[styles.actionButtonText, { color: '#2196F3' }]}>
                  View Profile
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="mail-outline" size={20} color="#4CAF50" />
                <Text style={[styles.actionButtonText, { color: '#4CAF50' }]}>
                  Send Message
                </Text>
              </TouchableOpacity>

              {isBanned ? (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={handleUnbanUser}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color="#4CAF50" />
                  <Text style={[styles.actionButtonText, { color: '#4CAF50' }]}>
                    Unban User
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={handleBanUser}
                >
                  <Ionicons name="ban-outline" size={20} color="#f44336" />
                  <Text style={[styles.actionButtonText, { color: '#f44336' }]}>
                    Ban User
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="warning-outline" size={20} color="#FF9800" />
                <Text style={[styles.actionButtonText, { color: '#FF9800' }]}>
                  Issue Warning
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="document-text-outline" size={20} color="#9C27B0" />
                <Text style={[styles.actionButtonText, { color: '#9C27B0' }]}>
                  View Activity Log
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingVertical: 16,
    backgroundColor: APP_CONFIG.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: APP_CONFIG.colors.border,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: APP_CONFIG.colors.text,
  },
  searchSection: {
    backgroundColor: APP_CONFIG.colors.surface,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_CONFIG.colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: APP_CONFIG.colors.text,
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: APP_CONFIG.colors.background,
    borderWidth: 1,
    borderColor: APP_CONFIG.colors.border,
  },
  activeFilterButton: {
    backgroundColor: APP_CONFIG.colors.primary,
    borderColor: APP_CONFIG.colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: APP_CONFIG.colors.text,
  },
  activeFilterButtonText: {
    color: 'white',
  },
  usersList: {
    flex: 1,
  },
  usersListContent: {
    padding: 20,
  },
  userCard: {
    backgroundColor: APP_CONFIG.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: APP_CONFIG.colors.border,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: APP_CONFIG.colors.border,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_CONFIG.colors.text,
    marginRight: 8,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  bannedBadge: {
    backgroundColor: '#f44336',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bannedText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  userUsername: {
    fontSize: 14,
    color: APP_CONFIG.colors.textSecondary,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: APP_CONFIG.colors.textSecondary,
  },
  moreButton: {
    padding: 8,
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: APP_CONFIG.colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_CONFIG.colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: APP_CONFIG.colors.textSecondary,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: APP_CONFIG.colors.textSecondary,
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: APP_CONFIG.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: APP_CONFIG.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: APP_CONFIG.colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalActions: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  actionButtonText: {
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '500',
  },
});

export default AdminUserManagementScreen;
