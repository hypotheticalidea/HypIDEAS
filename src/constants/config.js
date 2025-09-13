export const SUPABASE_CONFIG = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://nqrcskbgrkiwulndkfgl.supabase.co',
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xcmNza2Jncmtpd3VsbmRrZmdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDA2NDMsImV4cCI6MjA3MzI3NjY0M30.g1-TSZeajRg3xNzBTcF4970WTSjJ7lGT4hvucyj4UUY'
};

export const APP_CONFIG = {
  name: process.env.EXPO_PUBLIC_APP_NAME || 'HypIDEAS',
  version: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
  environment: process.env.EXPO_PUBLIC_ENVIRONMENT || 'development',
  
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    text: '#000000',
    textSecondary: '#8E8E93',
    background: '#F2F2F7',
    surface: '#FFFFFF',
    border: '#E5E5EA',
  },
  
  layout: {
    feedWidth: 60, // 60% for feed on web
    chatWidth: 40, // 40% for chat on web
  }
};
