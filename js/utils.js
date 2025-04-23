// Utility functions for animations and effects

// Initialize scroll animations
export function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, {
        threshold: 0.1
    });

    document.querySelectorAll('.feature-card, .stat-card, .chart-container').forEach(element => {
        observer.observe(element);
    });
}

// Add glow effect to elements
export function addGlowEffect(element) {
    element.style.boxShadow = '0 0 20px rgba(79, 70, 229, 0.5)';
}

// Add float effect to elements
export function addFloatEffect(element) {
    element.style.animation = 'float 3s ease-in-out infinite';
}

// Add pulse effect to elements
export function addPulseEffect(element) {
    element.style.animation = 'pulse 2s ease-in-out infinite';
}

// Create ripple effect on button clicks
export function createRippleEffect(event) {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    ripple.classList.add('ripple');
    button.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
}

// Debounce function for performance optimization
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for performance optimization
export function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Initialize mobile menu
export function initMobileMenu() {
    const menuToggle = document.createElement('button');
    menuToggle.className = 'menu-toggle';
    menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    document.querySelector('.navbar').appendChild(menuToggle);

    const navLinks = document.querySelector('.nav-links');
    
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('show');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
            navLinks.classList.remove('show');
        }
    });
}

// Add smooth scroll behavior
export function smoothScroll(target) {
    const element = document.querySelector(target);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Add parallax effect to elements
export function addParallaxEffect(element, speed = 0.5) {
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        element.style.transform = `translateY(${scrolled * speed}px)`;
    });
}

// Add typing effect to text
export function typeText(element, text, speed = 50) {
    let i = 0;
    element.textContent = '';
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}