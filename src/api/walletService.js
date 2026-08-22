import axios from 'axios';
import { BASE_URL } from '../config/api';

const getHeaders = (customHeaders = {}) => ({
  'ngrok-skip-browser-warning': 'true',
  'Content-Type': 'application/json',
  ...customHeaders,
});

const walletService = {
  /**
   * POST /wallet/create
   * Create a new wallet for an agent
   */
  createWallet: async (payload) => {
    try {
      const res = await axios.post(`${BASE_URL}/wallet/create`, payload, {
        headers: getHeaders(),
      });
      return res.data;
    } catch (error) {
      console.error('[walletService] createWallet error:', error);
      throw error;
    }
  },

  /**
   * GET /wallet/list
   * Fetch wallets. Optional filter by agent_id, branch_id, status
   */
  getWallets: async (params = {}) => {
    try {
      const res = await axios.get(`${BASE_URL}/wallet/list`, {
        headers: getHeaders(),
        params,
      });
      return res.data;
    } catch (error) {
      console.error('[walletService] getWallets error:', error);
      throw error;
    }
  },

  /**
   * POST /wallet/withdraw
   * Withdraw money from credit wallet
   */
  walletWithdraw: async (payload) => {
    try {
      const res = await axios.post(`${BASE_URL}/wallet/withdraw`, payload, {
        headers: getHeaders(),
      });
      return res.data;
    } catch (error) {
      console.error('[walletService] walletWithdraw error:', error);
      throw error;
    }
  },
};

export default walletService;
