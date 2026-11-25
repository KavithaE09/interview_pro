/**
 * InterviewPro Validation Helpers
 * Provides standardized email and phone number validation
 */

/**
 * Validates and normalizes an email address.
 * @param {string} email
 * @returns {{ isValid: boolean, message?: string, email?: string }}
 */
const validateEmail = (email) => {
  if (!email || typeof email !== 'string' || !email.trim()) {
    return { isValid: false, message: 'Email address is required.' };
  }
  const emailTrimmed = email.trim().toLowerCase();
  // RFC 5322 compatible practical regex requiring a valid domain and at least 2 char TLD
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(emailTrimmed)) {
    return { isValid: false, message: 'Please provide a valid email address (e.g. candidate@example.com).' };
  }
  return { isValid: true, email: emailTrimmed };
};

/**
 * Validates and normalizes a mobile phone number.
 * If optional (isRequired=false), an empty/whitespace input returns { isValid: true, phone: null }.
 * If provided, strips delimiters, handles +91/91/0 prefixes, and validates that the remaining
 * number is a standard 10-digit mobile number starting with 6, 7, 8, or 9.
 *
 * @param {string} phone
 * @param {boolean} isRequired
 * @returns {{ isValid: boolean, message?: string, phone?: string | null }}
 */
const validatePhone = (phone, isRequired = false) => {
  if (!phone || typeof phone !== 'string' || !phone.trim()) {
    if (isRequired) {
      return { isValid: false, message: 'Contact phone number is required.' };
    }
    return { isValid: true, phone: null };
  }

  // Remove whitespace, hyphens, parentheses, and dots
  let clean = phone.trim().replace(/[\s\-\(\)\.]/g, '');

  // Strip international prefix +91 or 91 (for 12 digits) or trunk prefix 0 (for 11 digits)
  if (clean.startsWith('+91')) {
    clean = clean.slice(3);
  } else if (clean.startsWith('91') && clean.length === 12) {
    clean = clean.slice(2);
  } else if (clean.startsWith('0') && clean.length === 11) {
    clean = clean.slice(1);
  }

  // Must be 10 digits starting with 6, 7, 8, or 9
  const phoneRegex = /^[6-9]\d{9}$/;
  if (!phoneRegex.test(clean)) {
    return {
      isValid: false,
      message: 'Please provide a valid 10-digit mobile number starting with 6, 7, 8, or 9 (e.g. 9876543210).'
    };
  }

  return { isValid: true, phone: clean };
};

module.exports = {
  validateEmail,
  validatePhone
};
