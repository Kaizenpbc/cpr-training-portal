import auth from '../core/auth.js';
import db from '../core/database.js';
import state from '../core/state.js';

class InstructorPortal {
    constructor() {
        console.log('=== Initializing InstructorPortal ===');
        
        // Initialize properties
        this.currentUser = null;
        this.currentDate = new Date();
        this.selectedDate = null;
        this.availableDates = [];
        this.confirmedDates = [];
        this.confirmedCourses = [];
        this.dateToRemove = null;
        
        // Hide all modals immediately
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        console.log('All modals hidden on construction');
        
        this.setupEventListeners();
        this.checkPermissions();
        
        console.log('=== InstructorPortal initialization completed ===');
    }

    async initialize() {
        try {
            console.log('=== Starting portal initialization ===');
            
            // Hide all modals first
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
            console.log('All modals hidden');

            this.currentUser = auth.getCurrentUser();
            if (!this.currentUser) {
                // Show login section instead of redirecting
                const loginSection = document.getElementById('login');
                if (loginSection) {
                    loginSection.style.display = 'block';
                }
                return;
            }

            // Update user info
            this.updateUserInfo();

            // Initialize all components
            await this.initializeAvailability();
            await this.initializeCourses();
            this.setupEventListeners();
            
            console.log('=== Portal initialization completed ===');
        } catch (error) {
            console.error('Initialization error:', error);
            state.addNotification({
                type: 'error',
                message: 'Failed to initialize portal'
            });
            // Show login section instead of redirecting
            const loginSection = document.getElementById('login');
            if (loginSection) {
                loginSection.style.display = 'block';
            }
        }
    }

    async initializeAvailability() {
        console.log('Initializing availability...');
        try {
            // Get current user
            this.currentUser = auth.getCurrentUser();
            console.log('Current user:', this.currentUser);

            if (!this.currentUser) {
                console.error('No user found');
                return;
            }

            // Load availability
            const result = await db.read('instructor_availability', {
                instructorId: this.currentUser.id
            });

            if (result.success) {
                this.availableDates = result.data.map(record => record.date);
                console.log('Loaded availability:', this.availableDates);
            }

            // Load confirmed courses
            const coursesResult = await db.read('courses', {
                instructorId: this.currentUser.id,
                status: 'confirmed'
            });

            if (coursesResult.success) {
                this.confirmedCourses = coursesResult.data;
                console.log('Loaded confirmed courses:', this.confirmedCourses);
            }

            // Initialize calendar
            await this.initializeCalendar();
            
            console.log('Calendar rendered');
        } catch (error) {
            console.error('Error initializing availability:', error);
            state.addNotification({
                type: 'error',
                message: 'Failed to load availability'
            });
        }
    }

    async initializeCalendar() {
        console.log('=== initializeCalendar START ===');
        console.log('Current availableDates:', this.availableDates);
        console.log('Current confirmedCourses:', this.confirmedCourses);
        
        // Wait for DOM to be ready
        if (!document.getElementById('availabilityCalendar')) {
            console.log('Waiting for calendar element...');
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        const calendarContainer = document.getElementById('availabilityCalendar');
        const monthYearElement = document.getElementById('monthYear');
        
        if (!calendarContainer || !monthYearElement) {
            console.error('Calendar elements not found');
            return;
        }

        // Create a new date object to avoid modifying the original
        const currentDate = new Date(this.currentDate);
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        console.log('Rendering calendar for:', `${year}-${month + 1}`);

        // Update month/year display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
        monthYearElement.textContent = `${monthNames[month]} ${year}`;

        // Clear previous calendar
        calendarContainer.innerHTML = '';

        // Create days header
        const daysHeader = document.createElement('div');
        daysHeader.className = 'calendar-days-header';
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        days.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.textContent = day;
            daysHeader.appendChild(dayElement);
        });
        calendarContainer.appendChild(daysHeader);

        // Create calendar grid
        const calendarGrid = document.createElement('div');
        calendarGrid.className = 'calendar-days';

        // Get first day of month and total days
        const firstDay = new Date(year, month, 1).getDay();
        const totalDays = new Date(year, month + 1, 0).getDate();

        console.log('Calendar grid details:', {
            firstDay,
            totalDays,
            year,
            month: month + 1
        });

        // Add empty cells for days before first of month
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendarGrid.appendChild(emptyDay);
        }

        // Add days of the month
        for (let day = 1; day <= totalDays; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            
            // Format date string consistently
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            console.log('Processing day:', {
                date: dateStr,
                isAvailable: this.availableDates.includes(dateStr),
                hasConfirmedCourse: this.confirmedCourses.some(c => c.date === dateStr)
            });
            
            // Create date number element
            const dateNumber = document.createElement('div');
            dateNumber.className = 'date-number';
            dateNumber.textContent = day;
            dayElement.appendChild(dateNumber);

            // Check if date has a confirmed course
            const confirmedCourse = this.confirmedCourses.find(c => c.date === dateStr);
            if (confirmedCourse && confirmedCourse.organizationName) {
                console.log('Adding confirmed course indicator for:', dateStr);
                dayElement.classList.add('confirmed');
                // Get first 3 letters of organization name
                const orgAbbrev = confirmedCourse.organizationName.slice(0, 3).toUpperCase();
                const statusIndicator = document.createElement('div');
                statusIndicator.className = 'status-indicator';
                statusIndicator.textContent = orgAbbrev;
                statusIndicator.style.backgroundColor = '#007bff'; // Blue for confirmed
                dayElement.appendChild(statusIndicator);
            }
            // If no confirmed course, check if date is available
            else if (this.availableDates.includes(dateStr)) {
                console.log('Adding available indicator for:', dateStr);
                dayElement.classList.add('available');
                const statusIndicator = document.createElement('div');
                statusIndicator.className = 'status-indicator';
                statusIndicator.textContent = 'A';
                statusIndicator.style.backgroundColor = '#28a745'; // Green for available
                dayElement.appendChild(statusIndicator);
            }

            // Add click handler
            dayElement.addEventListener('click', () => this.handleDayClick(new Date(year, month, day)));
            
            calendarGrid.appendChild(dayElement);
        }

        calendarContainer.appendChild(calendarGrid);
        console.log('Calendar rendering completed');
        console.log('=== initializeCalendar END ===');
    }

    renderTimeSlots() {
        const timeSlotsContainer = document.getElementById('timeSlots');
        const dateString = this.selectedDate;

        if (!dateString) {
            timeSlotsContainer.innerHTML = '<p>Select a date to view time slots</p>';
            return;
        }

        const availableSlots = this.availability[dateString] || [];
        
        timeSlotsContainer.innerHTML = this.timeSlots.map(slot => {
            const isSelected = availableSlots.includes(slot.id);
            const isUnavailable = this.isSlotUnavailable(dateString, slot.id);

            return `
                <div class="time-slot ${isSelected ? 'selected' : ''} ${isUnavailable ? 'unavailable' : ''}"
                     onclick="instructor.toggleTimeSlot('${slot.id}')">
                    ${slot.label}
                </div>
            `;
        }).join('');
    }

    selectDate(dateString) {
        this.selectedDate = dateString;
        this.selectedTimeSlots = new Set(this.availability[dateString] || []);
        this.renderCalendar();
        this.renderTimeSlots();
    }

    toggleTimeSlot(slotId) {
        if (!this.selectedDate) return;

        if (this.selectedTimeSlots.has(slotId)) {
            this.selectedTimeSlots.delete(slotId);
        } else {
            this.selectedTimeSlots.add(slotId);
        }

        this.availability[this.selectedDate] = Array.from(this.selectedTimeSlots);
        this.renderTimeSlots();
        this.updateSummary();
    }

    isSlotUnavailable(dateString, slotId) {
        // Check if the slot is already booked
        // This would typically involve checking against a bookings table
        return false;
    }

    previousMonth() {
        console.log('=== previousMonth START ===');
        const newDate = new Date(this.currentDate);
        newDate.setMonth(newDate.getMonth() - 1);
        this.currentDate = newDate;
        console.log('New date set:', this.currentDate);
        this.initializeCalendar();
        console.log('=== previousMonth END ===');
    }

    nextMonth() {
        console.log('=== nextMonth START ===');
        const newDate = new Date(this.currentDate);
        newDate.setMonth(newDate.getMonth() + 1);
        this.currentDate = newDate;
        console.log('New date set:', this.currentDate);
        this.initializeCalendar();
        console.log('=== nextMonth END ===');
    }

    selectAllDays() {
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const totalDays = lastDay.getDate();

        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
            const dateString = date.toISOString().split('T')[0];
            this.availability[dateString] = this.timeSlots.map(slot => slot.id);
        }

        this.renderCalendar();
        this.updateSummary();
    }

    clearSelection() {
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const totalDays = lastDay.getDate();

        for (let day = 1; day <= totalDays; day++) {
            const date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
            const dateString = date.toISOString().split('T')[0];
            delete this.availability[dateString];
        }

        this.renderCalendar();
        this.updateSummary();
    }

    updateSummary() {
        const availableDays = Object.keys(this.availability).length;
        const totalSlots = Object.values(this.availability).reduce((sum, slots) => sum + slots.length, 0);
        const bookedSlots = 0; // This would typically come from a bookings table
        const availableSlots = totalSlots - bookedSlots;

        document.getElementById('availableDays').textContent = availableDays;
        document.getElementById('totalSlots').textContent = totalSlots;
        document.getElementById('bookedSlots').textContent = bookedSlots;
        document.getElementById('availableSlots').textContent = availableSlots;
    }

    async saveAvailability() {
        const currentUser = state.getState('currentUser');
        if (!currentUser) return;

        try {
            // Delete existing availability for this month
            const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
            const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
            
            await db.delete('instructor_availability', {
                instructorId: currentUser.id,
                date: {
                    $gte: firstDay.toISOString(),
                    $lte: lastDay.toISOString()
                }
            });

            // Insert new availability
            const availabilityRecords = Object.entries(this.availability).map(([date, timeSlots]) => ({
                instructorId: currentUser.id,
                date,
                timeSlots,
                updatedAt: new Date().toISOString()
            }));

            for (const record of availabilityRecords) {
                await db.create('instructor_availability', record);
            }

            state.addNotification({
                type: 'success',
                message: 'Availability saved successfully'
            });
        } catch (error) {
            console.error('Error saving availability:', error);
            state.addNotification({
                type: 'error',
                message: 'Failed to save availability'
            });
        }
    }

    async initializeCourses() {
        console.log('=== initializeCourses START ===');
        const tableBody = document.getElementById('coursesTableBody');
        if (!tableBody) {
            console.log('No coursesTableBody found');
            return;
        }

        try {
            // Get confirmed courses
            const coursesResult = await db.read('courses', {
                instructorId: this.currentUser.id
            });
            console.log('Courses result:', coursesResult);

            // Create rows for both confirmed courses and available dates
            let rows = [];

            // Add confirmed courses
            if (coursesResult.success && coursesResult.data) {
                rows = rows.concat(coursesResult.data.map(course => ({
                    date: course.date,
                    isConfirmed: true,
                    data: course
                })));
            }

            // Add available dates that don't have confirmed courses
            console.log('Available dates:', this.availableDates);
            this.availableDates.forEach(date => {
                // Check if this date doesn't already have a confirmed course
                if (!rows.some(row => row.date === date)) {
                    rows.push({
                        date: date,
                        isConfirmed: false,
                        data: {
                            date: date,
                            organizationName: '-',
                            location: '-',
                            courseType: '-',
                            studentsRegistered: 0,
                            notes: '-',
                            status: 'available'
                        }
                    });
                }
            });

            // Sort rows by date
            rows.sort((a, b) => new Date(a.date) - new Date(b.date));
            
            console.log('Combined rows:', rows);

            // Generate table HTML
            tableBody.innerHTML = rows.map(row => {
                // Parse the date components to avoid timezone issues
                const [year, month, day] = row.date.split('-');
                // Format the date using the same approach as the calendar
                const formattedDate = this.formatDateForDisplay(`${year}-${month}-${day}`);
                
                return `
                    <tr>
                        <td>${formattedDate}</td>
                        <td>${row.data.organizationName}</td>
                        <td>${row.data.location}</td>
                        <td>${row.data.courseType}</td>
                        <td>${row.data.studentsRegistered}</td>
                        <td>${row.data.notes}</td>
                        <td>
                            <span class="status-badge ${row.isConfirmed ? 'status-confirmed' : 'status-available'}">
                                ${row.isConfirmed ? 'Confirmed' : 'Available'}
                            </span>
                        </td>
                    </tr>
                `;
            }).join('');
            
            console.log('Table updated');
        } catch (error) {
            console.error('Error loading courses:', error);
            state.addNotification({
                type: 'error',
                message: 'Failed to load courses'
            });
        }
        console.log('=== initializeCourses END ===');
    }

    showCourseDetails(dateStr) {
        // Show modal with course details
        const course = this.confirmedCourses.find(c => c.date === dateStr);
        if (!course) return;

        const modal = document.getElementById('courseDetailsModal');
        if (!modal) return;

        modal.querySelector('.modal-title').textContent = 'Course Details';
        modal.querySelector('.modal-body').innerHTML = `
            <div class="course-details">
                <p><strong>Organization:</strong> ${course.organizationName}</p>
                <p><strong>Location:</strong> ${course.location}</p>
                <p><strong>Course Type:</strong> ${course.courseType}</p>
                <p><strong>Students Registered:</strong> ${course.studentsRegistered}</p>
                <p><strong>Notes:</strong> ${course.notes || 'No notes'}</p>
            </div>
        `;

        this.showModal('courseDetailsModal');
    }

    setupEventListeners() {
        // Navigation handling
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.section;
                if (section) {
                    this.navigateToSection(section);
                }
            });
        });

        // Clear storage button
        const clearStorageBtn = document.getElementById('clearStorageBtn');
        if (clearStorageBtn) {
            clearStorageBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to clear all storage? This will log you out and remove all data.')) {
                    await this.clearStorage();
                }
            });
        }

        // Form submissions
        document.getElementById('updateAvailabilityForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAvailabilityUpdate(e.target);
        });

        document.getElementById('updateAttendanceForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAttendanceUpdate(e.target);
        });

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(button => {
            button.addEventListener('click', () => {
                const modalId = button.closest('.modal').id;
                this.hideModal(modalId);
            });
        });

        // Close modals when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal')) {
                this.hideModal(event.target.id);
            }
        });

        // Add event listeners for the remove availability modal buttons
        const cancelRemoveBtn = document.getElementById('cancelRemoveBtn');
        const confirmRemoveBtn = document.getElementById('confirmRemoveBtn');

        if (cancelRemoveBtn) {
            cancelRemoveBtn.addEventListener('click', () => {
                this.hideModal('confirmRemoveModal');
                this.dateToRemove = null; // Clear the date when canceling
            });
        }

        if (confirmRemoveBtn) {
            // Remove any existing listeners
            const newConfirmBtn = confirmRemoveBtn.cloneNode(true);
            confirmRemoveBtn.parentNode.replaceChild(newConfirmBtn, confirmRemoveBtn);

            // Add new listener
            newConfirmBtn.addEventListener('click', async () => {
                if (this.dateToRemove) { // Only proceed if we have a date to remove
                    await this.confirmRemoveAvailability();
                }
            });
        }
    }

    async navigateToSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
        });

        // Show the selected section
        const selectedSection = document.getElementById(sectionId);
        if (selectedSection) {
            selectedSection.style.display = 'block';
            
            // Update active state in navigation
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            const activeItem = document.querySelector(`.nav-item[data-section="${sectionId}"]`);
            if (activeItem) {
                activeItem.classList.add('active');
            }

            // Update section title
            const sectionTitle = document.getElementById('sectionTitle');
            if (sectionTitle) {
                sectionTitle.textContent = selectedSection.querySelector('.section-header h2')?.textContent || sectionId;
            }

            // Initialize section-specific content
            switch (sectionId) {
                case 'availability':
                    await this.initializeAvailability();
                    break;
                case 'courses':
                    await this.initializeCourses();
                    break;
                case 'dashboard':
                    await this.initializeDashboard();
                    break;
            }
        }
    }

    setupSubscriptions() {
        // Subscribe to course changes
        state.subscribe('courses', () => {
            this.updateInstructorStats();
            this.loadAssignedCourses();
        });

        // Subscribe to user changes
        state.subscribe('currentUser', () => {
            this.updateUserInfo();
        });
    }

    async updateInstructorStats() {
        const currentUser = state.getState('currentUser');
        if (!currentUser) return;

        const result = await db.read('courses', { instructorId: currentUser.id });
        if (!result.success) return;

        const courses = result.data;
        const stats = {
            total: courses.length,
            upcoming: courses.filter(c => new Date(c.date) > new Date() && c.status === 'active').length,
            completed: courses.filter(c => c.status === 'completed').length,
            cancelled: courses.filter(c => c.status === 'cancelled').length
        };

        // Update dashboard stats
        document.getElementById('totalCourses').textContent = stats.total;
        document.getElementById('upcomingCourses').textContent = stats.upcoming;
        document.getElementById('completedCourses').textContent = stats.completed;
        document.getElementById('cancelledCourses').textContent = stats.cancelled;
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

    async loadAssignedCourses() {
        const currentUser = state.getState('currentUser');
        if (!currentUser) return;

        const result = await db.read('courses', { instructorId: currentUser.id });
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
                    ${course.status === 'active' ? `
                        <button class="btn btn-sm btn-primary" onclick="instructor.updateAttendance('${course.id}')">Update Attendance</button>
                    ` : ''}
                    <button class="btn btn-sm btn-secondary" onclick="instructor.viewCourseDetails('${course.id}')">View Details</button>
                </div>
            </div>
        `).join('');
    }

    setupCourseModals() {
        this.updateAvailabilityModal = document.getElementById('updateAvailabilityModal');
        this.updateAttendanceModal = document.getElementById('updateAttendanceModal');
        this.updateAvailabilityForm = document.getElementById('updateAvailabilityForm');
        this.updateAttendanceForm = document.getElementById('updateAttendanceForm');
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.style.display = 'none';
    }

    async handleAvailabilityUpdate(form) {
        const formData = new FormData(form);
        const availability = formData.get('availability');

        const currentUser = state.getState('currentUser');
        if (!currentUser) return;

        const result = await db.update('users', currentUser.id, { availability });
        if (result.success) {
            this.hideModal('updateAvailabilityModal');
            state.addNotification({
                type: 'success',
                message: 'Availability updated successfully'
            });
        } else {
            state.addNotification({
                type: 'error',
                message: result.message
            });
        }
    }

    async handleAttendanceUpdate(form) {
        const formData = new FormData(form);
        const courseId = formData.get('courseId');
        const attendanceData = {
            date: formData.get('date'),
            students: JSON.parse(formData.get('students'))
        };

        const result = await db.update('courses', courseId, {
            attendance: attendanceData
        });

        if (result.success) {
            this.hideModal('updateAttendanceModal');
            await this.loadAssignedCourses();
            state.addNotification({
                type: 'success',
                message: 'Attendance updated successfully'
            });
        } else {
            state.addNotification({
                type: 'error',
                message: result.message
            });
        }
    }

    async updateAttendance(courseId) {
        const result = await db.findOne('courses', { id: courseId });
        if (!result.success) return;

        const course = result.data;
        const form = document.getElementById('updateAttendanceForm');
        form.querySelector('[name="courseId"]').value = courseId;
        form.querySelector('[name="date"]').value = new Date().toISOString().split('T')[0];

        // Populate student list
        const studentList = form.querySelector('[name="students"]');
        studentList.value = JSON.stringify(course.enrolledStudents || []);

        this.showModal('updateAttendanceModal');
    }

    async viewCourseDetails(courseId) {
        const result = await db.findOne('courses', { id: courseId });
        if (!result.success) return;

        const course = result.data;
        // TODO: Implement course details modal
        console.log('View course details:', course);
    }

    updateUserInfo() {
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        const userRole = document.getElementById('userRole');

        if (this.currentUser) {
            // Set avatar initial
            if (userAvatar) {
                userAvatar.textContent = this.currentUser.username.charAt(0).toUpperCase();
            }

            // Set user name
            if (userName) {
                userName.textContent = this.currentUser.username;
            }

            // Set user role
            if (userRole) {
                userRole.textContent = this.currentUser.role.charAt(0).toUpperCase() + this.currentUser.role.slice(1);
            }
        }
    }

    async handleLogout() {
        try {
            console.log('=== Starting handleLogout ===');
            
            // Perform logout
            await auth.logout();
            console.log('Auth.logout completed');
            
            // Hide the entire dashboard container and all its contents
            const dashboardContainer = document.querySelector('.dashboard-container');
            if (dashboardContainer) {
                dashboardContainer.style.display = 'none';
            }

            // Hide the navigation container
            const navContainer = document.querySelector('.nav-container');
            if (navContainer) {
                navContainer.style.display = 'none';
            }

            // Hide the header and all its contents
            const header = document.querySelector('header');
            if (header) {
                header.style.display = 'none';
            }

            // Hide user profile section
            const userProfile = document.querySelector('.user-profile');
            if (userProfile) {
                userProfile.style.display = 'none';
            }

            // Hide all navigation items
            document.querySelectorAll('.nav-item').forEach(item => {
                item.style.display = 'none';
            });

            // Hide all content sections
            document.querySelectorAll('.content-section, .dashboard-section').forEach(section => {
                section.style.display = 'none';
            });
            
            // Reset class properties
            this.currentUser = null;
            this.currentDate = new Date();
            this.selectedDate = null;
            this.availableDates = [];
            this.confirmedDates = [];
            this.confirmedCourses = [];
            this.dateToRemove = null;
            
            // Clear notifications
            state.setState('notifications', []);
            
            // Remove any visible toast notifications
            const toast = document.querySelector('.toast');
            if (toast) {
                toast.className = 'toast';
                toast.textContent = '';
            }
            
            // Hide all modals
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
            
            // Clear section title
            const sectionTitle = document.getElementById('sectionTitle');
            if (sectionTitle) {
                sectionTitle.textContent = '';
            }
            
            // Show only login section and ensure it's properly styled
            const loginSection = document.getElementById('login');
            if (loginSection) {
                // Reset any previous styles
                loginSection.style.cssText = '';
                // Apply new styles
                loginSection.style.display = 'flex';
                loginSection.style.justifyContent = 'center';
                loginSection.style.alignItems = 'center';
                loginSection.style.minHeight = '100vh';
                loginSection.style.width = '100%';
                loginSection.style.position = 'fixed';
                loginSection.style.top = '0';
                loginSection.style.left = '0';
                loginSection.style.background = '#fff';
                loginSection.style.zIndex = '9999';
            }

            // Clear any form inputs
            const usernameInput = document.getElementById('username');
            if (usernameInput) {
                usernameInput.value = '';
            }
            
            console.log('=== Logout Process Completed Successfully ===');
        } catch (error) {
            console.error('Error during logout:', error);
            state.addNotification({
                type: 'error',
                message: 'Error during logout'
            });
        }
    }

    // Add helper method for calendar reset
    resetCalendar() {
        const calendar = document.getElementById('availabilityCalendar');
        if (calendar) {
            // Remove all available markers
            const days = calendar.getElementsByClassName('calendar-day');
            Array.from(days).forEach(day => {
                day.classList.remove('available');
            });
        }
    }

    checkPermissions() {
        const currentUser = auth.getCurrentUser();
        if (!currentUser || currentUser.role !== 'instructor') {
            // Show login section instead of redirecting
            const loginSection = document.getElementById('login');
            if (loginSection) {
                loginSection.style.display = 'block';
            }
        }
    }

    createDayElement(day, isToday = false, isAvailable = false, isConfirmed = false) {
        const div = document.createElement('div');
        div.className = 'calendar-day';
        
        if (isToday) div.classList.add('today');
        if (isAvailable) div.classList.add('available');
        if (isConfirmed) div.classList.add('confirmed');
        
        if (day) {
            div.innerHTML = `
                <div class="date">${day}</div>
                ${isAvailable ? '<div class="status">A</div>' : ''}
                ${isConfirmed ? '<div class="status">C</div>' : ''}
            `;
            
            div.addEventListener('click', () => this.handleDayClick(new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day)));
        }
        
        return div;
    }

    isSameDate(date1, date2) {
        return date1.getDate() === date2.getDate() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getFullYear() === date2.getFullYear();
    }

    async handleDayClick(date) {
        // Format the date string without timezone conversion
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        console.log('=== handleDayClick START ===');
        console.log('Clicked date:', dateStr);
        console.log('Original date object:', date);
        console.log('Is date available:', this.isDateAvailable(date));
        console.log('Current availableDates:', this.availableDates);
        
        if (this.isDateConfirmed(date)) {
            console.log('Date is confirmed, showing course details');
            this.showCourseDetails(dateStr);
            return;
        }
        
        // Toggle availability
        if (this.isDateAvailable(date)) {
            console.log('Date is available, proceeding to remove');
            await this.removeAvailability(dateStr);
        } else {
            console.log('Date is not available, proceeding to add');
            await this.addAvailability(dateStr);
        }
        console.log('=== handleDayClick END ===');
    }

    isDateAvailable(date) {
        // Format the date string without timezone conversion
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        return this.availableDates.includes(dateStr);
    }

    isDateConfirmed(date) {
        // Format the date string without timezone conversion
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        return this.confirmedDates.includes(dateStr);
    }

    formatDateForDisplay(dateStr) {
        console.log('=== formatDateForDisplay START ===');
        console.log('Input dateStr:', dateStr);
        
        // Parse the date string into components
        const [year, month, day] = dateStr.split('-').map(num => parseInt(num, 10));
        console.log('Parsed components:', { year, month, day });
        
        // Create date using local timezone (months are 0-based in JS)
        const date = new Date(year, month - 1, day);
        console.log('Created Date object:', date);
        console.log('Date components:', {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
            hours: date.getHours(),
            minutes: date.getMinutes(),
            timezone: date.getTimezoneOffset()
        });
        
        const formatted = date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        console.log('Formatted result:', formatted);
        console.log('=== formatDateForDisplay END ===');
        return formatted;
    }

    async addAvailability(dateStr) {
        console.log('=== addAvailability START ===');
        console.log('Adding availability for date:', dateStr);
        console.log('Current user:', this.currentUser);
        console.log('Current availableDates:', this.availableDates);
        
        try {
            console.log('Creating availability record in database...');
            const result = await db.create('instructor_availability', {
                instructorId: this.currentUser.id,
                date: dateStr,
                status: 'available'
            });
            console.log('Database create result:', result);
            
            if (result.success) {
                console.log('Successfully created availability record');
                // Update local state
                this.availableDates.push(dateStr);
                console.log('Updated availableDates:', this.availableDates);
                
                // Update UI immediately
                console.log('Updating calendar UI...');
                await this.initializeCalendar();
                console.log('Calendar UI updated');
                
                // Show success notification with properly formatted date
                const formattedDate = this.formatDateForDisplay(dateStr);
                console.log('Showing success notification for:', formattedDate);
                state.addNotification({
                    type: 'success',
                    message: `YOU ARE NOW AVAILABLE FOR ${formattedDate}`
                });
                console.log('Success notification shown');
            } else {
                console.error('Failed to create availability record:', result);
                throw new Error(result.message || 'Failed to add availability');
            }
        } catch (error) {
            console.error('Error in addAvailability:', error);
            state.addNotification({
                type: 'error',
                message: 'Failed to mark date as available'
            });
        }
        console.log('=== addAvailability END ===');
    }

    async removeAvailability(dateStr) {
        console.log('=== removeAvailability START ===');
        console.log('Date to remove:', dateStr);
        console.log('Current availableDates:', this.availableDates);
        
        // Clear any existing notifications first
        state.setState('notifications', []);
        
        // Store the date to be removed in the class property
        this.dateToRemove = dateStr;
        console.log('Stored dateToRemove:', this.dateToRemove);
        
        // Show confirmation modal
        const modal = document.getElementById('confirmRemoveModal');
        console.log('Modal element:', modal);
        if (modal) {
            // Update modal text to show the date
            const formattedDate = this.formatDateForDisplay(dateStr);
            const modalText = modal.querySelector('p');
            if (modalText) {
                modalText.textContent = `Are you sure you want to remove availability for ${formattedDate}?`;
            }
            modal.style.display = 'flex';
            console.log('Modal displayed with date:', formattedDate);
        } else {
            console.error('Modal not found!');
        }
        console.log('=== removeAvailability END ===');
    }

    async confirmRemoveAvailability() {
        console.log('=== confirmRemoveAvailability START ===');
        console.log('Current dateToRemove:', this.dateToRemove);
        console.log('Current user:', this.currentUser);
        console.log('Current availableDates:', this.availableDates);
        
        try {
            if (!this.dateToRemove) {
                console.error('No dateToRemove found!');
                throw new Error('No date selected for removal');
            }

            // Clear any existing notifications
            state.setState('notifications', []);

            // Find the availability record
            console.log('Searching for availability record...');
            const availabilityRecord = await db.read('instructor_availability', {
                instructorId: this.currentUser.id,
                date: this.dateToRemove
            });
            console.log('Availability record result:', availabilityRecord);

            if (!availabilityRecord.success || !availabilityRecord.data || availabilityRecord.data.length === 0) {
                console.log('No availability record found to remove');
                return;
            }

            // Get the record ID
            const recordId = availabilityRecord.data[0].id;
            console.log('Found record ID:', recordId);

            // Delete the record using the ID
            console.log('Attempting to delete record...');
            const result = await db.delete('instructor_availability', recordId);
            console.log('Delete result:', result);

            if (result.success) {
                // Update local state
                console.log('Updating local state...');
                this.availableDates = this.availableDates.filter(d => d !== this.dateToRemove);
                console.log('Updated availableDates:', this.availableDates);
                
                // Hide the modal first
                console.log('Hiding modal...');
                this.hideModal('confirmRemoveModal');
                console.log('Modal hidden');
                
                // Update UI
                console.log('Updating calendar UI...');
                await this.initializeCalendar();
                console.log('Calendar updated');
                
                // Show success notification with the correct date
                const formattedDate = this.formatDateForDisplay(this.dateToRemove);
                state.addNotification({
                    type: 'success',
                    message: `YOU ARE NO LONGER AVAILABLE FOR ${formattedDate}`
                });

                // Clear the date to remove
                this.dateToRemove = null;
                console.log('dateToRemove cleared');
            } else {
                console.error('Delete operation failed:', result);
                throw new Error('Failed to remove availability');
            }
        } catch (error) {
            console.error('Error in confirmRemoveAvailability:', error);
            state.addNotification({
                type: 'error',
                message: 'Failed to remove availability'
            });
        }
        console.log('=== confirmRemoveAvailability END ===');
    }

    async initializeDashboard() {
        try {
            // Update instructor stats
            await this.updateInstructorStats();
            
            // Load assigned courses
            await this.loadAssignedCourses();
            
            // Update alerts
            this.updateAlerts();
            
            // Show dashboard section
            const dashboardSection = document.getElementById('dashboard');
            if (dashboardSection) {
                dashboardSection.style.display = 'block';
            }
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            state.addNotification({
                type: 'error',
                message: 'Failed to initialize dashboard'
            });
        }
    }

    async clearStorage() {
        console.log('=== Starting clearStorage ===');
        try {
            // Clear all localStorage
            localStorage.clear();
            console.log('LocalStorage cleared');

            // Reset class properties
            this.currentUser = null;
            this.currentDate = new Date();
            this.selectedDate = null;
            this.availableDates = [];
            this.confirmedDates = [];
            this.confirmedCourses = [];
            this.dateToRemove = null;
            console.log('Class properties reset');

            // Clear database tables
            await db.delete('instructor_availability', {});
            await db.delete('courses', {});
            console.log('Database tables cleared');

            // Clear notifications from state
            state.setState('notifications', []);
            console.log('Notifications cleared');

            // Hide all modals
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
            console.log('All modals hidden');

            // Reset UI
            this.resetCalendar();
            this.updateUserInfo();
            
            // Show login section
            const loginSection = document.getElementById('login');
            if (loginSection) {
                loginSection.style.display = 'block';
            }
            console.log('UI reset');

            // Remove any visible toast notifications
            const toast = document.querySelector('.toast');
            if (toast) {
                toast.className = 'toast';
                toast.textContent = '';
            }
            console.log('Toast notifications cleared');

            console.log('=== clearStorage completed successfully ===');
        } catch (error) {
            console.error('Error clearing storage:', error);
        }
    }
}

// Export singleton instance
const instructor = new InstructorPortal();
export default instructor; 