// Workout Module

import notifications from './notifications.js';
import modals from './modals.js';
import { storage, formatDuration, debounce } from './utils.js';
import { getCurrentUser, addWorkout, getWorkouts, deleteWorkout, updateUserProfile, completeWorkout, updateWorkout } from './firebase.js';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Workout tracker initializing...');
    
    // Get DOM elements
    const addWorkoutForm = document.getElementById('add-workout-form');
    const workoutListContainer = document.getElementById('workout-list');
    const totalCaloriesElement = document.getElementById('total-calories');
    const workoutStatsElement = document.querySelector('.header-stats');
    
    // Check if we're on the workout page
    if (!addWorkoutForm || !workoutListContainer) {
        console.log('Not on workout page, exiting initialization');
        return;
    }
    
    console.log('Found workout page elements');
    
    let workouts = [];
    let currentUser = null;
    let activeWorkout = null;
    
    // Initialize workout tracker
    async function init() {
        try {
            // Get current user
            currentUser = await getCurrentUser();
            console.log('Current user:', currentUser);
            
            if (!currentUser) {
                console.log('No user logged in, redirecting to login');
                window.location.href = 'login.html?redirect=workout.html';
                return;
            }
            
            console.log('User logged in:', currentUser.uid);
            
            // Load workouts from Firebase
            await loadWorkouts();
            
            // Set up event listeners
            setupEventListeners();
        } catch (error) {
            console.error('Error initializing workout tracker:', error);
            showToast('Failed to initialize workout tracker. Please refresh the page.', 'error');
        }
    }
    
    // Load workouts from Firebase
    async function loadWorkouts() {
        try {
            console.log('Loading workouts for user:', currentUser.uid);
            const result = await getWorkouts(currentUser.uid);
            console.log('getWorkouts result:', result);
            
            if (result.success) {
                workouts = result.workouts || [];
                console.log('Loaded workouts:', workouts);
                updateWorkoutList();
                updateWorkoutStats();
            } else {
                console.error('Error loading workouts:', result.error);
                showToast('Failed to load workouts', 'error');
            }
        } catch (error) {
            console.error('Error loading workouts:', error);
            showToast('Failed to load workouts', 'error');
        }
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Add workout form submission
        if (addWorkoutForm) {
            addWorkoutForm.addEventListener('submit', handleAddWorkout);
            console.log('Added form submission listener');
        }
        
        // Delete workout buttons and status toggle using event delegation
        document.addEventListener('click', function(e) {
            // Handle delete button
            const deleteBtn = e.target.closest('.btn-delete');
            if (deleteBtn) {
                const workoutId = deleteBtn.dataset.id;
                if (workoutId) {
                    console.log('Delete button clicked for workout:', workoutId);
                    handleDeleteWorkout(workoutId);
                }
            }
            
            // Handle status toggle
            const statusBtn = e.target.closest('.status');
            if (statusBtn) {
                const workoutId = statusBtn.closest('.workout-item').dataset.id;
                if (workoutId) {
                    console.log('Status button clicked for workout:', workoutId);
                    const currentStatus = statusBtn.classList.contains('done');
                    handleStatusToggle(workoutId, !currentStatus);
                }
            }
        });
        
        // Search input
        const searchInput = document.querySelector('.search-bar input');
        if (searchInput) {
            searchInput.addEventListener('input', function(e) {
                const query = e.target.value.trim();
                if (query) {
                    searchWorkouts(query);
                } else {
                    updateWorkoutList();
                }
            });
        }
    }
    
    // Handle status toggle
    async function handleStatusToggle(workoutId, completed) {
        if (!currentUser) {
            showToast('Please log in to update workout status', 'error');
            return;
        }
        
        try {
            // Find the workout in our local array
            const workout = workouts.find(w => w.id === workoutId);
            if (!workout) {
                console.error('Workout not found:', workoutId);
                return;
            }
            
            // Update the workout status
            const updatedWorkout = { ...workout, completed: completed };
            
            // Update in Firebase
            const result = await updateWorkout(currentUser.uid, workoutId, { completed: completed });
            
            if (result.success) {
                // Update in our local array
                workouts = workouts.map(w => w.id === workoutId ? updatedWorkout : w);
                
                // Update UI
                updateWorkoutList();
                updateWorkoutStats();
                
                // Show success message
                showToast(`Workout marked as ${completed ? 'completed' : 'not completed'}`, 'success');
                
                // If workout is being marked as completed, also update user stats
                if (completed) {
                    await completeWorkout(currentUser.uid, workout.calories, workout.duration);
                }
            } else {
                showToast(result.error || 'Failed to update workout status', 'error');
            }
        } catch (error) {
            console.error('Error updating workout status:', error);
            showToast('An error occurred while updating the workout status', 'error');
        }
    }
    
    // Handle add workout form submission
    async function handleAddWorkout(e) {
        e.preventDefault();
        
        if (!currentUser) {
            showToast('Please log in to add workouts', 'error');
            return;
        }
        
        const form = e.target;
        const nameInput = form.querySelector('#workout-name');
        const typeInput = form.querySelector('#workout-type');
        const intensityInput = form.querySelector('#intensity');
        const durationInput = form.querySelector('#duration');
        const caloriesInput = form.querySelector('#calories');
        const timeInput = form.querySelector('#time');
        const dateInput = form.querySelector('#date');
        const descriptionInput = form.querySelector('#description');
        
        // Validation
        if (!nameInput.value || !durationInput.value || !caloriesInput.value) {
            showToast('Please enter workout name, duration, and calories', 'error');
            return;
        }
        
        // Prepare workout data
        const workoutData = {
            name: nameInput.value,
            type: typeInput.value,
            intensity: intensityInput.value,
            duration: parseInt(durationInput.value) || 0,
            calories: parseInt(caloriesInput.value) || 0,
            time: timeInput.value || new Date().toTimeString().substring(0, 5),
            date: dateInput.value || new Date().toISOString().split('T')[0],
            description: descriptionInput ? descriptionInput.value : '',
            completed: false,
            userId: currentUser.uid,
            createdAt: new Date().toISOString()
        };
        
        console.log('Adding workout with data:', workoutData);
        
        // Submit button state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
        submitButton.disabled = true;
        
        try {
            const result = await addWorkout(currentUser.uid, workoutData);
            console.log('Add workout result:', result);
            
            if (result.success) {
                // Add the new workout to our local array with the assigned ID
                const newWorkout = result.workout || { ...workoutData, id: result.id };
                workouts.push(newWorkout);
                
                // Reset form
                form.reset();
                
                // Show success message
                showToast('Workout added successfully!', 'success');
                
                // Update UI
                updateWorkoutList();
                updateWorkoutStats();
            } else {
                showToast(result.error || 'Failed to add workout', 'error');
            }
        } catch (error) {
            console.error('Error adding workout:', error);
            showToast('An error occurred while adding the workout', 'error');
        } finally {
            // Reset button state
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
        }
    }
    
    // Update workout list in the UI
    function updateWorkoutList() {
        if (!workoutListContainer) return;
        
        console.log('Updating workout list with', workouts.length, 'workouts');
        
        // Sort workouts by date and time (newest first)
        const sortedWorkouts = [...workouts].sort((a, b) => {
            const dateA = new Date(a.date + 'T' + a.time);
            const dateB = new Date(b.date + 'T' + b.time);
            return dateB - dateA;
        });
        
        if (sortedWorkouts.length === 0) {
            workoutListContainer.innerHTML = `
                <div class="empty-state">
                    <p>No workouts added yet. Add your first workout to get started.</p>
                </div>
            `;
        } else {
            workoutListContainer.innerHTML = sortedWorkouts.map(workout => `
                <div class="table-row workout-item" data-id="${workout.id}">
                    <div class="workout-name">
                        <i class="fas ${getWorkoutIcon(workout.type)}"></i>
                        <span>${workout.name}</span>
                    </div>
                    <div>${workout.duration} min</div>
                    <div>${workout.calories} kcal</div>
                    <div class="status ${workout.completed ? 'done' : 'upcoming'}">
                        ${workout.completed ? 'Done' : 'Pending'}
                    </div>
                    <div>
                        <button class="btn-delete" data-id="${workout.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        // Update total calories
        updateTotalCalories();
    }
    
    // Update workout stats
    function updateWorkoutStats() {
        if (!workoutStatsElement) return;
        
        const totalWorkouts = workouts.length;
        const completedWorkouts = workouts.filter(workout => workout.completed).length;
        
        // Update the stats display
        workoutStatsElement.innerHTML = `
            <span class="status-indicator"></span>
            <span>${completedWorkouts} of ${totalWorkouts} workouts completed</span>
        `;
        
        console.log('Updated workout stats:', completedWorkouts, 'of', totalWorkouts);
    }
    
    // Handle delete workout
    async function handleDeleteWorkout(workoutId) {
        if (!currentUser) {
            showToast('Please log in to delete workouts', 'error');
            return;
        }
        
        if (!confirm('Are you sure you want to delete this workout?')) {
            return;
        }
        
        console.log('Deleting workout:', workoutId);
        
        try {
            const result = await deleteWorkout(currentUser.uid, workoutId);
            
            if (result.success) {
                // Remove the workout from our local array
                workouts = workouts.filter(workout => workout.id !== workoutId);
                updateWorkoutList();
                updateWorkoutStats();
                showToast('Workout deleted successfully!', 'success');
            } else {
                showToast(result.error || 'Failed to delete workout', 'error');
            }
        } catch (error) {
            console.error('Error deleting workout:', error);
            showToast('An error occurred while deleting the workout', 'error');
        }
    }
    
    // Search workouts
    function searchWorkouts(query) {
        console.log('Searching for:', query);
        
        const filteredWorkouts = workouts.filter(workout => 
            workout.name.toLowerCase().includes(query.toLowerCase()) ||
            workout.type.toLowerCase().includes(query.toLowerCase())
        );
        
        // Update UI with filtered workouts
        if (filteredWorkouts.length === 0) {
            workoutListContainer.innerHTML = `
                <div class="empty-state">
                    <p>No workouts matching "${query}" found.</p>
                </div>
            `;
        } else {
            workoutListContainer.innerHTML = filteredWorkouts.map(workout => `
                <div class="table-row workout-item" data-id="${workout.id}">
                    <div class="workout-name">
                        <i class="fas ${getWorkoutIcon(workout.type)}"></i>
                        <span>${workout.name}</span>
                    </div>
                    <div>${workout.duration} min</div>
                    <div>${workout.calories} kcal</div>
                    <div class="status ${workout.completed ? 'done' : 'upcoming'}">
                        ${workout.completed ? 'Done' : 'Pending'}
                    </div>
                    <div>
                        <button class="btn-delete" data-id="${workout.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }
    
    // Update total calories display
    function updateTotalCalories() {
        if (!totalCaloriesElement) return;
        
        const totalCalories = workouts.reduce((sum, workout) => sum + (parseInt(workout.calories) || 0), 0);
        totalCaloriesElement.textContent = `${totalCalories} kcal`;
        console.log('Updated total calories:', totalCalories);
    }
    
    // Get workout icon based on type
    function getWorkoutIcon(type) {
        switch (type) {
            case 'cardio':
                return 'fa-running';
            case 'strength':
                return 'fa-dumbbell';
            case 'flexibility':
                return 'fa-yoga';
            case 'hiit':
                return 'fa-fire';
            default:
                return 'fa-dumbbell';
        }
    }
    
    // Format time from 24h to 12h format
    function formatTime(time24h) {
        if (!time24h) return '';
        
        const [hours, minutes] = time24h.split(':');
        let period = 'AM';
        let hours12 = parseInt(hours, 10);
        
        if (hours12 >= 12) {
            period = 'PM';
            if (hours12 > 12) {
                hours12 = hours12 - 12;
            }
        }
        
        if (hours12 === 0) {
            hours12 = 12;
        }
        
        return `${hours12}:${minutes} ${period}`;
    }
    
    // Show toast notification
    function showToast(message, type = 'info') {
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
        
        // Set icon based on type
        const iconClass = type === 'success' ? 'fa-check-circle' : 
                         type === 'error' ? 'fa-exclamation-circle' : 
                         type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';
        
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
        toastContainer.appendChild(toast);
        
        // Add visible class after a small delay for animation
        setTimeout(() => {
            toast.classList.add('toast-visible');
        }, 10);
        
        // Close button click handler
        toast.querySelector('.toast-close').addEventListener('click', () => {
            closeToast(toast);
        });
        
        // Auto-close after 5 seconds
        setTimeout(() => {
            closeToast(toast);
        }, 5000);
    }
    
    function closeToast(toastElement) {
        toastElement.classList.add('toast-hidden');
        setTimeout(() => {
            toastElement.remove();
        }, 300); // Match the CSS transition duration
    }
    
    // Start initialization
    init();
}); 