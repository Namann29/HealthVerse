// Meal Tracker Module

import { getCurrentUser, addMeal, getMeals, deleteMeal } from './firebase.js';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Meal tracker initializing...');
    
    // Get DOM elements
    const addMealForm = document.getElementById('add-meal-form');
    const mealListContainer = document.getElementById('meal-list');
    const totalCaloriesElement = document.getElementById('total-calories');
    
    // Check if we're on the meal page
    if (!addMealForm || !mealListContainer) {
        console.log('Not on meal page, exiting initialization');
        return;
    }
    
    console.log('Found meal page elements');
    
    let meals = [];
    let currentUser = null;
    
    // Initialize meal tracker
    async function init() {
        try {
            // Get current user
            currentUser = await getCurrentUser();
            console.log('Current user:', currentUser);
            
            if (!currentUser) {
                console.log('No user logged in, redirecting to login');
                window.location.href = 'login.html?redirect=meal.html';
                return;
            }
            
            console.log('User logged in:', currentUser.uid);
            
            // Load meals from Firebase
            await loadMeals();
            
            // Set up event listeners
            setupEventListeners();
        } catch (error) {
            console.error('Error initializing meal tracker:', error);
            showToast('Failed to initialize meal tracker. Please refresh the page.', 'error');
        }
    }
    
    // Load meals from Firebase
    async function loadMeals() {
        try {
            console.log('Loading meals for user:', currentUser.uid);
            const result = await getMeals(currentUser.uid);
            console.log('getMeals result:', result);
            
            if (result.success) {
                meals = result.meals || [];
                console.log('Loaded meals:', meals);
                updateMealList();
            } else {
                console.error('Error loading meals:', result.error);
                showToast('Failed to load meals', 'error');
            }
        } catch (error) {
            console.error('Error loading meals:', error);
            showToast('Failed to load meals', 'error');
        }
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Add meal form submission
        if (addMealForm) {
            addMealForm.addEventListener('submit', handleAddMeal);
            console.log('Added form submission listener');
        }
        
        // Delete meal buttons using event delegation
        document.addEventListener('click', function(e) {
            const deleteBtn = e.target.closest('.btn-delete');
            if (deleteBtn) {
                const mealId = deleteBtn.dataset.id;
                if (mealId) {
                    console.log('Delete button clicked for meal:', mealId);
                    handleDeleteMeal(mealId);
                }
            }
        });
        
        // Search input
        const searchInput = document.querySelector('.search-bar input');
        if (searchInput) {
            searchInput.addEventListener('input', function(e) {
                const query = e.target.value.trim();
                if (query) {
                    searchMeals(query);
                } else {
                    updateMealList();
                }
            });
        }
    }
    
    // Handle add meal form submission
    async function handleAddMeal(e) {
        e.preventDefault();
        
        if (!currentUser) {
            showToast('Please log in to add meals', 'error');
            return;
        }
        
        const form = e.target;
        const nameInput = form.querySelector('#meal-name');
        const caloriesInput = form.querySelector('#calories');
        const timeInput = form.querySelector('#time');
        const dateInput = form.querySelector('#date');
        const descriptionInput = form.querySelector('#description');
        
        // Validation
        if (!nameInput.value || !caloriesInput.value) {
            showToast('Please enter meal name and calories', 'error');
            return;
        }
        
        // Prepare meal data
        const mealData = {
            name: nameInput.value,
            calories: parseInt(caloriesInput.value) || 0,
            time: timeInput.value || new Date().toTimeString().substring(0, 5),
            date: dateInput.value || new Date().toISOString().split('T')[0],
            description: descriptionInput ? descriptionInput.value : '',
            userId: currentUser.uid,
            createdAt: new Date().toISOString()
        };
        
        console.log('Adding meal with data:', mealData);
        
        // Submit button state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
        submitButton.disabled = true;
        
        try {
            const result = await addMeal(currentUser.uid, mealData);
            console.log('Add meal result:', result);
            
            if (result.success) {
                // Add the new meal to our local array with the assigned ID
                const newMeal = result.meal || { ...mealData, id: result.id };
                meals.push(newMeal);
                
                // Reset form
                form.reset();
                
                // Show success message
                showToast('Meal added successfully!', 'success');
                
                // Update UI
                updateMealList();
            } else {
                showToast(result.error || 'Failed to add meal', 'error');
            }
        } catch (error) {
            console.error('Error adding meal:', error);
            showToast('An error occurred while adding the meal', 'error');
        } finally {
            // Reset button state
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
        }
    }
    
    // Update meal list in the UI
    function updateMealList() {
        if (!mealListContainer) return;
        
        console.log('Updating meal list with', meals.length, 'meals');
        
        // Sort meals by date and time (newest first)
        const sortedMeals = [...meals].sort((a, b) => {
            const dateA = new Date(a.date + 'T' + a.time);
            const dateB = new Date(b.date + 'T' + b.time);
            return dateB - dateA;
        });
        
        if (sortedMeals.length === 0) {
            mealListContainer.innerHTML = `
                <div class="empty-state">
                    <p>No meals added yet. Add your first meal to get started.</p>
                </div>
            `;
        } else {
            mealListContainer.innerHTML = sortedMeals.map(meal => `
                <div class="table-row meal-item" data-id="${meal.id}">
                    <div class="meal-name">
                        <i class="fas fa-utensils"></i>
                        <span>${meal.name}</span>
                    </div>
                    <div>${meal.calories} kcal</div>
                    <div>${formatTime(meal.time)}</div>
                    <div>
                        <button class="btn-delete" data-id="${meal.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        // Update total calories
        updateTotalCalories();
    }
    
    // Handle delete meal
    async function handleDeleteMeal(mealId) {
        if (!currentUser) {
            showToast('Please log in to delete meals', 'error');
            return;
        }
        
        if (!confirm('Are you sure you want to delete this meal?')) {
            return;
        }
        
        console.log('Deleting meal:', mealId);
        
        try {
            const result = await deleteMeal(currentUser.uid, mealId);
            
            if (result.success) {
                // Remove the meal from our local array
                meals = meals.filter(meal => meal.id !== mealId);
                updateMealList();
                showToast('Meal deleted successfully!', 'success');
            } else {
                showToast(result.error || 'Failed to delete meal', 'error');
            }
        } catch (error) {
            console.error('Error deleting meal:', error);
            showToast('An error occurred while deleting the meal', 'error');
        }
    }
    
    // Search meals
    function searchMeals(query) {
        console.log('Searching for:', query);
        
        const filteredMeals = meals.filter(meal => 
            meal.name.toLowerCase().includes(query.toLowerCase())
        );
        
        // Update UI with filtered meals
        if (filteredMeals.length === 0) {
            mealListContainer.innerHTML = `
                <div class="empty-state">
                    <p>No meals matching "${query}" found.</p>
                </div>
            `;
        } else {
            mealListContainer.innerHTML = filteredMeals.map(meal => `
                <div class="table-row meal-item" data-id="${meal.id}">
                    <div class="meal-name">
                        <i class="fas fa-utensils"></i>
                        <span>${meal.name}</span>
                    </div>
                    <div>${meal.calories} kcal</div>
                    <div>${formatTime(meal.time)}</div>
                    <div>
                        <button class="btn-delete" data-id="${meal.id}">
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
        
        const totalCalories = meals.reduce((sum, meal) => sum + (parseInt(meal.calories) || 0), 0);
        totalCaloriesElement.textContent = `${totalCalories} kcal`;
        console.log('Updated total calories:', totalCalories);
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