import { Buffer } from 'buffer';

// Add Buffer to global scope for compatibility
global.Buffer = Buffer;

// Base64 utility functions using Buffer
export const base64ToArrayBuffer = (base64) => {
  return Buffer.from(base64, 'base64');
};

export const arrayBufferToBase64 = (buffer) => {
  return Buffer.from(buffer).toString('base64');
};

export const stringToBase64 = (str) => {
  return Buffer.from(str, 'utf-8').toString('base64');
};

export const base64ToString = (base64) => {
  return Buffer.from(base64, 'base64').toString('utf-8');
};
