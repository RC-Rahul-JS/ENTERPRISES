import axios from 'axios';
import { BASE_URL } from '../config/api';

const getHeaders = (customHeaders = {}) => ({
  'ngrok-skip-browser-warning': 'true',
  ...customHeaders,
});

const memberService = {
  /**
   * POST /create-member-request
   * Submit a new member request (supports multipart/form-data for file uploads)
   */
  createMemberRequest: async (formData) => {
    try {
      const res = await axios.post(`${BASE_URL}/create-member-request`, formData, {
        headers: getHeaders({ 'Content-Type': 'multipart/form-data' }),
      });
      return res.data;
    } catch (error) {
      console.error('[memberService] createMemberRequest error:', error);
      throw error;
    }
  },

  /**
   * GET /member-requests
   * Fetch member requests. Optional filter by status (pending, approved, rejected)
   */
  getMemberRequests: async (status = '') => {
    try {
      const params = status ? { status } : {};
      const res = await axios.get(`${BASE_URL}/member-requests`, {
        headers: getHeaders(),
        params,
      });
      return res.data;
    } catch (error) {
      console.error('[memberService] getMemberRequests error:', error);
      throw error;
    }
  },

  /**
   * POST /update-member-request/<request_id>
   * Approve or reject a member request
   */
  updateMemberRequest: async (requestId, payload) => {
    try {
      const res = await axios.post(`${BASE_URL}/update-member-request/${requestId}`, payload, {
        headers: getHeaders(),
      });
      return res.data;
    } catch (error) {
      console.error('[memberService] updateMemberRequest error:', error);
      throw error;
    }
  },

  /**
   * GET /get-members
   * Fetch all approved members
   */
  getAllMembers: async () => {
    try {
      const res = await axios.get(`${BASE_URL}/get-members`, {
        headers: getHeaders(),
      });
      return res.data;
    } catch (error) {
      console.error('[memberService] getAllMembers error:', error);
      throw error;
    }
  },

  /**
   * GET /members?memberId=XYZ
   * Fetch single member by memberId or _id
   */
  getSingleMember: async (params) => {
    try {
      const res = await axios.get(`${BASE_URL}/members`, {
        headers: getHeaders(),
        params,
      });
      return res.data;
    } catch (error) {
      console.error('[memberService] getSingleMember error:', error);
      throw error;
    }
  },
};

export default memberService;
