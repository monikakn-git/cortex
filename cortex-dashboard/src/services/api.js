/**
 * CORTEX API Service
 * Handles communication with the local OpenClaw backend.
 */

const BASE_URL = 'http://localhost:8000'; // Default P1 backend port

export const api = {
  /**
   * Fetch the current context vault state
   */
  getVault: async () => {
    try {
      const response = await fetch(`${BASE_URL}/vault`);
      if (!response.ok) throw new Error('Failed to fetch vault');
      return await response.json();
    } catch (error) {
      console.warn('API Error: Falling back to mock data.', error);
      return null; // Let the component handle fallback
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
  }
};
