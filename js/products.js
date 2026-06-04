/* ============================================================
   KA TECH - products.js
   Dados de produtos e frete (localStorage)
   ============================================================ */

var PRODUCTS_KEY = 'katech_products_v1';
var SHIPPING_KEY = 'katech_shipping_v1';

// ── Produtos iniciais (focados no solicitado) ─────────────────
var initialProducts = [
    {
        id: 1,
        nome: 'Mouse Gamer RGB 3200 DPI',
        categoria: 'Periféricos',
        preco: 79.90,
        estoque: 15,
        desconto: 0,
        imagem: 'https://placehold.co/400x400/11141b/ffffff?text=Mouse+Gamer',
        destaque: true,
        maisVendido: true,
        oferta: false
    },
    {
        id: 2,
        nome: 'Teclado Mecânico Compacto',
        categoria: 'Periféricos',
        preco: 189.90,
        estoque: 10,
        desconto: 10,
        imagem: 'https://placehold.co/400x400/11141b/ffffff?text=Teclado+Mecanico',
        destaque: true,
        maisVendido: false,
        oferta: true
    },
    {
        id: 3,
        nome: 'Headset Gamer 7.1 Surround',
        categoria: 'Periféricos',
        preco: 159.90,
        estoque: 8,
        desconto: 0,
        imagem: 'https://placehold.co/400x400/11141b/ffffff?text=Headset+Gamer',
        destaque: false,
        maisVendido: true,
        oferta: false
    },
    {
        id: 4,
        nome: 'SSD NVMe 500GB Kingston',
        categoria: 'Hardware',
        preco: 249.90,
        estoque: 12,
        desconto: 5,
        imagem: 'https://placehold.co/400x400/11141b/ffffff?text=SSD+NVMe',
        destaque: true,
        maisVendido: true,
        oferta: false
    },
    {
        id: 5,
        nome: 'Memória RAM 8GB DDR4 3200MHz',
        categoria: 'Hardware',
        preco: 139.90,
        estoque: 20,
        desconto: 0,
        imagem: 'https://placehold.co/400x400/11141b/ffffff?text=Memoria+RAM',
        destaque: false,
        maisVendido: false,
        oferta: false
    },
    {
        id: 6,
        nome: 'Cabo HDMI 2.0 4K 2 Metros',
        categoria: 'Cabos',
        preco: 29.90,
        estoque: 50,
        desconto: 0,
        imagem: 'https://placehold.co/400x400/11141b/ffffff?text=Cabo+HDMI',
        destaque: false,
        maisVendido: true,
        oferta: false
    },
    {
        id: 7,
        nome: 'Adaptador USB-C para HDMI',
        categoria: 'Adaptadores',
        preco: 45.00,
        estoque: 15,
        desconto: 0,
        imagem: 'https://placehold.co/400x400/11141b/ffffff?text=Adaptador+USB-C',
        destaque: true,
        maisVendido: false,
        oferta: false
    },
    {
        id: 8,
        nome: 'Cabo de Rede Cat6 5 Metros',
        categoria: 'Cabos',
        preco: 35.00,
        estoque: 30,
        desconto: 0,
        imagem: 'https://placehold.co/400x400/11141b/ffffff?text=Cabo+Rede',
        destaque: false,
        maisVendido: false,
        oferta: false
    }
];

// ── Frete inicial ─────────────────────────────────────────────
var initialShipping = [
    { nome: 'Centro', valor: 15 },
    { nome: 'Retiro', valor: 15 },
    { nome: 'Quitandinha', valor: 15 },
    { nome: 'Alto da Serra', valor: 15 },
    { nome: 'Bingen', valor: 20 },
    { nome: 'Itaipava', valor: 20 },
    { nome: 'Corrêas', valor: 20 },
    { nome: 'Nogueira', valor: 20 },
    { nome: 'Araras', valor: 25 },
    { nome: 'Pedro do Rio', valor: 25 },
    { nome: 'Posse', valor: 25 },
    { nome: 'Secretário', valor: 25 }
];

// ── Funções de Produtos ───────────────────────────────────────
function initProducts() {
    if (!localStorage.getItem(PRODUCTS_KEY)) {
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(initialProducts));
    }
}

function getProducts() {
    initProducts();
    return JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || [];
}

function saveProducts(products) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

function resetProducts() {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(initialProducts));
}

// ── Funções de Frete ──────────────────────────────────────────
function initShipping() {
    if (!localStorage.getItem(SHIPPING_KEY)) {
        localStorage.setItem(SHIPPING_KEY, JSON.stringify(initialShipping));
    }
}

function getShipping() {
    initShipping();
    return JSON.parse(localStorage.getItem(SHIPPING_KEY)) || [];
}

function saveShipping(data) {
    localStorage.setItem(SHIPPING_KEY, JSON.stringify(data));
}

function getFreteByBairro(bairro) {
    var shipping = getShipping();
    var found = shipping.find(function(s) { return s.nome.toLowerCase() === bairro.toLowerCase(); });
    return found ? found.valor : null;
}

// ── Inicializar ───────────────────────────────────────────────
initProducts();
initShipping();
