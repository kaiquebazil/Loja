document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Carregado - Inicializando...');
    renderProducts();
    updateCartUI();
    setupEventListeners();
});

function renderProducts(filter = 'Todos', searchQuery = '') {
    const products = getProducts();
    console.log('Renderizando produtos:', products.length);
    
    const container = document.getElementById('product-grid');
    if (!container) {
        console.error('Container product-grid não encontrado!');
        return;
    }

    container.innerHTML = '';

    if (products.length === 0) {
        container.innerHTML = '<p class="no-products" style="text-align:center; padding:40px;">Nenhum produto encontrado. Adicione produtos no painel admin.</p>';
        return;
    }

    const filteredProducts = products.filter(p => {
        const matchesCategory = filter === 'Todos' || p.categoria === filter || (filter === 'Promoções' && p.oferta);
        const matchesSearch = searchQuery === '' || p.nome.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (filteredProducts.length === 0) {
        container.innerHTML = '<p class="no-products" style="text-align:center; padding:40px;">Nenhum produto encontrado para esta categoria.</p>';
        return;
    }

    filteredProducts.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        let tags = '';
        if (product.destaque) tags += '<span class="tag lancamento">Destaque</span>';
        if (product.maisVendido) tags += '<span class="tag mais-vendido">Mais Vendido</span>';
        if (product.oferta) {
            tags += '<span class="tag oferta">Oferta</span>';
            if (product.desconto) tags += `<span class="tag desconto">-${product.desconto}%</span>`;
        }

        const imgUrl = product.imagem || 'https://placehold.co/400x400/11141b/ffffff?text=Produto';

        card.innerHTML = `
            ${tags}
            <div class="product-img">
                <img src="${imgUrl}" alt="${product.nome}" loading="lazy" onerror="this.src='https://placehold.co/400x400/11141b/ffffff?text=Produto'">
            </div>
            <div class="product-info">
                <span class="product-category">${product.categoria || 'Geral'}</span>
                <h4 class="product-title">${product.nome}</h4>
                <div class="product-price">
                    <span class="price">R$ ${product.preco.toFixed(2)}</span>
                </div>
                <span class="product-stock">Estoque: ${product.estoque} unidades</span>
                <button class="btn-add-cart" onclick="addToCart(${product.id})">
                    <i class="fas fa-shopping-cart"></i> Adicionar ao Carrinho
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

function updateCartUI() {
    const cart = getCart();
    const cartBadges = document.querySelectorAll('.cart-badge, .fab-cart .badge');
    const cartTotalElement = document.querySelector('.action-text span');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalDisplay = document.getElementById('cart-total-display');

    const count = getCartCount();
    const total = getCartTotal();

    cartBadges.forEach(badge => {
        if (badge) badge.textContent = count;
    });
    
    if (cartTotalElement) cartTotalElement.textContent = `R$ ${total.toFixed(2)}`;
    
    if (cartItemsContainer) {
        cartItemsContainer.innerHTML = '';
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Seu carrinho está vazio.</p>';
        } else {
            cart.forEach(item => {
                const div = document.createElement('div');
                div.className = 'cart-item';
                div.innerHTML = `
                    <img src="${item.imagem}" alt="${item.nome}" onerror="this.src='https://placehold.co/80x80/11141b/ffffff?text=Produto'">
                    <div class="cart-item-info">
                        <h5>${item.nome}</h5>
                        <p>R$ ${item.preco.toFixed(2)}</p>
                        <div class="quantity-controls">
                            <button onclick="updateQuantity(${item.id}, -1)">-</button>
                            <span>${item.quantity}</span>
                            <button onclick="updateQuantity(${item.id}, 1)">+</button>
                        </div>
                    </div>
                    <button class="remove-item" onclick="removeFromCart(${item.id})"><i class="fas fa-trash"></i></button>
                `;
                cartItemsContainer.appendChild(div);
            });
        }
    }

    if (cartTotalDisplay) {
        cartTotalDisplay.textContent = `R$ ${total.toFixed(2)}`;
    }
}

function setupEventListeners() {
    const searchInput = document.querySelector('.search-container input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderProducts('Todos', e.target.value);
        });
    }

    const categoryCards = document.querySelectorAll('.category-card');
    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const category = card.querySelector('span')?.textContent || 'Todos';
            const categoryMap = {
                'Mouse': 'Mouse',
                'Teclados': 'Teclados',
                'Headsets': 'Headsets',
                'Controles': 'Controles',
                'SSDs': 'Armazenamento',
                'Memórias RAM': 'Memórias RAM',
                'Cabos': 'Cabos e Adaptadores',
                'Outros': 'Outros'
            };
            renderProducts(categoryMap[category] || category);
            
            const titleEl = document.getElementById('current-category-title');
            if (titleEl) titleEl.textContent = category;
        });
    });

    const menuToggle = document.getElementById('menu-toggle');
    const closeMenu = document.getElementById('close-menu');
    const navMenu = document.getElementById('nav-menu');
    const overlay = document.getElementById('overlay');

    if (menuToggle && navMenu && overlay) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.add('active');
            overlay.classList.add('active');
        });

        const closeNav = () => {
            navMenu.classList.remove('active');
            overlay.classList.remove('active');
        };

        if (closeMenu) closeMenu.addEventListener('click', closeNav);
        
        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => link.addEventListener('click', closeNav));
    }

    const cartIcons = document.querySelectorAll('.cart-icon-wrapper, .fab-cart');
    const cartSidebar = document.getElementById('cart-sidebar');
    const closeCart = document.getElementById('close-cart');

    if (cartSidebar && overlay) {
        cartIcons.forEach(icon => {
            if (icon) {
                icon.addEventListener('click', () => {
                    cartSidebar.classList.add('open');
                    overlay.classList.add('active');
                });
            }
        });

        if (closeCart) {
            closeCart.addEventListener('click', () => {
                cartSidebar.classList.remove('open');
                overlay.classList.remove('active');
            });
        }

        overlay.addEventListener('click', () => {
            cartSidebar.classList.remove('open');
            if (navMenu) navMenu.classList.remove('active');
            const checkoutModal = document.getElementById('checkout-modal');
            if (checkoutModal) checkoutModal.classList.remove('active');
            overlay.classList.remove('active');
        });
    }

    const btnCheckout = document.getElementById('btn-checkout');
    if (btnCheckout) {
        btnCheckout.addEventListener('click', () => {
            if (getCart().length === 0) {
                alert("Adicione produtos ao carrinho primeiro!");
                return;
            }
            const checkoutModal = document.getElementById('checkout-modal');
            if (checkoutModal) checkoutModal.classList.add('active');
            
            const savedData = getCustomerData();
            const nameInput = document.getElementById('cust-name');
            const phoneInput = document.getElementById('cust-phone');
            const cityInput = document.getElementById('cust-city');
            const obsInput = document.getElementById('cust-obs');
            
            if (nameInput) nameInput.value = savedData.nome || '';
            if (phoneInput) phoneInput.value = savedData.telefone || '';
            if (cityInput) cityInput.value = savedData.cidade || '';
            if (obsInput) obsInput.value = savedData.observacoes || '';
        });
    }

    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const customerData = {
                nome: document.getElementById('cust-name').value,
                telefone: document.getElementById('cust-phone').value,
                cidade: document.getElementById('cust-city').value,
                observacoes: document.getElementById('cust-obs').value
            };
            finalizeOrder(customerData);
        });
    }
    
    const closeCheckout = document.getElementById('close-checkout');
    if (closeCheckout) {
        closeCheckout.addEventListener('click', () => {
            const checkoutModal = document.getElementById('checkout-modal');
            if (checkoutModal) checkoutModal.classList.remove('active');
            const cartSidebarCheck = document.getElementById('cart-sidebar');
            if (cartSidebarCheck && !cartSidebarCheck.classList.contains('open')) {
                overlay.classList.remove('active');
            }
        });
    }
}

function showNotification(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}