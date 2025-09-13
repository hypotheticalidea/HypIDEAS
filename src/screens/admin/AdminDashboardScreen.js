import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { APP_CONFIG } from '../../constants/config';
import { AdminService } from '../../services/admin/AdminService';
import { useAuth } from '../../hooks/useAuth';

const { width } = Dimensions.get('window');

const StatCard = ({ title, value, icon, color, trend }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <View style={styles.statHeader}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={styles.statTitle}>{title}</Text>
    </View>
    <Text style={styles.statValue}>{value}</Text>
    {trend && (
      <View style={styles.trendContainer}>
        <Ionicons 
          name={trend > 0 ? 'trending-up' : 'trending-down'} 
          size={16} 
          color={trend > 0 ? '#4CAF50' : '#f44336'} 
        />
        <Text style={[styles.trendText, { color: trend > 0 ? '#4CAF50' : '#f44336' }]}>
          {Math.abs(trend)}%
        </Text>
      </View>
    )}
  </View>
);

const QuickActionCard = ({ title, subtitle, icon, color, onPress }) => (
  <TouchableOpacity style={styles.quickActionCard} onPress={onPress}>
    <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={28} color={color} />
    </View>
    <View style={styles.quickActionText}>
      <Text style={styles.quickActionTitle}>{title}</Text>
      <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color={APP_CONFIG.colors.textSecondary} />
  </TouchableOpacity>
);

const AdminDashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [adminInfo, setAdminInfo] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Check admin access
      const adminCheck = await AdminService.checkAdminAccess();
      if (!adminCheck.isAdmin) {
        Alert.alert('Access Denied', 'You do not have admin privileges');
        navigation.goBack();
        return;
      }
      
      setAdminInfo(adminCheck);

      // Load platform stats
      const statsResult = await AdminService.getPlatformStats();
      if (statsResult.success) {
        setStats(statsResult.stats);
      }

      // Load system health
      const healthResult = await AdminService.getSystemHealth();
      if (healthResult.success) {
        setSystemHealth(healthResult.health);
      }

    } catch (error) {
      console.error('Load dashboard error:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  if (loading && !stats) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="shield-checkmark" size={64} color={APP_CONFIG.colors.primary} />
          <Text style={styles.loadingText}>Loading Admin Dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={APP_CONFIG.colors.text} />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Admin Dashboard</Text>
              <Text style={styles.headerSubtitle}>
                {adminInfo?.role} • HypIDEAS Platform
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings" size={24} color={APP_CONFIG.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* System Health Status */}
        {systemHealth && (
          <View style={styles.healthSection}>
            <Text style={styles.sectionTitle}>System Health</Text>
            <View style={styles.healthContainer}>
              {Object.entries(systemHealth).map(([service, status]) => (
                service !== 'overall' && (
                  <View key={service} style={styles.healthItem}>
                    <View style={[
                      styles.healthIndicator,
                      { backgroundColor: status === 'healthy' ? '#4CAF50' : '#f44336' }
                    ]} />
                    <Text style={styles.healthService}>{service}</Text>
                    <Text style={[
                      styles.healthStatus,
                      { color: status === 'healthy' ? '#4CAF50' : '#f44336' }
                    ]}>
                      {status}
                    </Text>
                  </View>
                )
              ))}
            </View>
          </View>
        )}

        {/* Platform Statistics */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Platform Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Users"
              value={formatNumber(stats?.total_users)}
              icon="people"
              color="#2196F3"
              trend={parseFloat(stats?.user_growth_rate)}
            />
            <StatCard
              title="Active Users"
              value={formatNumber(stats?.active_users)}
              icon="person-circle"
              color="#4CAF50"
            />
            <StatCard
              title="Total Posts"
              value={formatNumber(stats?.total_posts)}
              icon="document-text"
              color="#FF9800"
            />
            <StatCard
              title="Engagement"
              value={`${parseFloat(stats?.engagement_rate || 0).toFixed(1)}%`}
              icon="heart"
              color="#E91E63"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <QuickActionCard
            title="User Management"
            subtitle="View, ban, or manage users"
            icon="people-circle"
            color="#2196F3"
            onPress={() => navigation.navigate('AdminUserManagement')}
          />
          
          <QuickActionCard
            title="Content Moderation"
            subtitle="Review flagged content"
            icon="shield-checkmark"
            color="#FF9800"
            onPress={() => navigation.navigate('AdminModeration')}
          />
          
          <QuickActionCard
            title="Platform Analytics"
            subtitle="Detailed insights and reports"
            icon="analytics"
            color="#9C27B0"
            onPress={() => navigation.navigate('AdminAnalytics')}
          />
          
          <QuickActionCard
            title="System Monitoring"
            subtitle="Performance and health metrics"
            icon="pulse"
            color="#4CAF50"
            onPress={() => navigation.navigate('AdminSystemMonitoring')}
          />
          
          <QuickActionCard
            title="Announcements"
            subtitle="Create platform-wide announcements"
            icon="megaphone"
            color="#F44336"
            onPress={() => navigation.navigate('AdminAnnouncements')}
          />
          
          <QuickActionCard
            title="Admin Logs"
            subtitle="View all admin actions"
            icon="document-text"
            color="#607D8B"
            onPress={() => navigation.navigate('AdminLogs')}
          />
        </View>

        {/* Recent Activity Preview */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityItem}>
            <Ionicons name="person-add" size={20} color="#4CAF50" />
            <Text style={styles.activityText}>12 new users registered today</Text>
          </View>
          <View style={styles.activityItem}>
            <Ionicons name="document" size={20} color="#2196F3" />
            <Text style={styles.activityText}>85 new posts created</Text>
          </View>
          <View style={styles.activityItem}>
            <Ionicons name="flag" size={20} color="#FF9800" />
            <Text style={styles.activityText}>3 posts flagged for review</Text>
          </View>
        </View>

        {/* Admin Powers Notice */}
        <View style={styles.noticeSection}>
          <View style={styles.noticeHeader}>
            <Ionicons name="warning" size={24} color="#FF9800" />
            <Text style={styles.noticeTitle}>Maximum Admin Powers</Text>
          </View>
          <Text style={styles.noticeText}>
            You have full administrative control over the HypIDEAS platform. 
            Use these powers responsibly to maintain a safe and engaging community.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_CONFIG.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: APP_CONFIG.colors.text,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: APP_CONFIG.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: APP_CONFIG.colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: APP_CONFIG.colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: APP_CONFIG.colors.textSecondary,
    marginTop: 2,
  },
  settingsButton: {
    padding: 8,
  },
  healthSection: {
    padding: 20,
    backgroundColor: APP_CONFIG.colors.surface,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: APP_CONFIG.colors.text,
    marginBottom: 16,
  },
  healthContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  healthItem: {
    alignItems: 'center',
  },
  healthIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  healthService: {
    fontSize: 12,
    color: APP_CONFIG.colors.text,
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  healthStatus: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statsSection: {
    padding: 20,
    backgroundColor: APP_CONFIG.colors.surface,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: APP_CONFIG.colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 14,
    color: APP_CONFIG.colors.textSecondary,
    marginLeft: 8,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: APP_CONFIG.colors.text,
    marginBottom: 8,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  quickActionsSection: {
    padding: 20,
    backgroundColor: APP_CONFIG.colors.surface,
    marginTop: 8,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_CONFIG.colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_CONFIG.colors.text,
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: APP_CONFIG.colors.textSecondary,
  },
  activitySection: {
    padding: 20,
    backgroundColor: APP_CONFIG.colors.surface,
    marginTop: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activityText: {
    fontSize: 14,
    color: APP_CONFIG.colors.text,
    marginLeft: 12,
  },
  noticeSection: {
    margin: 20,
    padding: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F57C00',
    marginLeft: 8,
  },
  noticeText: {
    fontSize: 14,
    color: '#BF6000',
    lineHeight: 20,
  },
});

export default AdminDashboardScreen;
