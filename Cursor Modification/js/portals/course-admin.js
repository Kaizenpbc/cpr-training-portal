import auth from '../core/auth.js';
import db from '../core/database.js';
import state from '../core/state.js';

class CourseAdminPortal {
    constructor() {
        this.initialize();
    }

    async initialize() {
        // Check permissions
        if (!auth.hasRole('course_admin')) {
            window.location.href = '../login.html';
            return;
        }

        // Initialize components
        this.initializeDashboard();
        this.initializeCourseManagement();
        this.initializeInstructorManagement();
        this.setupEventListeners();

        // Subscribe to state changes
        this.setupSubscriptions();
    }

    initializeDashboard() {
        this.updateCourseStats();
        this.updateInstructorStats();
        this.updateAlerts();
    }

    async initializeCourseManagement() {
        await this.loadCourses();
        this.setupCourseModals();
    }

    async initializeInstructorManagement() {
        await this.loadInstructors();
        this.setupInstructorModals();
    }

    setupEventListeners() {
        // Form submissions
        document.getElementById('createCourseForm').addEventListener('submit', this.handleCreateCourse.bind(this));
        document.getElementById('createInstructorForm').addEventListener('submit', this.handleCreateInstructor.bind(this));

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
        // Subscribe to course changes
        state.subscribe('courses', () => {
            this.updateCourseStats();
            this.loadCourses();
        });

        // Subscribe to instructor changes
        state.subscribe('instructors', () => {
            this.updateInstructorStats();
            this.loadInstructors();
        });

        // Subscribe to user changes
        state.subscribe('currentUser', () => {
            this.updateUserInfo();
        });
    }

    async updateCourseStats() {
        const result = await db.read('courses');
        if (!result.success) return;

        const courses = result.data;
        const stats = {
            total: courses.length,
            active: courses.filter(c => c.status === 'active').length,
            pending: courses.filter(c => c.status === 'pending').length,
            completed: courses.filter(c => c.status === 'completed').length
        };

        // Update dashboard stats
        document.getElementById('totalCourses').textContent = stats.total;
        document.getElementById('activeCourses').textContent = stats.active;
        document.getElementById('pendingCourses').textContent = stats.pending;
        document.getElementById('completedCourses').textContent = stats.completed;
    }

    async updateInstructorStats() {
        const result = await db.read('users', { role: 'instructor' });
        if (!result.success) return;

        const instructors = result.data;
        const stats = {
            total: instructors.length,
            active: instructors.filter(i => i.status === 'active').length,
            available: instructors.filter(i => i.status === 'active' && i.availability === 'available').length
        };

        // Update dashboard stats
        document.getElementById('totalInstructors').textContent = stats.total;
        document.getElementById('activeInstructors').textContent = stats.active;
        document.getElementById('availableInstructors').textContent = stats.available;
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

    async loadCourses() {
        const result = await db.read('courses');
        if (!result.success) return;

        const courseList = document.getElementById('courseList');
        if (!courseList) return;

        courseList.innerHTML = result.data.map(course => `
            <div class="course-item">
                <div class="course-info">
                    <h3>${course.title}</h3>
                    <p>Date: ${new Date(course.date).toLocaleDateString()}</p>
                    <p>Location: ${course.location}</p>
                    <p>Instructor: ${course.instructorName || 'Not Assigned'}</p>
                    <p>Status: <span class="status-badge status-${course.status}">${course.status}</span></p>
                </div>
                <div class="course-actions">
                    <button class="btn btn-sm btn-secondary" onclick="courseAdmin.editCourse('${course.id}')">Edit</button>
                    <button class="btn btn-sm ${course.status === 'active' ? 'btn-danger' : 'btn-success'}" 
                            onclick="courseAdmin.toggleCourseStatus('${course.id}')">
                        ${course.status === 'active' ? 'Cancel' : 'Activate'}
                    </button>
                </div>
            </div>
        `).join('');
    }

    async loadInstructors() {
        const result = await db.read('users', { role: 'instructor' });
        if (!result.success) return;

        const instructorList = document.getElementById('instructorList');
        if (!instructorList) return;

        instructorList.innerHTML = result.data.map(instructor => `
            <div class="instructor-item">
                <div class="instructor-info">
                    <h3>${instructor.name}</h3>
                    <p>Status: <span class="status-badge status-${instructor.status}">${instructor.status}</span></p>
                    <p>Availability: <span class="status-badge status-${instructor.availability}">${instructor.availability}</span></p>
                    <p>Courses Assigned: ${instructor.coursesAssigned || 0}</p>
                </div>
                <div class="instructor-actions">
                    <button class="btn btn-sm btn-secondary" onclick="courseAdmin.editInstructor('${instructor.id}')">Edit</button>
                    <button class="btn btn-sm ${instructor.status === 'active' ? 'btn-danger' : 'btn-success'}" 
                            onclick="courseAdmin.toggleInstructorStatus('${instructor.id}')">
                        ${instructor.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                </div>
            </div>
        `).join('');
    }

    setupCourseModals() {
        this.createCourseModal = document.getElementById('createCourseModal');
        this.createCourseForm = document.getElementById('createCourseForm');
    }

    setupInstructorModals() {
        this.createInstructorModal = document.getElementById('createInstructorModal');
        this.createInstructorForm = document.getElementById('createInstructorForm');
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

    async handleCreateCourse(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const courseData = {
            title: formData.get('title'),
            date: formData.get('date'),
            location: formData.get('location'),
            maxStudents: parseInt(formData.get('maxStudents')),
            instructorId: formData.get('instructorId'),
            status: 'pending'
        };

        const result = await db.create('courses', courseData);
        if (result.success) {
            this.hideModal('createCourseModal');
            await this.loadCourses();
            state.addNotification({
                type: 'success',
                message: 'Course created successfully'
            });
        } else {
            state.addNotification({
                type: 'error',
                message: result.message
            });
        }
    }

    async handleCreateInstructor(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const instructorData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            role: 'instructor',
            status: 'active',
            availability: 'available'
        };

        const result = await auth.createUser(instructorData);
        if (result.success) {
            this.hideModal('createInstructorModal');
            await this.loadInstructors();
            state.addNotification({
                type: 'success',
                message: 'Instructor created successfully'
            });
        } else {
            state.addNotification({
                type: 'error',
                message: result.message
            });
        }
    }

    async editCourse(courseId) {
        const result = await db.findOne('courses', { id: courseId });
        if (!result.success) return;

        const course = result.data;
        // TODO: Implement course editing modal
        console.log('Edit course:', course);
    }

    async toggleCourseStatus(courseId) {
        const result = await db.findOne('courses', { id: courseId });
        if (!result.success) return;

        const course = result.data;
        const newStatus = course.status === 'active' ? 'cancelled' : 'active';
        
        const updateResult = await db.update('courses', courseId, { status: newStatus });
        if (updateResult.success) {
            await this.loadCourses();
            state.addNotification({
                type: 'success',
                message: `Course ${newStatus === 'active' ? 'activated' : 'cancelled'} successfully`
            });
        }
    }

    async editInstructor(instructorId) {
        const result = await db.findOne('users', { id: instructorId });
        if (!result.success) return;

        const instructor = result.data;
        // TODO: Implement instructor editing modal
        console.log('Edit instructor:', instructor);
    }

    async toggleInstructorStatus(instructorId) {
        const result = await db.findOne('users', { id: instructorId });
        if (!result.success) return;

        const instructor = result.data;
        const newStatus = instructor.status === 'active' ? 'inactive' : 'active';
        
        const updateResult = await db.update('users', instructorId, { status: newStatus });
        if (updateResult.success) {
            await this.loadInstructors();
            state.addNotification({
                type: 'success',
                message: `Instructor ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`
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
                <button class="btn btn-sm btn-secondary" onclick="courseAdmin.handleLogout()">Logout</button>
            `;
        }
    }

    async handleLogout() {
        await auth.logout();
        window.location.href = '../login.html';
    }
}

// Export singleton instance
const courseAdmin = new CourseAdminPortal();
export default courseAdmin; 