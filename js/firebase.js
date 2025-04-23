// Import Firebase modules from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, deleteDoc, addDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-storage.js";

// Your web app's Firebase configuration
// Replace this with the config from your Firebase console
const firebaseConfig = {
  apiKey: "AIzaSyDPAgqweNHmcuOILys5xdYyGcJFI20TiCE",
  authDomain: "healthverse2925.firebaseapp.com",
  projectId: "healthverse2925",
  storageBucket: "healthverse2925.appspot.com",
  messagingSenderId: "58509449682",
  appId: "1:58509449682:web:ea9cc65ba827f2fd71d00b",
  measurementId: "G-2XNV7P27P9"
};

// Initialize Firebase
console.log("Initializing Firebase...");
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
console.log("Firebase initialized successfully");

// Authentication functions
export const registerUser = async (email, password, userData) => {
  try {
    console.log("Registering user:", email);
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("User registered successfully:", user.uid);
    
    // Store additional user data in Firestore
    await setDoc(doc(db, "users", user.uid), {
      ...userData,
      email,
      createdAt: new Date().toISOString()
    });
    console.log("User profile created in Firestore");
    
    return { success: true, user };
  } catch (error) {
    console.error("Error registering user:", error.message);
    return { success: false, error: error.message };
  }
};

export const loginUser = async (email, password) => {
  try {
    console.log("Logging in user:", email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("User logged in successfully:", userCredential.user.uid);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error("Error logging in:", error.message);
    return { success: false, error: error.message };
  }
};

export const logoutUser = async () => {
  try {
    console.log("Logging out user");
    await signOut(auth);
    console.log("User logged out successfully");
    return { success: true };
  } catch (error) {
    console.error("Error logging out:", error.message);
    return { success: false, error: error.message };
  }
};

export const getCurrentUser = () => {
  console.log("Getting current user");
  return new Promise((resolve) => {
    // Don't unsubscribe immediately, let the listener persist
    onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user ? "Logged in" : "Logged out");
      resolve(user);
    });
  });
};

// User profile functions
export const getUserProfile = async (userId) => {
  try {
    console.log("Getting user profile for:", userId);
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log("User profile found");
      return { success: true, profile: docSnap.data() };
    } else {
      console.log("User profile not found");
      return { success: false, error: "Profile not found" };
    }
  } catch (error) {
    console.error("Error getting user profile:", error.message);
    return { success: false, error: error.message };
  }
};

export const updateUserProfile = async (userId, profileData) => {
  try {
    console.log("Updating user profile for:", userId, profileData);
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      ...profileData,
      updatedAt: new Date().toISOString()
    });
    console.log("User profile updated successfully");
    return { success: true };
  } catch (error) {
    console.error("Error updating user profile:", error.message);
    return { success: false, error: error.message };
  }
};

// Meal functions
export const addMeal = async (userId, mealData) => {
  try {
    console.log("Firebase addMeal called with:", {userId, mealData});
    // Ensure calories is a number
    if (mealData.calories) {
      mealData.calories = parseInt(mealData.calories);
    }

    // Sanitize and validate the meal data
    const sanitizedData = {
      name: mealData.name || 'Unnamed Meal',
      calories: mealData.calories || 0,
      time: mealData.time || '12:00',
      date: mealData.date || new Date().toISOString().split('T')[0],
      description: mealData.description || '',
      userId: userId,
      createdAt: new Date().toISOString()
    };
    
    console.log("Sanitized meal data:", sanitizedData);
    
    const mealsCollection = collection(db, "users", userId, "meals");
    const docRef = await addDoc(mealsCollection, sanitizedData);
    console.log("Meal added with ID:", docRef.id);
    
    return { 
      success: true, 
      id: docRef.id, 
      meal: {...sanitizedData, id: docRef.id} 
    };
  } catch (error) {
    console.error("Firebase addMeal error:", error);
    return { success: false, error: error.message };
  }
};

export const getMeals = async (userId) => {
  try {
    console.log("Firebase getMeals called for user:", userId);
    const mealsCollection = collection(db, "users", userId, "meals");
    const querySnapshot = await getDocs(mealsCollection);
    const meals = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Ensure calories is a number
      if (data.calories) {
        data.calories = parseInt(data.calories);
      }
      meals.push({ id: doc.id, ...data });
    });
    
    console.log("Firebase retrieved meals:", meals);
    return { success: true, meals };
  } catch (error) {
    console.error("Firebase getMeals error:", error);
    return { success: false, error: error.message };
  }
};

export const deleteMeal = async (userId, mealId) => {
  try {
    console.log("Firebase deleteMeal called:", {userId, mealId});
    const mealRef = doc(db, "users", userId, "meals", mealId);
    await deleteDoc(mealRef);
    console.log("Meal deleted successfully");
    return { success: true };
  } catch (error) {
    console.error("Firebase deleteMeal error:", error);
    return { success: false, error: error.message };
  }
};

// Medicine functions
export const addMedicine = async (userId, medicineData) => {
  try {
    console.log("Firebase addMedicine called with:", {userId, medicineData});
    
    // Sanitize and validate the medicine data
    const sanitizedData = {
      name: medicineData.name || 'Unnamed Medicine',
      dosage: medicineData.dosage || '',
      frequency: medicineData.frequency || 'daily',
      time: medicineData.time || '09:00',
      days: medicineData.days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      notes: medicineData.notes || '',
      startDate: medicineData.startDate || new Date().toISOString().split('T')[0],
      endDate: medicineData.endDate || null,
      status: medicineData.status || 'upcoming',
      userId: userId,
      createdAt: new Date().toISOString()
    };
    
    console.log("Sanitized medicine data:", sanitizedData);
    
    const medicinesCollection = collection(db, "users", userId, "medicines");
    const docRef = await addDoc(medicinesCollection, sanitizedData);
    console.log("Medicine added with ID:", docRef.id);
    
    return { 
      success: true, 
      id: docRef.id, 
      medicine: {...sanitizedData, id: docRef.id} 
    };
  } catch (error) {
    console.error("Firebase addMedicine error:", error);
    return { success: false, error: error.message };
  }
};

export const getMedicines = async (userId) => {
  try {
    console.log("Firebase getMedicines called for user:", userId);
    const medicinesCollection = collection(db, "users", userId, "medicines");
    const querySnapshot = await getDocs(medicinesCollection);
    const medicines = [];
    
    querySnapshot.forEach((doc) => {
      medicines.push({ id: doc.id, ...doc.data() });
    });
    
    console.log("Firebase retrieved medicines:", medicines);
    return { success: true, medicines };
  } catch (error) {
    console.error("Firebase getMedicines error:", error);
    return { success: false, error: error.message };
  }
};

export const deleteMedicine = async (userId, medicineId) => {
  try {
    console.log("Firebase deleteMedicine called:", {userId, medicineId});
    const medicineRef = doc(db, "users", userId, "medicines", medicineId);
    await deleteDoc(medicineRef);
    console.log("Medicine deleted successfully");
    return { success: true };
  } catch (error) {
    console.error("Firebase deleteMedicine error:", error);
    return { success: false, error: error.message };
  }
};

export const updateMedicineStatus = async (userId, medicineId, status) => {
  try {
    console.log("Firebase updateMedicineStatus called:", {userId, medicineId, status});
    const medicineRef = doc(db, "users", userId, "medicines", medicineId);
    
    // Update just the status field
    await updateDoc(medicineRef, {
      status: status,
      lastUpdated: new Date().toISOString()
    });
    
    console.log("Medicine status updated successfully");
    return { success: true };
  } catch (error) {
    console.error("Firebase updateMedicineStatus error:", error);
    return { success: false, error: error.message };
  }
};

// Workout functions
export const addWorkout = async (userId, workoutData) => {
  try {
    // Reference to user's workouts collection
    const workoutsRef = collection(db, 'users', userId, 'workouts');
    
    // Add timestamp fields
    const dataWithTimestamps = {
      ...workoutData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: userId
    };
    
    // Add the document
    const docRef = await addDoc(workoutsRef, dataWithTimestamps);
    
    return { 
      success: true, 
      id: docRef.id,
      message: 'Workout added successfully' 
    };
  } catch (error) {
    console.error('Error adding workout:', error);
    return { success: false, error: error.message };
  }
};

export const getWorkouts = async (userId) => {
  try {
    // Reference to user's workouts collection
    const workoutsRef = collection(db, 'users', userId, 'workouts');
    
    // Get all documents in the collection
    const querySnapshot = await getDocs(workoutsRef);
    
    // Transform to array of workout objects with document IDs
    const workouts = [];
    querySnapshot.forEach((doc) => {
      workouts.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, workouts };
  } catch (error) {
    console.error('Error getting workouts:', error);
    return { success: false, error: error.message };
  }
};

export const deleteWorkout = async (userId, workoutId) => {
  try {
    // Reference to the specific workout document
    const workoutRef = doc(db, 'users', userId, 'workouts', workoutId);
    
    // Delete the document
    await deleteDoc(workoutRef);
    
    return { 
      success: true, 
      message: 'Workout deleted successfully' 
    };
  } catch (error) {
    console.error('Error deleting workout:', error);
    return { success: false, error: error.message };
  }
};

export const completeWorkout = async (userId, calories, duration) => {
    try {
        if (!userId) {
            console.error('userId is required');
            return { success: false, error: 'Missing required parameters' };
        }
        
        console.log(`Completing workout for user ${userId}, calories: ${calories}, duration: ${duration}`);
        
        // Reference to the user document
        const userRef = doc(db, 'users', userId);
        
        // Get current user data
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
            console.error('User not found');
            return { success: false, error: 'User not found' };
        }
        
        const userData = userSnap.data();
        
        // Calculate new stats
        const totalCaloriesBurned = (userData.totalCaloriesBurned || 0) + (parseInt(calories) || 0);
        const totalWorkoutMinutes = (userData.totalWorkoutMinutes || 0) + (parseInt(duration) || 0);
        const completedWorkouts = (userData.completedWorkouts || 0) + 1;
        
        // Update user stats
        await updateDoc(userRef, {
            totalCaloriesBurned,
            totalWorkoutMinutes,
            completedWorkouts,
            updatedAt: new Date().toISOString()
        });
        
        return { success: true };
    } catch (error) {
        console.error('Error completing workout:', error);
        return { success: false, error: error.message };
    }
};

// Profile image upload function
export const uploadProfileImage = async (userId, file) => {
  try {
    // Create a reference to the file in Firebase Storage
    const storageRef = ref(storage, `profile_images/${userId}/${Date.now()}_${file.name}`);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    console.log('Uploaded image to Firebase Storage');
    
    // Get the download URL
    const downloadUrl = await getDownloadURL(snapshot.ref);
    
    return { success: true, downloadUrl };
  } catch (error) {
    console.error('Error uploading profile image:', error);
    return { success: false, error: error.message };
  }
};

// Newsletter subscription function
export const subscribeToNewsletter = async (email) => {
  try {
    // Check if this email is already subscribed
    const subscribersRef = collection(db, "newsletter_subscribers");
    const q = query(subscribersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return { success: false, error: "This email is already subscribed" };
    }
    
    // Add new subscriber
    await addDoc(subscribersRef, {
      email,
      subscribeDate: new Date().toISOString(),
      status: "active",
      source: "website"
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error subscribing to newsletter:", error);
    return { success: false, error: error.message };
  }
};

// Add a script to test Firebase connection
export const testFirebaseConnection = async () => {
  try {
    console.log("Testing Firebase connection...");
    // Try to get a document from Firestore to test connection
    const testRef = doc(db, "system", "status");
    await getDoc(testRef);
    console.log("Firebase connection successful");
    return { success: true };
  } catch (error) {
    console.error("Firebase connection error:", error);
    return { success: false, error: error.message };
  }
};

// Call the test function immediately when this file is loaded
testFirebaseConnection().then(result => {
  if (result.success) {
    console.log("✅ Firebase is properly configured and connected");
  } else {
    console.error("❌ Firebase connection failed:", result.error);
  }
});

// Function to update a medicine
export const updateMedicine = async (userId, medicineId, updateData) => {
    try {
        if (!userId || !medicineId) {
            console.error('userId and medicineId are required');
            return { success: false, error: 'Missing required parameters' };
        }
        
        console.log(`Updating medicine ${medicineId} for user ${userId} with data:`, updateData);
        
        // Reference to the medicine document
        const medicineRef = doc(db, 'users', userId, 'medicines', medicineId);
        
        // Update the medicine document
        await updateDoc(medicineRef, {
            ...updateData,
            updatedAt: new Date().toISOString()
        });
        
        return { success: true };
    } catch (error) {
        console.error('Error updating medicine:', error);
        return { success: false, error: error.message };
    }
};