/**
 * SecureDexie - Dexie wrapper with transparent encryption
 * 
 * This class extends Dexie to provide automatic encryption/decryption
 * of data before storing in IndexedDB.
 */

import Dexie from 'dexie';
import { KeyManager } from './KeyManager.js';

export class SecureDexie extends Dexie {
    constructor(databaseName, password, securityQuestion = null, securityAnswer = null) {
        super(databaseName);

        this.keyManager = new KeyManager();
        this.securityModule = null; // Will be loaded from WASM
        this.isWasmLoaded = false;

        // Initialize key manager
        if (securityQuestion && securityAnswer) {
            this.keyManager.initialize(password, securityQuestion, securityAnswer);
        } else {
            this.keyManager.unlock(password);
        }
    }

    /**
     * Load the WebAssembly security module
     */
    async loadSecurityModule() {
        if (this.isWasmLoaded) {
            return;
        }

        try {
            // Try to load WASM module
            const createSecurityModule = await import('/wasm/security.js');
            const module = await createSecurityModule.default();
            this.securityModule = new module.SecurityModule();
            this.isWasmLoaded = true;
            console.log('✅ Security module (WASM) loaded successfully');
        } catch (error) {
            console.warn('⚠️ WASM module not available, using JavaScript fallback');
            // Fallback to JavaScript implementation
            this.securityModule = new JavaScriptCryptoFallback();
            this.isWasmLoaded = true;
        }
    }

    /**
     * Encrypt data before storing
     */
    _encrypt(data) {
        if (!this.isWasmLoaded) {
            throw new Error('Security module not loaded. Call loadSecurityModule() first.');
        }

        const password = this.keyManager.getPassword();
        const jsonData = JSON.stringify(data);

        return this.securityModule.encrypt(jsonData, password);
    }

    /**
     * Decrypt data after retrieving
     */
    _decrypt(encryptedData) {
        if (!this.isWasmLoaded) {
            throw new Error('Security module not loaded. Call loadSecurityModule() first.');
        }

        const password = this.keyManager.getPassword();
        const decryptedJson = this.securityModule.decrypt(encryptedData, password);

        return JSON.parse(decryptedJson);
    }

    /**
     * Add encrypted data to a table
     */
    async secureAdd(tableName, data) {
        await this.loadSecurityModule();

        const encrypted = this._encrypt(data);

        return await this.table(tableName).add({
            _encrypted: encrypted,
            _isSecure: true,
            _timestamp: new Date().toISOString()
        });
    }

    /**
     * Get and decrypt data from a table
     */
    async secureGet(tableName, id) {
        await this.loadSecurityModule();

        const record = await this.table(tableName).get(id);

        if (!record) {
            return null;
        }

        if (record._isSecure) {
            return this._decrypt(record._encrypted);
        }

        return record;
    }

    /**
     * Get all records and decrypt them
     */
    async secureGetAll(tableName, filters = {}) {
        await this.loadSecurityModule();

        let query = this.table(tableName);

        // Apply filters
        for (const [key, value] of Object.entries(filters)) {
            if (key !== '_encrypted' && key !== '_isSecure') {
                query = query.where(key).equals(value);
            }
        }

        const records = await query.toArray();

        return records.map(record => {
            if (record._isSecure) {
                return this._decrypt(record._encrypted);
            }
            return record;
        });
    }

    /**
     * Update encrypted data
     */
    async securePut(tableName, data, id) {
        await this.loadSecurityModule();

        const encrypted = this._encrypt(data);

        return await this.table(tableName).put({
            id: id,
            _encrypted: encrypted,
            _isSecure: true,
            _timestamp: new Date().toISOString()
        });
    }

    /**
     * Delete encrypted data
     */
    async secureDelete(tableName, id) {
        return await this.table(tableName).delete(id);
    }

    /**
     * Change the encryption password
     * This will re-encrypt all data with the new password
     */
    async changePassword(oldPassword, newPassword, tableName) {
        await this.loadSecurityModule();

        // Verify old password
        if (this.keyManager.getPassword() !== oldPassword) {
            throw new Error('Incorrect current password');
        }

        // Get all encrypted records
        const records = await this.table(tableName).toArray();

        // Decrypt with old password
        const decryptedRecords = records.map(record => {
            if (record._isSecure) {
                return {
                    id: record.id,
                    data: this._decrypt(record._encrypted)
                };
            }
            return null;
        }).filter(r => r !== null);

        // Change password
        this.keyManager.changePassword(oldPassword, newPassword);

        // Re-encrypt with new password
        for (const record of decryptedRecords) {
            await this.securePut(tableName, record.data, record.id);
        }

        return true;
    }

    /**
     * Lock the database (clear password from memory)
     */
    lock() {
        this.keyManager.lock();
    }

    /**
     * Unlock the database with password
     */
    unlock(password) {
        this.keyManager.unlock(password);
    }
}

/**
 * JavaScript fallback for encryption when WASM is not available
 * Uses simple XOR encryption (for demo purposes)
 */
class JavaScriptCryptoFallback {
    encrypt(plaintext, password) {
        // Simple XOR encryption
        const salt = this._randomHex(32);
        const key = this._deriveKey(password, salt);
        const encrypted = this._xorEncrypt(plaintext, key);

        return salt + encrypted;
    }

    decrypt(encryptedHex, password) {
        const salt = encryptedHex.substring(0, 64);
        const encrypted = encryptedHex.substring(64);
        const key = this._deriveKey(password, salt);

        return this._xorDecrypt(encrypted, key);
    }

    _randomHex(bytes) {
        const array = new Uint8Array(bytes);
        crypto.getRandomValues(array);
        return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    }

    _deriveKey(password, salt) {
        let key = '';
        for (let i = 0; i < 32; i++) {
            let val = parseInt(salt.substring(i * 2, i * 2 + 2), 16);
            for (let j = 0; j < password.length; j++) {
                val ^= password.charCodeAt(j);
                val = ((val << 1) | (val >> 7)) & 0xFF;
            }
            key += val.toString(16).padStart(2, '0');
        }
        return key;
    }

    _xorEncrypt(text, key) {
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i);
            const keyByte = parseInt(key.substring((i * 2) % key.length, (i * 2) % key.length + 2), 16);
            const encrypted = charCode ^ keyByte;
            result += encrypted.toString(16).padStart(4, '0');
        }
        return result;
    }

    _xorDecrypt(encryptedHex, key) {
        let result = '';
        for (let i = 0; i < encryptedHex.length; i += 4) {
            const encrypted = parseInt(encryptedHex.substring(i, i + 4), 16);
            const keyByte = parseInt(key.substring((i / 2) % key.length, (i / 2) % key.length + 2), 16);
            const charCode = encrypted ^ keyByte;
            result += String.fromCharCode(charCode);
        }
        return result;
    }
}
