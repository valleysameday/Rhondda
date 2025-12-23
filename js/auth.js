import { auth } from './firebase.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Handle Sign Up
export async function signUp(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        window.location.href = 'dashboard.html'; // Send them to their new dashboard
    } catch (error) {
        alert("Error: " + error.message);
    }
}

// Handle Login
export async function login(email, password) {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = 'dashboard.html';
    } catch (error) {
        alert("Login failed: " + error.message);
    }
}
