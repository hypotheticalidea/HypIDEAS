import { supabase } from '../supabase/client';
import { INTEREST_KEYWORDS } from '../../constants/config';

export class AuthService {
  // Send OTP to phone
  static async sendPhoneOTP(phoneNumber) {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber,
      });

      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('Send OTP Error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to send OTP' 
      };
    }
  }

  // Verify OTP and complete registration/login
  static async verifyPhoneOTP(phoneNumber, otpCode, userData = null) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: otpCode,
        type: 'sms',
      });

      if (error) throw error;

      // If this is a new user registration with display name and interests
      if (userData && data.user) {
        await this.updateUserProfile(data.user.id, userData);
      }

      return { success: true, user: data.user, session: data.session };
    } catch (error) {
      console.error('Verify OTP Error:', error);
      return { 
        success: false, 
        error: error.message || 'Invalid OTP code' 
      };
    }
  }

  // Update user profile with display name and interests
  static async updateUserProfile(userId, userData) {
    try {
      const { displayName, interests } = userData;
      
      // Generate username based on interests
      const { data: usernameData, error: usernameError } = await supabase
        .rpc('generate_username_from_interests', { user_interests: interests });

      if (usernameError) throw usernameError;

      // Update user profile
      const { data, error } = await supabase
        .from('users')
        .update({
          display_name: displayName,
          interests: interests,
          username: usernameData
        })
        .eq('id', userId);

      if (error) throw error;

      return { success: true, username: usernameData };
    } catch (error) {
      console.error('Update Profile Error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to update profile' 
      };
    }
  }

  // Check if user exists - Updated to handle 406 errors
  static async checkUserExists(phoneNumber) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, display_name, username')
        .eq('phone', phoneNumber)
        .maybeSingle(); // Use maybeSingle() instead of single() to avoid 406 errors

      // Handle the case where no rows are found (not an error)
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return { 
        exists: !!data, 
        userData: data 
      };
    } catch (error) {
      console.error('Check User Error:', error);
      // If we get a 406 or other error, assume user doesn't exist
      return { exists: false };
    }
  }

  // Sign in with Google
  static async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('Google Sign In Error:', error);
      return { 
        success: false, 
        error: error.message || 'Google sign in failed' 
      };
    }
  }

  // Sign out
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Sign Out Error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to sign out' 
      };
    }
  }
}
