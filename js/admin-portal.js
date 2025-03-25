// Admin Portal JavaScript
class AdminPortal {
    constructor() {
        console.log('AdminPortal constructor called');
        // Initialize data first
        this.initializeDataIfNeeded();
        
        this.sortConfig = {
            column: null,
            direction: 'asc'
        };

        // Get the current section from localStorage or default to dashboard
        this.currentSection = localStorage.getItem('currentSection') || 'dashboard';
        console.log('Current section from storage:', this.currentSection);

        // Initialize event listeners and load data
        this.initializeEventListeners();
        this.loadInitialData();
    }

    initializeDataIfNeeded() {
        // Check if we have any data in localStorage
        if (!localStorage.getItem('courses')) {
            localStorage.setItem('courses', JSON.stringify([]));
        }
        if (!localStorage.getItem('instructors')) {
            localStorage.setItem('instructors', JSON.stringify([]));
        }
        if (!localStorage.getItem('organizations')) {
            localStorage.setItem('organizations', JSON.stringify([]));
        }
        console.log('Initialized empty data arrays');
    }

    initializeEventListeners() {
        // Navigation buttons
        document.querySelectorAll('.nav-button').forEach(button => {
            // Only add click event if it's a section button
            if (button.dataset.section) {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    const sectionId = e.currentTarget.dataset.section;
                    this.showSection(sectionId);
                });
            }
        });

        // Reset data confirmation
        const resetBtn = document.getElementById('resetDataBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.showResetDataConfirmation();
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        // Sortable columns
        document.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', () => {
                const column = header.dataset.sort;
                this.handleSort(column);
            });
        });

        // Initialize organization info if we're on the instructor dashboard
        const instructorDash = document.getElementById('instructorDash');
        if (instructorDash) {
            this.updateOrganizationInfo();
        }
    }

    handleSort(column) {
        if (this.sortConfig.column === column) {
            // Toggle direction if clicking the same column
            this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
        } else {
            // New column, default to ascending
            this.sortConfig.column = column;
            this.sortConfig.direction = 'asc';
        }

        // Update sort icons
        document.querySelectorAll('.sortable i').forEach(icon => {
            icon.className = 'fas fa-sort';
        });
        const currentHeader = document.querySelector(`[data-sort="${column}"] i`);
        currentHeader.className = `fas fa-sort-${this.sortConfig.direction}`;

        // Refresh the table with sorted data
        this.updateInstructorAvailability();
    }

    loadInitialData() {
        console.log('loadInitialData called with currentSection:', this.currentSection);
        
        // First update dashboard data
        this.updateDashboardData();
        
        // Hide all sections first
        document.querySelectorAll('.section').forEach(section => {
            section.style.display = 'none';
        });
        
        // Show the current section
        const currentSection = document.getElementById(this.currentSection);
        if (currentSection) {
            currentSection.style.display = 'block';
            console.log('Showing section:', this.currentSection);
        }
        
        // Handle dashboard summary visibility
        const dashboardSummary = document.getElementById('dashboardSummary');
        if (dashboardSummary) {
            // Show dashboard summary for all sections except dashboard
            const shouldShowSummary = this.currentSection !== 'dashboard';
            dashboardSummary.style.display = shouldShowSummary ? 'block' : 'none';
            console.log('Dashboard summary visibility:', shouldShowSummary ? 'shown' : 'hidden');
        }
        
        // Clear all button active states
        document.querySelectorAll('.nav-button').forEach(button => {
            button.classList.remove('nav-button--active');
        });
        
        // Set active state for current section button
        const currentButton = document.querySelector(`[data-section="${this.currentSection}"]`);
        if (currentButton) {
            currentButton.classList.add('nav-button--active');
            console.log('Setting active button:', this.currentSection);
        }
        
        // Special handling for Scheduled Courses section
        if (this.currentSection === 'scheduledCourses') {
            // Show Instructor Dashboard section as well
            const instructorDash = document.getElementById('instructorDash');
            if (instructorDash) {
                instructorDash.style.display = 'block';
                console.log('Showing Instructor Dashboard with Scheduled Courses');
            }
        }
        
        // Update section specific content if not on dashboard
        if (this.currentSection !== 'dashboard') {
            console.log('Updating section content for:', this.currentSection);
            this.updateSectionContent(this.currentSection);
        }
    }

    showSection(sectionId) {
        console.log('=== Starting showSection ===');
        console.log('showSection called with sectionId:', sectionId);
        
        // First update dashboard data
        this.updateDashboardData();
        
        // Hide all sections first
        document.querySelectorAll('.section').forEach(section => {
            section.style.display = 'none';
        });
        console.log('Hidden all sections');

        // Handle dashboard summary visibility
        const dashboardSummary = document.getElementById('dashboardSummary');
        if (dashboardSummary) {
            // Show dashboard summary for all sections except dashboard
            const shouldShowSummary = sectionId !== 'dashboard';
            dashboardSummary.style.display = shouldShowSummary ? 'block' : 'none';
            console.log('Dashboard summary visibility:', shouldShowSummary ? 'shown' : 'hidden');
        }

        // Show selected section and activate its nav button
        const selectedSection = document.getElementById(sectionId);
        const selectedButton = document.querySelector(`[data-section="${sectionId}"]`);

        if (selectedSection && selectedButton) {
            // Update button states
            document.querySelectorAll('.nav-button').forEach(button => {
                button.classList.remove('nav-button--active');
            });
            selectedButton.classList.add('nav-button--active');
            console.log('Updated button states');
            
            // Update state
            this.currentSection = sectionId;
            localStorage.setItem('currentSection', sectionId);
            console.log('Updated current section in storage:', sectionId);
            
            // Special handling for Scheduled Courses section
            if (sectionId === 'scheduledCourses') {
                // Show sections in the correct order
                const instructorDash = document.getElementById('instructorDash');
                if (instructorDash) {
                    instructorDash.style.display = 'block';
                    console.log('Showing Instructor Dashboard with Scheduled Courses');
                }
                selectedSection.style.display = 'block';
                console.log('Showing Scheduled Courses section');
            } else {
                selectedSection.style.display = 'block';
                console.log('Showing section:', sectionId);
            }
            
            // Update section specific content
            if (sectionId !== 'dashboard') {
                console.log('Updating section content for:', sectionId);
                this.updateSectionContent(sectionId);
            }
        } else {
            console.error('Selected section or button not found:', sectionId);
        }
        console.log('=== Completed showSection ===');
    }

    updateSectionContent(sectionId) {
        console.log('=== Starting updateSectionContent ===');
        console.log('Updating section content for:', sectionId);
        
        switch(sectionId) {
            case 'scheduledCourses':
                console.log('Calling updateScheduledCoursesTable');
                this.updateScheduledCoursesTable();
                break;
            case 'confirmedCourses':
                console.log('Calling updateConfirmedCoursesTable');
                this.updateConfirmedCoursesTable();
                break;
            case 'completedCourses':
                console.log('Calling updateCompletedCoursesTable');
                this.updateCompletedCoursesTable();
                break;
            case 'instructorDash':
                console.log('Calling updateInstructorAvailability');
                this.updateInstructorAvailability();
                break;
            default:
                console.warn('Unknown section ID:', sectionId);
        }
        console.log('=== Completed updateSectionContent ===');
    }

    updateScheduledCoursesTable() {
        console.log('=== Starting updateScheduledCoursesTable ===');
        const tableBody = document.getElementById('scheduledCoursesTableBody');
        if (!tableBody) {
            console.error('scheduledCoursesTableBody not found');
            return;
        }

        const courses = JSON.parse(localStorage.getItem('courses') || '[]');
        const organizations = JSON.parse(localStorage.getItem('organizations') || '[]');
        const instructors = JSON.parse(localStorage.getItem('instructors') || '[]');

        // Get only unconfirmed courses
        const scheduledCourses = courses.filter(course => !course.adminConfirmed);
        
        if (scheduledCourses.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">No courses available</td>
                </tr>
            `;
            return;
        }

        // Sort courses by date
        scheduledCourses.sort((a, b) => new Date(a.date) - new Date(b.date));

        tableBody.innerHTML = scheduledCourses.map(course => {
            const organization = organizations.find(org => org.id === course.organizationId);
            const instructor = instructors.find(inst => inst.id === course.instructorId);
            
            // Determine status and button display
            const displayStatus = instructor ? 'SCHEDULED' : 'PENDING';
            const actionButton = instructor ? 
                `<button class="btn btn-success btn-sm" onclick="adminPortal.confirmCourse('${course.id}')">
                    Confirm
                </button>` :
                `<button class="btn btn-primary btn-sm" onclick="adminPortal.showInstructorSelectionModal('${course.id}')">
                    Schedule
                </button>`;

            return `
                <tr>
                    <td>${course.date}</td>
                    <td>${organization ? organization.name : course.organizationName || 'N/A'}</td>
                    <td>${course.location || 'N/A'}</td>
                    <td>${course.classType || 'N/A'}</td>
                    <td>${course.studentsRegistered || '0'}</td>
                    <td><span class="status-${displayStatus.toLowerCase()}">${displayStatus}</span></td>
                    <td>${instructor ? instructor.name : 'Not Assigned'}</td>
                    <td>
                        <button class="btn btn-info btn-sm" onclick="adminPortal.viewCourseDetails('${course.id}')">
                            View Details
                        </button>
                        ${actionButton}
                    </td>
                </tr>
            `;
        }).join('');
    }

    updateConfirmedCoursesTable() {
        console.log('=== Starting updateConfirmedCoursesTable ===');
        const tableBody = document.getElementById('confirmedCoursesTableBody');
        if (!tableBody) {
            console.error('confirmedCoursesTableBody not found');
            return;
        }

        const courses = JSON.parse(localStorage.getItem('courses') || '[]');
        const organizations = JSON.parse(localStorage.getItem('organizations') || '[]');
        const instructors = JSON.parse(localStorage.getItem('instructors') || '[]');

        // Get confirmed courses
        const confirmedCourses = courses.filter(course => 
            course.status === 'CONFIRMED' && course.adminConfirmed
        );
        
        if (confirmedCourses.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center">No confirmed courses</td>
                </tr>
            `;
            return;
        }

        // Sort courses by date
        confirmedCourses.sort((a, b) => new Date(a.date) - new Date(b.date));

        tableBody.innerHTML = confirmedCourses.map(course => {
            const organization = organizations.find(org => org.id === course.organizationId);
            const instructor = instructors.find(inst => inst.id === course.instructorId);

            return `
                <tr>
                    <td>${course.date}</td>
                    <td>${organization ? organization.name : 'N/A'}</td>
                    <td>${course.location || 'N/A'}</td>
                    <td>${course.classType || 'N/A'}</td>
                    <td>${course.studentsRegistered || '0'}</td>
                    <td>${course.studentsAttended || '0'}</td>
                    <td><span class="status-confirmed">CONFIRMED</span></td>
                    <td>${instructor ? instructor.name : 'N/A'}</td>
                    <td>
                        <button class="btn btn-info btn-sm" onclick="adminPortal.viewStudentList('${course.id}')">
                            View Students
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="adminPortal.billCourse('${course.id}')">
                            Bill
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    updateCompletedCoursesTable() {
        console.log('=== Starting updateCompletedCoursesTable ===');
        const tableBody = document.getElementById('completedCoursesTableBody');
        if (!tableBody) {
            console.error('completedCoursesTableBody not found');
            return;
        }

        const courses = JSON.parse(localStorage.getItem('courses') || '[]');
        const organizations = JSON.parse(localStorage.getItem('organizations') || '[]');
        const instructors = JSON.parse(localStorage.getItem('instructors') || '[]');

        // Get completed courses
        const completedCourses = courses.filter(course => 
            course.status === 'COMPLETED' || course.completionStatus === 'COMPLETED'
        );
        
        if (completedCourses.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">No completed courses</td>
                </tr>
            `;
            return;
        }

        // Sort courses by date
        completedCourses.sort((a, b) => new Date(b.date || b.courseDate) - new Date(a.date || a.courseDate));

        tableBody.innerHTML = completedCourses.map(course => {
            const organization = organizations.find(org => org.id === course.organizationId);
            const instructor = instructors.find(inst => inst.id === course.instructorId);

            return `
                <tr>
                    <td>${course.date || course.courseDate}</td>
                    <td>${organization ? organization.name : course.organizationName || 'N/A'}</td>
                    <td>${course.location || 'N/A'}</td>
                    <td>${course.classType || 'N/A'}</td>
                    <td>${course.studentsRegistered || '0'}</td>
                    <td>${course.studentsAttended || '0'}</td>
                    <td><span class="status-completed">COMPLETED</span></td>
                    <td>${instructor ? instructor.name : course.instructorName || 'N/A'}</td>
                    <td>
                        <button class="btn btn-info btn-sm" onclick="adminPortal.viewStudentList('${course.id}')">
                            View Students
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="adminPortal.billCourse('${course.id}')">
                            Bill
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        console.log('=== Completed updateCompletedCoursesTable ===');
    }

    updateDashboardData() {
        const courses = this.getCoursesFromStorage();
        const instructors = this.getInstructorsFromStorage();
        
        // Calculate overall stats first
        const stats = this.calculateStats(courses);
        this.displayDashboardStats(stats);
        
        // Get current and next week dates
        const today = new Date();
        const currentWeekStart = new Date(today.setDate(today.getDate() - today.getDay())); // Start of current week
        const nextWeekStart = new Date(currentWeekStart);
        nextWeekStart.setDate(currentWeekStart.getDate() + 7);
        const nextWeekEnd = new Date(nextWeekStart);
        nextWeekEnd.setDate(nextWeekStart.getDate() + 6);

        // Process each instructor's courses
        const instructorStats = instructors.map(instructor => {
            const instructorCourses = courses.filter(course => course.instructor === instructor.name);
            
            // Current week stats
            const currentWeekCourses = instructorCourses.filter(course => {
                const courseDate = new Date(course.date);
                return courseDate >= currentWeekStart && courseDate < nextWeekStart;
            });

            const currentWeekStats = {
                week: 'Current Week',
                name: instructor.name,
                scheduled: currentWeekCourses.filter(c => c.status === 'SCHEDULED').length,
                confirmed: currentWeekCourses.filter(c => c.status === 'CONFIRMED').length,
                completed: currentWeekCourses.filter(c => c.status === 'COMPLETED').length,
                total: currentWeekCourses.length
            };

            // Next week stats
            const nextWeekCourses = instructorCourses.filter(course => {
                const courseDate = new Date(course.date);
                return courseDate >= nextWeekStart && courseDate <= nextWeekEnd;
            });

            const nextWeekStats = {
                week: 'Next Week',
                name: instructor.name,
                scheduled: nextWeekCourses.filter(c => c.status === 'SCHEDULED').length,
                confirmed: nextWeekCourses.filter(c => c.status === 'CONFIRMED').length,
                completed: nextWeekCourses.filter(c => c.status === 'COMPLETED').length,
                total: nextWeekCourses.length
            };

            return [currentWeekStats, nextWeekStats];
        }).flat();

        // Update dashboard table
        const dashboardTable = document.getElementById('dashboardTableBody');
        if (dashboardTable) {
            dashboardTable.innerHTML = instructorStats.map(stats => `
                <tr>
                    <td>${stats.week}</td>
                    <td>${stats.name}</td>
                    <td>${stats.scheduled}</td>
                    <td>${stats.confirmed}</td>
                    <td>${stats.completed}</td>
                    <td>${stats.total}</td>
                </tr>
            `).join('');
            
            // Ensure the table is visible
            dashboardTable.closest('table').style.display = 'table';
        }

        // Update dashboard summary if it exists
        const dashboardSummaryBody = document.getElementById('dashboardSummaryBody');
        if (dashboardSummaryBody && this.currentSection !== 'dashboard') {
            dashboardSummaryBody.innerHTML = instructorStats.map(stats => `
                <tr>
                    <td>${stats.week}</td>
                    <td>${stats.name}</td>
                    <td>${stats.scheduled}</td>
                    <td>${stats.confirmed}</td>
                    <td>${stats.completed}</td>
                    <td>${stats.total}</td>
                </tr>
            `).join('');
        }

        // Log for debugging
        console.log('Dashboard data updated:', instructorStats);
    }

    updateInstructorAvailability() {
        console.log('=== Starting updateInstructorAvailability ===');
        const tableBody = document.getElementById('instructorAvailabilityBody');
        if (!tableBody) {
            console.error('instructorAvailabilityBody not found');
            return;
        }

        const instructors = JSON.parse(localStorage.getItem('instructors') || '[]');
        const courses = JSON.parse(localStorage.getItem('courses') || '[]');
        const organizations = JSON.parse(localStorage.getItem('organizations') || '[]');

        let rows = [];

        instructors.forEach(instructor => {
            // Get all dates where instructor is assigned
            const assignedDates = courses
                .filter(course => course.instructorId === instructor.id)
                .map(course => course.date);

            console.log('Instructor:', instructor.name);
            console.log('Assigned dates:', assignedDates);
            
            // Add rows for available dates (only if not assigned to a course)
            const availableDates = (instructor.availability || []).filter(date => 
                !assignedDates.includes(date)
            );

            console.log('Available dates:', availableDates);
            
            availableDates.forEach(date => {
                rows.push({
                    name: instructor.name,
                    date: date,
                    status: 'AVAILABLE',
                    organization: 'N/A',
                    location: 'N/A',
                    classType: 'N/A',
                    studentsRegistered: '0',
                    notes: 'N/A'
                });
            });

            // Add rows for assigned courses
            const assignedCourses = courses.filter(course => 
                course.instructorId === instructor.id
            );

            assignedCourses.forEach(course => {
                // Get organization name with multiple fallbacks
                const organization = organizations.find(org => org.id === course.organizationId);
                const organizationName = organization ? organization.name : 
                    (course.organizationName || course.organization?.name || 'N/A');

                rows.push({
                    name: instructor.name,
                    date: course.date,
                    status: course.adminInstructorDashStatus || course.status || 'SCHEDULED',
                    organization: organizationName,
                    location: course.location || 'N/A',
                    classType: course.classType || 'N/A',
                    studentsRegistered: course.studentsRegistered || '0',
                    notes: course.notes || 'N/A'
                });
            });
        });

        // Sort rows by date
        rows.sort((a, b) => new Date(a.date) - new Date(b.date));

        tableBody.innerHTML = rows.map(row => `
            <tr>
                <td>${row.name}</td>
                <td>${row.date}</td>
                <td><span class="status-${row.status.toLowerCase()}">${row.status}</span></td>
                <td>${row.organization}</td>
                <td>${row.location}</td>
                <td>${row.classType}</td>
                <td>${row.studentsRegistered}</td>
                <td>${row.notes}</td>
            </tr>
        `).join('');

        console.log('=== Completed updateInstructorAvailability ===');
    }

    updateCourseAssignments() {
        const courses = this.getCoursesFromStorage();
        const instructors = this.getInstructorsFromStorage();
        const tableBody = document.getElementById('instructorTableBody');
        if (!tableBody) return;

        const assignableCourses = courses.filter(course => 
            course.status === 'SCHEDULED' || course.status === 'CONFIRMED'
        );

        tableBody.innerHTML = assignableCourses.map(course => `
            <tr>
                <td>${course.name}</td>
                <td>${this.formatDate(course.date)}</td>
                <td>${course.location}</td>
                <td>${course.classType}</td>
                <td>${course.studentsRegistered}</td>
                <td>${course.instructor || 'Not Assigned'}</td>
                <td>${this.getInstructorAvailabilityForCourse(course, instructors)}</td>
                <td>
                    <button class="btn-action" onclick="adminPortal.assignInstructor('${course.id}')">
                        <i class="fas fa-user-plus"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    getCoursesFromStorage() {
        try {
            return JSON.parse(localStorage.getItem('courses')) || [];
        } catch (e) {
            console.error('Error reading courses from storage:', e);
            return [];
        }
    }

    getInstructorsFromStorage() {
        try {
            return JSON.parse(localStorage.getItem('instructors')) || [];
        } catch (e) {
            console.error('Error reading instructors from storage:', e);
            return [];
        }
    }

    calculateStats(courses) {
        return {
            scheduled: courses.filter(course => course.status === 'SCHEDULED').length,
            confirmed: courses.filter(course => course.status === 'CONFIRMED').length,
            completed: courses.filter(course => course.status === 'COMPLETED').length,
            total: courses.length
        };
    }

    displayDashboardStats(stats) {
        const elements = {
            'scheduledCount': stats.scheduled,
            'confirmedCount': stats.confirmed,
            'completedCount': stats.completed,
            'totalCount': stats.total
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    displayCoursesList(tableBodyId, courses) {
        const tableBody = document.getElementById(tableBodyId);
        if (!tableBody) return;

        tableBody.innerHTML = courses.map(course => `
            <tr>
                <td>${this.formatDate(course.date)}</td>
                <td>${course.organization}</td>
                <td>${course.location}</td>
                <td>${course.classType}</td>
                <td>${course.studentsRegistered}</td>
                <td>${this.getStatusBadge(course.status)}</td>
                <td>${course.instructor || 'Not Assigned'}</td>
                <td>
                    <button class="btn-action" onclick="adminPortal.viewCourseDetails('${course.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    displayInstructorCourses(courses) {
        const tableBody = document.getElementById('instructorTableBody');
        if (!tableBody) return;

        tableBody.innerHTML = courses.map(course => `
            <tr>
                <td>${course.name}</td>
                <td>${this.getStatusBadge(course.status)}</td>
                <td>${this.formatDate(course.date)}</td>
                <td>${course.organization}</td>
                <td>${course.location}</td>
                <td>${course.classType}</td>
                <td>${course.studentsRegistered}</td>
                <td>${course.instructor || 'Not Assigned'}</td>
                <td>
                    <button class="btn-action" onclick="adminPortal.assignInstructor('${course.id}')">
                        <i class="fas fa-user-plus"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'N/A';
        }
    }

    getStatusBadge(status) {
        const badgeClasses = {
            'SCHEDULED': 'badge--warning',
            'CONFIRMED': 'badge--success',
            'COMPLETED': 'badge--primary',
            'PENDING': 'badge--info'
        };

        return `<span class="badge ${badgeClasses[status] || ''}">${status}</span>`;
    }

    showResetDataConfirmation() {
        if (confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
            localStorage.clear();
            this.loadInitialData();
        }
    }

    handleLogout() {
        // Clear all portal state
        localStorage.removeItem('hasLoadedAdminPortal');
        localStorage.removeItem('currentSection');
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }

    viewCourseDetails(courseId) {
        const courses = JSON.parse(localStorage.getItem('courses') || '[]');
        const course = courses.find(c => c.id === courseId);
        
        if (!course) {
            alert('Course not found');
            return;
        }

        // Create and show modal with course details
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Course Details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Date:</strong> ${this.formatDate(course.date)}</p>
                                <p><strong>Location:</strong> ${course.location || 'N/A'}</p>
                                <p><strong>Class Type:</strong> ${course.classType || 'N/A'}</p>
                                <p><strong>Students Registered:</strong> ${course.studentsRegistered || 0}</p>
                                <p><strong>Status:</strong> ${course.status}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Organization:</strong> ${course.organization?.name || 'N/A'}</p>
                                <p><strong>Instructor:</strong> ${course.instructorName || 'Not Assigned'}</p>
                                <p><strong>Notes:</strong> ${course.notes || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();

        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }

    confirmCourse(courseId) {
        console.log('=== Starting confirmCourse ===');
        
        if (!confirm('Are you sure you want to confirm this course?')) {
            return;
        }

        const courses = JSON.parse(localStorage.getItem('courses') || '[]');
        const instructors = JSON.parse(localStorage.getItem('instructors') || '[]');
        const courseIndex = courses.findIndex(c => c.id === courseId);

        if (courseIndex === -1) {
            console.error('Course not found');
            return;
        }

        // Get existing course data
        const existingCourse = courses[courseIndex];
        console.log('Existing course before confirmation:', existingCourse);

        // Get instructor data
        const instructor = instructors.find(i => i.id === existingCourse.instructorId);
        
        // Update course status and visibility flags
        courses[courseIndex] = {
            ...existingCourse,
            // Status updates
            status: 'CONFIRMED',           // Organization Portal
            adminStatus: 'CONFIRMED',      // Admin Portal main status
            adminDashboardStatus: 'CONFIRMED', // Admin Dashboard status
            adminInstructorDashStatus: 'CONFIRMED', // Admin Instructor Dashboard status
            instructorStatus: 'CONFIRMED', // Now show as CONFIRMED in Instructor Portal
            
            // Instructor details
            instructorId: existingCourse.instructorId,
            instructorName: instructor ? instructor.name : existingCourse.instructorName,
            
            // Visibility flags - Now show everything
            showInstructorToOrg: true,      // Show instructor to org
            displayInstructorDetails: true,  // Display instructor details
            showOrgToInstructor: true,      // Show org to instructor
            displayInInstructorPortal: true, // Now show in instructor portal
            displayOrgDetails: true,         // Show org details
            hideOrgDetails: false,          // Don't hide org details
            adminConfirmed: true,
            
            // Organization details
            organizationName: existingCourse.organizationName || existingCourse.organization?.name,
            organizationId: existingCourse.organizationId
        };

        console.log('Updated course after confirmation:', courses[courseIndex]);
        localStorage.setItem('courses', JSON.stringify(courses));

        // Update all views
        this.updateDashboardData();
        this.updateScheduledCoursesTable();
        this.updateConfirmedCoursesTable();
        this.updateInstructorAvailability();

        // Show success message
        this.showNotification('Course confirmed successfully', 'success');
        
        console.log('=== Completed confirmCourse ===');
    }

    formatAvailableDates(availability) {
        if (!availability || availability.length === 0) {
            return 'No dates set';
        }
        
        // Sort dates and format them in ISO format
        return availability
            .sort((a, b) => new Date(a) - new Date(b))
            .map(date => this.formatDate(date))
            .join(', ');
    }

    getAvailabilityStatus(instructor) {
        if (!instructor.availability || instructor.availability.length === 0) {
            return '<span class="badge badge--warning">Not Available</span>';
        }
        return '<span class="badge badge--success">Available</span>';
    }

    getInstructorAvailabilityForCourse(course, instructors) {
        const courseDate = new Date(course.date);
        const availableInstructors = instructors.filter(instructor => 
            instructor.availability && 
            instructor.availability.some(date => 
                this.isSameDay(new Date(date), courseDate)
            )
        );

        if (availableInstructors.length === 0) {
            return '<span class="badge badge--warning">No Instructors Available</span>';
        }

        return `<span class="badge badge--success">${availableInstructors.length} Available</span>`;
    }

    isSameDay(date1, date2) {
        // Convert both dates to YYYY-MM-DD format for comparison
        const d1 = new Date(date1).toISOString().split('T')[0];
        const d2 = new Date(date2).toISOString().split('T')[0];
        return d1 === d2;
    }

    viewInstructorDetails(instructorId) {
        // To be implemented: Show instructor details modal
        console.log('Viewing instructor details:', instructorId);
    }

    updateOrganizationInfo() {
        try {
            // Get all organizations
            const organizations = JSON.parse(localStorage.getItem('organizations')) || [];
            const instructors = JSON.parse(localStorage.getItem('instructors')) || [];
            const courses = JSON.parse(localStorage.getItem('courses')) || [];

            // Get the current organization (for now, using the first one)
            const currentOrg = organizations[0];

            const elements = {
                'currentOrganization': currentOrg?.name || 'N/A',
                'orgId': currentOrg?.id || 'N/A',
                'orgContact': currentOrg?.contactPerson || 'N/A',
                'orgEmail': currentOrg?.email || 'N/A',
                'orgPhone': currentOrg?.phone || 'N/A',
                'orgInstructorCount': instructors.filter(instructor => 
                    instructor.organizationId === currentOrg?.id
                ).length,
                'orgActiveCourses': courses.filter(course => 
                    course.organizationId === currentOrg?.id && 
                    ['SCHEDULED', 'CONFIRMED'].includes(course.status)
                ).length
            };

            Object.entries(elements).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = value;
                }
            });
        } catch (error) {
            console.error('Error updating organization info:', error);
        }
    }

    showInstructorSelectionModal(courseId) {
        console.log('=== Starting showInstructorSelectionModal ===');
        const courses = JSON.parse(localStorage.getItem('courses') || '[]');
        const instructors = JSON.parse(localStorage.getItem('instructors') || '[]');
        const course = courses.find(c => c.id === courseId);

        if (!course) {
            console.error('Course not found');
            return;
        }

        // Get available instructors for this date
        const availableInstructors = instructors.filter(instructor => {
            // Check if instructor has this date available
            const hasDateAvailable = instructor.availability && 
                instructor.availability.includes(course.date);

            // Check if instructor doesn't have another course on this date
            const hasNoConflict = !courses.some(c => 
                c.instructorId === instructor.id && 
                c.date === course.date
            );

            return hasDateAvailable && hasNoConflict;
        });

        // Create modal HTML
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Assign Instructor</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="course-details mb-3">
                            <h6>Course Details:</h6>
                            <p>Date: ${course.date}</p>
                            <p>Location: ${course.location}</p>
                            <p>Type: ${course.classType}</p>
                        </div>
                        ${availableInstructors.length > 0 ? `
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${availableInstructors.map(instructor => `
                                        <tr>
                                            <td>${instructor.name}</td>
                                            <td>
                                                <button class="btn btn-primary btn-sm" 
                                                    onclick="adminPortal.assignInstructor('${course.id}', '${instructor.id}')">
                                                    Assign
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        ` : '<p class="text-center">No Instructors Available</p>'}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        const modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();

        modal.addEventListener('hidden.bs.modal', () => {
            document.body.removeChild(modal);
        });
    }

    assignInstructor(courseId, instructorId) {
        console.log('=== Starting assignInstructor ===');
        
        const courses = JSON.parse(localStorage.getItem('courses') || '[]');
        const instructors = JSON.parse(localStorage.getItem('instructors') || '[]');
        const courseIndex = courses.findIndex(c => c.id === courseId);
        const instructorIndex = instructors.findIndex(i => i.id === instructorId);

        if (courseIndex === -1 || instructorIndex === -1) {
            console.error('Course or instructor not found');
            return;
        }

        // Get existing course and instructor data
        const existingCourse = courses[courseIndex];
        const instructor = instructors[instructorIndex];
        console.log('Existing course before assignment:', existingCourse);
        console.log('Instructor before update:', instructor);

        // Remove the assigned date from instructor's availability
        instructor.availability = (instructor.availability || []).filter(date => 
            date !== existingCourse.date
        );
        localStorage.setItem('instructors', JSON.stringify(instructors));
        console.log('Updated instructor availability:', instructor.availability);

        // Update course with instructor and status
        courses[courseIndex] = {
            ...existingCourse,
            instructorId: instructorId,
            instructorName: instructor.name,
            
            // Status updates
            status: 'PENDING',           // Organization Portal
            adminStatus: 'SCHEDULED',    // Admin Portal main status
            adminDashboardStatus: 'SCHEDULED', // Admin Dashboard status
            adminInstructorDashStatus: 'SCHEDULED', // Admin Instructor Dashboard status
            instructorStatus: 'AVAILABLE',  // Instructor Portal - stays AVAILABLE
            
            // Visibility flags
            showInstructorToOrg: false,     // Don't show instructor to org yet
            displayInstructorDetails: false, // Don't display instructor details yet
            showOrgToInstructor: false,     // Don't show org to instructor yet
            displayInInstructorPortal: false, // Don't show in instructor portal yet
            displayOrgDetails: true,        // Show org details in admin view
            hideOrgDetails: false,          // Don't hide org details in admin view
            adminConfirmed: false,
            
            // Organization details
            organizationName: existingCourse.organizationName || existingCourse.organization?.name,
            organizationId: existingCourse.organizationId
        };

        console.log('Updated course after assignment:', courses[courseIndex]);
        localStorage.setItem('courses', JSON.stringify(courses));

        // Update all views
        this.updateDashboardData();
        this.updateScheduledCoursesTable();
        this.updateConfirmedCoursesTable();
        this.updateInstructorAvailability();

        // Hide modal if it exists
        const modal = document.getElementById('instructorSelectionModal');
        if (modal) {
            modal.style.display = 'none';
        }

        console.log('=== Completed assignInstructor ===');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} notification`;
        notification.textContent = message;
        
        // Position the notification
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.zIndex = '1000';
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    billCourse(courseId) {
        console.log('=== Starting billCourse ===');
        try {
            const courses = JSON.parse(localStorage.getItem('courses') || '[]');
            const courseIndex = courses.findIndex(c => c.id === courseId);
            
            if (courseIndex === -1) {
                this.showNotification('Course not found', 'error');
                return;
            }

            const course = courses[courseIndex];
            
            // Create a new invoice
            const invoice = {
                id: 'inv_' + Date.now(),
                courseId: courseId,
                organizationId: course.organizationId,
                organizationName: course.organizationName,
                date: new Date().toISOString().split('T')[0],
                amount: this.calculateInvoiceAmount(course),
                status: 'PENDING',
                details: {
                    courseDate: course.date || course.courseDate,
                    classType: course.classType,
                    location: course.location,
                    studentsRegistered: course.studentsRegistered,
                    studentsAttended: course.studentsAttended,
                    instructorName: course.instructorName
                }
            };

            // Save invoice
            const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
            invoices.push(invoice);
            localStorage.setItem('invoices', JSON.stringify(invoices));

            // Update course with invoice reference
            courses[courseIndex] = {
                ...course,
                invoiceId: invoice.id,
                invoiceStatus: 'PENDING',
                billingStatus: 'PENDING'
            };
            localStorage.setItem('courses', JSON.stringify(courses));

            // Update displays
            this.updateCompletedCoursesTable();
            this.showNotification('Invoice created successfully', 'success');
            
            console.log('=== Completed billCourse ===');
        } catch (error) {
            console.error('Error in billCourse:', error);
            this.showNotification('Error creating invoice', 'error');
        }
    }

    calculateInvoiceAmount(course) {
        // This is a placeholder implementation
        // You should implement your actual billing logic here
        const baseAmount = 100; // Base amount per student
        const studentsAttended = course.studentsAttended || 0;
        return baseAmount * studentsAttended;
    }

    viewStudentList(courseId) {
        console.log('=== Starting viewStudentList ===');
        try {
            const courses = JSON.parse(localStorage.getItem('courses') || '[]');
            const course = courses.find(c => c.id === courseId);
            
            if (!course) {
                this.showNotification('Course not found', 'error');
                return;
            }

            // Create modal content
            const modalContent = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Student List - ${course.classType || 'Course'}</h3>
                        <button type="button" class="close" onclick="adminPortal.closeModal('studentListModal')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="course-info mb-3">
                            <p><strong>Date:</strong> ${course.date}</p>
                            <p><strong>Organization:</strong> ${course.organizationName || 'N/A'}</p>
                            <p><strong>Location:</strong> ${course.location || 'N/A'}</p>
                            <p><strong>Instructor:</strong> ${course.instructorName || 'N/A'}</p>
                        </div>
                        <div class="student-list">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Status</th>
                                        <th>Attendance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${course.studentList ? 
                                        course.studentList.map(student => `
                                            <tr>
                                                <td>${student.name || 'N/A'}</td>
                                                <td>${student.email || 'N/A'}</td>
                                                <td>${student.status || 'Registered'}</td>
                                                <td>${student.attendance || 'Not Recorded'}</td>
                                            </tr>
                                        `).join('') : 
                                        '<tr><td colspan="4" class="text-center">No students registered</td></tr>'
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="adminPortal.closeModal('studentListModal')">Close</button>
                    </div>
                </div>
            `;

            // Create or update the modal
            let modal = document.getElementById('studentListModal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'studentListModal';
                modal.className = 'modal';
                document.body.appendChild(modal);
            }
            modal.innerHTML = modalContent;
            modal.style.display = 'block';
            
        } catch (error) {
            console.error('Error viewing student list:', error);
            this.showNotification('Error viewing student list', 'error');
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }
}

// Initialize the admin portal when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminPortal = new AdminPortal();
});