// Authentication System
class Auth {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.initializeTestUsers();
        this.initializeFromStorage();
    }

    // Initialize test users if none exist
    initializeTestUsers() {
        console.log('Auth: Initializing test users...');
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        console.log('Auth: Current users in storage:', users);
        
        if (users.length === 0) {
            console.log('Auth: No users found, creating test instructor...');
            // Create test instructor
            const testUser = {
                id: 'instructor_1',
                username: 'instructor@example.com',
                password: 'password123',
                role: 'instructor',
                permissions: ['manage_courses', 'view_students', 'manage_availability'],
                created: new Date().toISOString(),
                status: 'active'
            };
            users.push(testUser);
            localStorage.setItem('users', JSON.stringify(users));
            console.log('Auth: Test instructor created:', testUser);
        } else {
            console.log('Auth: Users already exist:', users);
        }
    }

    // Initialize from localStorage if session exists
    initializeFromStorage() {
        console.log('Initializing from storage...');
        const savedUser = localStorage.getItem('currentUser');
        const savedToken = localStorage.getItem('authToken');
        
        console.log('Saved user:', savedUser);
        console.log('Saved token:', savedToken);
        
        if (savedUser && savedToken) {
            this.currentUser = JSON.parse(savedUser);
            this.isAuthenticated = true;
            this.setupAuthenticatedState();
            console.log('Restored user session:', this.currentUser);
        } else {
            console.log('No saved session found');
        }
    }

    // Login handler
    async login(username, password) {
        console.log('Auth: Starting login process for:', username);
        try {
            // Get users from storage (in real system, this would be an API call)
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            console.log('Auth: Available users:', users);
            
            const user = users.find(u => u.username === username);
            console.log('Auth: Found user:', user);

            if (!user) {
                console.log('Auth: User not found');
                return {
                    success: false,
                    message: 'User not found'
                };
            }

            // Simple password check - no encryption in demo
            if (user.password === password) {
                console.log('Auth: Password match successful');
                this.currentUser = {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    permissions: user.permissions || []
                };

                // Generate simple token (in real system, use JWT)
                const token = 'token_' + Date.now();
                
                // Save to localStorage
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                localStorage.setItem('authToken', token);
                
                this.isAuthenticated = true;
                this.setupAuthenticatedState();
                console.log('Auth: Login successful, user:', this.currentUser);

                return {
                    success: true,
                    user: this.currentUser
                };
            }

            console.log('Auth: Password mismatch');
            return {
                success: false,
                message: 'Invalid credentials'
            };

        } catch (error) {
            console.error('Auth: Login error:', error);
            return {
                success: false,
                message: 'Login failed'
            };
        }
    }

    // Logout handler
    logout() {
        this.currentUser = null;
        this.isAuthenticated = false;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        this.clearAuthenticatedState();
    }

    // Get current user
    getCurrentUser() {
        console.log('Auth: Getting current user:', this.currentUser);
        return this.currentUser;
    }

    // Check if user has specific permission
    hasPermission(permission) {
        if (!this.currentUser || !this.currentUser.permissions) {
            return false;
        }
        return this.currentUser.permissions.includes(permission);
    }

    // Check if user has specific role
    hasRole(role) {
        console.log('Auth: Checking role:', { required: role, current: this.currentUser?.role });
        if (!this.currentUser) {
            console.log('Auth: No current user');
            return false;
        }
        const hasRole = this.currentUser.role === role;
        console.log('Auth: Role check result:', hasRole);
        return hasRole;
    }

    // Set up authenticated state
    setupAuthenticatedState() {
        // Update UI elements based on role
        document.body.classList.add('authenticated');
        document.body.classList.add(`role-${this.currentUser.role}`);
        
        // Dispatch auth event
        const event = new CustomEvent('authStateChanged', {
            detail: {
                authenticated: true,
                user: this.currentUser
            }
        });
        window.dispatchEvent(event);
    }

    // Clear authenticated state
    clearAuthenticatedState() {
        document.body.classList.remove('authenticated');
        if (this.currentUser) {
            document.body.classList.remove(`role-${this.currentUser.role}`);
        }
        
        // Dispatch auth event
        const event = new CustomEvent('authStateChanged', {
            detail: {
                authenticated: false,
                user: null
            }
        });
        window.dispatchEvent(event);
    }

    // Create new user
    async createUser(userData) {
        try {
            // Validate required fields
            if (!userData.username || !userData.role) {
                return {
                    success: false,
                    message: 'Missing required fields'
                };
            }

            // Get existing users
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            
            // Check if username already exists
            if (users.some(u => u.username === userData.username)) {
                return {
                    success: false,
                    message: 'Username already exists'
                };
            }

            // Create new user object
            const newUser = {
                id: 'user_' + Date.now(),
                username: userData.username,
                password: userData.password || 'default123', // Default password if not provided
                role: userData.role,
                permissions: userData.permissions || [],
                created: new Date().toISOString(),
                status: 'active'
            };

            // Add to users array
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));

            // Log user creation
            this.logActivity('user_created', newUser.id);

            return {
                success: true,
                user: newUser
            };

        } catch (error) {
            console.error('Create user error:', error);
            return {
                success: false,
                message: 'Failed to create user'
            };
        }
    }

    // Log activity
    logActivity(action, userId) {
        const logs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
        logs.push({
            timestamp: new Date().toISOString(),
            action,
            userId,
            performedBy: this.currentUser ? this.currentUser.id : 'system'
        });
        localStorage.setItem('activityLogs', JSON.stringify(logs));
    }
}

// Create and export a default instance
const auth = new Auth();
export default auth; 