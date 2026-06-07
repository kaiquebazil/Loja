// KB Tech - sincronização opcional de produtos com Firestore.
// Fallback: se Firebase falhar, o catálogo local continua funcionando.

import { db, firebaseReady } from './firebase-config.js';
import {
    collection,
    doc,
    getDocs,
    setDoc,
    writeBatch
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const FIREBASE_PRODUCTS_COLLECTION = 'produtos';

function normalizeFirebaseProduct(item) {
    const data = item.data();
    const estoque = Number(data.estoque || 0);
    const precoVenda = Number(data.precoVenda || 0);

    return {
        id: data.id !== undefined ? data.id : item.id,
        nome: data.nome || '',
        categoria: data.categoria || 'Outros',
        descricao: data.descricao || '',
        preco: precoVenda,
        precoVenda: precoVenda,
        estoque: estoque,
        imagem: data.imagem || '',
        ativo: data.ativo === true,
        destaque: data.destaque === true,
        maisVendido: data.maisVendido === true,
        oferta: data.oferta === true,
        desconto: 0,
        criadoEm: data.criadoEm || null,
        atualizadoEm: data.atualizadoEm || null
    };
}

function toFirebaseProduct(product) {
    return {
        id: product.id,
        nome: product.nome || '',
        categoria: product.categoria || 'Outros',
        descricao: product.descricao || '',
        precoVenda: Number(product.precoVenda || product.preco || 0),
        estoque: Number(product.estoque || 0),
        imagem: product.imagem || '',
        ativo: product.ativo !== false,
        destaque: product.destaque === true,
        maisVendido: product.maisVendido === true,
        oferta: product.oferta === true,
        criadoEm: product.criadoEm || null,
        atualizadoEm: new Date().toISOString()
    };
}

async function loadProductsFromFirebase() {
    if (!firebaseReady || !db) return null;

    try {
        const snapshot = await getDocs(collection(db, FIREBASE_PRODUCTS_COLLECTION));
        if (snapshot.empty) return null;

        const products = [];
        snapshot.forEach(function(item) {
            const product = normalizeFirebaseProduct(item);
            if (product.ativo === true && product.estoque > 0) {
                products.push(product);
            }
        });

        if (!products.length) return null;

        products.sort(function(a, b) {
            return Number(a.id) - Number(b.id);
        });

        return products;
    } catch (error) {
        console.warn('Não foi possível carregar produtos do Firebase. Usando dados locais.', error);
        return null;
    }
}

async function saveProductToFirebase(product) {
    if (!firebaseReady || !db || !product || product.id === undefined) return false;

    try {
        await setDoc(doc(db, FIREBASE_PRODUCTS_COLLECTION, String(product.id)), toFirebaseProduct(product), { merge: true });
        return true;
    } catch (error) {
        console.warn('Não foi possível salvar produto no Firebase. Produto local preservado.', error);
        return false;
    }
}

async function saveProductsToFirebase(products) {
    if (!firebaseReady || !db || !Array.isArray(products)) return false;

    try {
        const batch = writeBatch(db);
        products.forEach(function(product) {
            if (product && product.id !== undefined) {
                batch.set(doc(db, FIREBASE_PRODUCTS_COLLECTION, String(product.id)), toFirebaseProduct(product), { merge: true });
            }
        });
        await batch.commit();
        return true;
    } catch (error) {
        console.warn('Não foi possível sincronizar produtos no Firebase. Produtos locais preservados.', error);
        return false;
    }
}

async function syncProductsOnLoad() {
    if (document.body && document.body.classList.contains('admin-body')) return;

    const products = await loadProductsFromFirebase();
    if (!products) return;

    window.KBTPublicProducts = products;
    if (typeof window.renderCategories === 'function') {
        window.renderCategories();
    }
    if (typeof window.renderProducts === 'function') {
        window.renderProducts();
    }
}

window.KBTFirebaseProducts = {
    loadProductsFromFirebase,
    saveProductToFirebase,
    saveProductsToFirebase,
    syncProductsOnLoad
};

syncProductsOnLoad();

export {
    loadProductsFromFirebase,
    saveProductToFirebase,
    saveProductsToFirebase,
    syncProductsOnLoad
};
