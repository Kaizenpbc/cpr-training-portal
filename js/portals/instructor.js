class InstructorPortal {
    constructor() {
        this.currentUser = null;
        this.confirmedCourses = [];
        this.confirmedDates = new Set();
    }

    async initialize() {
        try {
            this.currentUser = auth.getCurrentUser();
            if (!this.currentUser) {
                // Instead of redirecting, show login section
                const loginSection = document.getElementById('loginSection');
                if (loginSection) {
                    loginSection.style.display = 'block';
                }
                return;
            }

            // Update user info
            this.updateUserInfo();

            // Initialize all components
            this.initializeDashboard();
            this.initializeAvailability();
            this.initializeCourses();
            this.setupEventListeners();
        } catch (error) {
            console.error('Initialization error:', error);
            state.addNotification({
                type: 'error',
                message: 'Failed to initialize portal'
            });
            // Instead of redirecting, show login section
            const loginSection = document.getElementById('loginSection');
            if (loginSection) {
                loginSection.style.display = 'block';
            }
        }
    }

    // ... rest of the class implementation ...

    async handleLogout() {
        await auth.logout();
        // Instead of redirecting, show login section
        const loginSection = document.getElementById('loginSection');
        if (loginSection) {
            loginSection.style.display = 'block';
        }
    }

    checkPermissions() {
        if (!auth.hasRole('instructor')) {
            // Instead of redirecting, show login section
            const loginSection = document.getElementById('loginSection');
            if (loginSection) {
                loginSection.style.display = 'block';
            }
            return;
        }
        this.initialize();
    }
}

// Export singleton instance
const instructor = new InstructorPortal();
export default instructor; 