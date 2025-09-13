import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { APP_CONFIG } from '../../constants/config';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../services/supabase/client';

const CreatePostScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableCategories, setAvailableCategories] = useState([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('interest_categories')
      .select('name')
      .order('name');
    
    if (!error) {
      setAvailableCategories(data.map(cat => cat.name));
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your post');
      return;
    }
    
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter content for your post');
      return;
    }

    setLoading(true);

    try {
      const tagsArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const { data, error } = await supabase
        .from('posts')
        .insert({
          title: title.trim(),
          content: content.trim(),
          tags: tagsArray,
          category: category || null,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      Alert.alert(
        'Success!', 
        'Your post has been created successfully',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.goBack() 
          }
        ]
      );
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderCategoryButton = (categoryName) => (
    <TouchableOpacity
      key={categoryName}
      style={[
        styles.categoryButton,
        category === categoryName && styles.selectedCategoryButton
      ]}
      onPress={() => setCategory(category === categoryName ? '' : categoryName)}
    >
      <Text style={[
        styles.categoryButtonText,
        category === categoryName && styles.selectedCategoryButtonText
      ]}>
        {categoryName}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={24} color={APP_CONFIG.colors.text} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Create Post</Text>
          
          <TouchableOpacity
            style={[
              styles.postButton,
              (!title.trim() || !content.trim() || loading) && styles.postButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!title.trim() || !content.trim() || loading}
          >
            <Text style={[
              styles.postButtonText,
              (!title.trim() || !content.trim() || loading) && styles.postButtonTextDisabled
            ]}>
              {loading ? 'Posting...' : 'Post'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {/* Title Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="What's your idea about?"
              placeholderTextColor={APP_CONFIG.colors.textSecondary}
              value={title}
              onChangeText={setTitle}
              maxLength={200}
              autoFocus
            />
            <Text style={styles.characterCount}>
              {title.length}/200
            </Text>
          </View>

          {/* Content Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Content</Text>
            <TextInput
              style={styles.contentInput}
              placeholder="Share your thoughts, research, or innovative ideas..."
              placeholderTextColor={APP_CONFIG.colors.textSecondary}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Category Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Category (Optional)</Text>
            <View style={styles.categoriesContainer}>
              {availableCategories.map(renderCategoryButton)}
            </View>
          </View>

          {/* Tags Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Tags (Optional)</Text>
            <TextInput
              style={styles.tagsInput}
              placeholder="Add tags separated by commas (e.g., innovation, tech, research)"
              placeholderTextColor={APP_CONFIG.colors.textSecondary}
              value={tags}
              onChangeText={setTags}
            />
            <Text style={styles.helperText}>
              Tags help others discover your post
            </Text>
          </View>

          {/* Preview Section */}
          {(title.trim() || content.trim()) && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>Preview</Text>
              <View style={styles.previewCard}>
                {title.trim() && (
                  <Text style={styles.previewTitle}>{title}</Text>
                )}
                {content.trim() && (
                  <Text style={styles.previewContent} numberOfLines={3}>
                    {content}
                  </Text>
                )}
                {category && (
                  <View style={styles.previewCategory}>
                    <Text style={styles.previewCategoryText}>{category}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: APP_CONFIG.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: APP_CONFIG.colors.border,
  },
  headerButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: APP_CONFIG.colors.text,
  },
  postButton: {
    backgroundColor: APP_CONFIG.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  postButtonDisabled: {
    backgroundColor: APP_CONFIG.colors.border,
  },
  postButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  postButtonTextDisabled: {
    color: APP_CONFIG.colors.textSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginVertical: 15,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_CONFIG.colors.text,
    marginBottom: 10,
  },
  titleInput: {
    fontSize: 18,
    color: APP_CONFIG.colors.text,
    borderBottomWidth: 2,
    borderBottomColor: APP_CONFIG.colors.primary,
    paddingVertical: 10,
    marginBottom: 5,
  },
  contentInput: {
    fontSize: 16,
    color: APP_CONFIG.colors.text,
    backgroundColor: APP_CONFIG.colors.surface,
    borderRadius: 12,
    padding: 15,
    minHeight: 120,
    borderWidth: 1,
    borderColor: APP_CONFIG.colors.border,
  },
  tagsInput: {
    fontSize: 16,
    color: APP_CONFIG.colors.text,
    backgroundColor: APP_CONFIG.colors.surface,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: APP_CONFIG.colors.border,
  },
  characterCount: {
    fontSize: 12,
    color: APP_CONFIG.colors.textSecondary,
    textAlign: 'right',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: APP_CONFIG.colors.border,
    backgroundColor: APP_CONFIG.colors.surface,
  },
  selectedCategoryButton: {
    backgroundColor: APP_CONFIG.colors.primary,
    borderColor: APP_CONFIG.colors.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    color: APP_CONFIG.colors.text,
  },
  selectedCategoryButtonText: {
    color: 'white',
  },
  helperText: {
    fontSize: 12,
    color: APP_CONFIG.colors.textSecondary,
    marginTop: 5,
  },
  previewContainer: {
    marginVertical: 20,
    marginBottom: 40,
  },
  previewLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: APP_CONFIG.colors.text,
    marginBottom: 10,
  },
  previewCard: {
    backgroundColor: APP_CONFIG.colors.surface,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: APP_CONFIG.colors.border,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: APP_CONFIG.colors.text,
    marginBottom: 8,
  },
  previewContent: {
    fontSize: 16,
    color: APP_CONFIG.colors.text,
    lineHeight: 22,
  },
  previewCategory: {
    alignSelf: 'flex-start',
    backgroundColor: APP_CONFIG.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 10,
  },
  previewCategoryText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
});

export default CreatePostScreen;
