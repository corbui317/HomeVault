import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
} from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyALI8B3FSnh-0MQRjw-fPc4WuHlaZ9yLCE",
  authDomain: "homevault-89067.firebaseapp.com",
  projectId: "homevault-89067",
  storageBucket: "homevault-89067.appspot.com",
  messagingSenderId: "1045280803858",
  appId: "1:1045280803858:web:85a039a693f3e805301ccb",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
export const twitterProvider = new TwitterAuthProvider();
