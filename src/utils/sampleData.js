import { supabase } from '../services/supabase/client';

export const createSampleData = async () => {
  try {
    // Create sample world chat channels
    const { error: channelError } = await supabase
      .from('world_chat_channels')
      .upsert([
        {
          name: 'Tech Innovations',
          description: 'Discuss latest technology trends and innovations',
          is_active: true,
          member_count: 1250,
        },
        {
          name: 'Research Hub',
          description: 'Share and discuss research findings',
          is_active: true,
          member_count: 890,
        },
        {
          name: 'Startup Ideas',
          description: 'Pitch your startup ideas and get feedback',
          is_active: true,
          member_count: 2100,
        },
        {
          name: 'Design Thinking',
          description: 'Creative design discussions and critiques',
          is_active: true,
          member_count: 567,
        },
      ], { onConflict: 'name' });

    if (channelError) {
      console.error('Error creating sample channels:', channelError);
    } else {
      console.log('✅ Sample world chat channels created');
    }

    return { success: true };
  } catch (error) {
    console.error('Error creating sample data:', error);
    return { success: false, error: error.message };
  }
};
