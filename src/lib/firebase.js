import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDZfpReWfQzt2RTQ39dPb0CukJE1u7e6Yc",
  authDomain: "bw-house-hunter.firebaseapp.com",
  projectId: "bw-house-hunter",
  storageBucket: "bw-house-hunter.firebasestorage.app",
  messagingSenderId: "880335295884",
  appId: "1:880335295884:web:b754a4b87db2f3247772a9",
  measurementId: "G-CCJPMTPKYE"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
