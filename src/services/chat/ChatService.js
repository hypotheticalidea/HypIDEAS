import { supabase } from '../supabase/client';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { Buffer } from 'buffer';

export class ChatService {
  static realtimeSubscription = null;

  // Initialize real-time subscriptions for a chat
  static subscribeToChat(chatId, chatType, callback) {
    if (this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
    }

    const channel = chatType === 'private' ? 'conversation_id' : 'channel_id';
    
    this.realtimeSubscription = supabase
      .channel(`chat_${chatId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `${channel}=eq.${chatId}`
      }, (payload) => {
        callback('message', payload);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'typing_indicators',
        filter: `${channel}=eq.${chatId}`
      }, (payload) => {
        callback('typing', payload);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'message_reactions'
      }, (payload) => {
        callback('reaction', payload);
      })
      .subscribe();

    return this.realtimeSubscription;
  }

  // Send a text message
  static async sendMessage(chatId, chatType, content, replyToId = null) {
    try {
      const messageData = {
        content,
        sender_id: (await supabase.auth.getUser()).data.user.id,
        message_type: 'text',
        reply_to_message_id: replyToId,
        created_at: new Date().toISOString(),
      };

      if (chatType === 'private') {
        messageData.conversation_id = chatId;
      } else {
        messageData.channel_id = chatId;
      }

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select(`
          id, content, created_at, message_type, reply_to_message_id,
          file_url, file_name, file_type, reactions,
          users (id, username, display_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      // Update last message timestamp
      if (chatType === 'private') {
        await supabase
          .from('conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', chatId);
      }

      return { success: true, message: data };
    } catch (error) {
      console.error('Send message error:', error);
      return { success: false, error: error.message };
    }
  }

  // Upload and send file message
  static async sendFileMessage(chatId, chatType, fileUri, fileName, fileType) {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      
      // Read file as base64
      const fileBase64 = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to array buffer using Buffer
      const arrayBuffer = Buffer.from(fileBase64, 'base64');

      // Upload to Supabase storage
      const fileExt = fileName.split('.').pop();
      const filePath = `chat-files/${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(filePath, arrayBuffer, {
          contentType: fileType,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('chat-files')
        .getPublicUrl(filePath);

      // Send message with file
      const messageData = {
        content: fileName,
        sender_id: user.id,
        message_type: fileType.startsWith('image/') ? 'image' : 'file',
        file_url: urlData.publicUrl,
        file_name: fileName,
        file_type: fileType,
        created_at: new Date().toISOString(),
      };

      if (chatType === 'private') {
        messageData.conversation_id = chatId;
      } else {
        messageData.channel_id = chatId;
      }

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select(`
          id, content, created_at, message_type,
          file_url, file_name, file_type, reactions,
          users (id, username, display_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      return { success: true, message: data };
    } catch (error) {
      console.error('Send file error:', error);
      return { success: false, error: error.message };
    }
  }

  // Pick and send file
  static async pickAndSendFile(chatId, chatType) {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return { success: false, error: 'File selection cancelled' };
      }

      const file = result.assets[0];
      return await this.sendFileMessage(
        chatId, 
        chatType, 
        file.uri, 
        file.name, 
        file.mimeType
      );
    } catch (error) {
      console.error('Pick file error:', error);
      return { success: false, error: error.message };
    }
  }

  // Add reaction to message
  static async addMessageReaction(messageId, reactionType) {
    try {
      const user = (await supabase.auth.getUser()).data.user;

      const { error } = await supabase
        .from('message_reactions')
        .upsert({
          message_id: messageId,
          user_id: user.id,
          reaction_type: reactionType
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Add reaction error:', error);
      return { success: false, error: error.message };
    }
  }

  // Remove reaction from message
  static async removeMessageReaction(messageId, reactionType) {
    try {
      const user = (await supabase.auth.getUser()).data.user;

      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('reaction_type', reactionType);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Remove reaction error:', error);
      return { success: false, error: error.message };
    }
  }

  // Set typing indicator
  static async setTypingIndicator(chatId, chatType, isTyping) {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      
      if (isTyping) {
        const typingData = {
          user_id: user.id,
          is_typing: true,
          expires_at: new Date(Date.now() + 10000).toISOString(), // 10 seconds
        };

        if (chatType === 'private') {
          typingData.conversation_id = chatId;
        } else {
          typingData.channel_id = chatId;
        }

        await supabase.from('typing_indicators').upsert(typingData);
      } else {
        const filter = chatType === 'private' 
          ? { conversation_id: chatId, user_id: user.id }
          : { channel_id: chatId, user_id: user.id };

        await supabase.from('typing_indicators').delete().match(filter);
      }

      return { success: true };
    } catch (error) {
      console.error('Set typing indicator error:', error);
      return { success: false, error: error.message };
    }
  }

  // Update user presence
  static async updatePresence(status, customStatus = null) {
    try {
      const user = (await supabase.auth.getUser()).data.user;

      const { error } = await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          status,
          custom_status: customStatus,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Update presence error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get chat messages with pagination
  static async getChatMessages(chatId, chatType, limit = 50, before = null) {
    try {
      let query = supabase
        .from('messages')
        .select(`
          id, content, created_at, message_type, reply_to_message_id,
          file_url, file_name, file_type, reactions, is_edited, edited_at,
          users (id, username, display_name, avatar_url),
          reply_to:reply_to_message_id (
            id, content, message_type,
            users (username, display_name)
          )
        `)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (chatType === 'private') {
        query = query.eq('conversation_id', chatId);
      } else {
        query = query.eq('channel_id', chatId);
      }

      if (before) {
        query = query.lt('created_at', before);
      }

      const { data, error } = await query;
      if (error) throw error;

      return { success: true, messages: data.reverse() };
    } catch (error) {
      console.error('Get messages error:', error);
      return { success: false, error: error.message };
    }
  }

  // Create or get private conversation
  static async getOrCreateConversation(otherUserId) {
    try {
      const user = (await supabase.auth.getUser()).data.user;

      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant_1.eq.${user.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${user.id})`)
        .single();

      if (existing) {
        return { success: true, conversationId: existing.id };
      }

      // Create new conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          participant_1: user.id,
          participant_2: otherUserId,
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (error) throw error;

      return { success: true, conversationId: data.id };
    } catch (error) {
      console.error('Create conversation error:', error);
      return { success: false, error: error.message };
    }
  }

  // Mark messages as read
  static async markMessagesAsRead(messageIds) {
    try {
      const user = (await supabase.auth.getUser()).data.user;

      const readReceipts = messageIds.map(messageId => ({
        message_id: messageId,
        user_id: user.id,
        read_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('message_read_receipts')
        .upsert(readReceipts);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Mark as read error:', error);
      return { success: false, error: error.message };
    }
  }

  // Cleanup subscriptions
  static cleanup() {
    if (this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
      this.realtimeSubscription = null;
    }
  }
}
