// Database Management System
class Database {
    constructor() {
        this.initializeCollections();
    }

    // Initialize all required collections
    initializeCollections() {
        const collections = [
            'users',
            'courses',
            'organizations',
            'instructors',
            'students',
            'activityLogs',
            'supportTickets',
            'financialRecords'
        ];

        collections.forEach(collection => {
            if (!localStorage.getItem(collection)) {
                localStorage.setItem(collection, '[]');
            }
        });
    }

    // Generic CRUD operations
    async create(collection, data) {
        try {
            const items = JSON.parse(localStorage.getItem(collection) || '[]');
            const newItem = {
                ...data,
                id: `${collection}_${Date.now()}`,
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            };
            
            items.push(newItem);
            localStorage.setItem(collection, JSON.stringify(items));
            
            return {
                success: true,
                data: newItem
            };
        } catch (error) {
            console.error(`Create error in ${collection}:`, error);
            return {
                success: false,
                error: `Failed to create item in ${collection}`
            };
        }
    }

    async read(collection, query = null) {
        try {
            const items = JSON.parse(localStorage.getItem(collection) || '[]');
            
            if (!query) {
                return {
                    success: true,
                    data: items
                };
            }

            // Filter items based on query
            const filtered = items.filter(item => {
                return Object.entries(query).every(([key, value]) => {
                    if (typeof value === 'object' && value !== null) {
                        return JSON.stringify(item[key]) === JSON.stringify(value);
                    }
                    return item[key] === value;
                });
            });

            return {
                success: true,
                data: filtered
            };
        } catch (error) {
            console.error(`Read error in ${collection}:`, error);
            return {
                success: false,
                error: `Failed to read from ${collection}`
            };
        }
    }

    async update(collection, id, updates) {
        try {
            const items = JSON.parse(localStorage.getItem(collection) || '[]');
            const index = items.findIndex(item => item.id === id);
            
            if (index === -1) {
                return {
                    success: false,
                    error: 'Item not found'
                };
            }

            // Update item
            items[index] = {
                ...items[index],
                ...updates,
                updated: new Date().toISOString()
            };

            localStorage.setItem(collection, JSON.stringify(items));
            
            return {
                success: true,
                data: items[index]
            };
        } catch (error) {
            console.error(`Update error in ${collection}:`, error);
            return {
                success: false,
                error: `Failed to update item in ${collection}`
            };
        }
    }

    async delete(collection, id) {
        try {
            const items = JSON.parse(localStorage.getItem(collection) || '[]');
            const filtered = items.filter(item => item.id !== id);
            
            if (filtered.length === items.length) {
                return {
                    success: false,
                    error: 'Item not found'
                };
            }

            localStorage.setItem(collection, JSON.stringify(filtered));
            
            return {
                success: true
            };
        } catch (error) {
            console.error(`Delete error in ${collection}:`, error);
            return {
                success: false,
                error: `Failed to delete item from ${collection}`
            };
        }
    }

    // Specialized queries
    async findOne(collection, query) {
        const result = await this.read(collection, query);
        if (result.success && result.data.length > 0) {
            return {
                success: true,
                data: result.data[0]
            };
        }
        return {
            success: false,
            error: 'Item not found'
        };
    }

    async exists(collection, query) {
        const result = await this.read(collection, query);
        return {
            success: true,
            exists: result.success && result.data.length > 0
        };
    }

    // Backup and restore
    async backup() {
        try {
            const backup = {};
            const collections = [
                'users',
                'courses',
                'organizations',
                'instructors',
                'students',
                'activityLogs',
                'supportTickets',
                'financialRecords'
            ];

            collections.forEach(collection => {
                backup[collection] = JSON.parse(localStorage.getItem(collection) || '[]');
            });

            return {
                success: true,
                data: backup
            };
        } catch (error) {
            console.error('Backup error:', error);
            return {
                success: false,
                error: 'Failed to create backup'
            };
        }
    }

    async restore(backupData) {
        try {
            Object.entries(backupData).forEach(([collection, data]) => {
                localStorage.setItem(collection, JSON.stringify(data));
            });

            return {
                success: true
            };
        } catch (error) {
            console.error('Restore error:', error);
            return {
                success: false,
                error: 'Failed to restore backup'
            };
        }
    }
}

// Export database instance
const db = new Database();
export default db; 