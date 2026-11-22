import { initializeApp } from 'firebase/app'
import { getDatabase, ref, onValue, set } from 'firebase/database'

// Public web config of the Firebase project "kacha-haus-screen" (owned by the shop account).
// These values identify the project; access is controlled by the database rules:
// anyone may read /screen, only the shop's Google account may write it.
const firebaseConfig = {
  apiKey: 'AIzaSyClBFTtiruRQSTYL8vCmKBAgzDhxA1foCY',
  authDomain: 'kacha-haus-screen.firebaseapp.com',
  databaseURL: 'https://kacha-haus-screen-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'kacha-haus-screen',
  storageBucket: 'kacha-haus-screen.firebasestorage.app',
  messagingSenderId: '869965325448',
  appId: '1:869965325448:web:38b1b3df1f32334ae5ab3d'
}

export const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)
export const CONFIG_PATH = 'screen/config'
export const ADMIN_EMAIL = 'kachahaus@gmail.com'

// Calls cb(config | null) now and on every change; returns an unsubscribe function
export function watchConfig (cb, onError) {
  return onValue(ref(db, CONFIG_PATH), snap => cb(snap.val()), onError)
}

export function saveConfig (config) {
  return set(ref(db, CONFIG_PATH), config)
}
