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
const downloadStatus = document.getElementById('downloadStatus');
const uploadStatus = document.getElementById('uploadStatus');
const debugInfo = document.getElementById('debugInfo');
const debugContent = document.getElementById('debugContent');

// Connection test URLs (multiple fallbacks for reliability)
const testUrls = [
    'https://www.google.com/favicon.ico',
    'https://www.cloudflare.com/favicon.ico',
    'https://httpbin.org/status/200',
    'https://api.github.com/zen'
];

// Speed test configuration
const speedTestConfig = {
    downloadTestSize: 5 * 1024 * 1024,  // 5MB
    testDuration: 15000,                 // 15 seconds max
    progressInterval: 200                 // Update progress every 200ms
};

let isChecking = false;
let isSpeedTesting = false;

// Debug logging function
function logDebug(message) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('p');
    logEntry.textContent = `[${timestamp}] ${message}`;
    debugContent.appendChild(logEntry);
    debugContent.scrollTop = debugContent.scrollHeight;
    console.log(`[DEBUG] ${message}`);
}

// Update speed status function
function updateSpeedStatus(element, status, text) {
    element.className = `speed-status ${status}`;
    element.textContent = text;
}

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
                    cache: 'no-cache'
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
    
    // Show speed results section and debug info
    speedResults.style.display = 'block';
    debugInfo.style.display = 'block';
    debugContent.innerHTML = '<p>Starting speed test...</p>';
    
    // Reset values and status
    downloadSpeed.textContent = '-';
    uploadSpeed.textContent = '-';
    testDuration.textContent = '-';
    updateSpeedStatus(downloadStatus, 'ready', 'Ready to test');
    updateSpeedStatus(uploadStatus, 'ready', 'Ready to test');
    
    const startTime = performance.now();
    
    try {
        logDebug('Running primary speed test...');
        
        // Run download speed test
        logDebug('Testing download speed...');
        updateSpeedStatus(downloadStatus, 'testing', 'Testing download...');
        const downloadResult = await testDownloadSpeed();
        logDebug(`Download test completed: ${downloadResult.toFixed(2)} Mbps`);
        updateSpeedStatus(downloadStatus, 'completed', 'Download completed');
        
        // Run upload speed test
        logDebug('Testing upload speed...');
        updateSpeedStatus(uploadStatus, 'testing', 'Testing upload...');
        const uploadResult = await testUploadSpeed();
        logDebug(`Upload test completed: ${uploadResult.toFixed(2)} Mbps`);
        updateSpeedStatus(uploadStatus, 'completed', 'Upload completed');
        
        // Calculate total test duration
        const totalDuration = performance.now() - startTime;
        
        // Display results
        downloadSpeed.textContent = downloadResult.toFixed(2);
        uploadSpeed.textContent = uploadResult.toFixed(2);
        testDuration.textContent = `${(totalDuration / 1000).toFixed(1)}s`;
        lastSpeedTest.textContent = new Date().toLocaleTimeString();
        
        logDebug(`Speed test completed successfully in ${(totalDuration / 1000).toFixed(1)}s`);
        
        // Update status
        updateStatus('connected', 'Speed test completed');
        
    } catch (error) {
        console.error('Speed test failed:', error);
        logDebug(`Primary speed test failed: ${error.message}`);
        
        // Update status to failed
        updateSpeedStatus(downloadStatus, 'failed', 'Download failed');
        updateSpeedStatus(uploadStatus, 'failed', 'Upload failed');
        
        // Try fallback speed test
        try {
            logDebug('Trying fallback speed test...');
            updateSpeedStatus(downloadStatus, 'testing', 'Trying fallback...');
            updateSpeedStatus(uploadStatus, 'testing', 'Trying fallback...');
            
            const fallbackResult = await runFallbackSpeedTest();
            
            downloadSpeed.textContent = fallbackResult.download.toFixed(2);
            uploadSpeed.textContent = fallbackResult.upload.toFixed(2);
            testDuration.textContent = `${((performance.now() - startTime) / 1000).toFixed(1)}s`;
            lastSpeedTest.textContent = new Date().toLocaleTimeString();
            
            updateSpeedStatus(downloadStatus, 'completed', 'Download completed (fallback)');
            updateSpeedStatus(uploadStatus, 'completed', 'Upload completed (fallback)');
            
            logDebug(`Fallback speed test completed: D=${fallbackResult.download.toFixed(2)} Mbps, U=${fallbackResult.upload.toFixed(2)} Mbps`);
            
            updateStatus('connected', 'Speed test completed (fallback)');
            
        } catch (fallbackError) {
            console.error('Fallback speed test also failed:', fallbackError);
            logDebug(`Fallback speed test failed: ${fallbackError.message}`);
            
            downloadSpeed.textContent = 'Failed';
            uploadSpeed.textContent = 'Failed';
            testDuration.textContent = 'Error';
            lastSpeedTest.textContent = new Date().toLocaleTimeString();
            
            updateSpeedStatus(downloadStatus, 'failed', 'Download failed');
            updateSpeedStatus(uploadStatus, 'failed', 'Upload failed');
            
            updateStatus('disconnected', 'Speed test failed');
            showErrorMessage('Speed test failed. Please check your connection and try again.');
        }
    }
    
    // Reset button states
    setTimeout(() => {
        isSpeedTesting = false;
        speedTestButton.disabled = false;
        checkButton.disabled = false;
    }, 1000);
}

// Fallback speed test using multiple endpoints
async function runFallbackSpeedTest() {
    return new Promise(async (resolve, reject) => {
        try {
            // Test download speed using multiple small files
            const downloadStart = performance.now();
            let totalDownloaded = 0;
            let downloadCount = 0;
            
            const downloadUrls = [
                'https://www.google.com/favicon.ico',
                'https://www.cloudflare.com/favicon.ico',
                'https://httpbin.org/bytes/1024',
                'https://httpbin.org/bytes/2048'
            ];
            
            for (const url of downloadUrls) {
                try {
                    const response = await fetch(url, { cache: 'no-cache' });
                    if (response.ok) {
                        const blob = await response.blob();
                        totalDownloaded += blob.size;
                        downloadCount++;
                    }
                } catch (e) {
                    console.log(`Failed to download from ${url}:`, e.message);
                }
            }
            
            const downloadTime = (performance.now() - downloadStart) / 1000;
            const downloadSpeedMbps = downloadCount > 0 ? (totalDownloaded * 8 / 1000000) / downloadTime : 0;
            
            // Test upload speed using small data
            const uploadStart = performance.now();
            let uploadSuccess = false;
            
            try {
                const testData = new Uint8Array(1024); // 1KB
                const response = await fetch('https://httpbin.org/post', {
                    method: 'POST',
                    body: testData,
                    cache: 'no-cache'
                });
                
                if (response.ok) {
                    uploadSuccess = true;
                }
            } catch (e) {
                console.log('Upload test failed:', e.message);
            }
            
            const uploadTime = (performance.now() - uploadStart) / 1000;
            const uploadSpeedMbps = uploadSuccess ? (1024 * 8 / 1000000) / uploadTime : 0;
            
            resolve({
                download: downloadSpeedMbps,
                upload: uploadSpeedMbps
            });
            
        } catch (error) {
            reject(error);
        }
    });
}

// Download speed test using actual file download
async function testDownloadSpeed() {
    return new Promise((resolve, reject) => {
        const startTime = performance.now();
        let downloadedBytes = 0;
        let lastUpdateTime = startTime;
        
        // Use a reliable file for download testing
        const testUrl = 'https://httpbin.org/bytes/' + speedTestConfig.downloadTestSize;
        
        const xhr = new XMLHttpRequest();
        
        xhr.onprogress = function(event) {
            if (event.lengthComputable) {
                downloadedBytes = event.loaded;
                const currentTime = performance.now();
                
                // Update progress every 200ms to avoid too frequent updates
                if (currentTime - lastUpdateTime >= speedTestConfig.progressInterval) {
                    const elapsed = (currentTime - startTime) / 1000;
                    if (elapsed > 0) {
                        const speedMbps = (downloadedBytes * 8 / 1000000) / elapsed;
                        downloadSpeed.textContent = `${speedMbps.toFixed(2)}`;
                    }
                    lastUpdateTime = currentTime;
                }
            }
        };
        
        xhr.onload = function() {
            const totalTime = (performance.now() - startTime) / 1000;
            const speedMbps = (downloadedBytes * 8 / 1000000) / totalTime;
            resolve(speedMbps);
        };
        
        xhr.onerror = function() {
            reject(new Error('Download test failed'));
        };
        
        xhr.ontimeout = function() {
            reject(new Error('Download test timeout'));
        };
        
        xhr.timeout = speedTestConfig.testDuration;
        xhr.open('GET', testUrl);
        xhr.send();
    });
}

// Upload speed test using actual file upload
async function testUploadSpeed() {
    return new Promise((resolve, reject) => {
        const startTime = performance.now();
        let uploadedBytes = 0;
        let lastUpdateTime = startTime;
        
        // Create test data for upload (smaller size for faster testing)
        const testData = new Uint8Array(1024 * 1024); // 1MB
        for (let i = 0; i < testData.length; i++) {
            testData[i] = Math.floor(Math.random() * 256);
        }
        
        const blob = new Blob([testData]);
        
        const xhr = new XMLHttpRequest();
        
        xhr.upload.onprogress = function(event) {
            if (event.lengthComputable) {
                uploadedBytes = event.loaded;
                const currentTime = performance.now();
                
                // Update progress every 200ms
                if (currentTime - lastUpdateTime >= speedTestConfig.progressInterval) {
                    const elapsed = (currentTime - startTime) / 1000;
                    if (elapsed > 0) {
                        const speedMbps = (uploadedBytes * 8 / 1000000) / elapsed;
                        uploadSpeed.textContent = `${speedMbps.toFixed(2)}`;
                    }
                    lastUpdateTime = currentTime;
                }
            }
        };
        
        xhr.onload = function() {
            const totalTime = (performance.now() - startTime) / 1000;
            const speedMbps = (uploadedBytes * 8 / 1000000) / totalTime;
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
        xhr.send(blob);
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
