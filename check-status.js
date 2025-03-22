function checkCourseStatuses() {
    console.log('\n=== Current Course Statuses ===');
    
    try {
        const courses = JSON.parse(localStorage.getItem('courses') || '[]');
        
        if (courses.length === 0) {
            console.log('No courses found in the system.');
            return;
        }

        courses.forEach((course, index) => {
            console.log(`\nCourse ${index + 1}:`);
            console.log('ID:', course.id);
            console.log('Date:', course.date);
            console.log('Status:', course.status);
            console.log('Admin Scheduled Status:', course.adminScheduledDashStatus);
            console.log('Admin Instructor Status:', course.adminInstructorDashStatus);
            console.log('Organization Status:', course.organizationStatus);
            console.log('Instructor Status:', course.instructorStatus);
            console.log('Admin Confirmed:', course.adminConfirmed);
            console.log('Instructor ID:', course.instructorId || 'Not Assigned');
            console.log('Instructor Name:', course.instructorName || 'Not Assigned');
            console.log('Organization:', course.organization?.name || 'Not Set');
            console.log('Display Flags:');
            console.log('- Instructor Details:', course.displayInstructorDetails);
            console.log('- Organization Details:', course.displayOrgDetails);
            console.log('- Hide Org Details:', course.hideOrgDetails);
            console.log('------------------------');
        });
    } catch (error) {
        console.error('Error checking course statuses:', error);
    }
}

// Run the status check
checkCourseStatuses(); 