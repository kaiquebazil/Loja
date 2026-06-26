/* ============================================================
   KB Tech - cart.js
   Carrinho de compras, frete por bairro e envio via WhatsApp
   ============================================================ */

const CART_KEY = 'katech_cart';
const ORDERS_KEY = 'katech_orders';
const WHATSAPP_NUMBER = '5521977297049'; // Número da KB Tech

// ── Funções do Carrinho ───────────────────────────────────────
function getCart() {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
}

function addToCart(productId, quantity) {
    quantity = quantity || 1;
    const products = getProducts();
    const product = products.find(function(p) { return p.id === productId; });
    if (!product) return false;
    if (product.estoque < 1) {
        showToast('Produto sem estoque!', 'error');
        return false;
    }

    const cart = getCart();
    const existing = cart.find(function(item) { return item.id === productId; });

    if (existing) {
        if (existing.qty + quantity > product.estoque) {
            showToast('Quantidade máxima atingida!', 'warning');
            return false;
        }
        existing.qty += quantity;
    } else {
        cart.push({
            id: product.id,
            nome: product.nome,
            preco: product.preco,
            imagem: product.imagem,
            qty: quantity
        });
    }

    saveCart(cart);
    var nome = product.nome.length > 30 ? product.nome.substring(0, 30) + '...' : product.nome;
    showToast(nome + ' adicionado ao carrinho!');
    return true;
}

function removeFromCart(productId) {
    var cart = getCart().filter(function(item) { return item.id !== productId; });
    saveCart(cart);
    renderCartSidebar();
}

function updateCartQty(productId, delta) {
    var cart = getCart();
    var item = cart.find(function(i) { return i.id === productId; });
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
        removeFromCart(productId);
        return;
    }

    var products = getProducts();
    var product = products.find(function(p) { return p.id === productId; });
    if (product && item.qty > product.estoque) {
        item.qty = product.estoque;
        showToast('Estoque máximo atingido.', 'warning');
    }

    saveCart(cart);
    renderCartSidebar();
}

function clearCart() {
    localStorage.removeItem(CART_KEY);
    updateCartBadge();
}

function getCartTotal() {
    var cart = getCart();
    return cart.reduce(function(sum, item) { return sum + (item.preco * item.qty); }, 0);
}

function getCartCount() {
    var cart = getCart();
    return cart.reduce(function(sum, item) { return sum + item.qty; }, 0);
}

// ── Badge do carrinho ─────────────────────────────────────────
function updateCartBadge() {
    var count = getCartCount();
    var badges = document.querySelectorAll('.cart-badge');
    badges.forEach(function(badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    });
}

// ── Renderizar Sidebar do Carrinho ────────────────────────────
function renderCartSidebar() {
    var cart = getCart();
    var itemsContainer = document.getElementById('cart-items');
    if (!itemsContainer) return;

    if (cart.length === 0) {
        itemsContainer.innerHTML =
            '<div class="empty-cart-msg">' +
            '<i class="fas fa-shopping-cart" style="font-size:40px;margin-bottom:12px;color:var(--border-color);display:block;"></i>' +
            '<p>Seu carrinho está vazio.</p>' +
            '<p style="font-size:12px;margin-top:6px;">Adicione produtos para continuar.</p>' +
            '</div>';
        updateCartFooter(0, 0);
        return;
    }

    itemsContainer.innerHTML = '';
    cart.forEach(function(item) {
        var div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML =
            '<img src="' + item.imagem + '" alt="' + item.nome + '" onerror="this.src=\'https://placehold.co/68x68/11141b/ffffff?text=IMG\'">' +
            '<div class="cart-item-info">' +
            '<h5>' + item.nome + '</h5>' +
            '<p>R$ ' + item.preco.toFixed(2).replace('.', ',') + '</p>' +
            '<div class="quantity-controls">' +
            '<button onclick="updateCartQty(' + item.id + ', -1)" aria-label="Diminuir">−</button>' +
            '<span>' + item.qty + '</span>' +
            '<button onclick="updateCartQty(' + item.id + ', 1)" aria-label="Aumentar">+</button>' +
            '</div></div>' +
            '<button class="remove-item" onclick="removeFromCart(' + item.id + ')" aria-label="Remover">' +
            '<i class="fas fa-trash-alt"></i></button>';
        itemsContainer.appendChild(div);
    });

    var subtotal = getCartTotal();
    updateCartFooter(subtotal);
}

function updateCartFooter(subtotal) {
    var subtotalEl = document.getElementById('cart-subtotal');
    var freteEl = document.getElementById('cart-frete');
    var totalEl = document.getElementById('cart-total');

    if (subtotalEl) subtotalEl.textContent = 'R$ ' + subtotal.toFixed(2).replace('.', ',');
    if (freteEl) freteEl.textContent = 'Pelo entregador ou retirada';
    if (totalEl) totalEl.textContent = 'R$ ' + subtotal.toFixed(2).replace('.', ',');
}

// ── Preencher select de bairros ───────────────────────────────
function populateShippingSelect() {
    var select = document.getElementById('shipping-select');
    if (!select) return;

    var shipping = getShipping();
    select.innerHTML = '<option value="">Selecione seu bairro</option>';
    shipping.sort(function(a, b) { return a.nome.localeCompare(b.nome); }).forEach(function(s) {
        var opt = document.createElement('option');
        opt.value = s.nome;
        opt.textContent = s.nome;
        select.appendChild(opt);
    });

    select.addEventListener('change', function() {
        var bairro = select.value;
        var resultEl = document.getElementById('shipping-result');
        if (bairro) {
            if (resultEl) {
                resultEl.className = 'shipping-result found';
                resultEl.textContent = 'Frete decidido pelo entregador. Para não pagar frete, retire na Rua Condessa Barbosa, 500, C Tobogã, Corrêas, Petrópolis, RJ - 25730-040.';
            }
        } else {
            if (resultEl) { resultEl.className = 'shipping-result'; resultEl.textContent = ''; }
        }
        renderCartSidebar();
    });
}

// ── Abrir/Fechar Sidebar ──────────────────────────────────────
function openCart() {
    var sidebar = document.getElementById('cart-sidebar');
    var overlay = document.getElementById('overlay');
    if (sidebar) sidebar.classList.add('open');
    if (overlay) overlay.classList.add('active');
    renderCartSidebar();
    populateShippingSelect();
}

function closeCart() {
    var sidebar = document.getElementById('cart-sidebar');
    var overlay = document.getElementById('overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
}

// ── Modal de Checkout ─────────────────────────────────────────
function openCheckoutModal() {
    var cart = getCart();
    if (cart.length === 0) {
        showToast('Adicione produtos ao carrinho primeiro!', 'warning');
        return;
    }

    var modal = document.getElementById('checkout-modal');
    if (!modal) return;

    var summaryEl = document.getElementById('order-summary');
    if (summaryEl) {
        var subtotal = getCartTotal();
        var shippingSelect = document.getElementById('shipping-select');
        var bairro = shippingSelect ? shippingSelect.value : '';
        var html = '<strong>Resumo do Pedido:</strong><br>';
        cart.forEach(function(item) {
            html += '• ' + item.nome + ' × ' + item.qty + ' = R$ ' + (item.preco * item.qty).toFixed(2).replace('.', ',') + '<br>';
        });
        html += '<br>Subtotal: R$ ' + subtotal.toFixed(2).replace('.', ',') + '<br>';
        html += 'Frete: decidido pelo entregador<br>';
        html += 'Retirada sem frete: Rua Condessa Barbosa, 500, C Tobogã, Corrêas, Petrópolis, RJ - 25730-040<br>';
        html += '<strong>Total dos produtos: R$ ' + subtotal.toFixed(2).replace('.', ',') + '</strong>';
        summaryEl.innerHTML = html;
        summaryEl.className = 'form-summary visible';
    }

    modal.classList.add('active');
    closeCart();
}

function closeCheckoutModal() {
    var modal = document.getElementById('checkout-modal');
    if (modal) modal.classList.remove('active');
}

// ── Enviar Pedido via WhatsApp ────────────────────────────────
async function sendOrderWhatsApp(e) {
    e.preventDefault();

    var nome = document.getElementById('checkout-nome').value.trim();
    var telefone = document.getElementById('checkout-telefone').value.trim();
    var cidade = document.getElementById('checkout-cidade').value.trim();
    var bairroInput = document.getElementById('checkout-bairro');
    var bairro = bairroInput ? bairroInput.value.trim() : '';

    if (!nome || !telefone || !cidade) {
        showToast('Preencha todos os campos obrigatórios.', 'error');
        return;
    }

    var cart = getCart();
    var shippingSelect = document.getElementById('shipping-select');
    var selectedBairro = (shippingSelect && shippingSelect.value) ? shippingSelect.value : bairro;
    var subtotal = getCartTotal();
    var orderData = {
        clienteNome: nome,
        telefone: telefone,
        cidade: cidade,
        bairro: selectedBairro || bairro || '',
        endereco: '',
        observacoes: '',
        itens: cart.map(function(item) {
            return {
                id: item.id,
                nome: item.nome,
                quantidade: item.qty,
                precoUnitario: item.preco,
                subtotal: item.preco * item.qty,
                imagem: item.imagem || ''
            };
        }),
        subtotal: subtotal,
        frete: 0,
        total: subtotal,
        formaPagamento: 'A combinar',
        status: 'Novo',
        origem: 'Site',
        criadoEm: new Date().toISOString(),
        whatsappEnviado: true
    };

    var msg = 'Olá *KB Tech*! 👋\n';
    msg += 'Gostaria de fazer este pedido:\n\n';
    msg += '━━━━━━━━━━━━━━━━━━\n';
    msg += '🛒 *ITENS DO PEDIDO*\n';
    msg += '━━━━━━━━━━━━━━━━━━\n';
    cart.forEach(function(item) {
        msg += '▸ ' + item.nome + '\n';
        msg += '  Qtd: ' + item.qty + ' × R$ ' + item.preco.toFixed(2).replace('.', ',') + ' = R$ ' + (item.preco * item.qty).toFixed(2).replace('.', ',') + '\n\n';
    });
    msg += '━━━━━━━━━━━━━━━━━━\n';
    msg += '💰 Subtotal: R$ ' + subtotal.toFixed(2).replace('.', ',') + '\n';
    msg += '🚚 Frete: decidido pelo entregador\n';
    msg += '📍 Retirada sem frete: Rua Condessa Barbosa, 500, C Tobogã, Corrêas, Petrópolis, RJ - 25730-040\n';
    msg += '💵 *TOTAL DOS PRODUTOS: R$ ' + subtotal.toFixed(2).replace('.', ',') + '*\n';
    msg += '━━━━━━━━━━━━━━━━━━\n';
    msg += '📋 *DADOS DO CLIENTE*\n';
    msg += 'Nome: ' + nome + '\n';
    msg += 'Telefone: ' + telefone + '\n';
    msg += 'Cidade: ' + cidade + '\n';
    if (bairro) msg += 'Bairro: ' + bairro + '\n';
    msg += '━━━━━━━━━━━━━━━━━━\n';
    msg += 'Aguardo confirmação! 😊';

    saveOrder(orderData);
    if (window.KBTFirebaseOrders && typeof window.KBTFirebaseOrders.saveOrderToFirebase === 'function') {
        try {
            await window.KBTFirebaseOrders.saveOrderToFirebase(orderData);
        } catch (error) {
            console.error('Erro ao salvar pedido no Firebase. Abrindo WhatsApp normalmente.', error);
        }
    }

    var url = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg);
    window.open(url, '_blank');

    clearCart();
    closeCheckoutModal();
    renderCartSidebar();
    showToast('Pedido enviado! Redirecionando para o WhatsApp...', 'success');
}

// ── Salvar pedido no histórico ────────────────────────────────
function saveOrder(order) {
    var orders = JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
    orders.unshift(order);
    if (orders.length > 50) orders.pop();
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

// ── Toast Notification ────────────────────────────────────────
function showToast(message, type) {
    type = type || 'success';
    var toast = document.getElementById('toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        toast.className = 'toast-notification';
        document.body.appendChild(toast);
    }

    var icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle' };
    var colors = { success: '#25d366', error: '#e52e2e', warning: '#f5a623' };
    var icon = icons[type] || icons.success;
    var color = colors[type] || colors.success;

    toast.style.borderLeftColor = color;
    toast.innerHTML = '<i class="fas ' + icon + '" style="color:' + color + '"></i> ' + message;
    toast.classList.add('show');

    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(function() { toast.classList.remove('show'); }, 3500);
}

// ── Inicializar eventos do carrinho ───────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    updateCartBadge();

    document.querySelectorAll('[data-open-cart]').forEach(function(btn) {
        btn.addEventListener('click', openCart);
    });

    var btnClose = document.getElementById('close-cart');
    if (btnClose) btnClose.addEventListener('click', closeCart);

    var overlay = document.getElementById('overlay');
    if (overlay) overlay.addEventListener('click', function() {
        closeCart();
        closeCheckoutModal();
    });

    var btnCheckout = document.getElementById('btn-checkout');
    if (btnCheckout) btnCheckout.addEventListener('click', openCheckoutModal);

    var btnCloseCheckout = document.getElementById('close-checkout-modal');
    if (btnCloseCheckout) btnCloseCheckout.addEventListener('click', closeCheckoutModal);

    var btnCancelCheckout = document.getElementById('cancel-checkout');
    if (btnCancelCheckout) btnCancelCheckout.addEventListener('click', closeCheckoutModal);

    var checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) checkoutForm.addEventListener('submit', sendOrderWhatsApp);
});
