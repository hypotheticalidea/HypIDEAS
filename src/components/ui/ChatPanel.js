import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { APP_CONFIG } from '../../constants/config';
import { supabase } from '../../services/supabase/client';
import { useAuth } from '../../hooks/useAuth';

const ChatPanel = ({ style }) => {
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState(null);
  const [privateChats, setPrivateChats] = useState([]);
  const [worldChannels, setWorldChannels] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    loadChats();
    loadWorldChannels();
  }, []);

  const loadChats = async () => {
  try {
    // Simplified query to avoid foreign key issues for now
    const { data, error } = await supabase
      .from('conversations')
      .select('id, last_message_at, participant_1, participant_2')
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Load chats error:', error);
      return;
    }

    // For now, create simple chat items without user details
    const formattedChats = data?.map(conv => ({
      id: conv.id,
      type: 'private',
      name: `Chat ${conv.id.substring(0, 8)}`,
      username: 'user',
      avatar: null,
      lastMessage: conv.last_message_at,
    })) || [];
    
    setPrivateChats(formattedChats);
  } catch (error) {
    console.error('Error loading chats:', error);
  }
    };

  const loadWorldChannels = async () => {
    const { data, error } = await supabase
      .from('world_chat_channels')
      .select('id, name, description, icon_url, member_count')
      .eq('is_active', true)
      .order('member_count', { ascending: false });

    if (!error) {
      const formattedChannels = data.map(channel => ({
        id: channel.id,
        type: 'world',
        name: channel.name,
        description: channel.description,
        icon: channel.icon_url,
        memberCount: channel.member_count,
      }));
      setWorldChannels(formattedChannels);
    }
  };

  const loadMessages = async (chatId, chatType) => {
    let query = supabase
      .from('messages')
      .select(`
        id, content, created_at, sender_id,
        users(username, display_name, avatar_url)
      `)
      .order('created_at', { ascending: true });

    if (chatType === 'private') {
      query = query.eq('conversation_id', chatId);
    } else {
      query = query.eq('channel_id', chatId);
    }

    const { data, error } = await query;
    if (!error) {
      setMessages(data);
    }
  };

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    loadMessages(chat.id, chat.type);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    const messageData = {
      sender_id: user.id,
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
    };

    if (selectedChat.type === 'private') {
      messageData.conversation_id = selectedChat.id;
    } else {
      messageData.channel_id = selectedChat.id;
    }

    const { error } = await supabase
      .from('messages')
      .insert(messageData);

    if (!error) {
      setNewMessage('');
      loadMessages(selectedChat.id, selectedChat.type);
    }
  };

  const renderChatItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.chatItem,
        selectedChat?.id === item.id && styles.selectedChatItem
      ]}
      onPress={() => handleChatSelect(item)}
    >
      <View style={styles.chatIcon}>
        {item.type === 'private' ? (
          <Ionicons name="person-circle" size={24} color={APP_CONFIG.colors.primary} />
        ) : (
          <Ionicons name="people-circle" size={24} color={APP_CONFIG.colors.secondary} />
        )}
      </View>
      <View style={styles.chatInfo}>
        <Text style={styles.chatName} numberOfLines={1}>
          {item.name}
        </Text>
        {item.type === 'world' && (
          <Text style={styles.memberCount}>
            {item.memberCount} members
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderMessage = ({ item }) => {
    const isOwnMessage = item.sender_id === user.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        {!isOwnMessage && (
          <Text style={styles.messageSender}>
            {item.users.display_name}
          </Text>
        )}
        <Text style={styles.messageText}>{item.content}</Text>
        <Text style={styles.messageTime}>
          {new Date(item.created_at).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Chat List Section */}
      <View style={styles.chatListSection}>
        <Text style={styles.sectionTitle}>Private Chats</Text>
        <FlatList
          data={privateChats}
          renderItem={renderChatItem}
          keyExtractor={(item) => `private_${item.id}`}
          style={styles.chatList}
          showsVerticalScrollIndicator={false}
        />
        
        <Text style={styles.sectionTitle}>World Channels</Text>
        <FlatList
          data={worldChannels}
          renderItem={renderChatItem}
          keyExtractor={(item) => `world_${item.id}`}
          style={styles.chatList}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Messages Section */}
      <View style={styles.messagesSection}>
        {selectedChat ? (
          <>
            <View style={styles.chatHeader}>
              <Text style={styles.chatHeaderTitle}>{selectedChat.name}</Text>
              <Text style={styles.chatHeaderType}>
                {selectedChat.type === 'private' ? 'Private Chat' : 'World Channel'}
              </Text>
            </View>
            
            <FlatList
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              style={styles.messagesList}
              showsVerticalScrollIndicator={false}
            />
            
            <View style={styles.messageInputContainer}>
              <TextInput
                style={styles.messageInput}
                placeholder="Type a message..."
                placeholderTextColor={APP_CONFIG.colors.textSecondary}
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={sendMessage}
                disabled={!newMessage.trim()}
              >
                <Ionicons 
                  name="send" 
                  size={20} 
                  color={newMessage.trim() ? APP_CONFIG.colors.primary : APP_CONFIG.colors.textSecondary} 
                />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.noChatSelected}>
            <Ionicons name="chatbubbles-outline" size={48} color={APP_CONFIG.colors.textSecondary} />
            <Text style={styles.noChatText}>Select a chat to start messaging</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_CONFIG.colors.background,
  },
  chatListSection: {
    flex: 0.4,
    borderBottomWidth: 1,
    borderBottomColor: APP_CONFIG.colors.border,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: APP_CONFIG.colors.text,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: APP_CONFIG.colors.background,
  },
  chatList: {
    maxHeight: 120,
    paddingHorizontal: 10,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 5,
  },
  selectedChatItem: {
    backgroundColor: APP_CONFIG.colors.primary + '20',
  },
  chatIcon: {
    marginRight: 10,
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 14,
    fontWeight: '600',
    color: APP_CONFIG.colors.text,
  },
  memberCount: {
    fontSize: 12,
    color: APP_CONFIG.colors.textSecondary,
  },
  messagesSection: {
    flex: 0.6,
    paddingTop: 10,
  },
  chatHeader: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: APP_CONFIG.colors.border,
  },
  chatHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: APP_CONFIG.colors.text,
  },
  chatHeaderType: {
    fontSize: 12,
    color: APP_CONFIG.colors.textSecondary,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  messageContainer: {
    marginVertical: 5,
    padding: 10,
    borderRadius: 12,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: APP_CONFIG.colors.primary,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: APP_CONFIG.colors.surface,
    borderWidth: 1,
    borderColor: APP_CONFIG.colors.border,
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '600',
    color: APP_CONFIG.colors.primary,
    marginBottom: 3,
  },
  messageText: {
    fontSize: 14,
    color: APP_CONFIG.colors.text,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 10,
    color: APP_CONFIG.colors.textSecondary,
    marginTop: 3,
    alignSelf: 'flex-end',
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: APP_CONFIG.colors.border,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: APP_CONFIG.colors.border,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 80,
    fontSize: 14,
    color: APP_CONFIG.colors.text,
  },
  sendButton: {
    marginLeft: 10,
    padding: 10,
  },
  noChatSelected: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noChatText: {
    fontSize: 16,
    color: APP_CONFIG.colors.textSecondary,
    marginTop: 15,
  },
});

export default ChatPanel;
