// supa-auth.js
const { LocalAuth } = require('whatsapp-web.js');
const { createClient } = require('@supabase/supabase-js');

class SupaAuth extends LocalAuth {
  /**
   * @param {object} options
   * @param {string} [options.tableName] – Supabase table to store session blob
   * @param {string} [options.dataPath]  – Optional override of LocalAuth dataPath
   */
  constructor(options = {}) {
    super(options);

    if (!process.env.SUPA_URL || !process.env.SUPA_KEY) {
      throw new Error('Missing SUPA_URL or SUPA_KEY in environment');
    }

    this.supabase  = createClient(process.env.SUPA_URL, process.env.SUPA_KEY);
    this.tableName = options.tableName || 'whatsapp_sessions';
  }

  /** Ensure our sessions table exists via a Postgres RPC (or migrate yourself) */
  async beforeBrowserInitialized() {
    const { error } = await this.supabase
      .rpc('create_sessions_table_if_not_exists', { table_name: this.tableName });

    if (error && !error.message.includes('already exists')) {
      console.error('Error creating sessions table:', error);
    }

    return super.beforeBrowserInitialized();
  }

  /** Try local disk first; if no data, fall back to Supabase */
  async getAuthData() {
    try {
      const local = await super.getAuthData();
      if (local) return local;

      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('session_data')
        .eq('id', 'default')
        .single();

      if (error) {
        console.error('❌ SupaAuth.getAuthData error:', error);
        return null;
      }
      return data?.session_data || null;
    } catch (e) {
      console.error('❌ SupaAuth.getAuthData exception:', e);
      return null;
    }
  }

  /** Save to disk *and* upsert into Supabase */
  async saveAuthData(authData) {
    try {
      await super.saveAuthData(authData);

      const { error } = await this.supabase
        .from(this.tableName)
        .upsert({
          id:            'default',
          session_data:  authData,
          updated_at:    new Date().toISOString()
        });

      if (error) console.error('❌ SupaAuth.saveAuthData error:', error);
    } catch (e) {
      console.error('❌ SupaAuth.saveAuthData exception:', e);
    }
  }

  /** Remove from disk *and* delete the row in Supabase */
  async removeAuthData() {
    try {
      await super.removeAuthData();

      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', 'default');

      if (error) console.error('❌ SupaAuth.removeAuthData error:', error);
    } catch (e) {
      console.error('❌ SupaAuth.removeAuthData exception:', e);
    }
  }
}

module.exports = SupaAuth;
