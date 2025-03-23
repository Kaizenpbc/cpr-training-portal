// Trace Facility for Portal Functions

// Constants
const INDENT = '  ';
let traceDepth = 0;

// Store timing information
const functionTimings = {};

// Track function call hierarchy
const callStack = [];
const dataStates = new Map();

// Available functions for each portal
const portalFunctions = {
    adminPortal: [
        'updateScheduledCourses',
        'updateConfirmedCourses',
        'updateInstructorDashboard',
        'showAssignInstructorModal',
        'assignInstructor',
        'formatDate',
        'updateMonthlyConfirmedCourses',
        'fixCourseData',
        'updateDateFields',
        'validateCourseDate'
    ],
    instructorPortal: [
        'updateInstructorCourses',
        'updateInstructorAvailability',
        'showCourseDetails'
    ],
    organizationPortal: [
        'updateOrganizationCourses',
        'updateCourseStatus',
        'showCourseDetails'
    ],
    supportPortal: [
        'clearStorage',
        'dumpStorage',
        'displayStorage',
        'handleExcelUpload',
        'handleInstructorAvailabilityUpload',
        'handleOrganizationCoursesUpload'
    ]
};

// Add function categories for better organization
const functionCategories = {
    dateOperations: ['getISODate', 'fixCourseData', 'updateDateFields', 'validateCourseDate'],
    dataManagement: ['updateScheduledCourses', 'updateConfirmedCourses', 'updateInstructorDashboard'],
    userInterface: ['showAssignInstructorModal', 'assignInstructor']
};

// Store trace configuration for each portal
const traceConfig = {
    adminPortal: {
        enabled: false,
        functions: {}
    },
    instructorPortal: {
        enabled: false,
        functions: {}
    },
    organizationPortal: {
        enabled: false,
        functions: {}
    },
    supportPortal: {
        enabled: false,
        functions: {}
    }
};

// Global state to track if tracing is active anywhere
let globalTracingEnabled = false;

// Format objects for logging
function formatValue(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') {
        try {
            // Special handling for course objects
            if (value.courseDate) {
                return JSON.stringify({
                    ...value,
                    courseDate: `📅 ${value.courseDate} (Scheduled Course Date)`,
                }, null, 2);
            }
            return JSON.stringify(value, null, 2);
        } catch (e) {
            return String(value);
        }
    }
    return String(value);
}

// Format execution time
function formatExecutionTime(startTime) {
    const executionTime = Date.now() - startTime;
    if (executionTime < 1000) {
        return `${executionTime}ms`;
    }
    return `${(executionTime / 1000).toFixed(2)}s`;
}

// Enhanced trace wrapper function
function enableTrace(functionName, originalFunction) {
    return function (...args) {
        if (!globalTracingEnabled) {
            return originalFunction.apply(this, args);
        }
        
        const startTime = Date.now();
        const indent = INDENT.repeat(traceDepth);
        traceDepth++;
        callStack.push(functionName);
        
        // Start trace message with enhanced date handling
        console.group(`${indent}🔍 START: ${functionName} [${callStack.join(' → ')}]`);
        console.log(`${indent}⏰ Time: ${new Date().toISOString()}`);
        
        // Enhanced argument logging for dates
        const formattedArgs = args.map(arg => {
            if (typeof arg === 'object' && arg !== null) {
                const stateKey = `${functionName}_${Date.now()}`;
                dataStates.set(stateKey, {
                    before: JSON.parse(JSON.stringify(arg))
                });
                
                // Enhanced date field detection
                if (arg.courseDate) {
                    console.log(`${indent}📅 Course Scheduling Date: ${arg.courseDate}`);
                }
                if (arg.date) {
                    console.log(`${indent}📎 Reference Date: ${arg.date}`);
                }
            }
            return formatValue(arg);
        });
        console.log(`${indent}📥 Args:`, formattedArgs);
        
        try {
            const result = originalFunction.apply(this, args);
            
            // Track data state changes with enhanced date handling
            if (dataStates.has(`${functionName}_${startTime}`)) {
                const state = dataStates.get(`${functionName}_${startTime}`);
                state.after = result;
                if (typeof result === 'object' && result !== null) {
                    if (result.courseDate) {
                        console.log(`${indent}📅 Updated Course Date: ${result.courseDate}`);
                    }
                    console.log(`${indent}📊 Data changes:`, {
                        before: state.before,
                        after: state.after
                    });
                }
            }
            
            // Update timing statistics
            const executionTime = Date.now() - startTime;
            if (!functionTimings[functionName]) {
                functionTimings[functionName] = {
                    calls: 0,
                    totalTime: 0,
                    minTime: Infinity,
                    maxTime: 0,
                    dateOperations: 0
                };
            }
            const timing = functionTimings[functionName];
            timing.calls++;
            timing.totalTime += executionTime;
            timing.minTime = Math.min(timing.minTime, executionTime);
            timing.maxTime = Math.max(timing.maxTime, executionTime);
            
            if (functionName.toLowerCase().includes('date') || 
                (typeof result === 'string' && result.match(/\d{4}-\d{2}-\d{2}/))) {
                timing.dateOperations++;
            }
            
            console.log(`${indent}📤 Return:`, formatValue(result));
            console.log(`${indent}⏱️ Duration: ${formatExecutionTime(startTime)}`);
            console.log(`${indent}📊 Stats:`, {
                calls: timing.calls,
                avgTime: `${(timing.totalTime/timing.calls).toFixed(2)}ms`,
                dateOps: timing.dateOperations
            });
            
            return result;
        } catch (error) {
            console.error(`${indent}❌ Error in ${callStack.join(' → ')}:`, error);
            throw error;
        } finally {
            traceDepth--;
            callStack.pop();
            console.groupEnd();
            
            if (dataStates.size > 100) {
                const oldKeys = Array.from(dataStates.keys()).slice(0, 50);
                oldKeys.forEach(key => dataStates.delete(key));
            }
        }
    };
}

// Trace control functions
const TraceFacility = {
    // Initialize trace facility
    init(portalName) {
        this.portalName = portalName;
        this.createTraceUI();
        this.loadTraceConfig();
        this.updateGlobalTracingState();
        console.log('🔧 Trace Facility Initialized');
    },

    // Update global tracing state
    updateGlobalTracingState() {
        globalTracingEnabled = Object.values(traceConfig).some(portalConfig => 
            portalConfig.enabled || Object.values(portalConfig.functions).some(f => f)
        );
        console.log(`🌐 Global tracing ${globalTracingEnabled ? 'enabled' : 'disabled'}`);
    },

    // Create trace control UI
    createTraceUI() {
        const traceControl = document.createElement('div');
        traceControl.id = 'traceControl';
        traceControl.className = 'trace-control';
        
        traceControl.innerHTML = `
            <div class="trace-header">
                <h3>Trace Control Panel</h3>
                <button class="minimize-btn" onclick="TraceFacility.toggleMinimize()">_</button>
            </div>
            <div class="trace-content">
                <select id="portalSelect">
                    <option value="">Select Portal</option>
                    ${Object.keys(portalFunctions).map(portal => 
                        `<option value="${portal}">${portal}</option>`
                    ).join('')}
                </select>
                <div id="functionList"></div>
                <div class="trace-categories">
                    <h4>Function Categories</h4>
                    ${Object.entries(functionCategories).map(([category, funcs]) => `
                        <div class="category-item">
                            <label>
                                <input type="checkbox" onchange="TraceFacility.toggleCategory('${category}')">
                                ${category}
                            </label>
                        </div>
                    `).join('')}
                </div>
                <div class="trace-stats" id="traceStats"></div>
            </div>
        `;

        document.body.appendChild(traceControl);
        this.attachEventListeners();
    },

    // Attach event listeners
    attachEventListeners() {
        const portalSelect = document.getElementById('portalSelect');
        portalSelect.addEventListener('change', () => {
            const portal = portalSelect.value;
            if (portal) {
                this.updateFunctionList(portal);
            }
        });
    },

    // Update function list based on selected portal
    updateFunctionList(portal) {
        const functionList = document.getElementById('functionList');
        functionList.innerHTML = `
            <h4>Available Functions</h4>
            ${portalFunctions[portal].map(func => `
                <div class="function-item">
                    <label>
                        <input type="checkbox" id="${func}" 
                               onchange="TraceFacility.toggleTrace('${portal}', '${func}')"
                               ${traceConfig[portal].functions[func] ? 'checked' : ''}>
                        ${func}
                        <span class="status-indicator ${traceConfig[portal].functions[func] ? 'status-active' : 'status-inactive'}"></span>
                    </label>
                </div>
            `).join('')}
        `;
    },

    // Toggle trace for specific function
    toggleTrace(portalName, functionName) {
        traceConfig[portalName].functions[functionName] = !traceConfig[portalName].functions[functionName];
        this.saveTraceConfig();
        this.updateGlobalTracingState();
        
        // Update UI
        const indicator = document.querySelector(`label[for="${functionName}"] .status-indicator`);
        if (indicator) {
            indicator.className = `status-indicator ${traceConfig[portalName].functions[functionName] ? 'status-active' : 'status-inactive'}`;
        }
        
        // Apply or remove trace wrapper
        if (window[functionName]) {
            if (traceConfig[portalName].functions[functionName]) {
                window[functionName] = enableTrace(functionName, window[functionName]);
                console.log(`🔍 Trace enabled for ${functionName}`);
            } else {
                window.restoreOriginalFunction(functionName);
                console.log(`⭕ Trace disabled for ${functionName}`);
            }
        }
    },

    // Toggle minimize state
    toggleMinimize() {
        const traceControl = document.getElementById('traceControl');
        traceControl.classList.toggle('minimized');
    },

    // Save trace configuration
    saveTraceConfig() {
        localStorage.setItem('traceConfig', JSON.stringify(traceConfig));
    },

    // Load trace configuration
    loadTraceConfig() {
        const savedConfig = localStorage.getItem('traceConfig');
        if (savedConfig) {
            Object.assign(traceConfig, JSON.parse(savedConfig));
            this.updateGlobalTracingState();
        }
    },

    // Toggle category
    toggleCategory(category) {
        const portal = document.getElementById('portalSelect').value;
        if (!portal) return;
        
        const functions = functionCategories[category] || [];
        const checkboxes = functions.map(func => 
            document.getElementById(func)
        ).filter(Boolean);
        
        const someChecked = checkboxes.some(cb => cb.checked);
        checkboxes.forEach(cb => {
            cb.checked = !someChecked;
            this.toggleTrace(portal, cb.id);
        });
    },

    // Add trace function
    trace(functionName, message, type = 'info') {
        if (!globalTracingEnabled) return;
        
        const indent = INDENT.repeat(traceDepth);
        const timestamp = new Date().toISOString();
        const icon = type === 'error' ? '❌' : '🔍';
        
        console.log(`${indent}${icon} [${timestamp}] ${this.portalName} - ${functionName}: ${message}`);
        
        if (type === 'error') {
            console.error(`${indent}Error details:`, message);
        }
    }
};

// Export for use in other files
window.TraceFacility = TraceFacility;

// Add getISODate function
function getISODate(date) {
    if (!date) return '';
    try {
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return '';
        return dateObj.toISOString().split('T')[0];
    } catch (error) {
        console.error('Error formatting date:', error);
        return '';
    }
} 