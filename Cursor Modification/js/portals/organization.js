import auth from '../core/auth.js';
import db from '../core/database.js';
import state from '../core/state.js';

class OrganizationPortal {
    constructor() {
        this.initialize();
    }

    async initialize() {
        // Check permissions
        if (!auth.hasRole('organization')) {
            window.location.href = '../login.html';
            return;
        }

        // Initialize components
        this.initializeDashboard();
        this.initializeCourseManagement();
        this.initializeStudentManagement();
        this.setupEventListeners();

        // Subscribe to state changes
        this.setupSubscriptions();
    }

    initializeDashboard() {
        this.updateOrganizationStats();
        this.updateAlerts();
    }

    async initializeCourseManagement() {
        await this.loadRequestedCourses();
        this.setupCourseModals();
    }

    async initializeStudentManagement() {
        await this.loadStudents();
        this.setupStudentModals();
    }

    setupEventListeners() {
        // Form submissions
        document.getElementById('requestCourseForm').addEventListener('submit', this.handleRequestCourse.bind(this));
        document.getElementById('addStudentForm').addEventListener('submit', this.handleAddStudent.bind(this));

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
            this.updateOrganizationStats();
            this.loadRequestedCourses();
        });

        // Subscribe to student changes
        state.subscribe('students', () => {
            this.updateOrganizationStats();
            this.loadStudents();
        });

        // Subscribe to user changes
        state.subscribe('currentUser', () => {
            this.updateUserInfo();
        });
    }

    async updateOrganizationStats() {
        const currentUser = state.getState('currentUser');
        if (!currentUser) return;

        const result = await db.read('courses', { organizationId: currentUser.id });
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

    async loadRequestedCourses() {
        const currentUser = state.getState('currentUser');
        if (!currentUser) return;

        const result = await db.read('courses', { organizationId: currentUser.id });
        if (!result.success) return;

        const courseList = document.getElementById('courseList');
        if (!courseList) return;

        courseList.innerHTML = result.data.map(course => `
            <div class="course-item">
                <div class="course-info">
                    <h3>${course.title}</h3>
                    <p>Date: ${new Date(course.date).toLocaleDateString()}</p>
                    <p>Location: ${course.location}</p>
                    <p>Status: <span class="status-badge status-${course.status}">${course.status}</span></p>
                    <p>Students: ${course.enrolledStudents || 0}/${course.maxStudents}</p>
                </div>
                <div class="course-actions">
                    ${course.status === 'pending' ? `
                        <button class="btn btn-sm btn-danger" onclick="organization.cancelCourse('${course.id}')">Cancel Request</button>
                    ` : ''}
                    <button class="btn btn-sm btn-secondary" onclick="organization.viewCourseDetails('${course.id}')">View Details</button>
                </div>
            </div>
        `).join('');
    }

    async loadStudents() {
        const currentUser = state.getState('currentUser');
        if (!currentUser) return;

        const result = await db.read('students', { organizationId: currentUser.id });
        if (!result.success) return;

        const studentList = document.getElementById('studentList');
        if (!studentList) return;

        studentList.innerHTML = result.data.map(student => `
            <div class="student-item">
                <div class="student-info">
                    <h3>${student.name}</h3>
                    <p>Email: ${student.email}</p>
                    <p>Phone: ${student.phone}</p>
                    <p>Status: <span class="status-badge status-${student.status}">${student.status}</span></p>
                </div>
                <div class="student-actions">
                    <button class="btn btn-sm btn-secondary" onclick="organization.editStudent('${student.id}')">Edit</button>
                    <button class="btn btn-sm ${student.status === 'active' ? 'btn-danger' : 'btn-success'}" 
                            onclick="organization.toggleStudentStatus('${student.id}')">
                        ${student.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                </div>
            </div>
        `).join('');
    }

    setupCourseModals() {
        this.requestCourseModal = document.getElementById('requestCourseModal');
        this.requestCourseForm = document.getElementById('requestCourseForm');
    }

    setupStudentModals() {
        this.addStudentModal = document.getElementById('addStudentModal');
        this.addStudentForm = document.getElementById('addStudentForm');
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

    async handleRequestCourse(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const courseData = {
            title: formData.get('title'),
            date: formData.get('date'),
            location: formData.get('location'),
            maxStudents: parseInt(formData.get('maxStudents')),
            organizationId: state.getState('currentUser').id,
            status: 'pending'
        };

        const result = await db.create('courses', courseData);
        if (result.success) {
            this.hideModal('requestCourseModal');
            await this.loadRequestedCourses();
            state.addNotification({
                type: 'success',
                message: 'Course request submitted successfully'
            });
        } else {
            state.addNotification({
                type: 'error',
                message: result.message
            });
        }
    }

    async handleAddStudent(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const studentData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            organizationId: state.getState('currentUser').id,
            status: 'active'
        };

        const result = await db.create('students', studentData);
        if (result.success) {
            this.hideModal('addStudentModal');
            await this.loadStudents();
            state.addNotification({
                type: 'success',
                message: 'Student added successfully'
            });
        } else {
            state.addNotification({
                type: 'error',
                message: result.message
            });
        }
    }

    async cancelCourse(courseId) {
        const result = await db.update('courses', courseId, { status: 'cancelled' });
        if (result.success) {
            await this.loadRequestedCourses();
            state.addNotification({
                type: 'success',
                message: 'Course request cancelled successfully'
            });
        }
    }

    async viewCourseDetails(courseId) {
        const result = await db.findOne('courses', { id: courseId });
        if (!result.success) return;

        const course = result.data;
        // TODO: Implement course details modal
        console.log('View course details:', course);
    }

    async editStudent(studentId) {
        const result = await db.findOne('students', { id: studentId });
        if (!result.success) return;

        const student = result.data;
        // TODO: Implement student editing modal
        console.log('Edit student:', student);
    }

    async toggleStudentStatus(studentId) {
        const result = await db.findOne('students', { id: studentId });
        if (!result.success) return;

        const student = result.data;
        const newStatus = student.status === 'active' ? 'inactive' : 'active';
        
        const updateResult = await db.update('students', studentId, { status: newStatus });
        if (updateResult.success) {
            await this.loadStudents();
            state.addNotification({
                type: 'success',
                message: `Student ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`
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
                <button class="btn btn-sm btn-secondary" onclick="organization.handleLogout()">Logout</button>
            `;
        }
    }

    async handleLogout() {
        await auth.logout();
        window.location.href = '../login.html';
    }
}

// Export singleton instance
const organization = new OrganizationPortal();
export default organization; 