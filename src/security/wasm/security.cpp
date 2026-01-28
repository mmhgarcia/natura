#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <string>
#include <vector>
#include <cstring>
#include <random>
#include <stdexcept>

// Simple XOR-based encryption for demonstration
// In production, you would use a proper crypto library like libsodium
class SecurityModule {
private:
    // Generate a deterministic key from password using a simple hash
    std::vector<uint8_t> deriveKey(const std::string& password, const std::vector<uint8_t>& salt) {
        std::vector<uint8_t> key(32); // 256-bit key
        
        // Simple key derivation (in production, use PBKDF2 or Argon2)
        for (size_t i = 0; i < key.size(); i++) {
            uint8_t val = salt[i % salt.size()];
            for (size_t j = 0; j < password.length(); j++) {
                val ^= password[j];
                val = (val << 1) | (val >> 7); // Rotate left
            }
            key[i] = val;
        }
        
        return key;
    }
    
    // Generate random bytes
    std::vector<uint8_t> randomBytes(size_t length) {
        std::vector<uint8_t> bytes(length);
        std::random_device rd;
        std::mt19937 gen(rd());
        std::uniform_int_distribution<> dis(0, 255);
        
        for (size_t i = 0; i < length; i++) {
            bytes[i] = static_cast<uint8_t>(dis(gen));
        }
        
        return bytes;
    }
    
    // XOR encryption/decryption
    std::vector<uint8_t> xorCrypt(const std::vector<uint8_t>& data, const std::vector<uint8_t>& key) {
        std::vector<uint8_t> result(data.size());
        
        for (size_t i = 0; i < data.size(); i++) {
            result[i] = data[i] ^ key[i % key.size()];
        }
        
        return result;
    }
    
    // Convert bytes to hex string
    std::string toHex(const std::vector<uint8_t>& bytes) {
        const char* hex = "0123456789abcdef";
        std::string result;
        result.reserve(bytes.size() * 2);
        
        for (uint8_t byte : bytes) {
            result.push_back(hex[byte >> 4]);
            result.push_back(hex[byte & 0x0F]);
        }
        
        return result;
    }
    
    // Convert hex string to bytes
    std::vector<uint8_t> fromHex(const std::string& hex) {
        if (hex.length() % 2 != 0) {
            throw std::runtime_error("Invalid hex string");
        }
        
        std::vector<uint8_t> bytes;
        bytes.reserve(hex.length() / 2);
        
        for (size_t i = 0; i < hex.length(); i += 2) {
            uint8_t byte = 0;
            
            for (int j = 0; j < 2; j++) {
                char c = hex[i + j];
                byte <<= 4;
                
                if (c >= '0' && c <= '9') {
                    byte |= c - '0';
                } else if (c >= 'a' && c <= 'f') {
                    byte |= c - 'a' + 10;
                } else if (c >= 'A' && c <= 'F') {
                    byte |= c - 'A' + 10;
                } else {
                    throw std::runtime_error("Invalid hex character");
                }
            }
            
            bytes.push_back(byte);
        }
        
        return bytes;
    }

public:
    SecurityModule() {}
    
    // Encrypt data with password
    // Returns: salt(32 bytes) + encrypted_data in hex format
    std::string encrypt(const std::string& plaintext, const std::string& password) {
        if (password.empty()) {
            throw std::runtime_error("Password cannot be empty");
        }
        
        // Generate random salt
        std::vector<uint8_t> salt = randomBytes(32);
        
        // Derive key from password
        std::vector<uint8_t> key = deriveKey(password, salt);
        
        // Convert plaintext to bytes
        std::vector<uint8_t> data(plaintext.begin(), plaintext.end());
        
        // Encrypt
        std::vector<uint8_t> encrypted = xorCrypt(data, key);
        
        // Combine salt + encrypted data
        std::vector<uint8_t> result;
        result.reserve(salt.size() + encrypted.size());
        result.insert(result.end(), salt.begin(), salt.end());
        result.insert(result.end(), encrypted.begin(), encrypted.end());
        
        // Return as hex string
        return toHex(result);
    }
    
    // Decrypt data with password
    std::string decrypt(const std::string& encryptedHex, const std::string& password) {
        if (password.empty()) {
            throw std::runtime_error("Password cannot be empty");
        }
        
        // Convert hex to bytes
        std::vector<uint8_t> data = fromHex(encryptedHex);
        
        if (data.size() < 32) {
            throw std::runtime_error("Invalid encrypted data");
        }
        
        // Extract salt (first 32 bytes)
        std::vector<uint8_t> salt(data.begin(), data.begin() + 32);
        
        // Extract encrypted data
        std::vector<uint8_t> encrypted(data.begin() + 32, data.end());
        
        // Derive key from password
        std::vector<uint8_t> key = deriveKey(password, salt);
        
        // Decrypt
        std::vector<uint8_t> decrypted = xorCrypt(encrypted, key);
        
        // Convert to string
        return std::string(decrypted.begin(), decrypted.end());
    }
    
    // Generate a random password
    std::string generatePassword(int length) {
        if (length < 8) {
            length = 8;
        }
        
        const char* chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        std::vector<uint8_t> bytes = randomBytes(length);
        std::string password;
        password.reserve(length);
        
        size_t charLen = strlen(chars);
        for (uint8_t byte : bytes) {
            password.push_back(chars[byte % charLen]);
        }
        
        return password;
    }
    
    // Validate password strength
    bool isPasswordStrong(const std::string& password) {
        if (password.length() < 8) {
            return false;
        }
        
        bool hasUpper = false;
        bool hasLower = false;
        bool hasDigit = false;
        
        for (char c : password) {
            if (c >= 'A' && c <= 'Z') hasUpper = true;
            if (c >= 'a' && c <= 'z') hasLower = true;
            if (c >= '0' && c <= '9') hasDigit = true;
        }
        
        return hasUpper && hasLower && hasDigit;
    }
};

// Emscripten bindings
EMSCRIPTEN_BINDINGS(security_module) {
    emscripten::class_<SecurityModule>("SecurityModule")
        .constructor<>()
        .function("encrypt", &SecurityModule::encrypt)
        .function("decrypt", &SecurityModule::decrypt)
        .function("generatePassword", &SecurityModule::generatePassword)
        .function("isPasswordStrong", &SecurityModule::isPasswordStrong);
}
