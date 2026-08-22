import axios from 'axios';
import { BASE_URL } from '../config/api';

const getHeaders = (customHeaders = {}) => ({
  'ngrok-skip-browser-warning': 'true',
  'Content-Type': 'application/json',
  ...customHeaders,
});

const agentService = {
  /**
   * POST /agent-requests
   * Submit a new agent promotion request
   */
  createAgentRequest: async (payload) => {
    try {
      const res = await axios.post(`${BASE_URL}/agent-requests`, payload, {
        headers: getHeaders(),
      });
      return res.data;
    } catch (error) {
      console.error('[agentService] createAgentRequest error:', error);
      throw error;
    }
  },

  /**
   * GET /agent-requests
   * Fetch agent requests. Optional filter by status, member_id, branch_id
   */
  getAgentRequests: async (params = {}) => {
    try {
      const res = await axios.get(`${BASE_URL}/agent-requests`, {
        headers: getHeaders(),
        params,
      });
      return res.data;
    } catch (error) {
      console.error('[agentService] getAgentRequests error:', error);
      throw error;
    }
  },

  /**
   * POST /agent-requests/<request_id>
   * Approve or reject an agent request
   */
  updateAgentRequest: async (requestId, payload) => {
    try {
      const res = await axios.post(`${BASE_URL}/agent-requests/${requestId}`, payload, {
        headers: getHeaders(),
      });
      return res.data;
    } catch (error) {
      console.error('[agentService] updateAgentRequest error:', error);
      throw error;
    }
  },

  /**
   * GET /agents
   * Fetch active agents. Optional filter by branchCode, status, agentCode
   */
  getAgents: async (params = {}) => {
    try {
      const res = await axios.get(`${BASE_URL}/agents`, {
        headers: getHeaders(),
        params,
      });
      return res.data;
    } catch (error) {
      console.error('[agentService] getAgents error:', error);
      throw error;
    }
  },

  /**
   * POST /agent/change-password
   */
  changePassword: async (payload) => {
    try {
      const res = await axios.post(`${BASE_URL}/agent/change-password`, payload, {
        headers: getHeaders(),
      });
      return res.data;
    } catch (error) {
      console.error('[agentService] changePassword error:', error);
      throw error;
    }
  },

  /**
   * POST /agent/login
   */
  login: async (payload) => {
    try {
      const res = await axios.post(`${BASE_URL}/agent/login`, payload, {
        headers: getHeaders(),
      });
      return res.data;
    } catch (error) {
      console.error('[agentService] login error:', error);
      throw error;
    }
  },
};

export default agentService;
