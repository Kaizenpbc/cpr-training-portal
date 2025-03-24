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
        
        const courses = JSON.parse(localStorage.getItem('courses') || '[]');
        console.log('All courses from localStorage:', courses);
        
        const organizations = JSON.parse(localStorage.getItem('organizations') || '[]');
        console.log('All organizations from localStorage:', organizations);
        
        const instructors = JSON.parse(localStorage.getItem('instructors') || '[]');
        console.log('All instructors from localStorage:', instructors);
        
        // Filter for both PENDING and SCHEDULED courses
        const scheduledCourses = courses.filter(course => 
            course.status === 'SCHEDULED' || course.status === 'PENDING'
        );
        console.log('Filtered scheduled courses:', scheduledCourses);
        
        // Get the table body and organization filter
        const tableBody = document.getElementById('scheduledCoursesTableBody');
        const orgFilter = document.getElementById('organizationFilter');
        
        if (!tableBody) {
            console.error('scheduledCoursesTableBody element not found!');
            return;
        }
        console.log('Found scheduledCoursesTableBody element');

        // Update organization filter options
        if (orgFilter) {
            orgFilter.innerHTML = `
                <option value="">All Organizations</option>
                ${organizations.map(org => `
                    <option value="${org.id}">${org.name}</option>
                `).join('')}
            `;
        }

        // Filter courses by selected organization
        const selectedOrgId = orgFilter ? orgFilter.value : '';
        const filteredCourses = selectedOrgId 
            ? scheduledCourses.filter(course => course.organizationId === selectedOrgId)
            : scheduledCourses;
        console.log('Courses filtered by organization:', filteredCourses);

        if (filteredCourses.length === 0) {
            console.log('No scheduled courses found, displaying empty message');
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center">No scheduled courses available</td>
                </tr>
            `;
            return;
        }

        // Sort courses by date
        filteredCourses.sort((a, b) => new Date(a.date) - new Date(b.date));
        console.log('Sorted scheduled courses:', filteredCourses);

        // Update the table
        tableBody.innerHTML = filteredCourses.map(course => {
            // Get organization name
            const organization = organizations.find(org => org.id === course.organizationId);
            const orgName = organization ? organization.name : 'N/A';
            console.log(`Organization for course ${course.id}:`, organization);

            // Get instructor name
            const instructor = instructors.find(inst => inst.id === course.instructorId);
            const instructorName = instructor ? instructor.name : 'Not Assigned';
            console.log(`Instructor for course ${course.id}:`, instructor);

            // Check if any instructors are available for this course date
            const availableInstructors = instructors.filter(inst => 
                inst.availability && 
                inst.availability.some(date => 
                    this.isSameDay(new Date(date), new Date(course.date))
                )
            );
            const hasAvailableInstructors = availableInstructors.length > 0;

            return `
                <tr>
                    <td>${this.formatDate(course.date)}</td>
                    <td>${orgName}</td>
                    <td>${course.location || 'N/A'}</td>
                    <td>${course.classType || 'N/A'}</td>
                    <td>${course.studentsRegistered || 0}</td>
                    <td>
                        <span class="status status-${course.status.toLowerCase()}">${course.status}</span>
                    </td>
                    <td>${instructorName}</td>
                    <td>
                        <button class="btn btn-sm btn-info" onclick="adminPortal.viewCourseDetails('${course.id}')">
                            View Details
                        </button>
                        ${course.status === 'PENDING' ? `
                            ${hasAvailableInstructors ? `
                                <button class="btn btn-sm btn-primary" onclick="adminPortal.showInstructorSelectionModal('${course.id}')">
                                    Schedule
                                </button>
                            ` : `
                                <button class="btn btn-sm btn-secondary" disabled>
                                    No Instructor Available
                                </button>
                            `}
                        ` : ''}
                        ${course.status === 'SCHEDULED' ? `
                            <button class="btn btn-sm btn-success" onclick="adminPortal.confirmCourse('${course.id}')">
                                Confirm
                            </button>
                        ` : ''}
                    </td>
                </tr>
            `;
        }).join('');
        console.log('=== Completed updateScheduledCoursesTable ===');
    }

    updateConfirmedCoursesTable() {
        const courses = this.getCoursesFromStorage();
        const confirmedCourses = courses.filter(course => course.status === 'CONFIRMED');
        this.displayCoursesList('confirmedCoursesTableBody', confirmedCourses);
    }

    updateCompletedCoursesTable() {
        const courses = this.getCoursesFromStorage();
        const completedCourses = courses.filter(course => course.status === 'COMPLETED');
        this.displayCoursesList('completedCoursesTableBody', completedCourses);
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
        const instructors = this.getInstructorsFromStorage();
        const courses = this.getCoursesFromStorage();
        const tableBody = document.getElementById('instructorAvailabilityBody');
        if (!tableBody) return;

        // Prepare data with latest course information
        const instructorData = instructors.map(instructor => {
            const instructorCourses = courses.filter(course => course.instructor === instructor.name);
            const latestCourse = instructorCourses.length > 0 
                ? instructorCourses.reduce((latest, current) => 
                    new Date(current.date) > new Date(latest.date) ? current : latest
                )
                : null;

            const nextAvailableDate = instructor.availability && instructor.availability.length > 0
                ? instructor.availability.sort((a, b) => new Date(a) - new Date(b))[0]
                : null;

            return {
                name: instructor.name,
                date: nextAvailableDate ? new Date(nextAvailableDate) : null,
                status: this.getAvailabilityStatus(instructor),
                organization: instructor.organization || 'N/A',
                location: latestCourse ? latestCourse.location : 'N/A',
                classType: latestCourse ? latestCourse.classType : 'N/A',
                studentsRegistered: latestCourse ? latestCourse.studentsRegistered : '0',
                notes: instructor.notes || 'N/A'
            };
        });

        // Sort data if a sort column is selected
        if (this.sortConfig.column) {
            instructorData.sort((a, b) => {
                let comparison = 0;
                switch (this.sortConfig.column) {
                    case 'name':
                        comparison = a.name.localeCompare(b.name);
                        break;
                    case 'date':
                        // Handle null dates by treating them as earliest possible date
                        const dateA = a.date || new Date(0);
                        const dateB = b.date || new Date(0);
                        comparison = dateA - dateB;
                        break;
                    case 'status':
                        comparison = a.status.localeCompare(b.status);
                        break;
                    case 'organization':
                        comparison = a.organization.localeCompare(b.organization);
                        break;
                }
                return this.sortConfig.direction === 'asc' ? comparison : -comparison;
            });
        }

        // Render sorted data
        tableBody.innerHTML = instructorData.map(data => `
            <tr>
                <td>${data.name}</td>
                <td>${data.date ? this.formatDate(data.date) : 'N/A'}</td>
                <td>${data.status}</td>
                <td>${data.organization}</td>
                <td>${data.location}</td>
                <td>${data.classType}</td>
                <td>${data.studentsRegistered}</td>
                <td>${data.notes}</td>
            </tr>
        `).join('');
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
        if (!confirm('Are you sure you want to confirm this course?')) {
            return;
        }

        const courses = JSON.parse(localStorage.getItem('courses') || '[]');
        const courseIndex = courses.findIndex(c => c.id === courseId);

        if (courseIndex === -1) {
            alert('Course not found');
            return;
        }

        // Update course status to confirmed
        courses[courseIndex].status = 'CONFIRMED';
        localStorage.setItem('courses', JSON.stringify(courses));

        // Update the tables
        this.updateScheduledCoursesTable();
        this.updateConfirmedCoursesTable();
        this.updateDashboardData();

        alert('Course confirmed successfully');
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
        const courses = JSON.parse(localStorage.getItem('courses') || '[]');
        const course = courses.find(c => c.id === courseId);
        const instructors = JSON.parse(localStorage.getItem('instructors') || '[]');
        
        if (!course) {
            alert('Course not found');
            return;
        }

        // Filter available instructors for the course date
        const availableInstructors = instructors.filter(instructor => 
            instructor.availability && 
            instructor.availability.some(date => 
                this.isSameDay(new Date(date), new Date(course.date))
            )
        );

        if (availableInstructors.length === 0) {
            alert('No instructors available for this date');
            return;
        }

        // Create and show modal with instructor selection
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Select Instructor</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <p><strong>Course Date:</strong> ${this.formatDate(course.date)}</p>
                                <p><strong>Location:</strong> ${course.location || 'N/A'}</p>
                                <p><strong>Class Type:</strong> ${course.classType || 'N/A'}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Organization:</strong> ${course.organization?.name || 'N/A'}</p>
                                <p><strong>Students Registered:</strong> ${course.studentsRegistered || 0}</p>
                            </div>
                        </div>
                        <div class="table-responsive">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Instructor Name</th>
                                        <th>Organization</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${availableInstructors.map(instructor => `
                                        <tr>
                                            <td>${instructor.name}</td>
                                            <td>${instructor.organization || 'N/A'}</td>
                                            <td>
                                                <button class="btn btn-sm btn-primary" 
                                                    onclick="adminPortal.assignInstructor('${courseId}', '${instructor.id}')">
                                                    Assign
                                                </button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
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

    assignInstructor(courseId, instructorId) {
        const courses = JSON.parse(localStorage.getItem('courses') || '[]');
        const courseIndex = courses.findIndex(c => c.id === courseId);
        const instructors = JSON.parse(localStorage.getItem('instructors') || '[]');
        const instructor = instructors.find(inst => inst.id === instructorId);
        const organizations = JSON.parse(localStorage.getItem('organizations') || '[]');
        const organization = organizations.find(org => org.id === courses[courseIndex].organizationId);

        if (courseIndex === -1 || !instructor) {
            alert('Course or instructor not found');
            return;
        }

        // Update course with instructor information
        courses[courseIndex].instructorId = instructorId;
        courses[courseIndex].instructorName = instructor.name;
        courses[courseIndex].status = 'SCHEDULED';

        // Update instructor's record with course and organization info
        const instructorIndex = instructors.findIndex(inst => inst.id === instructorId);
        if (instructorIndex !== -1) {
            // Remove the assigned date from availability
            instructors[instructorIndex].availability = instructors[instructorIndex].availability
                .filter(date => !this.isSameDay(new Date(date), new Date(courses[courseIndex].date)));
            
            // Add or update the course in instructor's courses
            if (!instructors[instructorIndex].courses) {
                instructors[instructorIndex].courses = [];
            }
            
            const existingCourseIndex = instructors[instructorIndex].courses.findIndex(c => c.id === courseId);
            if (existingCourseIndex === -1) {
                instructors[instructorIndex].courses.push({
                    id: courseId,
                    date: courses[courseIndex].date,
                    location: courses[courseIndex].location,
                    classType: courses[courseIndex].classType,
                    studentsRegistered: courses[courseIndex].studentsRegistered,
                    status: 'SCHEDULED',
                    organization: {
                        id: organization.id,
                        name: organization.name
                    }
                });
            } else {
                instructors[instructorIndex].courses[existingCourseIndex] = {
                    ...instructors[instructorIndex].courses[existingCourseIndex],
                    status: 'SCHEDULED',
                    organization: {
                        id: organization.id,
                        name: organization.name
                    }
                };
            }
        }

        // Save changes
        localStorage.setItem('courses', JSON.stringify(courses));
        localStorage.setItem('instructors', JSON.stringify(instructors));

        // Update the tables
        this.updateScheduledCoursesTable();
        this.updateInstructorAvailability();

        // Close the modal
        const modal = document.querySelector('.modal');
        if (modal) {
            const modalInstance = bootstrap.Modal.getInstance(modal);
            if (modalInstance) {
                modalInstance.hide();
            }
        }

        alert('Instructor assigned successfully');
    }
}

// Initialize the admin portal when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminPortal = new AdminPortal();
});