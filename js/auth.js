import { getCurrentUser } from './firebase.js';

// Check authentication state and redirect if needed
export const checkAuth = async () => {
    const user = await getCurrentUser();
    return user;
};

// Handle protected routes
export const handleProtectedRoute = async () => {
    const user = await checkAuth();
    if (!user) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
};

// Handle auth routes (login/signup)
export const handleAuthRoute = async () => {
    const user = await checkAuth();
    if (user) {
        window.location.href = 'profile.html';
        return false;
    }
    return true;
}; 