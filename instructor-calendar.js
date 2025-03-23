function openInstructorAvailabilityModal() {
    document.getElementById('instructorAvailabilityModal').style.display = 'block';
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('availabilityDate').min = today;
}

function closeInstructorAvailabilityModal() {
    document.getElementById('instructorAvailabilityModal').style.display = 'none';
}

function saveInstructorAvailability() {
    const instructorName = document.getElementById('instructorName').value;
    const availabilityDate = document.getElementById('availabilityDate').value;
    const availabilityStatus = document.getElementById('availabilityStatus').value;

    if (!instructorName || !availabilityDate) {
        alert('Please fill in all required fields');
        return;
    }

    const availability = {
        instructorName,
        date: availabilityDate,
        status: availabilityStatus
    };

    // Get existing availabilities or initialize empty array
    const availabilities = JSON.parse(localStorage.getItem('instructorAvailabilities') || '[]');
    
    // Check for existing entry on same date
    const existingIndex = availabilities.findIndex(a => 
        a.instructorName === instructorName && 
        a.date === availabilityDate
    );

    if (existingIndex >= 0) {
        availabilities[existingIndex] = availability;
    } else {
        availabilities.push(availability);
    }

    localStorage.setItem('instructorAvailabilities', JSON.stringify(availabilities));
    updateInstructorAvailabilityTable();
    closeInstructorAvailabilityModal();
}

function updateInstructorAvailabilityTable() {
    const tableBody = document.getElementById('instructorAvailabilityTableBody');
    const availabilities = JSON.parse(localStorage.getItem('instructorAvailabilities') || '[]');

    if (availabilities.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No availabilities set</td></tr>';
        return;
    }

    tableBody.innerHTML = availabilities
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(availability => `
            <tr>
                <td>${availability.instructorName}</td>
                <td>${getISODate(availability.date)}</td>
                <td><span class="status status-${availability.status.toLowerCase()}">${availability.status}</span></td>
                <td>
                    <button class="btn btn-danger" onclick="deleteInstructorAvailability('${availability.instructorName}', '${availability.date}')">
                        Delete
                    </button>
                </td>
            </tr>
        `).join('');
}

function deleteInstructorAvailability(instructorName, date) {
    const availabilities = JSON.parse(localStorage.getItem('instructorAvailabilities') || '[]');
    const updatedAvailabilities = availabilities.filter(a => 
        !(a.instructorName === instructorName && a.date === date)
    );
    localStorage.setItem('instructorAvailabilities', JSON.stringify(updatedAvailabilities));
    updateInstructorAvailabilityTable();
} 