import axios from 'axios';
import { BASE_URL } from '../config/api';

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
 * - POST /loan-disbursement                    : Disburse a sanctioned loan
 * - POST /interest-posting                     : Post interest for a single loan
 * - GET  /interest-posting-list                : List loans due for interest on a date
 * - POST /interest-posting-batch               : Batch post interest for all loans on a date
 * - POST /generate-emi-due                     : Generate EMI due record
 * - POST /customer-payment                     : Receive a customer EMI payment
 * - POST /penalty-posting                      : Post penalty for a late EMI
 * - GET  /loan-closure-list                    : List loans eligible for closure
 * - GET  /emi-dues                             : Fetch EMI dues for a loan
 */

const getHeaders = (customHeaders = {}) => ({
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
  ...customHeaders,
});

export const loanService = {
  // ── Loan Requests ─────────────────────────────────────────────────────────
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

  // ── Loan Disbursement ─────────────────────────────────────────────────────
  /**
   * POST /loan-disbursement
   * Disburse a sanctioned loan
   */
  disburseLoan: async (payload) => {
    try {
      const res = await axios.post(`${BASE_URL}/loan-disbursement`, payload, {
        headers: getHeaders(),
      });
      return res.data;
    } catch (error) {
      console.error('[loanService] disburseLoan error:', error);
      throw error;
    }
  },

  // ── Interest Posting ──────────────────────────────────────────────────────
  /**
   * POST /interest-posting
   * Post interest for a single loan
   */
  postInterest: async (payload) => {
    try {
      const res = await axios.post(`${BASE_URL}/interest-posting`, payload, {
        headers: getHeaders(),
      });
      return res.data;
    } catch (error) {
      console.error('[loanService] postInterest error:', error);
      throw error;
    }
  },

  /**
   * GET /interest-posting-list?date=YYYY-MM-DD
   * List loans due for interest on a given date
   */
  getInterestPostingList: async (date) => {
    try {
      const res = await axios.get(`${BASE_URL}/interest-posting-list`, {
        params: { date },
        headers: getHeaders(),
      });
      return res.data;
    } catch (error) {
      console.error('[loanService] getInterestPostingList error:', error);
      throw error;
    }
  },

  /**
   * POST /interest-posting-batch
   * Batch post interest for all loans due on a date
   */
  postInterestBatch: async (payload) => {
    try {
      const res = await axios.post(`${BASE_URL}/interest-posting-batch`, payload, {
        headers: getHeaders(),
      });
      return res.data;
    } catch (error) {
      console.error('[loanService] postInterestBatch error:', error);
      throw error;
    }
  },

  // ── EMI Generation ────────────────────────────────────────────────────────
  /**
   * POST /generate-emi-due
   * Generate EMI due record for a loan
   */
  generateEmiDue: async (payload) => {
    try {
      const res = await axios.post(`${BASE_URL}/generate-emi-due`, payload, {
        headers: getHeaders(),
      });
      return res.data;
    } catch (error) {
      console.error('[loanService] generateEmiDue error:', error);
      throw error;
    }
  },

  /**
   * GET /emi-dues?loan_number=...
   * Fetch EMI due records for a loan
   */
  getEmiDues: async (loanNumber) => {
    try {
      const res = await axios.get(`${BASE_URL}/emi-dues`, {
        params: { loan_number: loanNumber },
        headers: getHeaders(),
      });
      return res.data?.data || res.data || [];
    } catch (error) {
      console.error('[loanService] getEmiDues error:', error);
      throw error;
    }
  },

  // ── Customer Statement ──────────────────────────────────────────────────
  /**
   * GET /customer-statement/<loan_number>
   * Fetch complete statement including EMI schedule and payment history
   */
  getCustomerStatement: async (loanNumber) => {
    try {
      const res = await axios.get(`${BASE_URL}/customer-statement/${loanNumber}`, {
        headers: getHeaders(),
      });
      return res.data;
    } catch (error) {
      console.error('[loanService] getCustomerStatement error:', error);
      throw error;
    }
  },

  // ── Customer Payment ──────────────────────────────────────────────────────
  /**
   * POST /customer-payment
   * Receive a customer EMI payment
   */
  receiveCustomerPayment: async (payload) => {
    try {
      const res = await axios.post(`${BASE_URL}/customer-payment`, payload, {
        headers: getHeaders(),
      });
      return res.data;
    } catch (error) {
      console.error('[loanService] receiveCustomerPayment error:', error);
      throw error;
    }
  },

  // ── Penalty Posting ───────────────────────────────────────────────────────
  /**
   * POST /penalty-posting
   * Post penalty for a late EMI
   */
  postPenalty: async (payload) => {
    try {
      const res = await axios.post(`${BASE_URL}/penalty-posting`, payload, {
        headers: getHeaders(),
      });
      return res.data;
    } catch (error) {
      console.error('[loanService] postPenalty error:', error);
      throw error;
    }
  },

  // ── Loan Closure ──────────────────────────────────────────────────────────
  /**
   * GET /loan-closure-list
   * List loans eligible for closure
   */
  getLoanClosureList: async () => {
    try {
      const res = await axios.get(`${BASE_URL}/loan-closure-list`, {
        headers: getHeaders(),
      });
      return res.data;
    } catch (error) {
      console.error('[loanService] getLoanClosureList error:', error);
      throw error;
    }
  },
};

export default loanService;
