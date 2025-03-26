import auth from '../core/auth.js';
import db from '../core/database.js';
import state from '../core/state.js';

class StudentPortal {
    constructor() {
        this.initialize();
        this.filters = {
            search: '',
            type: 'all',
            difficulty: 'all',
            dateRange: 'all'
        };
        this.achievements = [
            { id: 'first_course', icon: 'fa-graduation-cap', title: 'First Course', description: 'Completed your first course' },
            { id: 'perfect_attendance', icon: 'fa-calendar-check', title: 'Perfect Attendance', description: 'Attended all sessions in a course' },
            { id: 'quick_learner', icon: 'fa-bolt', title: 'Quick Learner', description: 'Completed a course ahead of schedule' },
            { id: 'course_master', icon: 'fa-crown', title: 'Course Master', description: 'Completed 5 courses' },
            { id: 'helpful_student', icon: 'fa-hands-helping', title: 'Helpful Student', description: 'Helped other students in discussions' }
        ];
    }

    async initialize() {
        // Check permissions
        if (!auth.hasRole('student')) {
            window.location.href = '../login.html';
            return;
        }

        // Initialize components
        this.initializeDashboard();
        this.initializeCourseManagement();
        this.setupEventListeners();
        this.initializeCalendar();

        // Subscribe to state changes
        this.setupSubscriptions();

        // Initialize progress dashboard
        this.initializeProgressDashboard();
    }

    initializeDashboard() {
        this.updateStudentStats();
        this.updateAlerts();
    }

    async initializeCourseManagement() {
        await this.loadEnrolledCourses();
        await this.loadAvailableCourses();
        this.setupCourseModals();
        this.setupSearchAndFilters();
    }

    setupEventListeners() {
        // Form submissions
        document.getElementById('enrollCourseForm').addEventListener('submit', this.handleEnrollCourse.bind(this));

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

        // Search and filter listeners
        document.getElementById('courseSearch').addEventListener('input', (e) => {
            this.filters.search = e.target.value.toLowerCase();
            this.applyFilters();
        });

        document.getElementById('courseType').addEventListener('change', (e) => {
            this.filters.type = e.target.value;
            this.applyFilters();
        });

        document.getElementById('difficultyLevel').addEventListener('change', (e) => {
            this.filters.difficulty = e.target.value;
            this.applyFilters();
        });

        document.getElementById('dateRange').addEventListener('change', (e) => {
            this.filters.dateRange = e.target.value;
            this.applyFilters();
        });
    }

    setupSubscriptions() {
        // Subscribe to course changes
        state.subscribe('courses', () => {
            this.updateStudentStats();
            this.loadEnrolledCourses();
        });

        // Subscribe to user changes
        state.subscribe('currentUser', () => {
            this.updateUserInfo();
        });
    }

    async updateStudentStats() {
        const currentUser = state.getState('currentUser');
        if (!currentUser) return;

        const result = await db.read('enrollments', { studentId: currentUser.id });
        if (!result.success) return;

        const enrollments = result.data;
        const stats = {
            total: enrollments.length,
            active: enrollments.filter(e => e.status === 'active').length,
            completed: enrollments.filter(e => e.status === 'completed').length,
            upcoming: enrollments.filter(e => e.status === 'upcoming').length
        };

        // Update dashboard stats
        document.getElementById('totalEnrollments').textContent = stats.total;
        document.getElementById('activeCourses').textContent = stats.active;
        document.getElementById('completedCourses').textContent = stats.completed;
        document.getElementById('upcomingCourses').textContent = stats.upcoming;
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

    async loadEnrolledCourses() {
        const currentUser = state.getState('currentUser');
        if (!currentUser) return;

        const result = await db.read('enrollments', { studentId: currentUser.id });
        if (!result.success) return;

        const courseList = document.getElementById('courseList');
        if (!courseList) return;

        courseList.innerHTML = result.data.map(enrollment => `
            <div class="course-item">
                <div class="course-info">
                    <h3>${enrollment.course.title}</h3>
                    <p>Date: ${new Date(enrollment.course.date).toLocaleDateString()}</p>
                    <p>Location: ${enrollment.course.location}</p>
                    <p>Status: <span class="status-badge status-${enrollment.status}">${enrollment.status}</span></p>
                    <p>Progress: ${enrollment.progress || 0}%</p>
                </div>
                <div class="course-actions">
                    <button class="btn btn-sm btn-primary" onclick="student.viewCourseMaterials('${enrollment.course.id}')">View Materials</button>
                    ${enrollment.status === 'active' ? `
                        <button class="btn btn-sm btn-secondary" onclick="student.updateProgress('${enrollment.id}')">Update Progress</button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    async loadAvailableCourses() {
        const currentUser = state.getState('currentUser');
        if (!currentUser) return;

        // Get all active courses
        const coursesResult = await db.read('courses', { status: 'active' });
        if (!coursesResult.success) return;

        // Get student's current enrollments
        const enrollmentsResult = await db.read('enrollments', { studentId: currentUser.id });
        if (!enrollmentsResult.success) return;

        const enrolledCourseIds = enrollmentsResult.data.map(e => e.courseId);
        
        // Filter out courses the student is already enrolled in
        const availableCourses = coursesResult.data.filter(course => 
            !enrolledCourseIds.includes(course.id) &&
            new Date(course.date) > new Date() // Only show future courses
        );

        // Update course selection dropdown
        const courseSelect = document.getElementById('courseId');
        if (!courseSelect) return;

        courseSelect.innerHTML = `
            <option value="">Select a course...</option>
            ${availableCourses.map(course => `
                <option value="${course.id}">
                    ${course.title} - ${new Date(course.date).toLocaleDateString()} (${course.location})
                </option>
            `).join('')}
        `;
    }

    setupCourseModals() {
        this.enrollCourseModal = document.getElementById('enrollCourseModal');
        this.enrollCourseForm = document.getElementById('enrollCourseForm');
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

    async handleEnrollCourse(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const courseId = formData.get('courseId');
        const currentUser = state.getState('currentUser');

        if (!courseId) {
            state.addNotification({
                type: 'error',
                message: 'Please select a course to enroll in'
            });
            return;
        }

        // Get course details to check capacity
        const courseResult = await db.findOne('courses', { id: courseId });
        if (!courseResult.success) return;

        const course = courseResult.data;

        // Check if course is full
        const enrollmentsResult = await db.read('enrollments', { courseId });
        if (!enrollmentsResult.success) return;

        if (enrollmentsResult.data.length >= course.maxStudents) {
            state.addNotification({
                type: 'error',
                message: 'This course is already full'
            });
            return;
        }

        const enrollmentData = {
            courseId,
            studentId: currentUser.id,
            status: 'upcoming',
            progress: 0,
            enrolledAt: new Date().toISOString()
        };

        const result = await db.create('enrollments', enrollmentData);
        if (result.success) {
            this.hideModal('enrollCourseModal');
            await this.loadEnrolledCourses();
            await this.loadAvailableCourses(); // Refresh available courses
            state.addNotification({
                type: 'success',
                message: 'Successfully enrolled in course'
            });
        } else {
            state.addNotification({
                type: 'error',
                message: result.message
            });
        }
    }

    async viewCourseMaterials(courseId) {
        const result = await db.findOne('courses', { id: courseId });
        if (!result.success) return;

        const course = result.data;
        const currentUser = state.getState('currentUser');
        
        // Get enrollment data
        const enrollmentResult = await db.findOne('enrollments', {
            courseId,
            studentId: currentUser.id
        });
        
        if (!enrollmentResult.success) return;
        const enrollment = enrollmentResult.data;

        // Create and show materials modal
        const modal = document.createElement('div');
        modal.id = 'courseMaterialsModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${course.title} - Course Materials</h2>
                    <button class="modal-close" onclick="student.hideModal('courseMaterialsModal')">&times;</button>
                </div>
                <div class="course-materials">
                    <div class="course-overview">
                        <h3>Course Overview</h3>
                        <p>${course.description || 'No description available.'}</p>
                        <div class="course-details">
                            <p><strong>Date:</strong> ${new Date(course.date).toLocaleDateString()}</p>
                            <p><strong>Location:</strong> ${course.location}</p>
                            <p><strong>Instructor:</strong> ${course.instructor?.name || 'Not assigned'}</p>
                            <p><strong>Status:</strong> <span class="status-badge status-${enrollment.status}">${enrollment.status}</span></p>
                            <p><strong>Progress:</strong> ${enrollment.progress || 0}%</p>
                        </div>
                    </div>
                    <div class="materials-section">
                        <h3>Course Materials</h3>
                        ${this.renderCourseMaterials(course.materials || [])}
                    </div>
                    ${enrollment.status === 'active' ? `
                        <div class="progress-section">
                            <h3>Update Progress</h3>
                            <form id="updateProgressForm" onsubmit="student.handleUpdateProgress(event, '${enrollment.id}')">
                                <div class="form-group">
                                    <label for="progress">Progress Percentage</label>
                                    <input type="range" id="progress" name="progress" min="0" max="100" value="${enrollment.progress || 0}">
                                    <div class="progress-value">${enrollment.progress || 0}%</div>
                                </div>
                                <div class="form-group">
                                    <label for="notes">Notes (Optional)</label>
                                    <textarea id="notes" name="notes" rows="3"></textarea>
                                </div>
                                <div class="flex justify-end gap-2">
                                    <button type="button" class="btn btn-secondary" onclick="student.hideModal('courseMaterialsModal')">Close</button>
                                    <button type="submit" class="btn btn-primary">Save Progress</button>
                                </div>
                            </form>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.showModal('courseMaterialsModal');

        // Add event listener for progress input
        const progressInput = modal.querySelector('#progress');
        if (progressInput) {
            progressInput.addEventListener('input', (e) => {
                const progressValue = modal.querySelector('.progress-value');
                if (progressValue) {
                    progressValue.textContent = `${e.target.value}%`;
                }
            });
        }
    }

    renderCourseMaterials(materials) {
        if (!materials || materials.length === 0) {
            return '<p>No materials available yet.</p>';
        }

        return `
            <div class="materials-list">
                ${materials.map(material => `
                    <div class="material-item">
                        <h4>${material.title}</h4>
                        <p>${material.description || ''}</p>
                        ${material.type === 'document' ? `
                            <a href="${material.url}" target="_blank" class="btn btn-sm btn-primary">Download</a>
                        ` : material.type === 'video' ? `
                            <div class="video-container">
                                <iframe src="${material.url}" frameborder="0" allowfullscreen></iframe>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    async handleUpdateProgress(event, enrollmentId) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const progress = parseInt(formData.get('progress'));
        const notes = formData.get('notes');

        const result = await db.update('enrollments', enrollmentId, {
            progress,
            notes,
            lastUpdated: new Date().toISOString()
        });

        if (result.success) {
            this.hideModal('courseMaterialsModal');
            await this.loadEnrolledCourses();
            state.addNotification({
                type: 'success',
                message: 'Progress updated successfully'
            });
        } else {
            state.addNotification({
                type: 'error',
                message: result.message
            });
        }
    }

    async updateProgress(enrollmentId) {
        const result = await db.findOne('enrollments', { id: enrollmentId });
        if (!result.success) return;

        const enrollment = result.data;
        // TODO: Implement progress update modal
        console.log('Update progress:', enrollment);
    }

    updateUserInfo() {
        const userInfo = document.getElementById('userInfo');
        if (!userInfo) return;

        const currentUser = state.getState('currentUser');
        if (currentUser) {
            userInfo.innerHTML = `
                <span>${currentUser.username}</span>
                <button class="btn btn-sm btn-secondary" onclick="student.handleLogout()">Logout</button>
            `;
        }
    }

    async handleLogout() {
        await auth.logout();
        window.location.href = '../login.html';
    }

    setupSearchAndFilters() {
        const filterContainer = document.createElement('div');
        filterContainer.className = 'course-filters';
        filterContainer.innerHTML = `
            <div class="search-box">
                <input type="text" id="courseSearch" placeholder="Search courses...">
            </div>
            <div class="filter-options">
                <select id="courseType">
                    <option value="all">All Types</option>
                    <option value="basic">Basic CPR</option>
                    <option value="advanced">Advanced CPR</option>
                    <option value="first-aid">First Aid</option>
                </select>
                <select id="difficultyLevel">
                    <option value="all">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                </select>
                <select id="dateRange">
                    <option value="all">All Dates</option>
                    <option value="week">Next Week</option>
                    <option value="month">Next Month</option>
                    <option value="quarter">Next Quarter</option>
                </select>
            </div>
            <div class="view-toggle">
                <button class="btn btn-sm btn-secondary" onclick="student.toggleView('list')">List View</button>
                <button class="btn btn-sm btn-secondary" onclick="student.toggleView('calendar')">Calendar View</button>
            </div>
        `;

        const courseList = document.getElementById('courseList');
        if (courseList) {
            courseList.parentNode.insertBefore(filterContainer, courseList);
        }
    }

    initializeCalendar() {
        const calendarContainer = document.createElement('div');
        calendarContainer.id = 'courseCalendar';
        calendarContainer.className = 'calendar-view hidden';
        calendarContainer.innerHTML = `
            <div class="calendar-header">
                <button class="btn btn-sm btn-secondary" onclick="student.navigateCalendar('prev')">&lt;</button>
                <h3 id="calendarMonth"></h3>
                <button class="btn btn-sm btn-secondary" onclick="student.navigateCalendar('next')">&gt;</button>
            </div>
            <div class="calendar-grid">
                <div class="calendar-weekdays">
                    <div>Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                </div>
                <div class="calendar-days"></div>
            </div>
        `;

        const courseList = document.getElementById('courseList');
        if (courseList) {
            courseList.parentNode.insertBefore(calendarContainer, courseList);
        }

        this.currentDate = new Date();
        this.renderCalendar();
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();

        document.getElementById('calendarMonth').textContent = 
            `${firstDay.toLocaleString('default', { month: 'long' })} ${year}`;

        const calendarDays = document.querySelector('.calendar-days');
        calendarDays.innerHTML = '';

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay.getDay(); i++) {
            calendarDays.appendChild(document.createElement('div'));
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;

            const date = new Date(year, month, day);
            const courses = this.getCoursesForDate(date);
            
            if (courses.length > 0) {
                dayElement.classList.add('has-courses');
                dayElement.innerHTML = `
                    <div class="day-number">${day}</div>
                    <div class="course-count">${courses.length} courses</div>
                `;
                dayElement.addEventListener('click', () => this.showCoursesForDate(date, courses));
            }

            calendarDays.appendChild(dayElement);
        }
    }

    getCoursesForDate(date) {
        const currentUser = state.getState('currentUser');
        if (!currentUser) return [];

        const enrollments = this.enrolledCourses || [];
        return enrollments.filter(enrollment => {
            const courseDate = new Date(enrollment.course.date);
            return courseDate.toDateString() === date.toDateString();
        });
    }

    showCoursesForDate(date, courses) {
        const modal = document.createElement('div');
        modal.id = 'coursesForDateModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Courses for ${date.toLocaleDateString()}</h2>
                    <button class="modal-close" onclick="student.hideModal('coursesForDateModal')">&times;</button>
                </div>
                <div class="courses-list">
                    ${courses.map(enrollment => `
                        <div class="course-item">
                            <div class="course-info">
                                <h3>${enrollment.course.title}</h3>
                                <p>Time: ${new Date(enrollment.course.date).toLocaleTimeString()}</p>
                                <p>Location: ${enrollment.course.location}</p>
                                <p>Status: <span class="status-badge status-${enrollment.status}">${enrollment.status}</span></p>
                            </div>
                            <div class="course-actions">
                                <button class="btn btn-sm btn-primary" onclick="student.viewCourseMaterials('${enrollment.course.id}')">View Materials</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.showModal('coursesForDateModal');
    }

    navigateCalendar(direction) {
        if (direction === 'prev') {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        } else {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        }
        this.renderCalendar();
    }

    toggleView(view) {
        const courseList = document.getElementById('courseList');
        const calendarView = document.getElementById('courseCalendar');
        
        if (view === 'list') {
            courseList.classList.remove('hidden');
            calendarView.classList.add('hidden');
        } else {
            courseList.classList.add('hidden');
            calendarView.classList.remove('hidden');
        }
    }

    applyFilters() {
        const currentUser = state.getState('currentUser');
        if (!currentUser) return;

        const enrollments = this.enrolledCourses || [];
        const filteredEnrollments = enrollments.filter(enrollment => {
            const course = enrollment.course;
            const matchesSearch = this.filters.search === '' || 
                course.title.toLowerCase().includes(this.filters.search) ||
                course.location.toLowerCase().includes(this.filters.search);

            const matchesType = this.filters.type === 'all' || 
                course.type === this.filters.type;

            const matchesDifficulty = this.filters.difficulty === 'all' || 
                course.difficulty === this.filters.difficulty;

            const matchesDateRange = this.filters.dateRange === 'all' || 
                this.isInDateRange(new Date(course.date));

            return matchesSearch && matchesType && matchesDifficulty && matchesDateRange;
        });

        this.renderFilteredCourses(filteredEnrollments);
    }

    isInDateRange(courseDate) {
        const today = new Date();
        const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
        const quarterFromNow = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

        switch (this.filters.dateRange) {
            case 'week':
                return courseDate <= weekFromNow;
            case 'month':
                return courseDate <= monthFromNow;
            case 'quarter':
                return courseDate <= quarterFromNow;
            default:
                return true;
        }
    }

    renderFilteredCourses(enrollments) {
        const courseList = document.getElementById('courseList');
        if (!courseList) return;

        courseList.innerHTML = enrollments.map(enrollment => `
            <div class="course-item">
                <div class="course-info">
                    <h3>${enrollment.course.title}</h3>
                    <p>Date: ${new Date(enrollment.course.date).toLocaleDateString()}</p>
                    <p>Location: ${enrollment.course.location}</p>
                    <p>Type: ${enrollment.course.type}</p>
                    <p>Difficulty: ${enrollment.course.difficulty}</p>
                    <p>Status: <span class="status-badge status-${enrollment.status}">${enrollment.status}</span></p>
                    <p>Progress: ${enrollment.progress || 0}%</p>
                </div>
                <div class="course-actions">
                    <button class="btn btn-sm btn-primary" onclick="student.viewCourseMaterials('${enrollment.course.id}')">View Materials</button>
                    ${enrollment.status === 'active' ? `
                        <button class="btn btn-sm btn-secondary" onclick="student.updateProgress('${enrollment.id}')">Update Progress</button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    // Add review functionality
    async submitReview(courseId, rating, comment) {
        try {
            const user = await auth.getCurrentUser();
            if (!user) throw new Error('User not authenticated');

            const review = {
                id: Date.now().toString(),
                courseId,
                userId: user.uid,
                rating,
                comment,
                timestamp: new Date().toISOString(),
                userName: user.displayName || 'Anonymous'
            };

            await db.write(`reviews/${review.id}`, review);
            await this.updateCourseRating(courseId);
            this.showAlert('Review submitted successfully', 'success');
            this.hideModal('reviewModal');
        } catch (error) {
            console.error('Error submitting review:', error);
            this.showAlert('Failed to submit review', 'error');
        }
    }

    async updateCourseRating(courseId) {
        try {
            const reviews = await db.read('reviews');
            const courseReviews = Object.values(reviews).filter(r => r.courseId === courseId);
            
            if (courseReviews.length === 0) return;

            const averageRating = courseReviews.reduce((acc, review) => acc + review.rating, 0) / courseReviews.length;
            await db.update(`courses/${courseId}`, {
                rating: averageRating,
                reviewCount: courseReviews.length
            });
        } catch (error) {
            console.error('Error updating course rating:', error);
        }
    }

    async loadCourseReviews(courseId) {
        try {
            const reviews = await db.read('reviews');
            const courseReviews = Object.values(reviews)
                .filter(r => r.courseId === courseId)
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            const reviewsList = document.getElementById('courseReviewsList');
            if (!reviewsList) return;

            reviewsList.innerHTML = courseReviews.map(review => `
                <div class="review-item">
                    <div class="review-header">
                        <div class="review-rating">
                            ${this.generateStarRating(review.rating)}
                            <span class="review-date">${new Date(review.timestamp).toLocaleDateString()}</span>
                        </div>
                        <div class="review-author">${review.userName}</div>
                    </div>
                    <div class="review-comment">${review.comment}</div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading course reviews:', error);
        }
    }

    generateStarRating(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        let stars = '';
        
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars += '<i class="fas fa-star"></i>';
            } else if (i === fullStars && hasHalfStar) {
                stars += '<i class="fas fa-star-half-alt"></i>';
            } else {
                stars += '<i class="far fa-star"></i>';
            }
        }
        
        return stars;
    }

    showReviewModal(courseId) {
        const modal = document.getElementById('reviewModal');
        if (!modal) return;

        const courseTitle = document.getElementById('reviewCourseTitle');
        if (courseTitle) {
            courseTitle.textContent = this.availableCourses.find(c => c.id === courseId)?.title || 'Course';
        }

        modal.style.display = 'block';
        this.currentReviewCourseId = courseId;
        this.loadCourseReviews(courseId);
    }

    hideReviewModal() {
        const modal = document.getElementById('reviewModal');
        if (modal) {
            modal.style.display = 'none';
            this.currentReviewCourseId = null;
        }
    }

    renderAvailableCourses() {
        const container = document.getElementById('availableCoursesList');
        if (!container) return;

        const filteredCourses = this.filterCourses(this.availableCourses);
        container.innerHTML = filteredCourses.map(course => `
            <div class="course-item">
                <div class="course-header">
                    <h3>${course.title}</h3>
                    <span class="status-badge ${course.status.toLowerCase()}">${course.status}</span>
                </div>
                <div class="course-info">
                    <p><i class="fas fa-calendar"></i> ${new Date(course.date).toLocaleDateString()}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${course.location}</p>
                    <p><i class="fas fa-user-tie"></i> ${course.instructor}</p>
                    <p><i class="fas fa-users"></i> ${course.enrolledStudents}/${course.maxStudents} students</p>
                    ${course.rating ? `
                        <div class="course-rating">
                            <i class="fas fa-star"></i>
                            <span>${course.rating.toFixed(1)}</span>
                            <span class="review-count">(${course.reviewCount || 0} reviews)</span>
                        </div>
                    ` : ''}
                </div>
                <div class="course-actions">
                    <button class="btn btn-primary" onclick="studentPortal.enrollInCourse('${course.id}')">
                        Enroll Now
                    </button>
                    <button class="btn btn-review" onclick="studentPortal.showReviewModal('${course.id}')">
                        <i class="fas fa-star"></i> Review
                    </button>
                </div>
            </div>
        `).join('');
    }

    async initializeProgressDashboard() {
        await this.updateOverallProgress();
        await this.updateAchievements();
        await this.updateProgressChart();
        await this.updateRecentActivity();
    }

    async updateOverallProgress() {
        const currentUser = state.getState('currentUser');
        if (!currentUser) return;

        const result = await db.read('enrollments', { studentId: currentUser.id });
        if (!result.success) return;

        const enrollments = result.data;
        const totalProgress = enrollments.reduce((acc, enrollment) => acc + (enrollment.progress || 0), 0);
        const averageProgress = enrollments.length > 0 ? totalProgress / enrollments.length : 0;

        const progressBar = document.getElementById('overallProgress');
        const progressValue = document.getElementById('overallProgressValue');
        
        if (progressBar) {
            progressBar.style.width = `${averageProgress}%`;
        }
        if (progressValue) {
            progressValue.textContent = `${Math.round(averageProgress)}%`;
        }
    }

    async updateAchievements() {
        const currentUser = state.getState('currentUser');
        if (!currentUser) return;

        const result = await db.read('achievements', { userId: currentUser.id });
        if (!result.success) return;

        const earnedAchievements = result.data;
        const achievementsGrid = document.getElementById('achievementsGrid');
        if (!achievementsGrid) return;

        achievementsGrid.innerHTML = this.achievements.map(achievement => `
            <div class="achievement-item ${earnedAchievements.some(a => a.id === achievement.id) ? 'earned' : ''}"
                 title="${achievement.title}"
                 data-achievement-id="${achievement.id}">
                <i class="fas ${achievement.icon}"></i>
            </div>
        `).join('');

        // Add tooltip functionality
        achievementsGrid.querySelectorAll('.achievement-item').forEach(item => {
            item.addEventListener('mouseenter', (e) => {
                const achievement = this.achievements.find(a => a.id === e.target.dataset.achievementId);
                if (achievement) {
                    this.showTooltip(e, achievement);
                }
            });
        });
    }

    showTooltip(event, achievement) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.innerHTML = `
            <h4>${achievement.title}</h4>
            <p>${achievement.description}</p>
        `;

        document.body.appendChild(tooltip);

        const rect = event.target.getBoundingClientRect();
        tooltip.style.top = `${rect.bottom + 5}px`;
        tooltip.style.left = `${rect.left + (rect.width - tooltip.offsetWidth) / 2}px`;

        event.target.addEventListener('mouseleave', () => {
            tooltip.remove();
        });
    }

    async updateProgressChart() {
        const currentUser = state.getState('currentUser');
        if (!currentUser) return;

        const result = await db.read('enrollments', { studentId: currentUser.id });
        if (!result.success) return;

        const enrollments = result.data;
        const ctx = document.getElementById('progressChart');
        if (!ctx) return;

        // Group enrollments by month
        const monthlyProgress = {};
        enrollments.forEach(enrollment => {
            const date = new Date(enrollment.enrolledAt);
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
            if (!monthlyProgress[monthKey]) {
                monthlyProgress[monthKey] = {
                    count: 0,
                    totalProgress: 0
                };
            }
            monthlyProgress[monthKey].count++;
            monthlyProgress[monthKey].totalProgress += enrollment.progress || 0;
        });

        // Calculate average progress for each month
        const labels = Object.keys(monthlyProgress).sort();
        const data = labels.map(monthKey => {
            const month = monthlyProgress[monthKey];
            return month.count > 0 ? month.totalProgress / month.count : 0;
        });

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels.map(monthKey => {
                    const [year, month] = monthKey.split('-');
                    return `${new Date(year, month - 1).toLocaleString('default', { month: 'short' })} ${year}`;
                }),
                datasets: [{
                    label: 'Average Progress',
                    data: data,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    async updateRecentActivity() {
        const currentUser = state.getState('currentUser');
        if (!currentUser) return;

        const result = await db.read('activity_log', { userId: currentUser.id });
        if (!result.success) return;

        const activities = result.data
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5);

        const activityList = document.getElementById('recentActivity');
        if (!activityList) return;

        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas ${this.getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-time">${new Date(activity.timestamp).toLocaleString()}</div>
                </div>
            </div>
        `).join('');
    }

    getActivityIcon(type) {
        const icons = {
            'course_completed': 'fa-graduation-cap',
            'course_enrolled': 'fa-user-plus',
            'progress_updated': 'fa-chart-line',
            'achievement_earned': 'fa-trophy',
            'review_submitted': 'fa-star'
        };
        return icons[type] || 'fa-info-circle';
    }

    async showCertificateModal() {
        const currentUser = state.getState('currentUser');
        if (!currentUser) return;

        const result = await db.read('certificates', { userId: currentUser.id });
        if (!result.success) return;

        const certificates = result.data;
        const modal = document.createElement('div');
        modal.id = 'certificateModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>My Certificates</h2>
                    <button class="modal-close" onclick="student.hideModal('certificateModal')">&times;</button>
                </div>
                <div class="certificates-list">
                    ${certificates.map(cert => `
                        <div class="certificate-item">
                            <div class="certificate-icon">
                                <i class="fas fa-certificate"></i>
                            </div>
                            <div class="certificate-info">
                                <h3>${cert.title}</h3>
                                <p>Issued: ${new Date(cert.issuedDate).toLocaleDateString()}</p>
                                <p>Course: ${cert.courseTitle}</p>
                                <p>Valid Until: ${new Date(cert.validUntil).toLocaleDateString()}</p>
                                <span class="certificate-status status-${this.getCertificateStatus(cert)}">
                                    ${this.getCertificateStatusText(cert)}
                                </span>
                            </div>
                            <div class="certificate-actions">
                                <button class="btn btn-sm btn-primary" onclick="student.downloadCertificate('${cert.id}')">
                                    <i class="fas fa-download"></i> Download
                                </button>
                                <button class="btn btn-sm btn-secondary" onclick="student.viewCertificateDetails('${cert.id}')">
                                    <i class="fas fa-eye"></i> View
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.showModal('certificateModal');
    }

    getCertificateStatus(certificate) {
        const now = new Date();
        const validUntil = new Date(certificate.validUntil);
        
        if (validUntil < now) {
            return 'expired';
        } else if (validUntil.getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000) { // Less than 30 days
            return 'pending';
        }
        return 'issued';
    }

    getCertificateStatusText(certificate) {
        const status = this.getCertificateStatus(certificate);
        switch (status) {
            case 'expired':
                return 'Expired';
            case 'pending':
                return 'Expiring Soon';
            default:
                return 'Valid';
        }
    }

    async downloadCertificate(certificateId) {
        try {
            const result = await db.findOne('certificates', { id: certificateId });
            if (!result.success) return;

            const certificate = result.data;
            
            // Create a loading state
            const button = event.target.closest('button');
            const originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Downloading...';
            button.disabled = true;

            // Simulate certificate generation and download
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Create a temporary link to download the certificate
            const link = document.createElement('a');
            link.href = certificate.downloadUrl || '#';
            link.download = `certificate-${certificate.id}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Reset button state
            button.innerHTML = originalText;
            button.disabled = false;

            // Show success notification
            state.addNotification({
                type: 'success',
                message: 'Certificate downloaded successfully'
            });

            // Log the download activity
            await this.logActivity('certificate_downloaded', {
                certificateId,
                certificateTitle: certificate.title
            });
        } catch (error) {
            console.error('Error downloading certificate:', error);
            state.addNotification({
                type: 'error',
                message: 'Failed to download certificate'
            });
        }
    }

    async viewCertificateDetails(certificateId) {
        try {
            const result = await db.findOne('certificates', { id: certificateId });
            if (!result.success) return;

            const certificate = result.data;
            
            // Create a modal to show certificate details
            const modal = document.createElement('div');
            modal.id = 'certificateDetailsModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Certificate Details</h2>
                        <button class="modal-close" onclick="student.hideModal('certificateDetailsModal')">&times;</button>
                    </div>
                    <div class="certificate-details">
                        <div class="certificate-preview">
                            <img src="${certificate.previewUrl || 'path/to/default-certificate.png'}" alt="Certificate Preview">
                        </div>
                        <div class="certificate-info">
                            <h3>${certificate.title}</h3>
                            <div class="info-grid">
                                <div class="info-item">
                                    <label>Course</label>
                                    <p>${certificate.courseTitle}</p>
                                </div>
                                <div class="info-item">
                                    <label>Issued Date</label>
                                    <p>${new Date(certificate.issuedDate).toLocaleDateString()}</p>
                                </div>
                                <div class="info-item">
                                    <label>Valid Until</label>
                                    <p>${new Date(certificate.validUntil).toLocaleDateString()}</p>
                                </div>
                                <div class="info-item">
                                    <label>Certificate ID</label>
                                    <p>${certificate.id}</p>
                                </div>
                            </div>
                            <div class="certificate-actions">
                                <button class="btn btn-primary" onclick="student.downloadCertificate('${certificate.id}')">
                                    <i class="fas fa-download"></i> Download
                                </button>
                                <button class="btn btn-secondary" onclick="student.shareCertificate('${certificate.id}')">
                                    <i class="fas fa-share"></i> Share
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            this.showModal('certificateDetailsModal');
        } catch (error) {
            console.error('Error viewing certificate details:', error);
            state.addNotification({
                type: 'error',
                message: 'Failed to load certificate details'
            });
        }
    }

    async shareCertificate(certificateId) {
        try {
            const result = await db.findOne('certificates', { id: certificateId });
            if (!result.success) return;

            const certificate = result.data;
            
            // Create share options modal
            const modal = document.createElement('div');
            modal.id = 'shareCertificateModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Share Certificate</h2>
                        <button class="modal-close" onclick="student.hideModal('shareCertificateModal')">&times;</button>
                    </div>
                    <div class="share-options">
                        <div class="share-link">
                            <input type="text" value="${certificate.shareUrl}" readonly>
                            <button class="btn btn-sm btn-primary" onclick="student.copyShareLink('${certificate.shareUrl}')">
                                Copy Link
                            </button>
                        </div>
                        <div class="share-buttons">
                            <button class="btn btn-sm btn-primary" onclick="student.shareOnLinkedIn('${certificate.id}')">
                                <i class="fab fa-linkedin"></i> LinkedIn
                            </button>
                            <button class="btn btn-sm btn-primary" onclick="student.shareOnTwitter('${certificate.id}')">
                                <i class="fab fa-twitter"></i> Twitter
                            </button>
                            <button class="btn btn-sm btn-primary" onclick="student.shareOnFacebook('${certificate.id}')">
                                <i class="fab fa-facebook"></i> Facebook
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            this.showModal('shareCertificateModal');
        } catch (error) {
            console.error('Error sharing certificate:', error);
            state.addNotification({
                type: 'error',
                message: 'Failed to share certificate'
            });
        }
    }

    async copyShareLink(url) {
        try {
            await navigator.clipboard.writeText(url);
            state.addNotification({
                type: 'success',
                message: 'Share link copied to clipboard'
            });
        } catch (error) {
            console.error('Error copying share link:', error);
            state.addNotification({
                type: 'error',
                message: 'Failed to copy share link'
            });
        }
    }

    async shareOnLinkedIn(certificateId) {
        // Implement LinkedIn sharing
        console.log('Sharing on LinkedIn:', certificateId);
    }

    async shareOnTwitter(certificateId) {
        // Implement Twitter sharing
        console.log('Sharing on Twitter:', certificateId);
    }

    async shareOnFacebook(certificateId) {
        // Implement Facebook sharing
        console.log('Sharing on Facebook:', certificateId);
    }

    async logActivity(type, data) {
        try {
            const currentUser = state.getState('currentUser');
            if (!currentUser) return;

            const activity = {
                id: Date.now().toString(),
                userId: currentUser.id,
                type,
                data,
                timestamp: new Date().toISOString()
            };

            await db.create('activity_log', activity);
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    }
}

// Export singleton instance
const student = new StudentPortal();
export default student; 