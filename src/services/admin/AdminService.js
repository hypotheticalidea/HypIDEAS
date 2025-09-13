import { supabase } from '../supabase/client';

export class AdminService {
  // Check if current user is admin
  static async checkAdminAccess() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { isAdmin: false };

      const { data, error } = await supabase
        .from('admin_users')
        .select('role, permissions, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return {
        isAdmin: !!data,
        role: data?.role,
        permissions: data?.permissions || {}
      };
    } catch (error) {
      console.error('Admin access check error:', error);
      return { isAdmin: false };
    }
  }

  // Get platform statistics
  static async getPlatformStats(daysBack = 30) {
    try {
      const { data, error } = await supabase
        .rpc('get_platform_stats', { days_back: daysBack });

      if (error) throw error;
      return { success: true, stats: data[0] };
    } catch (error) {
      console.error('Get platform stats error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user management data
  static async getUsers(filters = {}, limit = 50, offset = 0) {
    try {
      let query = supabase
        .from('users')
        .select(`
          id, username, display_name, email, phone, 
          created_at, last_seen, posts_count, followers_count,
          user_violations!inner (
            count
          ),
          user_bans!inner (
            ban_type, is_active, banned_until
          )
        `)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.search) {
        query = query.or(`username.ilike.%${filters.search}%,display_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }
      
      if (filters.banned) {
        query = query.eq('user_bans.is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;

      return { success: true, users: data };
    } catch (error) {
      console.error('Get users error:', error);
      return { success: false, error: error.message };
    }
  }

  // Ban/suspend user
  static async banUser(userId, banType, reason, duration = null) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const banData = {
        user_id: userId,
        ban_type: banType,
        reason,
        banned_by: user.id,
        banned_until: duration ? new Date(Date.now() + duration).toISOString() : null,
        is_active: true
      };

      const { error } = await supabase
        .from('user_bans')
        .insert(banData);

      if (error) throw error;

      // Log admin action
      await this.logAdminAction('ban_user', 'user', userId, {}, { ban_type: banType, reason });

      return { success: true };
    } catch (error) {
      console.error('Ban user error:', error);
      return { success: false, error: error.message };
    }
  }

  // Unban user
  static async unbanUser(userId, reason) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('user_bans')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      // Log admin action
      await this.logAdminAction('unban_user', 'user', userId, {}, { reason });

      return { success: true };
    } catch (error) {
      console.error('Unban user error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get moderation queue
  static async getModerationQueue(status = 'pending', limit = 50) {
    try {
      const { data, error } = await supabase
        .from('moderation_queue')
        .select(`
          id, content_type, content_id, reason, priority, status,
          created_at, notes, action_taken,
          reported_by:users!moderation_queue_reported_by_fkey (username, display_name),
          reviewed_by:admin_users!moderation_queue_reviewed_by_fkey (
            users (username, display_name)
          )
        `)
        .eq('status', status)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return { success: true, queue: data };
    } catch (error) {
      console.error('Get moderation queue error:', error);
      return { success: false, error: error.message };
    }
  }

  // Moderate content
  static async moderateContent(queueId, action, notes = '') {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('moderation_queue')
        .update({
          status: action, // 'approved' or 'rejected'
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          notes,
          action_taken: action
        })
        .eq('id', queueId);

      if (error) throw error;

      // Log admin action
      await this.logAdminAction('moderate_content', 'moderation_queue', queueId, {}, { action, notes });

      return { success: true };
    } catch (error) {
      console.error('Moderate content error:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete content (posts, comments)
  static async deleteContent(contentType, contentId, reason) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const table = contentType === 'post' ? 'posts' : 'comments';
      
      const { error } = await supabase
        .from(table)
        .update({ 
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
          deletion_reason: reason
        })
        .eq('id', contentId);

      if (error) throw error;

      // Log admin action
      await this.logAdminAction('delete_content', contentType, contentId, {}, { reason });

      return { success: true };
    } catch (error) {
      console.error('Delete content error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get platform analytics
  static async getAnalytics(timeRange = '7d') {
    try {
      const days = parseInt(timeRange.replace('d', ''));
      
      const [usersData, postsData, engagementData] = await Promise.all([
        // User analytics
        supabase
          .from('users')
          .select('created_at')
          .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()),
        
        // Posts analytics  
        supabase
          .from('posts')
          .select('created_at, likes_count, comments_count')
          .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
          .eq('is_deleted', false),
          
        // Engagement analytics
        supabase
          .from('likes')
          .select('created_at')
          .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      ]);

      // Process data for charts
      const analytics = {
        userGrowth: this.processTimeSeriesData(usersData.data, days),
        postActivity: this.processTimeSeriesData(postsData.data, days),
        engagement: this.processTimeSeriesData(engagementData.data, days),
        summary: {
          totalUsers: usersData.data?.length || 0,
          totalPosts: postsData.data?.length || 0,
          totalEngagement: engagementData.data?.length || 0,
          avgLikesPerPost: postsData.data?.length ? 
            postsData.data.reduce((sum, post) => sum + (post.likes_count || 0), 0) / postsData.data.length : 0
        }
      };

      return { success: true, analytics };
    } catch (error) {
      console.error('Get analytics error:', error);
      return { success: false, error: error.message };
    }
  }

  // Process time series data for charts
  static processTimeSeriesData(data, days) {
    const result = [];
    const now = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      const count = data?.filter(item => {
        const itemDate = new Date(item.created_at).toISOString().split('T')[0];
        return itemDate === dateStr;
      }).length || 0;
      
      result.unshift({ date: dateStr, value: count });
    }
    
    return result;
  }

  // Create platform announcement
  static async createAnnouncement(title, content, type, targetAudience = 'all', expiresAt = null) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('platform_announcements')
        .insert({
          title,
          content,
          announcement_type: type,
          target_audience: targetAudience,
          expires_at: expiresAt,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Log admin action
      await this.logAdminAction('create_announcement', 'announcement', data.id, {}, { title, type });

      return { success: true, announcement: data };
    } catch (error) {
      console.error('Create announcement error:', error);
      return { success: false, error: error.message };
    }
  }

  // Log admin actions
  static async logAdminAction(actionType, targetType, targetId, oldValues, newValues, reason = null) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase
        .from('admin_action_logs')
        .insert({
          admin_id: user.id,
          action_type: actionType,
          target_type: targetType,
          target_id: targetId,
          old_values: oldValues,
          new_values: newValues,
          reason
        });
    } catch (error) {
      console.error('Log admin action error:', error);
    }
  }

  // Get admin action logs
  static async getAdminLogs(limit = 100, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('admin_action_logs')
        .select(`
          id, action_type, target_type, target_id, reason, created_at,
          old_values, new_values,
          admin:admin_users!admin_action_logs_admin_id_fkey (
            users (username, display_name)
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { success: true, logs: data };
    } catch (error) {
      console.error('Get admin logs error:', error);
      return { success: false, error: error.message };
    }
  }

  // System health check
  static async getSystemHealth() {
    try {
      // Check database connection
      const dbCheck = await supabase.from('users').select('count').limit(1);
      
      // Check various system components
      const health = {
        database: dbCheck.error ? 'unhealthy' : 'healthy',
        storage: 'healthy', // Add actual storage check
        auth: 'healthy', // Add actual auth check
        realtime: 'healthy', // Add actual realtime check
        overall: 'healthy'
      };

      // Update system health table
      await supabase
        .from('system_health')
        .upsert([
          { service_name: 'database', status: health.database, last_check: new Date().toISOString() },
          { service_name: 'storage', status: health.storage, last_check: new Date().toISOString() },
          { service_name: 'auth', status: health.auth, last_check: new Date().toISOString() },
          { service_name: 'realtime', status: health.realtime, last_check: new Date().toISOString() }
        ]);

      return { success: true, health };
    } catch (error) {
      console.error('System health check error:', error);
      return { success: false, error: error.message };
    }
  }
}
