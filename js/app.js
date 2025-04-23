// Main Application File

import workoutManager from './workout.js';
import mealManager from './meal.js';
import medicineManager from './medicine.js';
import { initScrollAnimations, initMobileMenu, addGlowEffect, addFloatEffect } from './utils.js';
import { getCurrentUser, logoutUser, onAuthStateChanged, getAuth } from './firebase.js';

// Common functionality for all pages
class App {
    constructor() {
        this.initializeEventListeners();
        this.initializeAnimations();
        this.initializeScrollToTop();
        this.initializeNotifications();
        this.initializeMobileMenu();
        this.initializeModules();
        this.initializeAuth();
    }

    initializeAuth() {
        // Set up auth state listener
        const auth = getAuth();
        onAuthStateChanged(auth, (user) => {
            console.log('Auth state changed:', user ? 'Logged in' : 'Logged out');
            updateUIForAuthState(user);
        });

        // Initialize auth listeners
        initAuthListeners();
    }

    initializeEventListeners() {
        // Handle active navigation state
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Add hover effects to cards
        document.querySelectorAll('.card, .feature-card, .stat-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                addGlowEffect(card);
            });
            card.addEventListener('mouseleave', () => {
                card.style.boxShadow = '';
            });
        });

        // Add float effect to feature icons
        document.querySelectorAll('.feature-icon').forEach(icon => {
            addFloatEffect(icon);
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            const navLinks = document.querySelector('.nav-links');
            const menuToggle = document.querySelector('.menu-toggle');
            if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
                navLinks.classList.remove('show');
            }
        });
    }

    initializeMobileMenu() {
        const menuToggle = document.querySelector('.menu-toggle');
        const navLinks = document.querySelector('.nav-links');

        if (menuToggle && navLinks) {
            menuToggle.addEventListener('click', () => {
                navLinks.classList.toggle('show');
                menuToggle.classList.toggle('active');
            });

            // Close menu when clicking a link
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    navLinks.classList.remove('show');
                    menuToggle.classList.remove('active');
                });
            });
        }
    }

    initializeAnimations() {
        // Initialize scroll animations
        initScrollAnimations();

        // Add animation delays to elements
        document.querySelectorAll('.feature-card, .stat-card').forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
        });

        // Add text glow effect to hero title
        const heroTitle = document.querySelector('.hero-content h1');
        if (heroTitle) {
            heroTitle.style.animation = 'textGlow 3s infinite';
        }
    }

    initializeScrollToTop() {
        const scrollToTop = document.querySelector('.scroll-to-top');
        if (scrollToTop) {
            window.addEventListener('scroll', () => {
                if (window.pageYOffset > 100) {
                    scrollToTop.classList.add('show');
                } else {
                    scrollToTop.classList.remove('show');
                }
            });

            scrollToTop.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
    }

    initializeNotifications() {
        const notificationIcon = document.querySelector('.fa-bell');
        if (notificationIcon) {
            notificationIcon.addEventListener('click', () => {
                this.showNotification('You have 3 new notifications', 'info');
            });
        }
    }

    static showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                            type === 'error' ? 'times-circle' : 
                            type === 'warning' ? 'exclamation-circle' : 
                            'info-circle'}"></i>
            <span>${message}</span>
        `;

        document.body.appendChild(notification);
        setTimeout(() => {
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }, 100);
    }

    initializeModules() {
        // Initialize page-specific modules based on current page
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        // Initialize workout manager if on workout page
        if (currentPage === 'workout.html') {
            console.log('Initializing workout manager');
            // Initialization is handled in the module itself
        }
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize UI components
    initNavigation();
    initScrollToTop();

    // Check for authentication state
    const user = await getCurrentUser();
    updateUIForAuthState(user);

    // Add auth-related event listeners
    initAuthListeners();

    window.app = new App();
});

// Export the App class for use in other modules
export default App;

// Initialize the notifications panel
function initNotificationsPanel() {
    const bellIcon = document.querySelector('.user-menu .fa-bell');
    
    if (!bellIcon) return;
    
    // Create notifications panel if it doesn't exist
    if (!document.querySelector('.notifications-panel')) {
        const notificationsPanel = document.createElement('div');
        notificationsPanel.className = 'notifications-panel';
        notificationsPanel.innerHTML = `
            <div class="notifications-header">
                <h3>Notifications</h3>
                <button class="mark-all-read">Mark all as read</button>
            </div>
            <div class="notifications-list">
                <div class="notification-item unread">
                    <div class="notification-icon medication">
                        <i class="fas fa-pills"></i>
                    </div>
                    <div class="notification-content">
                        <p class="notification-text">Time to take Vitamin D - 1000 IU</p>
                        <p class="notification-time">Just now</p>
                    </div>
                    <button class="notification-dismiss"><i class="fas fa-times"></i></button>
                </div>
                <div class="notification-item unread">
                    <div class="notification-icon workout">
                        <i class="fas fa-dumbbell"></i>
                    </div>
                    <div class="notification-content">
                        <p class="notification-text">Your evening workout is scheduled in 30 minutes</p>
                        <p class="notification-time">30 minutes ago</p>
                    </div>
                    <button class="notification-dismiss"><i class="fas fa-times"></i></button>
                </div>
                <div class="notification-item">
                    <div class="notification-icon system">
                        <i class="fas fa-cog"></i>
                    </div>
                    <div class="notification-content">
                        <p class="notification-text">Your weekly health report is ready to view</p>
                        <p class="notification-time">2 hours ago</p>
                    </div>
                    <button class="notification-dismiss"><i class="fas fa-times"></i></button>
                </div>
                <div class="notification-item">
                    <div class="notification-icon meal">
                        <i class="fas fa-utensils"></i>
                    </div>
                    <div class="notification-content">
                        <p class="notification-text">Don't forget to log your lunch meal</p>
                        <p class="notification-time">5 hours ago</p>
                    </div>
                    <button class="notification-dismiss"><i class="fas fa-times"></i></button>
                </div>
            </div>
            <div class="notifications-footer">
                <a href="settings.html#notifications">Manage notifications</a>
            </div>
        `;
        
        document.body.appendChild(notificationsPanel);
        
        // Setup event listeners for notification panel
        setupNotificationsEvents(notificationsPanel);
    }
    
    // Toggle notifications panel
    bellIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        const panel = document.querySelector('.notifications-panel');
        panel.classList.toggle('active');
        
        // Close any other open panels
        document.querySelectorAll('.dropdown-content.show').forEach(dropdown => {
            dropdown.classList.remove('show');
        });
    });
    
    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
        const panel = document.querySelector('.notifications-panel');
        if (panel && panel.classList.contains('active') && !panel.contains(e.target) && e.target !== bellIcon) {
            panel.classList.remove('active');
        }
    });
}

// Setup event listeners for notification panel elements
function setupNotificationsEvents(panel) {
    // Mark all as read
    const markAllReadBtn = panel.querySelector('.mark-all-read');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', () => {
            panel.querySelectorAll('.notification-item.unread').forEach(item => {
                item.classList.remove('unread');
            });
            
            // Update notification badge
            updateNotificationBadge();
        });
    }
    
    // Dismiss individual notifications
    panel.querySelectorAll('.notification-dismiss').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const item = btn.closest('.notification-item');
            item.style.height = `${item.offsetHeight}px`;
            
            // Trigger reflow
            item.offsetHeight;
            
            item.style.height = '0';
            item.style.opacity = '0';
            item.style.margin = '0';
            item.style.padding = '0';
            
            setTimeout(() => {
                item.remove();
                updateNotificationBadge();
            }, 300);
        });
    });
    
    // Make notification items clickable
    panel.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', () => {
            item.classList.remove('unread');
            updateNotificationBadge();
            
            // In a real app, this would navigate to the related content
            const type = item.querySelector('.notification-icon').classList[1];
            let url = '#';
            
            switch(type) {
                case 'medication':
                    url = 'medicine.html';
                    break;
                case 'workout':
                    url = 'workout.html';
                    break;
                case 'meal':
                    url = 'meal.html';
                    break;
                case 'system':
                    url = 'index.html';
                    break;
            }
            
            window.location.href = url;
        });
    });
}

// Update notification badge count
function updateNotificationBadge() {
    const unreadCount = document.querySelectorAll('.notification-item.unread').length;
    const badge = document.querySelector('.notification-badge');
    
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Make the function available globally
window.updateNotificationBadge = updateNotificationBadge;

// Add navigation to settings page when clicking settings icon
function initSettingsIconNavigation() {
    const settingsIcon = document.querySelector('.user-menu .fa-cog');
    
    if (settingsIcon) {
        settingsIcon.style.cursor = 'pointer';
        settingsIcon.addEventListener('click', function() {
            window.location.href = 'settings.html';
        });
    }
}

// Call the function when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // ... existing code ...
    
    // Initialize notifications panel
    initNotificationsPanel();
    
    // Initialize settings icon navigation
    initSettingsIconNavigation();
    
    // Initialize settings navigation if on settings page
    if (window.location.pathname.includes('settings.html')) {
        initSettingsNavigation();
    }
});

// Initialize settings page navigation
function initSettingsNavigation() {
    const settingsLinks = document.querySelectorAll('.settings-nav-link');
    
    settingsLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            settingsLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Show the corresponding section
            const targetId = this.getAttribute('href').substring(1);
            const sections = document.querySelectorAll('.settings-section');
            
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
        }
    } else {
        // Default to first section
        settingsLinks[0].click();
    }
}

// Initialize responsive navigation
function initNavigation() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('show');
        });
    }
}

// Initialize scroll-to-top button
function initScrollToTop() {
    const scrollButton = document.querySelector('.scroll-to-top');
    
    if (scrollButton) {
        // Show/hide button based on scroll position
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                scrollButton.classList.add('show');
            } else {
                scrollButton.classList.remove('show');
            }
        });

        // Scroll to top when clicked
        scrollButton.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// Update UI based on authentication state
function updateUIForAuthState(user) {
    const userMenuContainer = document.querySelector('.user-menu');
    
    if (!userMenuContainer) return;
    
    // Find existing login button if any
    const existingLoginBtn = userMenuContainer.querySelector('.login-btn');
    // Find existing logout button if any
    const existingLogoutBtn = userMenuContainer.querySelector('.logout-btn');
    
    if (user) {
        // User is logged in
        // Add user avatar if not present
        if (!userMenuContainer.querySelector('.user-avatar')) {
            const avatarElement = document.createElement('a');
            avatarElement.href = 'profile.html';
            avatarElement.className = 'user-avatar';
            avatarElement.innerHTML = `
                <img src="${user.photoURL || 'https://via.placeholder.com/40'}" alt="User Avatar">
            `;
            
            // Insert before notifications
            if (existingLoginBtn) {
                userMenuContainer.removeChild(existingLoginBtn);
            }
            
            if (!existingLogoutBtn) {
                const logoutBtn = document.createElement('a');
                logoutBtn.href = '#';
                logoutBtn.className = 'logout-btn';
                logoutBtn.innerHTML = `
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Log Out</span>
                `;
                
                logoutBtn.addEventListener('click', async function(e) {
                    e.preventDefault();
                    try {
                        await logoutUser();
                        window.location.href = 'index.html';
                    } catch (error) {
                        console.error('Logout error:', error);
                    }
                });
                
                userMenuContainer.appendChild(logoutBtn);
            }
        }
    } else {
        // User is logged out
        // Remove user avatar if present
        const avatar = userMenuContainer.querySelector('.user-avatar');
        if (avatar) {
            userMenuContainer.removeChild(avatar);
        }
        
        // Remove logout button if present
        if (existingLogoutBtn) {
            userMenuContainer.removeChild(existingLogoutBtn);
        }
        
        // Add login button if not present
        if (!existingLoginBtn) {
            const loginBtn = document.createElement('a');
            loginBtn.href = 'login.html';
            loginBtn.className = 'login-btn';
            loginBtn.innerHTML = `
                <i class="fas fa-sign-in-alt"></i>
                <span>Log In</span>
            `;
            userMenuContainer.appendChild(loginBtn);
        }
    }
}

// Initialize auth-related event listeners
function initAuthListeners() {
    // Handle login/signup buttons in CTA section
    const ctaSection = document.querySelector('.cta-section');
    
    if (ctaSection) {
        const ctaButton = ctaSection.querySelector('.btn-get-started');
        
        if (ctaButton) {
            ctaButton.addEventListener('click', async function(e) {
                const user = await getCurrentUser();
                
                if (user) {
                    // If user is already logged in, redirect to profile
                    window.location.href = 'profile.html';
                    e.preventDefault();
                }
                // If not logged in, the link will navigate to signup.html
            });
        }
    }
} 