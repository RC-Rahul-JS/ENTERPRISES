import axios from 'axios';

const BASE_URL =
  import.meta.env.VITE_LOCALPRIME_URL ||
  'http://192.168.29.145:5000/badri_enterprises/localprime';

/**
 * Clean, non-duplicative API Service for Loan Operations
 * 
 * Endpoints:
 * - POST /loan-requests-approval/<request_id>  : Update loan approval status (Approve/Reject)
 * - POST /loan-requests/<request_id>           : Action/Update for a particular loan request
 * - GET  /loans                                : Get all approved loans
 * - GET  /loans/<loan_id>                      : Get particular approved loan details
 * - GET  /loan-requests                        : Get all loan requests
 * - POST /loan-requests                        : Submit new loan request
 */

const getHeaders = (customHeaders = {}) => ({
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
  ...customHeaders,
});

export const loanService = {
  /**
   * GET /loan-requests
   * Fetch all loan requests
   */
  getLoanRequests: async (params = {}) => {
    try {
      const res = await axios.get(`${BASE_URL}/loan-requests`, {
        params,
        headers: getHeaders(),
      });
      return Array.isArray(res.data)
        ? res.data
        : res.data?.data || res.data?.requests || [];
    } catch (error) {
      console.error('[loanService] getLoanRequests error:', error);
      throw error;
    }
  },

  /**
   * POST /loan-requests-approval/<request_id>
   * Update approval status for loan request (Approve/Reject)
   */
  updateLoanApproval: async (requestId, payload = {}) => {
    try {
      const url = `${BASE_URL}/loan-requests-approval/${requestId}`;
      console.log(`[loanService] POST ${url}`, payload);
      const res = await axios.post(url, payload, {
        headers: getHeaders(),
      });
      return res.data;
    } catch (error) {
      console.warn(
        '[loanService] POST /loan-requests-approval failed, trying fallback POST /loan-requests/...',
        error?.response?.status
      );
      // Fallback to POST /loan-requests/<request_id> if /loan-requests-approval returns 404
      if (error?.response?.status === 404 || error?.response?.status === 405) {
        const fallbackUrl = `${BASE_URL}/loan-requests/${requestId}`;
        const fallbackRes = await axios.post(fallbackUrl, payload, {
          headers: getHeaders(),
        });
        return fallbackRes.data;
      }
      throw error;
    }
  },

  /**
   * POST /loan-requests/<request_id>
   * Fetch details or update a particular loan request
   */
  updateParticularLoanRequest: async (requestId, payload = {}) => {
    try {
      const url = `${BASE_URL}/loan-requests/${requestId}`;
      console.log(`[loanService] POST ${url}`, payload);
      const res = await axios.post(url, payload, {
        headers: getHeaders(),
      });
      return res.data;
    } catch (error) {
      console.error(`[loanService] POST /loan-requests/${requestId} error:`, error);
      throw error;
    }
  },

  /**
   * GET /loans
   * Fetch all approved loans
   */
  getAllApprovedLoans: async (params = {}) => {
    try {
      const res = await axios.get(`${BASE_URL}/loans`, {
        params,
        headers: getHeaders(),
      });
      return Array.isArray(res.data)
        ? res.data
        : res.data?.data || res.data?.loans || [];
    } catch (error) {
      console.error('[loanService] getAllApprovedLoans error:', error);
      throw error;
    }
  },

  /**
   * GET /loans/<loan_id>
   * Fetch particular approved loan details by loan_id
   */
  getApprovedLoanById: async (loanId) => {
    try {
      const url = `${BASE_URL}/loans/${loanId}`;
      const res = await axios.get(url, {
        headers: getHeaders(),
      });
      return res.data?.data || res.data;
    } catch (error) {
      console.error(`[loanService] GET /loans/${loanId} error:`, error);
      throw error;
    }
  },

  /**
   * POST /loan-requests
   * Create / Submit new loan application
   */
  createLoanRequest: async (formDataPayload) => {
    try {
      const res = await axios.post(`${BASE_URL}/loan-requests`, formDataPayload, {
        headers: getHeaders({ 'Content-Type': 'multipart/form-data' }),
      });
      return res.data;
    } catch (error) {
      console.error('[loanService] createLoanRequest error:', error);
      throw error;
    }
  },
};

export default loanService;
