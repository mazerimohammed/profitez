// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBCPYWSeQ5JnJs9yOfo2vpqNhiDpxgM-tQ",
  authDomain: "turnkey-cooler-456322-f6.firebaseapp.com",
  projectId: "turnkey-cooler-456322-f6",
  storageBucket: "turnkey-cooler-456322-f6.firebasestorage.app",
  messagingSenderId: "634999350618",
  appId: "1:634999350618:web:093ffbb3df59efb36fff63",
  measurementId: "G-1SDKYMPG20"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);