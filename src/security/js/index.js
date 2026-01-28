/**
 * Security Module - Main entry point
 * 
 * Exports all security-related functionality for Natura
 */

export { SecureDexie } from './SecureDexie.js';
export { KeyManager } from './KeyManager.js';

/**
 * Initialize a secure database instance
 * 
 * @param {string} dbName - Database name
 * @param {string} password - Master password
 * @param {string} securityQuestion - Security question for recovery
 * @param {string} securityAnswer - Answer to security question
 * @returns {SecureDexie} - Secure database instance
 */
export async function createSecureDatabase(dbName, password, securityQuestion, securityAnswer) {
    const { SecureDexie } = await import('./SecureDexie.js');
    const db = new SecureDexie(dbName, password, securityQuestion, securityAnswer);
    await db.loadSecurityModule();
    return db;
}

/**
 * Password strength validator
 */
export function validatePasswordStrength(password) {
    const checks = {
        length: password.length >= 8,
        hasUpper: /[A-Z]/.test(password),
        hasLower: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const score = Object.values(checks).filter(Boolean).length;

    return {
        isValid: checks.length && checks.hasUpper && checks.hasLower && checks.hasNumber,
        score: score,
        checks: checks,
        strength: score < 3 ? 'weak' : score < 4 ? 'medium' : 'strong'
    };
}

/**
 * Generate a random secure password
 */
export function generateSecurePassword(length = 16) {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*';

    const allChars = uppercase + lowercase + numbers + special;
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);

    let password = '';

    // Ensure at least one of each type
    password += uppercase[array[0] % uppercase.length];
    password += lowercase[array[1] % lowercase.length];
    password += numbers[array[2] % numbers.length];
    password += special[array[3] % special.length];

    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
        password += allChars[array[i] % allChars.length];
    }

    // Shuffle
    return password.split('').sort(() => Math.random() - 0.5).join('');
}
