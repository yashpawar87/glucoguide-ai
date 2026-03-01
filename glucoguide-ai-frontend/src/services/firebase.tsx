import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAyRId3UBwaTZI4DrpX1w8n_G_T_nfgrxg",
    authDomain: "diabetes-ai-7fcaf.firebaseapp.com",
    projectId: "diabetes-ai-7fcaf",
    appId: "1:991992016856:web:3bc886fcd0968b43ae8cad"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider(); 