// Global variables
let attendanceData = { records: [], interns: [] };
let currentDate = new Date().toISOString().split('T')[0];

// Initialize the application
async function initApp() {
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    initGitHubInfo();
    await loadAttendanceData();
    loadInternsList();
    
    document.getElementById('markPresentBtn').addEventListener('click', markPresent);
    document.getElementById('markLeaveBtn').addEventListener('click', markLeave);
    
    setInterval(loadAttendanceData, 30000);
}

// Update date and time display
function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
    document.getElementById('currentTime').textContent = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', minute: '2-digit', second: '2-digit' 
    });
}

// Load attendance data from GitHub
async function loadAttendanceData() {
    showNotification('Loading attendance data...', 'info');
    
    try {
        attendanceData = await getFileFromGitHub('data/attendance.json');
        
        if (!attendanceData) {
            attendanceData = { records: [], interns: [] };
        }
        
        displayAttendanceTable();
        updateStatistics();
        showNotification('Data loaded successfully', 'success');
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('Error loading data. Using local storage.', 'error');
        const localData = getFromLocalStorage('attendanceData');
        if (localData) {
            attendanceData = localData;
            displayAttendanceTable();
            updateStatistics();
        }
    }
}

// Load interns list into dropdown
function loadInternsList() {
    const internSelect = document.getElementById('internSelect');
    internSelect.innerHTML = '<option value="">-- Select Intern --</option>';
    
    if (attendanceData.interns && attendanceData.interns.length > 0) {
        attendanceData.interns.forEach(intern => {
            const option = document.createElement('option');
            option.value = intern.id;
            option.textContent = intern.name;
            internSelect.appendChild(option);
        });
    } else {
        const defaultInterns = [
            { id: 1, name: 'Alex Johnson' },
            { id: 2, name: 'Maria Garcia' },
            { id: 3, name: 'David Smith' },
            { id: 4, name: 'Sarah Williams' }
        ];
        
        defaultInterns.forEach(intern => {
            const option = document.createElement('option');
            option.value = intern.id;
            option.textContent = intern.name;
            internSelect.appendChild(option);
        });
        
        attendanceData.interns = defaultInterns;
        saveAttendanceData();
    }
}

// Mark present
async function markPresent() {
    const internSelect = document.getElementById('internSelect');
    const internId = parseInt(internSelect.value);
    
    if (!internId) {
        showNotification('Please select your name', 'error');
        return;
    }
    
    const intern = attendanceData.interns.find(i => i.id === internId);
    if (!intern) {
        showNotification('Intern not found', 'error');
        return;
    }
    
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    let status = 'Present';
    let remarks = 'On time';
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    if (currentHour > 9 || (currentHour === 9 && currentMinute > 5)) {
        status = 'Late';
        remarks = `Arrived at ${currentTime}`;
    }
    
    const record = {
        id: Date.now(),
        internId: internId,
        internName: intern.name,
        date: currentDate,
        time: currentTime,
        status: status,
        remarks: remarks,
        timestamp: now.toISOString()
    };
    
    attendanceData.records = attendanceData.records.filter(
        r => !(r.internId === internId && r.date === currentDate)
    );
    
    attendanceData.records.push(record);
    
    await saveAttendanceData();
    
    showNotification(`Attendance marked for ${intern.name} (${status})`, 'success');
    loadAttendanceData();
}

// Mark leave
async function markLeave() {
    const internSelect = document.getElementById('internSelect');
    const internId = parseInt(internSelect.value);
    
    if (!internId) {
        showNotification('Please select your name', 'error');
        return;
    }
    
    const intern = attendanceData.interns.find(i => i.id === internId);
    if (!intern) {
        showNotification('Intern not found', 'error');
        return;
    }
    
    const record = {
        id: Date.now(),
        internId: internId,
        internName: intern.name,
        date: currentDate,
        time: '-',
        status: 'Absent',
        remarks: 'On leave',
        timestamp: new Date().toISOString()
    };
    
    attendanceData.records = attendanceData.records.filter(
        r => !(r.internId === internId && r.date === currentDate)
    );
    
    attendanceData.records.push(record);
    
    await saveAttendanceData();
    
    showNotification(`Leave marked for ${intern.name}`, 'success');
    loadAttendanceData();
}

// Save attendance data to GitHub
async function saveAttendanceData() {
    const commitMessage = `Update attendance records - ${new Date().toLocaleString()}`;
    const result = await saveFileToGitHub('data/attendance.json', attendanceData, commitMessage);
    
    if (result.source === 'localStorage') {
        showNotification('Saved to local storage (GitHub unavailable)', 'warning');
    } else {
        showNotification('Data saved successfully to GitHub', 'success');
    }
}

// Display attendance table
function displayAttendanceTable() {
    const tableBody = document.getElementById('attendanceTable');
    const todayRecords = attendanceData.records.filter(record => record.date === currentDate);
    
    if (todayRecords.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No attendance records for today</td></tr>';
        return;
    }
    
    tableBody.innerHTML = '';
    
    todayRecords.sort((a, b) => a.internName.localeCompare(b.internName));
    
    todayRecords.forEach(record => {
        const row = document.createElement('tr');
        let statusClass = '';
        
        switch (record.status) {
            case 'Present': statusClass = 'status-present'; break;
            case 'Absent': statusClass = 'status-absent'; break;
            case 'Late': statusClass = 'status-late'; break;
        }
        
        row.innerHTML = `
            <td>
                <div class="intern-info">
                    <div class="avatar">${getInitials(record.internName)}</div>
                    <div>${record.internName}</div>
                </div>
            </td>
            <td>${record.time}</td>
            <td class="${statusClass}">${record.status}</td>
            <td>${record.remarks}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Update statistics
function updateStatistics() {
    const todayRecords = attendanceData.records.filter(record => record.date === currentDate);
    
    const presentCount = todayRecords.filter(r => r.status === 'Present').length;
    const absentCount = todayRecords.filter(r => r.status === 'Absent').length;
    const lateCount = todayRecords.filter(r => r.status === 'Late').length;
    
    document.getElementById('presentCount').textContent = presentCount;
    document.getElementById('absentCount').textContent = absentCount;
    document.getElementById('lateCount').textContent = lateCount;
}

// Get initials for avatar
function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', initApp);
