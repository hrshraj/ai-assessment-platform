// Security & Compliance Service
// Simulates Encryption, PII Masking, and Audit Logging

class SecurityService {
    constructor() {
        this.auditLog = JSON.parse(localStorage.getItem('security_audit_log') || '[]');
    }

    // Mock End-to-End Encryption (Base64 + Salt)
    encryptData(data) {
        const salt = 'skillrank-salt';
        const jsonString = JSON.stringify(data);
        return btoa(salt + jsonString);
    }

    // Mock Decryption
    decryptData(cipherText) {
        try {
            const salt = 'skillrank-salt';
            const decoded = atob(cipherText);
            const jsonString = decoded.replace(salt, '');
            return JSON.parse(jsonString);
        } catch (e) {
            console.error('Decryption failed', e);
            return null;
        }
    }

    // Data Masking for PII (Email, Phone)
    maskPII(text, type = 'email') {
        if (!text) return '';
        if (type === 'email') {
            const [local, domain] = text.split('@');
            if (!domain) return text;
            return `${local[0]}***@${domain}`;
        }
        if (type === 'phone') {
            return text.replace(/\d(?=\d{4})/g, '*'); // Mask all but last 4
        }
        return '****';
    }

    // Security Audit Logging
    logAudit(action, actor, target) {
        const logEntry = {
            id: Date.now(),
            timestamp: new Date().toLocaleString(),
            action: action, // e.g., 'VIEW_SNAPSHOTS', 'SHORTLIST_CANDIDATE'
            actor: actor,   // e.g., 'Recruiter: John'
            target: target, // e.g., 'Candidate: Alice'
            severity: action.includes('VIEW') ? 'LOW' : 'HIGH'
        };

        this.auditLog.unshift(logEntry);
        // Persist to local storage
        localStorage.setItem('security_audit_log', JSON.stringify(this.auditLog.slice(0, 50))); // Keep last 50
        console.log('[SECURITY AUDIT]', logEntry);
    }

    getAuditLogs() {
        return this.auditLog;
    }
}

export const securityService = new SecurityService();
