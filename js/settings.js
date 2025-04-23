/**
 * Settings page functionality for HealthVerse
 */

document.addEventListener('DOMContentLoaded', function() {
    initSettingsForms();
    initToggleSwitches();
    initDangerZone();
    initSettingsNavigation();
});

/**
 * Initialize form submission handling for settings forms
 */
function initSettingsForms() {
    const forms = document.querySelectorAll('.settings-form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Here you would normally process the form data and send to backend
            // For demo purposes, we'll just show a success message
            
            // Find the submit button
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            
            // Simulate server request
            setTimeout(() => {
                // Show success state
                submitBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
                submitBtn.classList.add('btn-success');
                
                // Reset button after 2 seconds
                setTimeout(() => {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                    submitBtn.classList.remove('btn-success');
                    
                    // Show toast notification
                    showToast('Settings saved successfully!');
                }, 2000);
            }, 1500);
        });
    });
}

/**
 * Initialize toggle switches functionality
 */
function initToggleSwitches() {
    const toggleSwitches = document.querySelectorAll('.toggle-switch input');
    
    toggleSwitches.forEach(toggle => {
        toggle.addEventListener('change', function() {
            const categoryName = this.id.replace('-toggle', '');
            const isEnabled = this.checked;
            
            console.log(`${categoryName} notifications ${isEnabled ? 'enabled' : 'disabled'}`);
            
            // Here you would save this setting to user preferences
            // For demo, just show a toast message
            showToast(`${capitalize(categoryName)} notifications ${isEnabled ? 'enabled' : 'disabled'}`);
            
            // Update badge count if turning off notifications would reduce count
            if (!isEnabled && window.updateNotificationBadge) {
                window.updateNotificationBadge();
            }
        });
    });
}

/**
 * Initialize danger zone actions (account deletion, data export)
 */
function initDangerZone() {
    const deleteAccountBtn = document.querySelector('.account-actions .btn-danger');
    const exportDataBtn = document.querySelector('.account-actions .btn-warning');
    
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                // Here you would send delete request to backend
                // For demo, show toast and redirect
                showToast('Account scheduled for deletion. Redirecting to home page...');
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 3000);
            }
        });
    }
    
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', function() {
            // Show loading state
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exporting...';
            this.disabled = true;
            
            // Simulate data export
            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-download"></i> Export All Data';
                this.disabled = false;
                
                // In a real app, this would trigger a file download
                // For demo, just show toast
                showToast('Data export complete. Download started.');
                
                // Create a dummy file to demonstrate the download
                const dummyData = JSON.stringify({
                    user: { name: "John Doe", email: "john.doe@example.com" },
                    health_data: { weight: "78kg", height: "182cm", bmi: 23.5 },
                    app_usage: { last_login: "2023-06-27", total_sessions: 47 }
                }, null, 2);
                
                const blob = new Blob([dummyData], {type: 'application/json'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'healthverse_data_export.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 2000);
        });
    }
}

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (success, error, warning, info)
 */
function showToast(message, type = 'success') {
    // Check if toast container exists, if not create it
    let toastContainer = document.querySelector('.toast-container');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Add icon based on type
    let icon = 'check-circle';
    if (type === 'error') icon = 'times-circle';
    if (type === 'warning') icon = 'exclamation-circle';
    if (type === 'info') icon = 'info-circle';
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas fa-${icon}"></i>
        </div>
        <div class="toast-content">
            <p>${message}</p>
        </div>
        <button class="toast-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Handle close button
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.classList.add('toast-hidden');
        setTimeout(() => {
            toast.remove();
        }, 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.classList.add('toast-hidden');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 5000);
    
    // Animate in
    setTimeout(() => {
        toast.classList.add('toast-visible');
    }, 10);
}

/**
 * Helper function to capitalize first letter of a string
 * @param {string} string - The string to capitalize
 * @returns {string} The capitalized string
 */
function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Initialize settings page navigation
 */
function initSettingsNavigation() {
    const settingsLinks = document.querySelectorAll('.settings-nav-link');
    const sections = document.querySelectorAll('.settings-section');
    
    // Hide all sections initially
    sections.forEach(section => {
        section.style.display = 'none';
    });
    
    settingsLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            settingsLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Show the corresponding section
            const targetId = this.getAttribute('href').substring(1);
            
            sections.forEach(section => {
                section.style.display = 'none';
            });
            
            document.getElementById(targetId).style.display = 'block';
            
            // Update URL hash
            window.location.hash = targetId;
        });
    });
    
    // Check if URL has a hash and activate the corresponding section
    if (window.location.hash) {
        const targetLink = document.querySelector(`.settings-nav-link[href="${window.location.hash}"]`);
        if (targetLink) {
            targetLink.click();
        } else {
            // Default to first section
            settingsLinks[0].click();
        }
    } else {
        // Default to first section
        settingsLinks[0].click();
    }
} 