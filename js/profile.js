import { handleProtectedRoute } from './auth.js';
import { getCurrentUser, getUserProfile, updateUserProfile, uploadProfileImage, logoutUser } from './firebase.js';
import notifications from './notifications.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Profile page loaded.');
    const isAuthenticated = await handleProtectedRoute();
    if (!isAuthenticated) {
        console.log('User not authenticated, returning from profile script.');
        return;
    }

    console.log('User authenticated, proceeding to load profile.');
    const user = await getCurrentUser();
    if (!user) {
        console.error('Could not get current user object even after auth check.');
        return; // Should not happen if handleProtectedRoute passed
    }

    console.log('Current User UID:', user.uid);

    // --- DOM Elements --- Select elements to update
    const profileNameElement = document.getElementById('profile-display-name'); // Main profile display name
    const profileBioElement = document.getElementById('profile-bio'); // Profile tagline/bio
    const profileAvatarElement = document.querySelector('.profile-avatar img'); // Profile avatar
    const avatarEditButton = document.querySelector('.avatar-edit'); // Avatar edit button
    
    // Form elements
    const personalInfoForm = document.querySelector('.profile-card form');
    const healthInfoForm = document.querySelectorAll('.profile-form')[1]; // Second form is health info
    
    // --- Load Profile Data --- Fetch from Firestore
    async function loadProfileData() {
        try {
            console.log('Attempting to load profile for UID:', user.uid);
            const result = await getUserProfile(user.uid);
            console.log('getUserProfile result:', result);

            if (result.success && result.profile) {
                const profile = result.profile;
                console.log('Profile data loaded:', profile);

                // Update header elements
                if (profileNameElement) {
                    profileNameElement.textContent = profile.displayName || user.displayName || 'User Name';
                }
                if (profileBioElement) {
                    profileBioElement.textContent = profile.bio || 'Health Enthusiast'; 
                }
                if (profileAvatarElement) {
                    profileAvatarElement.src = profile.avatarUrl || profileAvatarElement.src;
                }
                
                // Fill personal info form
                if (personalInfoForm) {
                    const fullNameInput = personalInfoForm.querySelector('#full-name');
                    const emailInput = personalInfoForm.querySelector('#email');
                    const phoneInput = personalInfoForm.querySelector('#phone');
                    const locationInput = personalInfoForm.querySelector('#location');
                    const birthdateInput = personalInfoForm.querySelector('#birthdate');
                    const genderInput = personalInfoForm.querySelector('#gender');
                    
                    if (fullNameInput) fullNameInput.value = profile.displayName || user.displayName || '';
                    if (emailInput) emailInput.value = profile.email || user.email || '';
                    if (phoneInput) phoneInput.value = profile.phone || '';
                    if (locationInput) locationInput.value = profile.location || '';
                    if (birthdateInput) birthdateInput.value = profile.birthdate || '';
                    if (genderInput) genderInput.value = profile.gender || 'prefer-not';
                }
                
                // Fill health info form
                if (healthInfoForm && profile.health) {
                    const health = profile.health;
                    const heightInput = healthInfoForm.querySelector('#height');
                    const weightInput = healthInfoForm.querySelector('#weight');
                    const bloodTypeInput = healthInfoForm.querySelector('#blood-type');
                    const allergiesInput = healthInfoForm.querySelector('#allergies');
                    const medicalConditionsInput = healthInfoForm.querySelector('#medical-conditions');
                    const medicationsInput = healthInfoForm.querySelector('#medications');
                    
                    if (heightInput) heightInput.value = health.height || '';
                    if (weightInput) weightInput.value = health.weight || '';
                    if (bloodTypeInput) bloodTypeInput.value = health.bloodType || '';
                    if (allergiesInput) allergiesInput.value = health.allergies || '';
                    if (medicalConditionsInput) medicalConditionsInput.value = health.medicalConditions || '';
                    if (medicationsInput) medicationsInput.value = health.medications || '';
                    
                    // Set fitness goals checkboxes
                    if (health.fitnessGoals && Array.isArray(health.fitnessGoals)) {
                        healthInfoForm.querySelectorAll('input[name="goals"]').forEach(checkbox => {
                            checkbox.checked = health.fitnessGoals.includes(checkbox.value);
                        });
                    }
                    
                    // Update BMI display if height and weight are available
                    if (health.height && health.weight) {
                        updateBMI(health.height, health.weight);
                    }
                }
            } else {
                console.warn('Profile not found, using default values');
                // Set default values from user auth object
                if (profileNameElement) profileNameElement.textContent = user.displayName || 'User Name';
                if (profileBioElement) profileBioElement.textContent = 'Health Enthusiast';
                if (personalInfoForm) {
                    const fullNameInput = personalInfoForm.querySelector('#full-name');
                    const emailInput = personalInfoForm.querySelector('#email');
                    if (fullNameInput) fullNameInput.value = user.displayName || '';
                    if (emailInput) emailInput.value = user.email || '';
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            notifications.error('Failed to load profile data');
        }
    }

    // Initial load of profile data
    await loadProfileData();

    // --- Set up avatar update functionality ---
    if (avatarEditButton && profileAvatarElement) {
        // Create a hidden file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
        
        // Handle avatar edit button click
        avatarEditButton.addEventListener('click', () => {
            fileInput.click();
        });
        
        // Handle file selection
        fileInput.addEventListener('change', async (e) => {
            if (!e.target.files || !e.target.files[0]) return;
            
            const file = e.target.files[0];
            
            // Simple file validation
            if (!file.type.match('image.*')) {
                notifications.error('Please select an image file');
                return;
            }
            
            // Show loading state on avatar
            const originalSrc = profileAvatarElement.src;
            profileAvatarElement.style.opacity = '0.5';
            avatarEditButton.disabled = true;
            
            try {
                // Upload image to Firebase Storage
                const result = await uploadProfileImage(user.uid, file);
                
                if (result.success) {
                    // Update avatar in UI
                    profileAvatarElement.src = result.downloadUrl;
                    
                    // Show success message
                    notifications.success('Profile picture updated successfully');
                    
                    // Update avatarUrl in user profile
                    await updateUserProfile(user.uid, { 
                        avatarUrl: result.downloadUrl,
                        updatedAt: new Date().toISOString()
                    });
                } else {
                    notifications.error(result.error || 'Failed to update profile picture');
                    profileAvatarElement.src = originalSrc;
                }
            } catch (error) {
                console.error('Error updating profile picture:', error);
                notifications.error('An error occurred while updating profile picture');
                profileAvatarElement.src = originalSrc;
            } finally {
                // Reset avatar state
                profileAvatarElement.style.opacity = '1';
                avatarEditButton.disabled = false;
                fileInput.value = ''; // Reset file input for next selection
            }
        });
    }

    // --- Set up form submission handlers ---
    
    // Personal Information Form Submission
    if (personalInfoForm) {
        personalInfoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Saving personal information...');
            
            // Get form values
            const fullName = personalInfoForm.querySelector('#full-name').value.trim();
            const email = personalInfoForm.querySelector('#email').value.trim();
            const phone = personalInfoForm.querySelector('#phone').value.trim();
            const location = personalInfoForm.querySelector('#location').value.trim();
            const birthdate = personalInfoForm.querySelector('#birthdate').value;
            const gender = personalInfoForm.querySelector('#gender').value;
            
            // Basic validation
            if (!fullName || !email) {
                notifications.error('Name and email are required');
                return;
            }
            
            // Show loading state
            const submitButton = personalInfoForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            submitButton.disabled = true;
            
            try {
                // Prepare user data to update
                const userData = {
                    displayName: fullName,
                    email, // Note: This won't update the auth email, just the profile data
                    phone,
                    location,
                    birthdate,
                    gender,
                    updatedAt: new Date().toISOString()
                };
                
                // Update profile in Firebase
                const result = await updateUserProfile(user.uid, userData);
                
                if (result.success) {
                    // Update display name in the header
                    if (profileNameElement) {
                        profileNameElement.textContent = fullName;
                    }
                    
                    // Show success message
                    notifications.success('Personal information updated successfully');
                } else {
                    notifications.error(result.error || 'Failed to update profile');
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                notifications.error('An error occurred while updating profile');
            } finally {
                // Reset button state
                submitButton.innerHTML = originalButtonText;
                submitButton.disabled = false;
            }
        });
    }
    
    // Health Information Form Submission
    if (healthInfoForm) {
        healthInfoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Saving health information...');
            
            // Get form values
            const height = healthInfoForm.querySelector('#height').value;
            const weight = healthInfoForm.querySelector('#weight').value;
            const bloodType = healthInfoForm.querySelector('#blood-type').value;
            const allergies = healthInfoForm.querySelector('#allergies').value.trim();
            const medicalConditions = healthInfoForm.querySelector('#medical-conditions').value.trim();
            const medications = healthInfoForm.querySelector('#medications').value.trim();
            
            // Get selected fitness goals
            const fitnessGoals = [];
            healthInfoForm.querySelectorAll('input[name="goals"]:checked').forEach(checkbox => {
                fitnessGoals.push(checkbox.value);
            });
            
            // Show loading state
            const submitButton = healthInfoForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            submitButton.disabled = true;
            
            try {
                // Prepare health data to update
                const healthData = {
                    height: height ? parseInt(height) : null,
                    weight: weight ? parseInt(weight) : null,
                    bloodType,
                    allergies,
                    medicalConditions,
                    medications,
                    fitnessGoals,
                    updatedAt: new Date().toISOString()
                };
                
                // Update health data in Firebase as a nested object
                const result = await updateUserProfile(user.uid, { health: healthData });
                
                if (result.success) {
                    // Show success message
                    notifications.success('Health information updated successfully');
                    
                    // Update BMI if height and weight are provided
                    if (height && weight) {
                        updateBMI(height, weight);
                    }
                } else {
                    notifications.error(result.error || 'Failed to update health information');
                }
            } catch (error) {
                console.error('Error updating health information:', error);
                notifications.error('An error occurred while updating health information');
            } finally {
                // Reset button state
                submitButton.innerHTML = originalButtonText;
                submitButton.disabled = false;
            }
        });
    }
    
    // --- Helper Functions ---
    
    // Update BMI display
    function updateBMI(height, weight) {
        // Height should be in cm, weight in kg
        const heightInMeters = height / 100;
        const bmi = weight / (heightInMeters * heightInMeters);
        
        // Update BMI display if it exists in the UI
        const bmiValue = document.querySelector('.health-metric-card:nth-child(2) .metric-value.current span:last-child');
        if (bmiValue) {
            bmiValue.textContent = bmi.toFixed(1);
        }
    }

    // Add logout functionality
    const logoutButton = document.querySelector('.btn-logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                const result = await logoutUser();
                if (result.success) {
                    window.location.href = 'index.html';
                } else {
                    notifications.error('Failed to logout. Please try again.');
                }
            } catch (error) {
                console.error('Error signing out:', error);
                notifications.error('Failed to logout. Please try again.');
            }
        });
    }
}); 