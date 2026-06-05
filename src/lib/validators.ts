export function isValidIndonesianPhone(v: string): boolean {
  const digits = v.replace(/[^0-9]/g, '');
  return digits.length >= 10 && digits.length <= 15 && /^(62|0)8[1-9]/.test(digits);
}

export function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
