/**
 * CORTEX API Service
 * Handles communication with the local OpenClaw backend.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'; // Default backend port

export const api = {
  /**
   * Fetch the current context vault state
   */
  getVault: async () => {
    try {
      const response = await fetch(`${BASE_URL}/vault/export`);
      if (!response.ok) throw new Error('Failed to fetch vault');
      const data = await response.json();
      const vault = data.vault;

      // Transform conflicts if they exist
      if (vault.conflicts && vault.conflicts.conflicts) {
        vault.realConflicts = vault.conflicts.conflicts.map(c => ({
          id: c.id,
          field: c.topic,
          severity: c.severity > 0.7 ? 'high' : c.severity > 0.4 ? 'medium' : 'low',
          aiA: c.beliefs[0]?.ai || 'AI A',
          aiB: c.beliefs[1]?.ai || 'AI B',
          valueA: c.beliefs[0]?.statement || '',
          valueB: c.beliefs[1]?.statement || '',
          suggestion: c.explanation || 'Review the conflict and choose the correct value.',
          status: c.status
        }));
      } else {
        vault.realConflicts = [];
      }

      return vault; 
    } catch (error) {
      console.warn('API Error: Falling back to mock data.', error);
      return null;
    }
  },

  /**
   * Save the current vault state
   */
  saveVault: async (vaultData) => {
    try {
      const response = await fetch(`${BASE_URL}/vault/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vaultData),
      });
      return response.ok;
    } catch (error) {
      console.error('API Error: Failed to save vault.', error);
      return false;
    }
  },

  /**
   * Resolve a specific conflict
   * @param {string} conflictId 
   * @param {string} resolutionValue 
   */
  resolveConflict: async (conflictId, resolutionValue) => {
    const response = await fetch(`${BASE_URL}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: conflictId, value: resolutionValue }),
    });
    return response.ok;
  },

  /**
   * Resolve all active conflicts simultaneously
   */
  resolveAll: async (resolutions) => {
    // resolutions = [{ id, value }, ...]
    const response = await fetch(`${BASE_URL}/resolve-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolutions }),
    });
    return response.ok;
  },

  /**
   * Fetch all stored conversations (metadata only)
   */
  getConversations: async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/conversations`);
      if (!response.ok) throw new Error('Failed to fetch conversations');
      const data = await response.json();
      return data.conversations || [];
    } catch (error) {
      console.warn('API Error: Failed to fetch conversations.', error);
      return [];
    }
  },

  /**
   * Fetch a single conversation with full content
   */
  getConversation: async (id) => {
    try {
      const response = await fetch(`${BASE_URL}/api/conversations/${id}`);
      if (!response.ok) throw new Error('Failed to fetch conversation');
      const data = await response.json();
      return data.conversation || null;
    } catch (error) {
      console.warn('API Error: Failed to fetch conversation.', error);
      return null;
    }
  },

  /**
   * Delete a stored conversation
   */
  deleteConversation: async (id) => {
    try {
      const response = await fetch(`${BASE_URL}/api/conversations/${id}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error('API Error: Failed to delete conversation.', error);
      return false;
    }
  },

  /**
   * Update the user's name in the soul.yaml vault
   */
  updateName: async (name) => {
    try {
      const response = await fetch(`${BASE_URL}/api/soul/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      return await response.json();
    } catch (error) {
      console.error('API Error: Failed to update name.', error);
      return { ok: false };
    }
  },
};
