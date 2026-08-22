const fs = require('fs');
const path = require('path');

// 1. Copy CreateMember.jsx to Addmember.jsx
const src = 'c:/Users/pc/Desktop/badari/ENTERPRISES/src/pages/Loan/CreateMember.jsx';
const dest = 'C:/Users/pc/Desktop/agent/src/routes/Addmember.jsx';
let content = fs.readFileSync(src, 'utf8');
content = content.replace("import { useLoader } from '../../context/LoaderContext';", "import { useLoader } from '../loader/LoaderContext';");
content = content.replace("import { BASE_URL as localprimeBase } from '../../config/api';", "import { BASE_URL as localprimeBase } from '../config/api';");
fs.writeFileSync(dest, content);
console.log('Copied and modified Addmember.jsx');

// 2. Create .env
const envDest = 'C:/Users/pc/Desktop/agent/.env';
const envContent = `VITE_API_BASE_URL=http://192.168.29.9:5001
VITE_API_URL=http://192.168.29.9:5001/badri_enterprises
VITE_LOCALPRIME_URL=http://192.168.29.9:5001/badri_enterprises/localprime
VITE_AADHAR_OTP_URL=https://apipoultry.duniyape.in/api/aadhar
`;
fs.writeFileSync(envDest, envContent);
console.log('Created .env');

// 3. Create api.js
const apiDir = 'C:/Users/pc/Desktop/agent/src/config';
if (!fs.existsSync(apiDir)) {
  fs.mkdirSync(apiDir, { recursive: true });
}
const apiDest = path.join(apiDir, 'api.js');
const apiContent = `/**
 * Central API Configuration
 */
export const BASE_URL = import.meta.env.VITE_LOCALPRIME_URL;
export const API_URL = import.meta.env.VITE_API_URL;
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const AADHAR_OTP_URL = import.meta.env.VITE_AADHAR_OTP_URL;
`;
fs.writeFileSync(apiDest, apiContent);
console.log('Created api.js');
