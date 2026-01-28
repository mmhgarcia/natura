/**
 * KeyManager - Manages encryption keys for SecureDexie
 * 
 * This class handles:
 * - Password validation
 * - Security questions for password recovery
 * - Key storage in memory (never persisted to disk)
 */

export class KeyManager {
    constructor() {
        this.masterPassword = null;
        this.securityQuestion = null;
        this.securityAnswer = null;
        this.isUnlocked = false;
    }

    /**
     * Initialize with password and security question
     * @param {string} password - Master password
     * @param {string} question - Security question
     * @param {string} answer - Answer to security question
     */
    async initialize(password, question, answer) {
        if (!password || password.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }

        if (!question || !answer) {
            throw new Error('Security question and answer are required');
        }

        this.masterPassword = password;
        this.securityQuestion = question;
        // Hash the answer for comparison (simple hash for demo)
        this.securityAnswer = this._simpleHash(answer.toLowerCase().trim());
        this.isUnlocked = true;

        // Store security question in localStorage (NOT the answer)
        localStorage.setItem('natura_security_question', question);

        return true;
    }

    /**
     * Unlock with password
     * @param {string} password - Password to verify
     */
    unlock(password) {
        if (!password) {
            throw new Error('Password is required');
        }

        // In a real app, you'd verify against a stored hash
        // For now, we just store it in memory
        this.masterPassword = password;
        this.isUnlocked = true;

        return true;
    }

    /**
     * Recover password using security question
     * @param {string} answer - Answer to security question
     * @returns {boolean} - True if answer is correct
     */
    recoverWithSecurityQuestion(answer) {
        if (!this.securityAnswer) {
            throw new Error('No security question configured');
        }

        const hashedAnswer = this._simpleHash(answer.toLowerCase().trim());

        if (hashedAnswer === this.securityAnswer) {
            this.isUnlocked = true;
            return true;
        }

        return false;
    }

    /**
     * Get the security question
     */
    getSecurityQuestion() {
        return this.securityQuestion || localStorage.getItem('natura_security_question');
    }

    /**
     * Get the master password (only if unlocked)
     */
    getPassword() {
        if (!this.isUnlocked) {
            throw new Error('KeyManager is locked. Please unlock first.');
        }

        return this.masterPassword;
    }

    /**
     * Lock the key manager (clear password from memory)
     */
    lock() {
        this.masterPassword = null;
        this.isUnlocked = false;
    }

    /**
     * Check if the key manager is unlocked
     */
    isReady() {
        return this.isUnlocked && this.masterPassword !== null;
    }

    /**
     * Change password
     * @param {string} oldPassword - Current password
     * @param {string} newPassword - New password
     */
    changePassword(oldPassword, newPassword) {
        if (this.masterPassword !== oldPassword) {
            throw new Error('Incorrect current password');
        }

        if (!newPassword || newPassword.length < 8) {
            throw new Error('New password must be at least 8 characters long');
        }

        this.masterPassword = newPassword;
        return true;
    }

    /**
     * Simple hash function (for demo purposes)
     * In production, use a proper hashing algorithm like SHA-256
     */
    _simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }

    /**
     * Clear all security data
     */
    reset() {
        this.masterPassword = null;
        this.securityQuestion = null;
        this.securityAnswer = null;
        this.isUnlocked = false;
        localStorage.removeItem('natura_security_question');
    }
}
