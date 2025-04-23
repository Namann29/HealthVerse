// Notifications Module
// This module handles displaying toast notifications to the user

// Toast notification types
const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

// Toast notification class with default settings
class NotificationManager {
    constructor() {
        this.defaultDuration = 3000; // 3 seconds
        this.container = null;
        this.initialize();
    }

    initialize() {
        // Create container for notifications if it doesn't exist
        if (!document.querySelector('.toast-container')) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        } else {
            this.container = document.querySelector('.toast-container');
        }
    }

    /**
     * Show a success toast notification
     * @param {string} message - The message to display
     * @param {number} duration - Optional duration in ms
     */
    success(message, duration = this.defaultDuration) {
        this.show(message, NOTIFICATION_TYPES.SUCCESS, duration);
    }

    /**
     * Show an error toast notification
     * @param {string} message - The message to display
     * @param {number} duration - Optional duration in ms
     */
    error(message, duration = this.defaultDuration) {
        this.show(message, NOTIFICATION_TYPES.ERROR, duration);
    }

    /**
     * Show a warning toast notification
     * @param {string} message - The message to display
     * @param {number} duration - Optional duration in ms
     */
    warning(message, duration = this.defaultDuration) {
        this.show(message, NOTIFICATION_TYPES.WARNING, duration);
    }

    /**
     * Show an info toast notification
     * @param {string} message - The message to display
     * @param {number} duration - Optional duration in ms
     */
    info(message, duration = this.defaultDuration) {
        this.show(message, NOTIFICATION_TYPES.INFO, duration);
    }

    /**
     * Show a toast notification
     * @param {string} message - The message to display
     * @param {string} type - The type of notification (success, error, warning, info)
     * @param {number} duration - Duration in ms
     */
    show(message, type = NOTIFICATION_TYPES.INFO, duration = this.defaultDuration) {
        // Make sure container exists
        this.initialize();

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Set icon based on type
        const iconClass = this.getIconForType(type);
        
        // Set content
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas ${iconClass}"></i>
            </div>
            <div class="toast-content">
                <p>${message}</p>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add to container
        this.container.appendChild(toast);
        
        // Add visible class after a small delay for animation
        setTimeout(() => {
            toast.classList.add('toast-visible');
        }, 10);
        
        // Close button click handler
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.closeToast(toast);
        });
        
        // Auto-close after duration
        setTimeout(() => {
            this.closeToast(toast);
        }, duration);
    }

    /**
     * Close a toast notification with animation
     * @param {HTMLElement} toast - The toast element to close
     */
    closeToast(toast) {
        toast.classList.add('toast-hidden');
        setTimeout(() => {
            toast.remove();
        }, 300); // Match the CSS transition duration
    }

    /**
     * Get the FontAwesome icon class for the notification type
     * @param {string} type - The notification type
     * @returns {string} The FontAwesome icon class
     */
    getIconForType(type) {
        switch (type) {
            case NOTIFICATION_TYPES.SUCCESS:
                return 'fa-check-circle';
            case NOTIFICATION_TYPES.ERROR:
                return 'fa-exclamation-circle';
            case NOTIFICATION_TYPES.WARNING:
                return 'fa-exclamation-triangle';
            default:
                return 'fa-info-circle';
        }
    }
}

// Export a single instance of the notification manager
const notifications = new NotificationManager();
export default notifications; 