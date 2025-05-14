// supa-auth.js
require('dotenv').config();
const { Client } = require('whatsapp-web.js');
const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPA_URL || !process.env.SUPA_KEY) {
  throw new Error('Missing SUPA_URL or SUPA_KEY in environment');
}

// Initialize Supabase client
const supabase = createClient(process.env.SUPA_URL, process.env.SUPA_KEY);

// Create a base auth strategy class
class BaseAuthStrategy {
  constructor() {}
  async beforeBrowserInitialized() {}
  async afterBrowserInitialized() {}
  async destroy() {}
  async logout() {}
  async saveState() {}
  async getState() {}
}

class SupaAuth extends BaseAuthStrategy {
  constructor() {
    super();
  }

  async beforeBrowserInitialized() {
    // No setup needed before browser initialization
  }

  async afterBrowserInitialized() {
    // No setup needed after browser initialization
  }

  async destroy() {
    // Clean up any resources if needed
  }

  async logout() {
    // Clean up session data on logout
    try {
      await supabase
        .from('wa_sessions')
        .delete()
        .eq('id', 'current');
      console.log('Session data cleared from Supabase');
    } catch (error) {
      console.error('Error clearing session data:', error);
    }
  }

  async saveState(state) {
    try {
      await supabase
        .from('wa_sessions')
        .upsert([{
          id: 'current',
          state: state,
          updated_at: new Date().toISOString()
        }]);
      console.log('Session state saved to Supabase');
    } catch (error) {
      console.error('Error saving session state:', error);
      throw error;
    }
  }

  async getState() {
    try {
      const { data, error } = await supabase
        .from('wa_sessions')
        .select('state')
        .eq('id', 'current')
        .single();

      if (error) {
        console.log('No existing session found');
        return null;
      }

      console.log('Session state retrieved from Supabase');
      return data.state;
    } catch (error) {
      console.error('Error retrieving session state:', error);
      return null;
    }
  }
}

module.exports = SupaAuth;
