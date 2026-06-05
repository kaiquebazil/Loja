/* ============================================================
   KB Tech - app.js
   Lógica principal: carrossel, catálogo, busca, avaliações
   ============================================================ */

var ITEMS_PER_PAGE = 20;
var currentPage = 1;
var currentFilter = 'todos';
var currentCategory = '';
var currentSearch = '';

var reviews = [
    { nome: 'João Silva', cidade: 'Petrópolis', stars: 5, texto: 'Produto chegou rápido e com qualidade excelente! Recomendo muito a KB Tech.' },
    { nome: 'Maria Santos', cidade: 'Petrópolis', stars: 5, texto: 'Atendimento incrível pelo WhatsApp. Tirou todas as minhas dúvidas antes de comprar.' },
    { nome: 'Carlos Oliveira', cidade: 'Petrópolis', stars: 5, texto: 'Comprei um fone bluetooth e ficou perfeito. Entrega no mesmo dia!' },
    { nome: 'Ana Lima', cidade: 'Petrópolis', stars: 5, texto: 'Preços ótimos e produtos de qualidade. Já é minha loja favorita de eletrônicos.' },
    { nome: 'Pedro Costa', cidade: 'Petrópolis', stars: 5, texto: 'Comprei cabos e carregadores. Tudo funcionando perfeitamente. Voltarei sempre!' },
    { nome: 'Fernanda Rocha', cidade: 'Petrópolis', stars: 5, texto: 'Excelente variedade de produtos. Encontrei tudo que precisava em um só lugar.' }
];

var categoryIcons = {
    'Informática': 'fa-laptop', 'Áudio': 'fa-headphones', 'Cabos': 'fa-plug',
    'Carregadores': 'fa-bolt', 'TV e Streaming': 'fa-tv', 'Câmeras': 'fa-camera',
    'Wearables': 'fa-watch', 'Acessórios': 'fa-mobile-alt', 'Iluminação': 'fa-lightbulb',
    'Casa': 'fa-home', 'Beleza': 'fa-spa', 'Saúde': 'fa-heartbeat',
    'Elétrica': 'fa-bolt', 'Ferramentas': 'fa-tools', 'Fotografia': 'fa-camera-retro',
    'Projetores': 'fa-film', 'Redes': 'fa-wifi', 'Controles': 'fa-gamepad',
    'Drones': 'fa-paper-plane', 'Baterias': 'fa-battery-full'
};

document.addEventListener('DOMContentLoaded', function() {
    initCarousel();
    renderCategories();
    renderProducts();
    renderReviews();
    initSearch();
    initMobileMenu();
    initFilterButtons();
});

// ── Carrossel ─────────────────────────────────────────────────
var carouselIndex = 0;
var carouselTimer = null;

function initCarousel() {
    var slides = document.querySelectorAll('.hero-slide');
    var dots = document.querySelectorAll('.dot');
    if (!slides.length) return;

    function showSlide(index) {
        slides.forEach(function(s) { s.classList.remove('active'); });
        dots.forEach(function(d) { d.classList.remove('active'); });
        carouselIndex = (index + slides.length) % slides.length;
        slides[carouselIndex].classList.add('active');
        if (dots[carouselIndex]) dots[carouselIndex].classList.add('active');
    }

    function nextSlide() { showSlide(carouselIndex + 1); }
    function prevSlide() { showSlide(carouselIndex - 1); }

    function startTimer() {
        clearInterval(carouselTimer);
        carouselTimer = setInterval(nextSlide, 5000);
    }

    var btnNext = document.querySelector('.carousel-next');
    var btnPrev = document.querySelector('.carousel-prev');
    if (btnNext) btnNext.addEventListener('click', function() { nextSlide(); startTimer(); });
    if (btnPrev) btnPrev.addEventListener('click', function() { prevSlide(); startTimer(); });

    dots.forEach(function(dot, i) {
        dot.addEventListener('click', function() { showSlide(i); startTimer(); });
    });

    showSlide(0);
    startTimer();
}

// ── Categorias ────────────────────────────────────────────────
function renderCategories() {
    var grid = document.getElementById('category-grid');
    if (!grid) return;

    var products = getProducts();
    var cats = [];
    products.forEach(function(p) {
        if (cats.indexOf(p.categoria) === -1) cats.push(p.categoria);
    });
    cats.sort();

    grid.innerHTML = '';
    cats.forEach(function(cat) {
        var icon = categoryIcons[cat] || 'fa-tag';
        var div = document.createElement('div');
        div.className = 'category-card';
        div.innerHTML =
            '<div class="cat-img-placeholder"><i class="fas ' + icon + '"></i></div>' +
            '<span>' + cat + '</span>';
        div.addEventListener('click', function() {
            currentCategory = cat;
            currentPage = 1;
            currentFilter = 'todos';
            currentSearch = '';
            var si = document.getElementById('search-input');
            if (si) si.value = '';
            renderProducts();
            var ps = document.getElementById('products-section');
            if (ps) ps.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        grid.appendChild(div);
    });
}

// ── Produtos ──────────────────────────────────────────────────
function renderProducts() {
    var grid = document.getElementById('product-grid');
    if (!grid) return;

    var products = getProducts();

    if (currentSearch) {
        var q = currentSearch.toLowerCase();
        products = products.filter(function(p) {
            return p.nome.toLowerCase().indexOf(q) !== -1 || p.categoria.toLowerCase().indexOf(q) !== -1;
        });
    }
    if (currentCategory) {
        products = products.filter(function(p) { return p.categoria === currentCategory; });
    }
    if (currentFilter === 'destaque') {
        products = products.filter(function(p) { return p.destaque; });
    } else if (currentFilter === 'oferta') {
        products = products.filter(function(p) { return p.oferta || p.desconto > 0; });
    } else if (currentFilter === 'mais-vendido') {
        products = products.filter(function(p) { return p.maisVendido; });
    }

    var sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        var sv = sortSelect.value;
        if (sv === 'preco-asc') products.sort(function(a, b) { return a.preco - b.preco; });
        else if (sv === 'preco-desc') products.sort(function(a, b) { return b.preco - a.preco; });
        else if (sv === 'nome') products.sort(function(a, b) { return a.nome.localeCompare(b.nome); });
    }

    var total = products.length;
    var paginated = products.slice(0, currentPage * ITEMS_PER_PAGE);

    var sectionTitle = document.getElementById('section-title');
    if (sectionTitle) {
        if (currentCategory) sectionTitle.textContent = currentCategory;
        else if (currentSearch) sectionTitle.textContent = 'Busca: "' + currentSearch + '"';
        else if (currentFilter === 'destaque') sectionTitle.textContent = 'Destaques';
        else if (currentFilter === 'oferta') sectionTitle.textContent = 'Ofertas';
        else if (currentFilter === 'mais-vendido') sectionTitle.textContent = 'Mais Vendidos';
        else sectionTitle.textContent = 'Todos os Produtos';
    }

    var btnClear = document.getElementById('btn-clear-filter');
    if (btnClear) {
        btnClear.style.display = (currentCategory || currentSearch || currentFilter !== 'todos') ? 'inline-flex' : 'none';
    }

    if (total === 0) {
        grid.innerHTML =
            '<div class="no-products">' +
            '<i class="fas fa-search" style="font-size:40px;margin-bottom:12px;color:var(--border-color);display:block;"></i>' +
            '<p>Nenhum produto encontrado.</p>' +
            '<p style="font-size:13px;margin-top:6px;color:var(--text-muted);">Tente outro termo de busca ou categoria.</p>' +
            '</div>';
        var lm = document.getElementById('load-more-wrapper');
        if (lm) lm.style.display = 'none';
        return;
    }

    grid.innerHTML = '';
    paginated.forEach(function(p) { grid.appendChild(createProductCard(p)); });

    var loadMore = document.getElementById('load-more-wrapper');
    if (loadMore) loadMore.style.display = paginated.length < total ? 'block' : 'none';
}

function createProductCard(p) {
    var card = document.createElement('div');
    card.className = 'product-card';

    var precoFinal = p.preco;
    var precoOriginal = '';
    if (p.desconto > 0) {
        precoFinal = p.preco * (1 - p.desconto / 100);
        precoOriginal = '<span class="price-original">R$ ' + p.preco.toFixed(2).replace('.', ',') + '</span>';
    }

    var tags = '';
    if (p.destaque) tags += '<span class="tag lancamento">Destaque</span>';
    if (p.maisVendido) tags += '<span class="tag mais-vendido">+ Vendido</span>';
    if (p.oferta) tags += '<span class="tag oferta">Oferta</span>';
    if (p.desconto > 0) tags += '<span class="tag desconto">-' + p.desconto + '%</span>';

    var estoque = p.estoque > 0
        ? '<span class="product-stock">Em estoque: ' + p.estoque + ' un.</span>'
        : '<span class="product-stock out">Sem estoque</span>';

    var imgSrc = p.imagem || 'https://placehold.co/400x400/11141b/ffffff?text=Produto';
    var waMsg = 'Olá KB Tech! Tenho interesse no produto: ' + p.nome + ' (R$ ' + precoFinal.toFixed(2).replace('.', ',') + '). Poderia me dar mais informações?';
    var waUrl = 'https://wa.me/5524992046467?text=' + encodeURIComponent(waMsg);

    var addBtn = p.estoque > 0
        ? '<button class="btn-add-cart" onclick="addToCart(' + p.id + ')"><i class="fas fa-cart-plus"></i> Adicionar ao Carrinho</button>'
        : '<button class="btn-add-cart" disabled style="opacity:0.5;cursor:not-allowed;"><i class="fas fa-ban"></i> Sem Estoque</button>';

    card.innerHTML =
        tags +
        '<div class="product-img"><img src="' + imgSrc + '" alt="' + p.nome + '" loading="lazy" onerror="this.src=\'https://placehold.co/400x400/11141b/ffffff?text=Produto\'"></div>' +
        '<span class="product-category">' + p.categoria + '</span>' +
        '<h3 class="product-title">' + p.nome + '</h3>' +
        '<div class="product-price"><span class="price">R$ ' + precoFinal.toFixed(2).replace('.', ',') + '</span>' + precoOriginal + '</div>' +
        estoque +
        '<div class="product-actions">' + addBtn +
        '<a href="' + waUrl + '" target="_blank" rel="noopener" class="btn-buy-whatsapp"><i class="fab fa-whatsapp"></i> Comprar pelo WhatsApp</a>' +
        '</div>';

    return card;
}

// ── Busca ─────────────────────────────────────────────────────
function initSearch() {
    var searchInput = document.getElementById('search-input');
    var searchBtn = document.getElementById('search-btn');
    if (!searchInput) return;

    function doSearch() {
        currentSearch = searchInput.value.trim();
        currentCategory = '';
        currentPage = 1;
        currentFilter = 'todos';
        renderProducts();
        var ps = document.getElementById('products-section');
        if (ps) ps.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    searchInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') doSearch(); });
    if (searchBtn) searchBtn.addEventListener('click', doSearch);
}

// ── Filtros ───────────────────────────────────────────────────
function initFilterButtons() {
    document.querySelectorAll('[data-filter]').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('[data-filter]').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            currentCategory = '';
            currentPage = 1;
            currentSearch = '';
            var si = document.getElementById('search-input');
            if (si) si.value = '';
            renderProducts();
        });
    });

    var sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.addEventListener('change', function() { currentPage = 1; renderProducts(); });

    var btnLoadMore = document.getElementById('btn-load-more');
    if (btnLoadMore) btnLoadMore.addEventListener('click', function() { currentPage++; renderProducts(); });

    var btnClear = document.getElementById('btn-clear-filter');
    if (btnClear) {
        btnClear.addEventListener('click', function() {
            currentFilter = 'todos'; currentCategory = ''; currentSearch = ''; currentPage = 1;
            var si = document.getElementById('search-input');
            if (si) si.value = '';
            document.querySelectorAll('[data-filter]').forEach(function(b) { b.classList.remove('active'); });
            var todosBtn = document.querySelector('[data-filter="todos"]');
            if (todosBtn) todosBtn.classList.add('active');
            renderProducts();
        });
    }
}

// ── Avaliações ────────────────────────────────────────────────
function renderReviews() {
    var grid = document.getElementById('reviews-grid');
    if (!grid) return;
    grid.innerHTML = '';
    reviews.forEach(function(r) {
        var stars = '';
        for (var i = 0; i < r.stars; i++) stars += '<i class="fas fa-star"></i>';
        var div = document.createElement('div');
        div.className = 'review-card';
        div.innerHTML =
            '<div class="review-stars">' + stars + '</div>' +
            '<p class="review-text">"' + r.texto + '"</p>' +
            '<div class="review-author">' + r.nome + ' — ' + r.cidade + '</div>';
        grid.appendChild(div);
    });
}

// ── Menu Mobile ───────────────────────────────────────────────
function initMobileMenu() {
    var menuToggle = document.getElementById('menu-toggle');
    var navMenu = document.getElementById('nav-menu');
    var closeMenuBtn = document.getElementById('close-menu');
    var overlay = document.getElementById('overlay');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', function() {
            navMenu.classList.add('active');
            if (overlay) overlay.classList.add('active');
        });
    }
    if (closeMenuBtn && navMenu) {
        closeMenuBtn.addEventListener('click', function() {
            navMenu.classList.remove('active');
            if (overlay) overlay.classList.remove('active');
        });
    }
}
