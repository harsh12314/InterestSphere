import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCekQbi44Ps62OFgYEDY0KtJ8Eng9j-y9I",
    authDomain: "interestsphere-6e899.firebaseapp.com",
    projectId: "interestsphere-6e899",
    storageBucket: "interestsphere-6e899.firebasestorage.app",
    messagingSenderId: "946870584799",
    appId: "1:946870584799:web:f26e1aca671ebd6f7ff06a",
    measurementId: "G-TX45BW39BJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export const storage = getStorage(app);
