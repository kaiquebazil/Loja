document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    updateCartUI();
    setupEventListeners();
});

function renderProducts(filter = 'Todos', searchQuery = '') {
    const products = getProducts();
    const container = document.getElementById('product-grid');
    if (!container) return;

    container.innerHTML = '';

    const filteredProducts = products.filter(p => {
        const matchesCategory = filter === 'Todos' || p.categoria === filter || (filter === 'Promoções' && p.oferta);
        const matchesSearch = p.nome.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (filteredProducts.length === 0) {
        container.innerHTML = '<p class="no-products">Nenhum produto encontrado.</p>';
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

        card.innerHTML = `
            ${tags}
            <div class="product-img">
                <img src="${product.imagem}" alt="${product.nome}" loading="lazy">
            </div>
            <div class="product-info">
                <span class="product-category">${product.categoria}</span>
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
    const cartCountElements = document.querySelectorAll('.cart-badge, .fab-cart .badge');
    const cartTotalElement = document.querySelector('.action-text span');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalDisplay = document.getElementById('cart-total-display');

    const count = getCartCount();
    const total = getCartTotal();

    cartCountElements.forEach(el => el.textContent = count);
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
                    <img src="${item.imagem}" alt="${item.nome}">
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
    // Pesquisa
    const searchInput = document.querySelector('.search-container input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderProducts('Todos', e.target.value);
        });
    }

    // Categorias no Menu
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            const category = link.textContent.trim().replace(/.*?\s/, ''); // Remove ícone se houver
            const categoryMap = {
                'Início': 'Todos',
                'Todos os Produtos': 'Todos',
                'Mouse': 'Mouse',
                'Teclados': 'Teclados',
                'Headsets': 'Headsets',
                'Controles': 'Controles',
                'Armazenamento': 'Armazenamento',
                'Memórias RAM': 'Memórias RAM',
                'Cabos e Adaptadores': 'Cabos e Adaptadores',
                'Ofertas': 'Promoções',
                'Promoções': 'Promoções'
            };
            
            renderProducts(categoryMap[category] || category);
            
            // Scroll para produtos
            document.querySelector('.products-section').scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Abrir/Fechar Carrinho Lateral
    const cartIcons = document.querySelectorAll('.cart-icon-wrapper, .fab-cart');
    const cartSidebar = document.getElementById('cart-sidebar');
    const closeCart = document.getElementById('close-cart');
    const overlay = document.getElementById('overlay');

    if (cartSidebar && overlay) {
        cartIcons.forEach(icon => {
            icon.addEventListener('click', () => {
                cartSidebar.classList.add('open');
                overlay.classList.add('active');
            });
        });

        closeCart.addEventListener('click', () => {
            cartSidebar.classList.remove('open');
            overlay.classList.remove('active');
        });

        overlay.addEventListener('click', () => {
            cartSidebar.classList.remove('open');
            document.getElementById('checkout-modal').classList.remove('active');
            overlay.classList.remove('active');
        });
    }

    // Finalizar Pedido (Abrir Modal)
    const btnCheckout = document.getElementById('btn-checkout');
    if (btnCheckout) {
        btnCheckout.addEventListener('click', () => {
            if (getCart().length === 0) {
                alert("Adicione produtos ao carrinho primeiro!");
                return;
            }
            document.getElementById('checkout-modal').classList.add('active');
            
            // Preencher dados salvos
            const savedData = getCustomerData();
            document.getElementById('cust-name').value = savedData.nome || '';
            document.getElementById('cust-phone').value = savedData.telefone || '';
            document.getElementById('cust-city').value = savedData.cidade || '';
            document.getElementById('cust-obs').value = savedData.observacoes || '';
        });
    }

    // Confirmar Pedido no Modal
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
    
    // Fechar Modal
    const closeCheckout = document.getElementById('close-checkout');
    if (closeCheckout) {
        closeCheckout.addEventListener('click', () => {
            document.getElementById('checkout-modal').classList.remove('active');
            if (!document.getElementById('cart-sidebar').classList.contains('open')) {
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
