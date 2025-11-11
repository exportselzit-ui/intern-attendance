// Admin panel functionality
let attendanceData = { records: [], interns: [] };

async function initAdmin() {
    await loadAttendanceData();
    displayInternsList();
}

async function loadAttendanceData() {
    attendanceData = await getFileFromGitHub('data/attendance.json') || { records: [], interns: [] };
}

function displayInternsList() {
    const internsList = document.getElementById('internsList');
    internsList.innerHTML = '';

    if (!attendanceData.interns || attendanceData.interns.length === 0) {
        internsList.innerHTML = '<tr><td colspan="3" style="text-align: center;">No interns found</td></tr>';
        return;
    }

    attendanceData.interns.forEach(intern => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${intern.id}</td>
            <td>${intern.name}</td>
            <td>
                <button class="btn btn-danger" onclick="removeIntern(${intern.id})">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </td>
        `;
        internsList.appendChild(row);
    });
}

async function addNewIntern() {
    const nameInput = document.getElementById('newInternName');
    const name = nameInput.value.trim();

    if (!name) {
        alert('Please enter intern name');
        return;
    }

    const newId = attendanceData.interns.length > 0 
        ? Math.max(...attendanceData.interns.map(i => i.id)) + 1 
        : 1;

    attendanceData.interns.push({
        id: newId,
        name: name
    });

    await saveFileToGitHub('data/attendance.json', attendanceData, `Added intern: ${name}`);
    
    displayInternsList();
    nameInput.value = '';
    alert(`Intern "${name}" added successfully!`);
}

async function removeIntern(internId) {
    if (!confirm('Are you sure you want to remove this intern?')) {
        return;
    }

    const intern = attendanceData.interns.find(i => i.id === internId);
    if (!intern) return;

    attendanceData.interns = attendanceData.interns.filter(i => i.id !== internId);

    await saveFileToGitHub('data/attendance.json', attendanceData, `Removed intern: ${intern.name}`);
    
    displayInternsList();
    alert(`Intern "${intern.name}" removed successfully!`);
}

async function loadHistory() {
    const dateInput = document.getElementById('historyDate');
    const selectedDate = dateInput.value;

    if (!selectedDate) {
        alert('Please select a date');
        return;
    }

    const historyResults = document.getElementById('historyResults');
    const dateRecords = attendanceData.records.filter(record => record.date === selectedDate);

    if (dateRecords.length === 0) {
        historyResults.innerHTML = '<p>No attendance records found for selected date.</p>';
        return;
    }

    let html = `<h3>Attendance for ${selectedDate}</h3>`;
    html += '<table><thead><tr><th>Intern</th><th>Time</th><th>Status</th><th>Remarks</th></tr></thead><tbody>';

    dateRecords.forEach(record => {
        let statusClass = '';
        switch (record.status) {
            case 'Present': statusClass = 'status-present'; break;
            case 'Absent': statusClass = 'status-absent'; break;
            case 'Late': statusClass = 'status-late'; break;
        }

        html += `
            <tr>
                <td>${record.internName}</td>
                <td>${record.time}</td>
                <td class="${statusClass}">${record.status}</td>
                <td>${record.remarks}</td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    historyResults.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', initAdmin);
