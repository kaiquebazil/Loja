const initialProducts = [
    {
        id: 1,
        nome: "Mouse Gamer RGB 12000 DPI",
        categoria: "Mouse",
        preco: 89.90,
        estoque: 12,
        imagem: "https://placehold.co/400x400/11141b/ffffff?text=Mouse+Gamer",
        descricao: "Mouse de alta precisão com iluminação RGB personalizável.",
        destaque: true,
        maisVendido: false,
        oferta: false
    },
    {
        id: 2,
        nome: "Teclado Mecânico Switch Blue",
        categoria: "Teclados",
        preco: 249.90,
        estoque: 8,
        imagem: "https://placehold.co/400x400/11141b/ffffff?text=Teclado+Mecanico",
        descricao: "Teclado mecânico compacto com switches azuis táteis e sonoros.",
        destaque: true,
        maisVendido: true,
        oferta: false
    },
    {
        id: 3,
        nome: "Headset Gamer 7.1 Surround",
        categoria: "Headsets",
        preco: 189.90,
        estoque: 15,
        imagem: "https://placehold.co/400x400/11141b/ffffff?text=Headset+Gamer",
        descricao: "Áudio imersivo 7.1 para maior vantagem competitiva nos jogos.",
        destaque: false,
        maisVendido: false,
        oferta: true,
        desconto: 15
    },
    {
        id: 4,
        nome: "Controle DualShock Wireless",
        categoria: "Controles",
        preco: 329.90,
        estoque: 5,
        imagem: "https://placehold.co/400x400/11141b/ffffff?text=Controle+Wireless",
        descricao: "Controle sem fio com alta precisão e vibração dinâmica.",
        destaque: false,
        maisVendido: false,
        oferta: false
    },
    {
        id: 5,
        nome: "SSD Kingston 480GB A400",
        categoria: "Armazenamento",
        preco: 199.90,
        estoque: 20,
        imagem: "https://placehold.co/400x400/11141b/ffffff?text=SSD+480GB",
        descricao: "Aumente a velocidade do seu PC com este SSD de alta performance.",
        destaque: false,
        maisVendido: true,
        oferta: false
    },
    {
        id: 6,
        nome: "Memória RAM 8GB DDR4 3200MHz",
        categoria: "Memórias RAM",
        preco: 159.90,
        estoque: 10,
        imagem: "https://placehold.co/400x400/11141b/ffffff?text=RAM+8GB",
        descricao: "Melhore o multitarefa do seu computador com memória de alta velocidade.",
        destaque: false,
        maisVendido: false,
        oferta: false
    }
];

// Função para inicializar produtos no LocalStorage se não existirem
function initProducts() {
    if (!localStorage.getItem('kb_products')) {
        localStorage.setItem('kb_products', JSON.stringify(initialProducts));
    }
}

function getProducts() {
    return JSON.parse(localStorage.getItem('kb_products')) || [];
}

function saveProducts(products) {
    localStorage.setItem('kb_products', JSON.stringify(products));
}

initProducts();
