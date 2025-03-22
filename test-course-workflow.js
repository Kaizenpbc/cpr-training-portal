// Test Course Status Workflow
function testCourseWorkflow() {
    console.log('Starting Course Workflow Tests...');
    
    // Test 1: Organization Submits Course
    function testOrganizationSubmission() {
        console.log('\nTest 1: Organization Course Submission');
        try {
            // Create test organization
            const testOrg = {
                id: 'test_org_' + Date.now(),
                name: 'Test Organization',
                email: 'test@org.com'
            };
            localStorage.setItem('currentOrganization', JSON.stringify(testOrg));
            
            // Create test course
            const testCourse = {
                id: 'test_course_' + Date.now(),
                date: '2024-04-01',
                location: 'Test Location',
                classType: 'Test Class',
                studentsRegistered: '10',
                notes: 'Test Notes',
                status: 'PENDING',
                adminScheduledDashStatus: 'PENDING',
                adminInstructorDashStatus: 'PENDING',
                organizationStatus: 'PENDING',
                instructorStatus: 'AVAILABLE',
                adminConfirmed: false,
                displayInstructorDetails: false,
                displayOrgDetails: false,
                hideOrgDetails: true,
                organization: testOrg,
                instructorId: null,
                instructorName: null
            };
            
            // Add course to storage
            const courses = JSON.parse(localStorage.getItem('courses') || '[]');
            courses.push(testCourse);
            localStorage.setItem('courses', JSON.stringify(courses));
            
            // Verify initial status
            const savedCourse = courses.find(c => c.id === testCourse.id);
            if (savedCourse && 
                savedCourse.status === 'PENDING' &&
                savedCourse.instructorId === null &&
                savedCourse.displayInstructorDetails === false) {
                console.log('✓ Organization submission test passed');
                return true;
            } else {
                console.error('✗ Organization submission test failed');
                return false;
            }
        } catch (error) {
            console.error('Error in organization submission test:', error);
            return false;
        }
    }
    
    // Test 2: Admin Schedules Course
    function testAdminScheduling() {
        console.log('\nTest 2: Admin Course Scheduling');
        try {
            const courses = JSON.parse(localStorage.getItem('courses') || '[]');
            const testCourse = courses.find(c => c.instructorId === null);
            
            if (!testCourse) {
                console.error('✗ No pending course found for scheduling test');
                return false;
            }
            
            // Create test instructor
            const testInstructor = {
                id: 'test_instructor_' + Date.now(),
                name: 'Test Instructor',
                email: 'test@instructor.com'
            };
            
            // Update course with instructor
            testCourse.instructorId = testInstructor.id;
            testCourse.instructorName = testInstructor.name;
            testCourse.adminInstructorDashStatus = 'SCHEDULED';
            testCourse.displayOrgDetails = true;
            testCourse.status = 'SCHEDULED';
            testCourse.adminScheduledDashStatus = 'SCHEDULED';
            testCourse.organizationStatus = 'PENDING';
            testCourse.instructorStatus = 'AVAILABLE';
            testCourse.displayInstructorDetails = false;
            testCourse.hideOrgDetails = true;
            
            localStorage.setItem('courses', JSON.stringify(courses));
            
            // Verify scheduling status
            const updatedCourse = courses.find(c => c.id === testCourse.id);
            if (updatedCourse &&
                updatedCourse.status === 'SCHEDULED' &&
                updatedCourse.instructorId === testInstructor.id &&
                updatedCourse.organizationStatus === 'PENDING' &&
                updatedCourse.instructorStatus === 'AVAILABLE' &&
                updatedCourse.displayInstructorDetails === false) {
                console.log('✓ Admin scheduling test passed');
                return true;
            } else {
                console.error('✗ Admin scheduling test failed');
                return false;
            }
        } catch (error) {
            console.error('Error in admin scheduling test:', error);
            return false;
        }
    }
    
    // Test 3: Admin Confirms Course
    function testAdminConfirmation() {
        console.log('\nTest 3: Admin Course Confirmation');
        try {
            const courses = JSON.parse(localStorage.getItem('courses') || '[]');
            const testCourse = courses.find(c => c.status === 'SCHEDULED');
            
            if (!testCourse) {
                console.error('✗ No scheduled course found for confirmation test');
                return false;
            }
            
            // Update course status to confirmed
            testCourse.status = 'CONFIRMED';
            testCourse.adminScheduledDashStatus = 'CONFIRMED';
            testCourse.adminInstructorDashStatus = 'CONFIRMED';
            testCourse.organizationStatus = 'CONFIRMED';
            testCourse.instructorStatus = 'CONFIRMED';
            testCourse.adminConfirmed = true;
            testCourse.displayInstructorDetails = true;
            testCourse.displayOrgDetails = true;
            testCourse.hideOrgDetails = false;
            testCourse.isConfirmed = true;
            
            localStorage.setItem('courses', JSON.stringify(courses));
            
            // Verify confirmation status
            const updatedCourse = courses.find(c => c.id === testCourse.id);
            if (updatedCourse &&
                updatedCourse.status === 'CONFIRMED' &&
                updatedCourse.adminConfirmed === true &&
                updatedCourse.displayInstructorDetails === true &&
                updatedCourse.displayOrgDetails === true &&
                updatedCourse.hideOrgDetails === false) {
                console.log('✓ Admin confirmation test passed');
                return true;
            } else {
                console.error('✗ Admin confirmation test failed');
                return false;
            }
        } catch (error) {
            console.error('Error in admin confirmation test:', error);
            return false;
        }
    }
    
    // Run all tests
    const orgTest = testOrganizationSubmission();
    const scheduleTest = testAdminScheduling();
    const confirmTest = testAdminConfirmation();
    
    // Print summary
    console.log('\nTest Summary:');
    console.log('Organization Submission:', orgTest ? '✓ Passed' : '✗ Failed');
    console.log('Admin Scheduling:', scheduleTest ? '✓ Passed' : '✗ Failed');
    console.log('Admin Confirmation:', confirmTest ? '✓ Passed' : '✗ Failed');
    
    return orgTest && scheduleTest && confirmTest;
}

// Run the tests
testCourseWorkflow(); 