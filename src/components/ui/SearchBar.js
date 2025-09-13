import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  FlatList,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { APP_CONFIG } from '../../constants/config';
import { supabase } from '../../services/supabase/client';

const SearchBar = ({ onUserSelect, onPostSearch }) => {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [searchType, setSearchType] = useState(null); // 'user' | 'post'

  useEffect(() => {
    if (searchText.length > 1) {
      performSearch();
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [searchText]);

  const performSearch = async () => {
    if (searchText.startsWith('@')) {
      // User search
      setSearchType('user');
      const query = searchText.substring(1);
      const { data, error } = await supabase
        .from('users')
        .select('id, username, display_name, avatar_url')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(10);
      
      if (!error) {
        setSearchResults(data);
        setShowResults(true);
      }
    } else if (searchText.startsWith('t/')) {
      // Post search
      setSearchType('post');
      const query = searchText.substring(2);
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id, title, content, created_at,
          users(username, display_name, avatar_url)
        `)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%,tags.cs.{${query}}`)
        .eq('is_deleted', false)
        .limit(10);
      
      if (!error) {
        setSearchResults(data);
        setShowResults(true);
      }
    } else {
      // General search (both users and posts)
      setSearchType('general');
      const [usersData, postsData] = await Promise.all([
        supabase
          .from('users')
          .select('id, username, display_name, avatar_url')
          .or(`username.ilike.%${searchText}%,display_name.ilike.%${searchText}%`)
          .limit(5),
        supabase
          .from('posts')
          .select(`
            id, title, content, created_at,
            users(username, display_name, avatar_url)
          `)
          .or(`title.ilike.%${searchText}%,content.ilike.%${searchText}%`)
          .eq('is_deleted', false)
          .limit(5)
      ]);

      const combinedResults = [
        ...(usersData.data || []).map(user => ({ ...user, type: 'user' })),
        ...(postsData.data || []).map(post => ({ ...post, type: 'post' }))
      ];
      
      setSearchResults(combinedResults);
      setShowResults(true);
    }
  };

  const handleResultPress = (result) => {
    if (result.type === 'user' || searchType === 'user') {
      onUserSelect && onUserSelect(result);
    } else {
      onPostSearch && onPostSearch(result);
    }
    setSearchText('');
    setShowResults(false);
    Keyboard.dismiss();
  };

  const renderSearchResult = ({ item }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleResultPress(item)}
    >
      <View style={styles.resultInfo}>
        <Text style={styles.resultTitle}>
          {item.type === 'user' || searchType === 'user' 
            ? `@${item.username}` 
            : item.title
          }
        </Text>
        <Text style={styles.resultSubtitle}>
          {item.type === 'user' || searchType === 'user'
            ? item.display_name
            : item.content.substring(0, 50) + '...'
          }
        </Text>
      </View>
      <Ionicons 
        name={item.type === 'user' || searchType === 'user' ? 'person-circle' : 'document-text'} 
        size={24} 
        color={APP_CONFIG.colors.textSecondary} 
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={APP_CONFIG.colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users (@username) or posts (t/topic)"
          placeholderTextColor={APP_CONFIG.colors.textSecondary}
          value={searchText}
          onChangeText={setSearchText}
          onFocus={() => setShowResults(true)}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={20} color={APP_CONFIG.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      
      {showResults && searchResults.length > 0 && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => `${item.type || 'item'}_${item.id}`}
            style={styles.resultsList}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: APP_CONFIG.colors.surface,
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: APP_CONFIG.colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: APP_CONFIG.colors.text,
  },
  resultsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: APP_CONFIG.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: APP_CONFIG.colors.border,
    marginTop: 5,
    maxHeight: 300,
  },
  resultsList: {
    paddingVertical: 5,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: APP_CONFIG.colors.border,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_CONFIG.colors.text,
  },
  resultSubtitle: {
    fontSize: 14,
    color: APP_CONFIG.colors.textSecondary,
    marginTop: 2,
  },
});

export default SearchBar;
