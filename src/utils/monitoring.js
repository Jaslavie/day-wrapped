/**
 * Monitor the memory usage of the browser
 * - Detect significant changes in memory usage
 * - Log the changes to the console
 */

import { cleanup } from './cleanup';

const MEMORY_THRESHOLD = 3500; // MB

export const MonitoringService = {
    lastUsage : {},

    async checkStorageUsage() {
        const currentUsage = await StorageManager.getStorageUsage();
        const totalMemoryMB = process.memoryUsage().heapUsed / 1024 / 1024;

        if (totalMemoryMB > MEMORY_THRESHOLD) {
            console.warn(`Memory usage critical: ${totalMemoryMB.toFixed(2)}MB`);
            await StorageManager.pruneStorage();
            cleanup.clearObject(this.lastUsage);
            
        }

        this.lastUsage = currentUsage;
        return currentUsage;
    },

    detectSignificantChanges(currentUsage) {
        const changes = [];

        for (const [key, size] of Object.entries(currentUsage)) {
            const prevSize = this.lastUsage[key] || '0 KB';
            const current = parseFloat(size);
            const previous = parseFloat(prevSize);
            
            if (current > previous * 1.5) { // 50% increase
                changes.push(`${key}: ${prevSize} -> ${size}`);
            }
        }
        return changes;
    }
};