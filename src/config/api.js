/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║         CENTRAL API CONFIGURATION — CHANGE HERE ONLY    ║
 * ║  To change the server IP/URL, edit BASE_URL below ONLY  ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * Usage in any component:
 *   import { BASE_URL } from '../../config/api';
 *   fetch(`${BASE_URL}/your-endpoint`)
 */

// ✅ THE ONE URL TO RULE THEM ALL — change this and everything updates
export const BASE_URL =
  import.meta.env.VITE_LOCALPRIME_URL ||
  'https://api.care2connect.in/badri_enterprises';

// Aadhar OTP endpoint (separate service — do not change with BASE_URL)
export const AADHAR_OTP_URL =
  import.meta.env.VITE_AADHAR_OTP_URL ||
  'https://apipoultry.duniyape.in/api/aadhar';
