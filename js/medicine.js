// Medicine Module

import { getCurrentUser, addMedicine, getMedicines, deleteMedicine, updateMedicine } from './firebase.js';

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Medicine tracker initializing...');
    
    // Get DOM elements
    const addMedicineForm = document.getElementById('add-medicine-form');
    const medicineListContainer = document.getElementById('medicine-list');
    const totalMedicinesElement = document.getElementById('total-medicines');
    const medicineStatsElement = document.querySelector('.header-stats');
    
    // Check if we're on the medicine page
    if (!addMedicineForm || !medicineListContainer) {
        console.log('Not on medicine page, exiting initialization');
        return;
    }
    
    console.log('Found medicine page elements');
    
    let medicines = [];
    let currentUser = null;
    
    // Initialize medicine tracker
    async function init() {
        try {
            // Get current user
            currentUser = await getCurrentUser();
            console.log('Current user:', currentUser);
            
            if (!currentUser) {
                console.log('No user logged in, redirecting to login');
                window.location.href = 'login.html?redirect=medicine.html';
                return;
            }
            
            console.log('User logged in:', currentUser.uid);
            
            // Load medicines from Firebase
            await loadMedicines();
            
            // Set up event listeners
            setupEventListeners();
        } catch (error) {
            console.error('Error initializing medicine tracker:', error);
            showToast('Failed to initialize medicine tracker. Please refresh the page.', 'error');
        }
    }
    
    // Load medicines from Firebase
    async function loadMedicines() {
        try {
            console.log('Loading medicines for user:', currentUser.uid);
            const result = await getMedicines(currentUser.uid);
            console.log('getMedicines result:', result);
            
            if (result.success) {
                medicines = result.medicines || [];
                console.log('Loaded medicines:', medicines);
                updateMedicineList();
                updateMedicineStats();
            } else {
                console.error('Error loading medicines:', result.error);
                showToast('Failed to load medicines', 'error');
            }
        } catch (error) {
            console.error('Error loading medicines:', error);
            showToast('Failed to load medicines', 'error');
        }
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Add medicine form submission
        if (addMedicineForm) {
            addMedicineForm.addEventListener('submit', handleAddMedicine);
            console.log('Added form submission listener');
        }
        
        // Delete medicine buttons and status toggle using event delegation
        document.addEventListener('click', function(e) {
            // Handle delete button
            const deleteBtn = e.target.closest('.btn-delete');
            if (deleteBtn) {
                const medicineId = deleteBtn.dataset.id;
                if (medicineId) {
                    console.log('Delete button clicked for medicine:', medicineId);
                    handleDeleteMedicine(medicineId);
                }
            }
            
            // Handle status toggle
            const statusBtn = e.target.closest('.status');
            if (statusBtn) {
                const medicineId = statusBtn.closest('.medicine-item').dataset.id;
                if (medicineId) {
                    console.log('Status button clicked for medicine:', medicineId);
                    const currentStatus = statusBtn.classList.contains('done');
                    handleStatusToggle(medicineId, !currentStatus);
                }
            }
        });
        
        // Search input
        const searchInput = document.querySelector('.search-bar input');
        if (searchInput) {
            searchInput.addEventListener('input', function(e) {
                const query = e.target.value.trim();
                if (query) {
                    searchMedicines(query);
                } else {
                    updateMedicineList();
                }
            });
        }
    }
    
    // Handle status toggle
    async function handleStatusToggle(medicineId, taken) {
        if (!currentUser) {
            showToast('Please log in to update medicine status', 'error');
            return;
        }
        
        try {
            // Find the medicine in our local array
            const medicine = medicines.find(m => m.id === medicineId);
            if (!medicine) {
                console.error('Medicine not found:', medicineId);
                return;
            }
            
            // Update the medicine status
            const updatedMedicine = { ...medicine, taken: taken };
            
            // Update in Firebase
            const result = await updateMedicine(currentUser.uid, medicineId, { taken: taken });
            
            if (result.success) {
                // Update in our local array
                medicines = medicines.map(m => m.id === medicineId ? updatedMedicine : m);
                
                // Update UI
                updateMedicineList();
                updateMedicineStats();
                
                // Show success message
                showToast(`Medicine marked as ${taken ? 'taken' : 'not taken'}`, 'success');
            } else {
                showToast(result.error || 'Failed to update medicine status', 'error');
            }
        } catch (error) {
            console.error('Error updating medicine status:', error);
            showToast('An error occurred while updating the medicine status', 'error');
        }
    }
    
    // Handle add medicine form submission
    async function handleAddMedicine(e) {
        e.preventDefault();
        
        if (!currentUser) {
            showToast('Please log in to add medicines', 'error');
            return;
        }
        
        const form = e.target;
        const nameInput = form.querySelector('#medicine-name');
        const typeInput = form.querySelector('#medicine-type');
        const dosageInput = form.querySelector('#dosage');
        const frequencyInput = form.querySelector('#frequency');
        const timeInput = form.querySelector('#time');
        const dateInput = form.querySelector('#date');
        const notesInput = form.querySelector('#notes');
        
        // Validation
        if (!nameInput.value || !dosageInput.value || !frequencyInput.value) {
            showToast('Please enter medicine name, dosage, and frequency', 'error');
            return;
        }
        
        // Prepare medicine data
        const medicineData = {
            name: nameInput.value,
            type: typeInput.value,
            dosage: dosageInput.value,
            frequency: frequencyInput.value,
            time: timeInput.value || new Date().toTimeString().substring(0, 5),
            date: dateInput.value || new Date().toISOString().split('T')[0],
            notes: notesInput ? notesInput.value : '',
            taken: false,
            userId: currentUser.uid,
            createdAt: new Date().toISOString()
        };
        
        console.log('Adding medicine with data:', medicineData);
        
        // Submit button state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
        submitButton.disabled = true;
        
        try {
            const result = await addMedicine(currentUser.uid, medicineData);
            console.log('Add medicine result:', result);
            
            if (result.success) {
                // Add the new medicine to our local array with the assigned ID
                const newMedicine = result.medicine || { ...medicineData, id: result.id };
                medicines.push(newMedicine);
                
                // Reset form
                form.reset();
                
                // Show success message
                showToast('Medicine added successfully!', 'success');
                
                // Update UI
                updateMedicineList();
                updateMedicineStats();
            } else {
                showToast(result.error || 'Failed to add medicine', 'error');
            }
        } catch (error) {
            console.error('Error adding medicine:', error);
            showToast('An error occurred while adding the medicine', 'error');
        } finally {
            // Reset button state
            submitButton.innerHTML = originalButtonText;
            submitButton.disabled = false;
        }
    }
    
    // Update medicine list in the UI
    function updateMedicineList() {
        if (!medicineListContainer) return;
        
        console.log('Updating medicine list with', medicines.length, 'medicines');
        
        // Sort medicines by date and time (newest first)
        const sortedMedicines = [...medicines].sort((a, b) => {
            const dateA = new Date(a.date + 'T' + a.time);
            const dateB = new Date(b.date + 'T' + b.time);
            return dateB - dateA;
        });
        
        if (sortedMedicines.length === 0) {
            medicineListContainer.innerHTML = `
                <div class="empty-state">
                    <p>No medicines added yet. Add your first medicine to get started.</p>
                </div>
            `;
        } else {
            medicineListContainer.innerHTML = sortedMedicines.map(medicine => `
                <div class="table-row medicine-item" data-id="${medicine.id}">
                    <div class="medicine-name">
                        <i class="fas ${getMedicineIcon(medicine.type)}"></i>
                        <span>${medicine.name}</span>
                    </div>
                    <div>${formatTime(medicine.time)}</div>
                    <div>${medicine.dosage}</div>
                    <div class="status ${medicine.taken ? 'done' : 'upcoming'}">
                        ${medicine.taken ? 'Taken' : 'Pending'}
                    </div>
                    <div>
                        <button class="btn-delete" data-id="${medicine.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        // Update total medicines
        updateTotalMedicines();
    }
    
    // Update medicine stats
    function updateMedicineStats() {
        if (!medicineStatsElement) return;
        
        const totalMedicines = medicines.length;
        const takenMedicines = medicines.filter(medicine => medicine.taken).length;
        
        // Update the stats display
        medicineStatsElement.innerHTML = `
            <span class="status-indicator"></span>
            <span>${takenMedicines} of ${totalMedicines} medications taken</span>
        `;
        
        console.log('Updated medicine stats:', takenMedicines, 'of', totalMedicines);
    }
    
    // Handle delete medicine
    async function handleDeleteMedicine(medicineId) {
        if (!currentUser) {
            showToast('Please log in to delete medicines', 'error');
            return;
        }
        
        if (!confirm('Are you sure you want to delete this medicine?')) {
            return;
        }
        
        console.log('Deleting medicine:', medicineId);
        
        try {
            const result = await deleteMedicine(currentUser.uid, medicineId);
            
            if (result.success) {
                // Remove the medicine from our local array
                medicines = medicines.filter(medicine => medicine.id !== medicineId);
                updateMedicineList();
                updateMedicineStats();
                showToast('Medicine deleted successfully!', 'success');
            } else {
                showToast(result.error || 'Failed to delete medicine', 'error');
            }
        } catch (error) {
            console.error('Error deleting medicine:', error);
            showToast('An error occurred while deleting the medicine', 'error');
        }
    }
    
    // Search medicines
    function searchMedicines(query) {
        console.log('Searching for:', query);
        
        const filteredMedicines = medicines.filter(medicine => 
            medicine.name.toLowerCase().includes(query.toLowerCase()) ||
            medicine.type.toLowerCase().includes(query.toLowerCase())
        );
        
        // Update UI with filtered medicines
        if (filteredMedicines.length === 0) {
            medicineListContainer.innerHTML = `
                <div class="empty-state">
                    <p>No medicines matching "${query}" found.</p>
                </div>
            `;
        } else {
            medicineListContainer.innerHTML = filteredMedicines.map(medicine => `
                <div class="table-row medicine-item" data-id="${medicine.id}">
                    <div class="medicine-name">
                        <i class="fas ${getMedicineIcon(medicine.type)}"></i>
                        <span>${medicine.name}</span>
                    </div>
                    <div>${formatTime(medicine.time)}</div>
                    <div>${medicine.dosage}</div>
                    <div class="status ${medicine.taken ? 'done' : 'upcoming'}">
                        ${medicine.taken ? 'Taken' : 'Pending'}
                    </div>
                    <div>
                        <button class="btn-delete" data-id="${medicine.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }
    
    // Update total medicines display
    function updateTotalMedicines() {
        if (!totalMedicinesElement) return;
        
        const totalMedicines = medicines.length;
        totalMedicinesElement.textContent = `${totalMedicines} medicine${totalMedicines !== 1 ? 's' : ''}`;
        console.log('Updated total medicines:', totalMedicines);
    }
    
    // Get medicine icon based on type
    function getMedicineIcon(type) {
        switch (type) {
            case 'pill':
                return 'fa-pills';
            case 'liquid':
                return 'fa-flask';
            case 'injection':
                return 'fa-syringe';
            case 'other':
                return 'fa-medkit';
            default:
                return 'fa-pills';
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