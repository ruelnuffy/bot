const { LocalAuth } = require('whatsapp-web.js');
const { createClient } = require('@supabase/supabase-js');

/**
 * Custom auth strategy that uses Supabase for storing session data
 */
class SupaAuth extends LocalAuth {
  constructor(options = {}) {
    super(options);
    
    if (!process.env.SUPA_URL || !process.env.SUPA_KEY) {
      throw new Error('Missing SUPA_URL or SUPA_KEY in environment');
    }
    
    this.supabase = createClient(process.env.SUPA_URL, process.env.SUPA_KEY);
    this.tableName = options.tableName || 'whatsapp_sessions';
  }

  async beforeBrowserInitialized() {
    // Create the sessions table if it doesn't exist
    const { error } = await this.supabase.rpc('create_sessions_table_if_not_exists', {
      table_name: this.tableName
    });
    
    if (error && !error.message.includes('already exists')) {
      console.error('Error creating sessions table:', error);
    }
    
    return await super.beforeBrowserInitialized();
  }

  async getAuthData() {
    try {
      // First try the local implementation (faster)
      const localData = await super.getAuthData();
      if (localData) return localData;
      
      // If not available locally, try from Supabase
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('session_data')
        .eq('id', 'default')
        .single();
      
      if (error) {
        console.error('Error fetching auth data:', error);
        return null;
      }
      
      return data?.session_data || null;
    } catch (error) {
      return null;
    }
  }

  async saveAuthData(authData) {
    try {
      // Save locally first
      await super.saveAuthData(authData);
      
      // Then save to Supabase
      const { error } = await this.supabase
        .from(this.tableName)
        .upsert({ 
          id: 'default', 
          session_data: authData,
          updated_at: new Date()
        });
      
      if (error) {
        console.error('Error saving auth data:', error);
      }
    } catch (error) {
      console.error('Error in saveAuthData:', error);
    }
  }

  async removeAuthData() {
    try {
      // Remove locally first
      await super.removeAuthData();
      
      // Then remove from Supabase
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', 'default');
      
      if (error) {
        console.error('Error removing auth data:', error);
      }
    } catch (error) {
      console.error('Error in removeAuthData:', error);
    }
  }
}

module.exports = SupaAuth;