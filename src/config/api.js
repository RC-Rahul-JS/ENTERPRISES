/**
 * Central API Configuration
 *
 * The base URL is stored ONCE in the .env file as VITE_LOCALPRIME_URL.
 * Import BASE_URL from this file in any component that needs it.
 *
 * Usage:
 *   import { BASE_URL } from '../../config/api';
 *   // or from any depth:
 *   import { BASE_URL } from '../config/api';
 */

// Full base URL for the LocalPrime API
// Defined in .env  →  VITE_LOCALPRIME_URL=http://192.168.29.8:5001/badri_enterprises/localprime
export const BASE_URL = import.meta.env.VITE_LOCALPRIME_URL;

// Top-level API URL (without /localprime)
// Defined in .env  →  VITE_API_URL=http://192.168.29.8:5001/badri_enterprises
export const API_URL = import.meta.env.VITE_API_URL;

// Raw server base (host only)
// Defined in .env  →  VITE_API_BASE_URL=http://192.168.29.8:5001
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Aadhar OTP endpoint
export const AADHAR_OTP_URL = import.meta.env.VITE_AADHAR_OTP_URL;
