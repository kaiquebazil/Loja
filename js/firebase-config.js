// KB Tech - configuração opcional do Firebase.
// Preencha os campos abaixo com os dados do seu projeto Firebase.
// Se algum campo ficar vazio, o site continuará usando localStorage.

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyDrRIql_uh3shdn_48U-MXZ35oIkaGktp8",
  authDomain: "kb-tech-498fd.firebaseapp.com",
  projectId: "kb-tech-498fd",
  storageBucket: "kb-tech-498fd.firebasestorage.app",
  messagingSenderId: "530664962806",
  appId: "1:530664962806:web:144cb844411a9b619d8ad7",
  measurementId: "G-2DTH1P7RHV"
};

function hasFirebaseConfig(config) {
    return Boolean(
        config.apiKey &&
        config.authDomain &&
        config.projectId &&
        config.storageBucket &&
        config.messagingSenderId &&
        config.appId
    );
}

let app = null;
let db = null;
let firebaseReady = false;

try {
    if (hasFirebaseConfig(firebaseConfig)) {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        firebaseReady = true;
        window.KBTFirebaseReady = true;
    } else {
        window.KBTFirebaseReady = false;
        console.info('Firebase não configurado. Usando dados locais como fallback.');
    }
} catch (error) {
    window.KBTFirebaseReady = false;
    console.warn('Firebase falhou ao iniciar. Usando dados locais como fallback.', error);
}

export { app, db, firebaseReady };
