// DOM elements
const statusIndicator = document.getElementById('statusIndicator');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const checkButton = document.getElementById('checkButton');
const connectionStatus = document.getElementById('connectionStatus');
const responseTime = document.getElementById('responseTime');
const lastCheck = document.getElementById('lastCheck');

// Connection test URLs (multiple fallbacks for reliability)
const testUrls = [
    'https://www.google.com/favicon.ico',
    'https://www.cloudflare.com/favicon.ico',
    'https://httpbin.org/status/200',
    'https://api.github.com/zen'
];

let isChecking = false;

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
    if (!isChecking) {
        updateStatus('connected', 'Connection restored');
        connectionStatus.textContent = 'Connected (Auto-detected)';
        lastCheck.textContent = new Date().toLocaleTimeString();
    }
});

window.addEventListener('offline', () => {
    if (!isChecking) {
        updateStatus('disconnected', 'Connection lost');
        connectionStatus.textContent = 'Disconnected (Auto-detected)';
        lastCheck.textContent = new Date().toLocaleTimeString();
    }
});

// Add keyboard shortcut (Space or Enter key)
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault();
        if (!isChecking) {
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
    
    // Add loading animation to button
    checkButton.addEventListener('click', () => {
        if (!isChecking) {
            checkButton.style.transform = 'scale(0.95)';
            setTimeout(() => {
                checkButton.style.transform = '';
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
