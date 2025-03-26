// State Management System
class State {
    constructor() {
        this.state = {
            activePortal: null,
            currentUser: null,
            notifications: [],
            systemConfig: {},
            lastSync: null,
            isOnline: navigator.onLine
        };
        
        this.subscribers = new Map();
        this.syncQueue = [];
        
        // Initialize online/offline detection
        window.addEventListener('online', () => this.handleConnectivityChange(true));
        window.addEventListener('offline', () => this.handleConnectivityChange(false));
        
        // Start sync interval
        this.startSyncInterval();
    }
    
    // Get current state or a specific key
    getState(key = null) {
        if (key) {
            return this.state[key];
        }
        return { ...this.state };
    }
    
    // Update state
    setState(key, value) {
        const oldValue = this.state[key];
        this.state[key] = value;
        
        // Notify subscribers
        if (this.subscribers.has(key)) {
            this.subscribers.get(key).forEach(callback => {
                callback(value, oldValue);
            });
        }
        
        // Queue sync if needed
        if (this.shouldSync(key)) {
            this.queueSync({ key, value });
        }
    }
    
    // Subscribe to state changes
    subscribe(key, callback) {
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set());
        }
        this.subscribers.get(key).add(callback);
        
        // Return unsubscribe function
        return () => {
            const callbacks = this.subscribers.get(key);
            if (callbacks) {
                callbacks.delete(callback);
                if (callbacks.size === 0) {
                    this.subscribers.delete(key);
                }
            }
        };
    }
    
    // Add notification
    addNotification(notification) {
        const id = Date.now();
        const newNotification = {
            id,
            timestamp: new Date(),
            ...notification
        };
        
        this.state.notifications.push(newNotification);
        this.setState('notifications', [...this.state.notifications]);
        
        // Auto-remove after delay
        setTimeout(() => {
            this.removeNotification(id);
        }, 5000);
        
        return id;
    }
    
    // Remove notification
    removeNotification(id) {
        this.setState('notifications', 
            this.state.notifications.filter(n => n.id !== id)
        );
    }
    
    // Handle online/offline changes
    handleConnectivityChange(isOnline) {
        this.setState('isOnline', isOnline);
        
        if (isOnline) {
            this.processSyncQueue();
        }
    }
    
    // Determine if a state change needs syncing
    shouldSync(key) {
        const syncKeys = ['currentUser', 'systemConfig'];
        return syncKeys.includes(key);
    }
    
    // Queue a state change for syncing
    queueSync(change) {
        this.syncQueue.push({
            ...change,
            timestamp: Date.now()
        });
        
        if (this.state.isOnline) {
            this.processSyncQueue();
        }
    }
    
    // Process queued sync items
    async processSyncQueue() {
        if (!this.state.isOnline || this.syncQueue.length === 0) {
            return;
        }
        
        const items = [...this.syncQueue];
        this.syncQueue = [];
        
        try {
            // TODO: Implement actual sync with server
            // For now, just update lastSync
            this.setState('lastSync', new Date());
            
            // Log sync for debugging
            console.log('Synced items:', items);
        } catch (error) {
            // On failure, add items back to queue
            this.syncQueue.unshift(...items);
            console.error('Sync failed:', error);
            
            this.addNotification({
                type: 'error',
                message: 'Failed to sync with server'
            });
        }
    }
    
    // Start periodic sync
    startSyncInterval() {
        setInterval(() => {
            if (this.state.isOnline) {
                this.processSyncQueue();
            }
        }, 30000); // Sync every 30 seconds
    }
}

// Export singleton instance
export default new State(); 