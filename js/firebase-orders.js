// KB Tech - registro opcional de pedidos no Firestore.
// O checkout pelo WhatsApp continua funcionando mesmo sem Firebase.

import { db, firebaseReady } from './firebase-config.js';
import {
    addDoc,
    collection,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const FIREBASE_ORDERS_COLLECTION = 'pedidos';

async function saveOrderToFirebase(order) {
    if (!firebaseReady || !db || !order) return false;

    try {
        await addDoc(collection(db, FIREBASE_ORDERS_COLLECTION), Object.assign({}, order, {
            criadoEm: serverTimestamp(),
            status: 'Novo',
            origem: 'Site',
            whatsappEnviado: true
        }));
        return true;
    } catch (error) {
        console.error('Não foi possível salvar pedido no Firebase. WhatsApp será aberto normalmente.', error);
        return false;
    }
}

window.KBTFirebaseOrders = {
    saveOrderToFirebase
};

export { saveOrderToFirebase };
