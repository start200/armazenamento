// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBOXqar6tQqcUFVmhkdg4kOOOKZJCLHs7w",
  authDomain: "authentication-cb7d2.firebaseapp.com",
  databaseURL: "https://authentication-cb7d2-default-rtdb.firebaseio.com",
  projectId: "authentication-cb7d2",
  storageBucket: "authentication-cb7d2.firebasestorage.app",
  messagingSenderId: "124652912298",
  appId: "1:124652912298:web:9edc7caf0abd5888f59ad3",
  measurementId: "G-EQ83C14TFX"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
