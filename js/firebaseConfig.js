import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC5x0qlaC_78inbJq1UatMAiT6RHMWPUYg",
    authDomain: "alex-onpe.firebaseapp.com",
    projectId: "alex-onpe",
    storageBucket: "alex-onpe.firebasestorage.app",
    messagingSenderId: "973180645933",
    appId: "1:973180645933:web:ab1c1c607a2343e6e1fea4"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);