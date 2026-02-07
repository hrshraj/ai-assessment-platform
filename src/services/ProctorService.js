import AuthService from './AuthService';

const API_BASE_URL = 'https://ai-assessment-platform.onrender.com/api/proctor';

class ProctorService {
    constructor() {
        this.snapshots = [];
        this.events = [];
        this.logBuffer = [];
        this.startTime = Date.now();
        this.sequenceNumber = 0;
        this.flushInterval = null;
    }

    startAutoFlush(submissionId) {
        if (this.flushInterval) return;
        this.flushInterval = setInterval(() => this.flushLogs(submissionId), 30000); // Flush every 30s
    }

    stopAutoFlush() {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
            this.flushInterval = null;
        }
    }

    /**
     * Buffer log for batch submission
     */
    async sendLog(submissionId, logType, data) {
        const sequenceNumber = this.sequenceNumber++;

        const logEntry = {
            submissionId,
            logType,
            data, // Controller expects Base64 for SNAPSHOT, JSON string for others
            sequenceNumber
        };

        this.logBuffer.push(logEntry);
        console.log(`Proctor: Buffered ${logType} [seq: ${sequenceNumber}]`);

        // If buffer gets too large, flush immediately
        if (this.logBuffer.length >= 10) {
            await this.flushLogs(submissionId);
        }
    }

    async flushLogs(submissionId) {
        if (this.logBuffer.length === 0) return;

        const token = AuthService.getToken();
        const logsToSend = [...this.logBuffer];
        this.logBuffer = [];

        try {
            console.log(`Proctor: Flushing ${logsToSend.length} logs to batch-log`);
            const response = await fetch(`${API_BASE_URL}/batch-log`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(logsToSend)
            });

            if (!response.ok) {
                console.warn('Proctor batch-log failed', response.status);
                // Put back in buffer? Or just drop to avoid loops
            }
        } catch (error) {
            console.error('Proctor Batch Log Error:', error);
        }
    }

    // Local save for UI/Demo persistence
    saveSnapshot(imageSrc, reason = 'Routine Check') {
        const snapshot = {
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            image: imageSrc,
            reason: reason,
            timeOffset: Math.floor((Date.now() - this.startTime) / 1000)
        };
        this.snapshots.push(snapshot);
        localStorage.setItem('proctor_snapshots', JSON.stringify(this.snapshots));
    }

    saveReplay(events) {
        this.events = events;
        localStorage.setItem('proctor_replay', JSON.stringify(events));
    }

    getSnapshots() {
        return JSON.parse(localStorage.getItem('proctor_snapshots') || '[]');
    }

    getReplay() {
        return JSON.parse(localStorage.getItem('proctor_replay') || '[]');
    }

    clearData() {
        this.snapshots = [];
        this.events = [];
        this.sequenceNumber = 0;
        localStorage.removeItem('proctor_snapshots');
        localStorage.removeItem('proctor_replay');
    }
}

export const proctorService = new ProctorService();
