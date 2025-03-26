import auth from '../core/auth.js';
import db from '../core/database.js';
import state from '../core/state.js';

class SysAdminPortal {
    constructor() {
        this.initialize();
    }

    async initialize() {
        // Check permissions
        if (!auth.hasRole('sys_admin')) {
            window.location.href = '../login.html';
            return;
        }

        // Initialize components
        this.initializeDashboard();
        this.initializeUserManagement();
        this.initializeSystemConfig();
        this.initializeActivityLog();
        this.setupEventListeners();

        // Subscribe to state changes
        this.setupSubscriptions();
    }

    initializeDashboard() {
        this.updateSystemStatus();
        this.updateActiveUsers();
        this.updateAlerts();
    }

    async initializeUserManagement() {
        await this.loadUsers();
        this.setupUserModals();
    }

    initializeSystemConfig() {
        const config = state.getState('systemConfig');
        if (config) {
            document.getElementById('sessionTimeout').value = config.sessionTimeout || 30;
            document.getElementById('maxLoginAttempts').value = config.maxLoginAttempts || 5;
        }
    }

    async initializeActivityLog() {
        await this.loadActivityLog();
    }

    setupEventListeners() {
        // Form submissions
        document.getElementById('createUserForm').addEventListener('submit', this.handleCreateUser.bind(this));
        document.getElementById('systemConfigForm').addEventListener('submit', this.handleSystemConfig.bind(this));

        // Modal close buttons
        document.querySelectorAll('.modal .btn-secondary').forEach(button => {
            button.addEventListener('click', () => this.hideModal(button.closest('.modal').id));
        });

        // Close modals when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal')) {
                this.hideModal(event.target.id);
            }
        });
    }

    setupSubscriptions() {
        // Subscribe to system status changes
        state.subscribe('systemConfig', (newConfig) => {
            this.updateSystemStatus();
        });

        // Subscribe to user changes
        state.subscribe('currentUser', () => {
            this.updateUserInfo();
        });
    }

    updateSystemStatus() {
        const systemState = state.getState();
        const lastSyncElement = document.getElementById('lastSync');
        if (lastSyncElement) {
            lastSyncElement.textContent = systemState.lastSync 
                ? new Date(systemState.lastSync).toLocaleString()
                : 'Never';
        }
    }

    async updateActiveUsers() {
        const result = await db.read('users', { status: 'active' });
        const activeUsersElement = document.getElementById('activeUsers');
        if (activeUsersElement && result.success) {
            activeUsersElement.textContent = result.data.length;
        }
    }

    updateAlerts() {
        const alertsList = document.getElementById('alertsList');
        if (!alertsList) return;

        const alerts = state.getState('notifications')
            .filter(n => n.type === 'warning' || n.type === 'error')
            .slice(0, 5);

        alertsList.innerHTML = alerts.map(alert => `
            <div class="alert alert-${alert.type}">
                <small>${new Date(alert.timestamp).toLocaleString()}</small>
                <p>${alert.message}</p>
            </div>
        `).join('');
    }

    async loadUsers() {
        const result = await db.read('users');
        if (!result.success) return;

        const userList = document.getElementById('userList');
        if (!userList) return;

        userList.innerHTML = result.data.map(user => `
            <div class="user-item">
                <div>
                    <span class="status-indicator ${user.status === 'active' ? 'status-active' : 'status-inactive'}"></span>
                    ${user.username} (${user.role})
                </div>
                <div class="user-actions">
                    <button class="btn btn-sm btn-secondary" onclick="sysAdmin.editUser('${user.id}')">Edit</button>
                    <button class="btn btn-sm ${user.status === 'active' ? 'btn-danger' : 'btn-success'}" 
                            onclick="sysAdmin.toggleUserStatus('${user.id}')">
                        ${user.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                </div>
            </div>
        `).join('');
    }

    async loadActivityLog() {
        const result = await db.read('activityLogs');
        if (!result.success) return;

        const logElement = document.getElementById('activityLog');
        if (!logElement) return;

        logElement.innerHTML = result.data
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 50)
            .map(log => `
                <div class="log-item">
                    <small>${new Date(log.timestamp).toLocaleString()}</small>
                    <p>${log.action} - User: ${log.userId}</p>
                </div>
            `).join('');
    }

    setupUserModals() {
        // Create User Modal
        this.createUserModal = document.getElementById('createUserModal');
        this.createUserForm = document.getElementById('createUserForm');

        // System Config Modal
        this.systemConfigModal = document.getElementById('systemConfigModal');
        this.systemConfigForm = document.getElementById('systemConfigForm');
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async handleCreateUser(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const userData = {
            username: formData.get('username'),
            role: formData.get('role'),
            password: formData.get('password') || 'default123'
        };

        const result = await auth.createUser(userData);
        if (result.success) {
            this.hideModal('createUserModal');
            await this.loadUsers();
            state.addNotification({
                type: 'success',
                message: 'User created successfully'
            });
        } else {
            state.addNotification({
                type: 'error',
                message: result.message
            });
        }
    }

    async handleSystemConfig(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const config = {
            sessionTimeout: parseInt(formData.get('sessionTimeout')),
            maxLoginAttempts: parseInt(formData.get('maxLoginAttempts'))
        };

        state.setState('systemConfig', config);
        this.hideModal('systemConfigModal');
        state.addNotification({
            type: 'success',
            message: 'System configuration updated'
        });
    }

    async editUser(userId) {
        const result = await db.findOne('users', { id: userId });
        if (!result.success) return;

        const user = result.data;
        // TODO: Implement user editing modal
        console.log('Edit user:', user);
    }

    async toggleUserStatus(userId) {
        const result = await db.findOne('users', { id: userId });
        if (!result.success) return;

        const user = result.data;
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        
        const updateResult = await db.update('users', userId, { status: newStatus });
        if (updateResult.success) {
            await this.loadUsers();
            state.addNotification({
                type: 'success',
                message: `User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`
            });
        }
    }

    updateUserInfo() {
        const userInfo = document.getElementById('userInfo');
        if (!userInfo) return;

        const currentUser = state.getState('currentUser');
        if (currentUser) {
            userInfo.innerHTML = `
                <span>${currentUser.username}</span>
                <button class="btn btn-sm btn-secondary" onclick="sysAdmin.handleLogout()">Logout</button>
            `;
        }
    }

    async handleLogout() {
        await auth.logout();
        window.location.href = '../login.html';
    }
}

// Export singleton instance
const sysAdmin = new SysAdminPortal();
export default sysAdmin; 