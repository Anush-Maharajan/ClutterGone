// DOM elements
const statusIndicator = document.getElementById('statusIndicator');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const checkButton = document.getElementById('checkButton');
const speedTestButton = document.getElementById('speedTestButton');
const connectionStatus = document.getElementById('connectionStatus');
const responseTime = document.getElementById('responseTime');
const lastCheck = document.getElementById('lastCheck');
const speedResults = document.getElementById('speedResults');
const downloadSpeed = document.getElementById('downloadSpeed');
const uploadSpeed = document.getElementById('uploadSpeed');
const testDuration = document.getElementById('testDuration');
const lastSpeedTest = document.getElementById('lastSpeedTest');

// Connection test URLs (multiple fallbacks for reliability)
const testUrls = [
    'https://www.google.com/favicon.ico',
    'https://www.cloudflare.com/favicon.ico',
    'https://httpbin.org/status/200',
    'https://api.github.com/zen'
];

// Speed test configuration
const speedTestConfig = {
    downloadTestSize: 10 * 1024 * 1024, // 10MB
    uploadTestSize: 5 * 1024 * 1024,    // 5MB
    testDuration: 10000,                 // 10 seconds max
    progressInterval: 100                 // Update progress every 100ms
};

let isChecking = false;
let isSpeedTesting = false;

// Main connection check function
async function checkConnection() {
    if (isChecking) return;
    
    isChecking = true;
    updateStatus('checking', 'Checking connection...');
    checkButton.disabled = true;
    
    try {
        const startTime = performance.now();
        
        // Try multiple URLs for better reliability
        let success = false;
        let finalResponseTime = 0;
        
        for (const url of testUrls) {
            try {
                const response = await fetch(url, {
                    method: 'HEAD',
                    mode: 'no-cors',
                    cache: 'no-cache',
                    timeout: 5000
                });
                
                success = true;
                finalResponseTime = performance.now() - startTime;
                break;
            } catch (error) {
                console.log(`Failed to reach ${url}:`, error.message);
                continue;
            }
        }
        
        if (success) {
            // Connection successful
            updateStatus('connected', 'Connected to internet');
            connectionStatus.textContent = 'Connected';
            responseTime.textContent = `${finalResponseTime.toFixed(0)}ms`;
            lastCheck.textContent = new Date().toLocaleTimeString();
            
            // Add success animation
            statusDot.style.animation = 'pulse 0.5s ease-in-out';
            setTimeout(() => {
                statusDot.style.animation = 'pulse 2s infinite';
            }, 500);
            
        } else {
            // All URLs failed
            throw new Error('All connection attempts failed');
        }
        
    } catch (error) {
        console.error('Connection check failed:', error);
        
        // Connection failed
        updateStatus('disconnected', 'No internet connection');
        connectionStatus.textContent = 'Disconnected';
        responseTime.textContent = 'N/A';
        lastCheck.textContent = new Date().toLocaleTimeString();
        
        // Add error animation
        statusDot.style.animation = 'pulse 0.5s ease-in-out';
        setTimeout(() => {
            statusDot.style.animation = 'pulse 2s infinite';
        }, 500);
    }
    
    // Reset button state
    setTimeout(() => {
        isChecking = false;
        checkButton.disabled = false;
    }, 1000);
}

// Speed test function
async function runSpeedTest() {
    if (isSpeedTesting) return;
    
    isSpeedTesting = true;
    speedTestButton.disabled = true;
    checkButton.disabled = true;
    
    // Show speed results section
    speedResults.style.display = 'block';
    
    // Reset values
    downloadSpeed.textContent = 'Testing...';
    uploadSpeed.textContent = 'Testing...';
    testDuration.textContent = 'In progress...';
    
    const startTime = performance.now();
    
    try {
        // Run download speed test
        const downloadResult = await testDownloadSpeed();
        
        // Run upload speed test
        const uploadResult = await testUploadSpeed();
        
        // Calculate total test duration
        const totalDuration = performance.now() - startTime;
        
        // Display results
        downloadSpeed.textContent = downloadResult.toFixed(2);
        uploadSpeed.textContent = uploadResult.toFixed(2);
        testDuration.textContent = `${(totalDuration / 1000).toFixed(1)}s`;
        lastSpeedTest.textContent = new Date().toLocaleTimeString();
        
        // Update status
        updateStatus('connected', 'Speed test completed');
        
    } catch (error) {
        console.error('Speed test failed:', error);
        
        downloadSpeed.textContent = 'Failed';
        uploadSpeed.textContent = 'Failed';
        testDuration.textContent = 'Error';
        lastSpeedTest.textContent = new Date().toLocaleTimeString();
        
        updateStatus('disconnected', 'Speed test failed');
    }
    
    // Reset button states
    setTimeout(() => {
        isSpeedTesting = false;
        speedTestButton.disabled = false;
        checkButton.disabled = false;
    }, 1000);
}

// Download speed test
async function testDownloadSpeed() {
    return new Promise((resolve, reject) => {
        const startTime = performance.now();
        let downloadedBytes = 0;
        let testStartTime = performance.now();
        
        // Create a large blob for download testing
        const testData = new Blob([new ArrayBuffer(speedTestConfig.downloadTestSize)]);
        const testUrl = URL.createObjectURL(testData);
        
        const xhr = new XMLHttpRequest();
        
        xhr.onprogress = function(event) {
            if (event.lengthComputable) {
                downloadedBytes = event.loaded;
                const elapsed = performance.now() - testStartTime;
                const speedMbps = (downloadedBytes * 8 / 1000000) / (elapsed / 1000);
                
                // Update progress every 100ms
                if (elapsed % speedTestConfig.progressInterval < 16) { // 60fps check
                    downloadSpeed.textContent = `${speedMbps.toFixed(2)}`;
                }
            }
        };
        
        xhr.onload = function() {
            const totalTime = performance.now() - startTime;
            const speedMbps = (downloadedBytes * 8 / 1000000) / (totalTime / 1000);
            URL.revokeObjectURL(testUrl);
            resolve(speedMbps);
        };
        
        xhr.onerror = function() {
            URL.revokeObjectURL(testUrl);
            reject(new Error('Download test failed'));
        };
        
        xhr.ontimeout = function() {
            URL.revokeObjectURL(testUrl);
            reject(new Error('Download test timeout'));
        };
        
        xhr.timeout = speedTestConfig.testDuration;
        xhr.open('GET', testUrl);
        xhr.send();
    });
}

// Upload speed test
async function testUploadSpeed() {
    return new Promise((resolve, reject) => {
        const startTime = performance.now();
        let uploadedBytes = 0;
        let testStartTime = performance.now();
        
        // Create test data for upload
        const testData = new Blob([new ArrayBuffer(speedTestConfig.uploadTestSize)]);
        
        const xhr = new XMLHttpRequest();
        
        xhr.upload.onprogress = function(event) {
            if (event.lengthComputable) {
                uploadedBytes = event.loaded;
                const elapsed = performance.now() - testStartTime;
                const speedMbps = (uploadedBytes * 8 / 1000000) / (elapsed / 1000);
                
                // Update progress every 100ms
                if (elapsed % speedTestConfig.progressInterval < 16) {
                    uploadSpeed.textContent = `${speedMbps.toFixed(2)}`;
                }
            }
        };
        
        xhr.onload = function() {
            const totalTime = performance.now() - startTime;
            const speedMbps = (uploadedBytes * 8 / 1000000) / (totalTime / 1000);
            resolve(speedMbps);
        };
        
        xhr.onerror = function() {
            reject(new Error('Upload test failed'));
        };
        
        xhr.ontimeout = function() {
            reject(new Error('Upload test timeout'));
        };
        
        xhr.timeout = speedTestConfig.testDuration;
        xhr.open('POST', 'https://httpbin.org/post');
        xhr.send(testData);
    });
}

// Update status indicator
function updateStatus(status, text) {
    // Remove all status classes
    statusDot.classList.remove('connected', 'disconnected', 'checking');
    
    // Add new status class
    statusDot.classList.add(status);
    
    // Update text
    statusText.textContent = text;
}

// Alternative connection check using navigator.onLine
function checkConnectionAlternative() {
    if (navigator.onLine) {
        updateStatus('connected', 'Connected to internet');
        connectionStatus.textContent = 'Connected (Browser API)';
        responseTime.textContent = 'N/A';
        lastCheck.textContent = new Date().toLocaleTimeString();
    } else {
        updateStatus('disconnected', 'No internet connection');
        connectionStatus.textContent = 'Disconnected (Browser API)';
        responseTime.textContent = 'N/A';
        lastCheck.textContent = new Date().toLocaleTimeString();
    }
}

// Listen for online/offline events
window.addEventListener('online', () => {
    if (!isChecking && !isSpeedTesting) {
        updateStatus('connected', 'Connection restored');
        connectionStatus.textContent = 'Connected (Auto-detected)';
        lastCheck.textContent = new Date().toLocaleTimeString();
    }
});

window.addEventListener('offline', () => {
    if (!isChecking && !isSpeedTesting) {
        updateStatus('disconnected', 'Connection lost');
        connectionStatus.textContent = 'Disconnected (Auto-detected)';
        lastCheck.textContent = new Date().toLocaleTimeString();
    }
});

// Add keyboard shortcuts (Space or Enter key)
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault();
        if (!isChecking && !isSpeedTesting) {
            checkConnection();
        }
    }
});

// Add touch feedback for mobile devices
checkButton.addEventListener('touchstart', () => {
    if (!isChecking) {
        checkButton.style.transform = 'scale(0.95)';
    }
});

checkButton.addEventListener('touchend', () => {
    checkButton.style.transform = '';
});

speedTestButton.addEventListener('touchstart', () => {
    if (!isSpeedTesting) {
        speedTestButton.style.transform = 'scale(0.95)';
    }
});

speedTestButton.addEventListener('touchend', () => {
    speedTestButton.style.transform = '';
});

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    // Check initial connection status
    if (navigator.onLine) {
        updateStatus('connected', 'Ready to check');
        connectionStatus.textContent = 'Ready';
    } else {
        updateStatus('disconnected', 'No internet connection');
        connectionStatus.textContent = 'Disconnected';
    }
    
    // Add loading animation to buttons
    checkButton.addEventListener('click', () => {
        if (!isChecking) {
            checkButton.style.transform = 'scale(0.95)';
            setTimeout(() => {
                checkButton.style.transform = '';
            }, 150);
        }
    });
    
    speedTestButton.addEventListener('click', () => {
        if (!isSpeedTesting) {
            speedTestButton.style.transform = 'scale(0.95)';
            setTimeout(() => {
                speedTestButton.style.transform = '';
            }, 150);
        }
    });
});

// Add some visual feedback for better UX
function addVisualFeedback() {
    const card = document.querySelector('.connection-card');
    card.style.transform = 'scale(1.02)';
    setTimeout(() => {
        card.style.transform = '';
    }, 200);
}

// Enhanced error handling with user-friendly messages
function showErrorMessage(message) {
    // Create a temporary error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #dc3545;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(errorDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
        errorDiv.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 300);
    }, 3000);
}

// Add CSS animations for error messages
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
