// KB Tech - consulta opcional de OS e Garantias no Firestore.
// Fallback: se Firebase falhar ou não encontrar, consulta.js usa localStorage.

import { db, firebaseReady } from './firebase-config.js';
import {
    collection,
    getDocs,
    limit,
    query,
    where
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

function normalizeNumber(value) {
    return String(value || '').replace(/[^0-9]/g, '');
}

function matchesNumber(record, number) {
    var queryNumber = normalizeNumber(number);
    var possibleNumbers = [
        record.id,
        record.numero,
        record.numeroOS,
        record.numeroOrdem,
        record.numeroGarantia,
        record.codigo
    ];

    for (var i = 0; i < possibleNumbers.length; i++) {
        var current = normalizeNumber(possibleNumbers[i]);
        if (current && (current === queryNumber || current.slice(-4) === queryNumber || current.slice(-6) === queryNumber)) {
            return true;
        }
    }
    return false;
}

async function findByFields(collectionName, fields, number) {
    if (!firebaseReady || !db) return null;
    var normalized = normalizeNumber(number);
    var variants = [normalized];
    if (!Number.isNaN(Number(normalized))) variants.push(Number(normalized));

    for (var i = 0; i < fields.length; i++) {
        for (var j = 0; j < variants.length; j++) {
            try {
                var q = query(collection(db, collectionName), where(fields[i], '==', variants[j]), limit(1));
                var snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    var docItem = snapshot.docs[0];
                    return Object.assign({ id: docItem.id }, docItem.data());
                }
            } catch (error) {
                console.warn('Consulta por campo falhou no Firebase. Tentando fallback.', error);
            }
        }
    }
    return null;
}

async function findByScan(collectionName, number) {
    if (!firebaseReady || !db) return null;

    try {
        var snapshot = await getDocs(collection(db, collectionName));
        var found = null;
        snapshot.forEach(function(docItem) {
            if (found) return;
            var data = Object.assign({ id: docItem.id }, docItem.data());
            if (matchesNumber(data, number)) found = data;
        });
        return found;
    } catch (error) {
        console.warn('Consulta geral falhou no Firebase. Usando localStorage como fallback.', error);
        return null;
    }
}

async function getOSFromFirebase(number) {
    var direct = await findByFields('ordensServico', ['numeroOS', 'numero', 'codigo'], number);
    return direct || findByScan('ordensServico', number);
}

async function getGuaranteeFromFirebase(number) {
    var direct = await findByFields('garantias', ['numeroGarantia', 'numero', 'codigo'], number);
    return direct || findByScan('garantias', number);
}

window.KBTFirebaseConsulta = {
    getOSFromFirebase,
    getGuaranteeFromFirebase
};

export { getOSFromFirebase, getGuaranteeFromFirebase };
