/* ============================================================
   KA TECH - admin.js
   Lógica do painel administrativo
   ============================================================ */

var ADMIN_PASSWORD = 'katech2024'; // Altere para a senha desejada
var ADMIN_SESSION_KEY = 'katech_admin_session';

// ── Autenticação ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    // Verificar sessão
    if (sessionStorage.getItem(ADMIN_SESSION_KEY) === '1') {
        showAdminPanel();
    }

    // Form de login
    var loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            var pwd = document.getElementById('admin-password').value;
            if (pwd === ADMIN_PASSWORD) {
                sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
                showAdminPanel();
            } else {
                var errEl = document.getElementById('login-error');
                if (errEl) errEl.style.display = 'flex';
                document.getElementById('admin-password').value = '';
                document.getElementById('admin-password').focus();
            }
        });
    }

    // Toggle senha
    var togglePwd = document.getElementById('toggle-password');
    if (togglePwd) {
        togglePwd.addEventListener('click', function() {
            var input = document.getElementById('admin-password');
            var icon = togglePwd.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'fas fa-eye-slash';
            } else {
                input.type = 'password';
                icon.className = 'fas fa-eye';
            }
        });
    }

    // Logout
    var btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', function() {
            sessionStorage.removeItem(ADMIN_SESSION_KEY);
            document.getElementById('admin-panel').style.display = 'none';
            document.getElementById('login-screen').style.display = 'flex';
        });
    }
});

function showAdminPanel() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'flex';
    initAdminPanel();
}

// ── Painel Principal ──────────────────────────────────────────
function initAdminPanel() {
    initAdminTabs();
    renderAdminProducts();
    renderAdminShipping();
    renderAdminOrders();
    initProductModal();
    initShippingModal();
    initAdminSearch();
    initResetCatalog();
    initClearOrders();
}

// ── Tabs ──────────────────────────────────────────────────────
function initAdminTabs() {
    var navBtns = document.querySelectorAll('.admin-nav-btn');
    navBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            navBtns.forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');

            var tab = btn.getAttribute('data-tab');
            document.querySelectorAll('.admin-tab').forEach(function(t) { t.style.display = 'none'; });
            var activeTab = document.getElementById('tab-' + tab);
            if (activeTab) activeTab.style.display = 'block';
        });
    });
}

// ── Produtos ──────────────────────────────────────────────────
function renderAdminProducts(filter) {
    filter = filter || '';
    var products = getProducts();
    if (filter) {
        var q = filter.toLowerCase();
        products = products.filter(function(p) {
            return p.nome.toLowerCase().indexOf(q) !== -1 || p.categoria.toLowerCase().indexOf(q) !== -1;
        });
    }

    // Stats
    var all = getProducts();
    document.getElementById('stat-total').textContent = all.length;
    document.getElementById('stat-destaque').textContent = all.filter(function(p) { return p.destaque; }).length;
    document.getElementById('stat-oferta').textContent = all.filter(function(p) { return p.oferta || p.desconto > 0; }).length;
    document.getElementById('stat-zerado').textContent = all.filter(function(p) { return p.estoque <= 0; }).length;

    var tbody = document.getElementById('products-tbody');
    if (!tbody) return;

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--text-muted);">Nenhum produto encontrado.</td></tr>';
        return;
    }

    tbody.innerHTML = '';
    products.forEach(function(p) {
        var flags = '';
        if (p.destaque) flags += '<span class="flag-badge flag-destaque">Destaque</span>';
        if (p.maisVendido) flags += '<span class="flag-badge flag-mais-vendido">+ Vendido</span>';
        if (p.oferta) flags += '<span class="flag-badge flag-oferta">Oferta</span>';

        var stockClass = p.estoque <= 0 ? 'stock-zero' : (p.estoque <= 3 ? 'stock-low' : '');
        var imgSrc = p.imagem || 'https://placehold.co/46x46/11141b/ffffff?text=IMG';

        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td>' + p.id + '</td>' +
            '<td><img src="' + imgSrc + '" alt="" onerror="this.src=\'https://placehold.co/46x46/11141b/ffffff?text=IMG\'"></td>' +
            '<td class="product-name" title="' + p.nome + '">' + p.nome + '</td>' +
            '<td>' + p.categoria + '</td>' +
            '<td>R$ ' + p.preco.toFixed(2).replace('.', ',') + '</td>' +
            '<td class="' + stockClass + '">' + p.estoque + '</td>' +
            '<td>' + (flags || '—') + '</td>' +
            '<td class="table-actions">' +
            '<button class="btn-edit-row" onclick="editProduct(' + p.id + ')" title="Editar"><i class="fas fa-edit"></i></button>' +
            '<button class="btn-delete-row" onclick="deleteProduct(' + p.id + ')" title="Excluir"><i class="fas fa-trash"></i></button>' +
            '</td>';
        tbody.appendChild(tr);
    });
}

function initAdminSearch() {
    var searchInput = document.getElementById('admin-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            renderAdminProducts(searchInput.value.trim());
        });
    }
}

function initResetCatalog() {
    var btn = document.getElementById('btn-reset-catalog');
    if (btn) {
        btn.addEventListener('click', function() {
            if (confirm('ATENÇÃO! Isso vai restaurar o catálogo original. Produtos adicionados manualmente serão perdidos. Continuar?')) {
                resetProducts();
                renderAdminProducts();
                showAdminToast('Catálogo restaurado com sucesso!', 'success');
            }
        });
    }
}

// ── Modal de Produto ──────────────────────────────────────────
function initProductModal() {
    var modal = document.getElementById('product-modal');
    var form = document.getElementById('product-form');
    var btnAdd = document.getElementById('btn-add-product');
    var btnClose = document.getElementById('close-product-modal');
    var btnCancel = document.getElementById('cancel-product-modal');

    if (btnAdd) {
        btnAdd.addEventListener('click', function() {
            form.reset();
            document.getElementById('prod-id').value = '';
            document.getElementById('product-modal-title').textContent = 'Novo Produto';
            modal.classList.add('active');
        });
    }

    function closeModal() { modal.classList.remove('active'); }
    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var id = document.getElementById('prod-id').value;
            var products = getProducts();

            var productData = {
                id: id ? parseInt(id) : Date.now(),
                nome: document.getElementById('prod-nome').value.trim(),
                categoria: document.getElementById('prod-categoria').value,
                preco: parseFloat(document.getElementById('prod-preco').value) || 0,
                estoque: parseInt(document.getElementById('prod-estoque').value) || 0,
                desconto: parseInt(document.getElementById('prod-desconto').value) || 0,
                imagem: document.getElementById('prod-imagem').value.trim() || 'https://placehold.co/400x400/11141b/ffffff?text=Produto',
                destaque: document.getElementById('prod-destaque').checked,
                maisVendido: document.getElementById('prod-mais-vendido').checked,
                oferta: document.getElementById('prod-oferta').checked
            };

            if (!productData.nome || !productData.categoria) {
                showAdminToast('Preencha o nome e a categoria.', 'error');
                return;
            }

            if (id) {
                var idx = products.findIndex(function(p) { return p.id === parseInt(id); });
                if (idx !== -1) products[idx] = productData;
            } else {
                products.push(productData);
            }

            saveProducts(products);
            closeModal();
            renderAdminProducts();
            showAdminToast(id ? 'Produto atualizado!' : 'Produto adicionado!', 'success');
        });
    }
}

function editProduct(id) {
    var products = getProducts();
    var p = products.find(function(prod) { return prod.id === id; });
    if (!p) return;

    document.getElementById('prod-id').value = p.id;
    document.getElementById('prod-nome').value = p.nome;
    document.getElementById('prod-categoria').value = p.categoria;
    document.getElementById('prod-preco').value = p.preco;
    document.getElementById('prod-estoque').value = p.estoque;
    document.getElementById('prod-desconto').value = p.desconto || 0;
    document.getElementById('prod-imagem').value = p.imagem || '';
    document.getElementById('prod-destaque').checked = p.destaque || false;
    document.getElementById('prod-mais-vendido').checked = p.maisVendido || false;
    document.getElementById('prod-oferta').checked = p.oferta || false;

    document.getElementById('product-modal-title').textContent = 'Editar Produto';
    document.getElementById('product-modal').classList.add('active');
}

function deleteProduct(id) {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
        var products = getProducts().filter(function(p) { return p.id !== id; });
        saveProducts(products);
        renderAdminProducts();
        showAdminToast('Produto excluído.', 'success');
    }
}

// ── Frete ─────────────────────────────────────────────────────
function renderAdminShipping() {
    var tbody = document.getElementById('shipping-tbody');
    if (!tbody) return;

    var shipping = getShipping();
    shipping.sort(function(a, b) { return a.nome.localeCompare(b.nome); });

    tbody.innerHTML = '';
    shipping.forEach(function(s) {
        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td>' + s.nome + '</td>' +
            '<td>R$ ' + s.valor.toFixed(2).replace('.', ',') + '</td>' +
            '<td class="table-actions">' +
            '<button class="btn-edit-row" onclick="editBairro(\'' + s.nome + '\')" title="Editar"><i class="fas fa-edit"></i></button>' +
            '<button class="btn-delete-row" onclick="deleteBairro(\'' + s.nome + '\')" title="Excluir"><i class="fas fa-trash"></i></button>' +
            '</td>';
        tbody.appendChild(tr);
    });
}

function initShippingModal() {
    var modal = document.getElementById('bairro-modal');
    var form = document.getElementById('bairro-form');
    var btnAdd = document.getElementById('btn-add-bairro');
    var btnClose = document.getElementById('close-bairro-modal');
    var btnCancel = document.getElementById('cancel-bairro-modal');

    if (btnAdd) {
        btnAdd.addEventListener('click', function() {
            form.reset();
            document.getElementById('bairro-original').value = '';
            document.getElementById('bairro-modal-title').textContent = 'Novo Bairro';
            modal.classList.add('active');
        });
    }

    function closeModal() { modal.classList.remove('active'); }
    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var original = document.getElementById('bairro-original').value;
            var nome = document.getElementById('bairro-nome').value.trim();
            var valor = parseFloat(document.getElementById('bairro-valor').value) || 0;

            if (!nome) { showAdminToast('Informe o nome do bairro.', 'error'); return; }

            var shipping = getShipping();
            if (original) {
                var idx = shipping.findIndex(function(s) { return s.nome === original; });
                if (idx !== -1) shipping[idx] = { nome: nome, valor: valor };
            } else {
                if (shipping.find(function(s) { return s.nome.toLowerCase() === nome.toLowerCase(); })) {
                    showAdminToast('Bairro já cadastrado.', 'error'); return;
                }
                shipping.push({ nome: nome, valor: valor });
            }

            saveShipping(shipping);
            closeModal();
            renderAdminShipping();
            showAdminToast('Frete salvo!', 'success');
        });
    }
}

function editBairro(nome) {
    var shipping = getShipping();
    var s = shipping.find(function(item) { return item.nome === nome; });
    if (!s) return;

    document.getElementById('bairro-original').value = s.nome;
    document.getElementById('bairro-nome').value = s.nome;
    document.getElementById('bairro-valor').value = s.valor;
    document.getElementById('bairro-modal-title').textContent = 'Editar Bairro';
    document.getElementById('bairro-modal').classList.add('active');
}

function deleteBairro(nome) {
    if (confirm('Remover o bairro "' + nome + '"?')) {
        var shipping = getShipping().filter(function(s) { return s.nome !== nome; });
        saveShipping(shipping);
        renderAdminShipping();
        showAdminToast('Bairro removido.', 'success');
    }
}

// ── Pedidos ───────────────────────────────────────────────────
function renderAdminOrders() {
    var container = document.getElementById('orders-list');
    if (!container) return;

    var orders = JSON.parse(localStorage.getItem('katech_orders')) || [];

    if (orders.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>Nenhum pedido registrado ainda.</p></div>';
        return;
    }

    container.innerHTML = '';
    orders.forEach(function(order) {
        var date = new Date(order.data);
        var dateStr = date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        var itemsHtml = '';
        order.cart.forEach(function(item) {
            itemsHtml += '• ' + item.nome + ' × ' + item.qty + ' = R$ ' + (item.preco * item.qty).toFixed(2).replace('.', ',') + '\n';
        });

        var div = document.createElement('div');
        div.className = 'order-card';
        div.innerHTML =
            '<div class="order-card-header">' +
            '<strong>' + order.nome + ' — ' + order.cidade + (order.bairro ? ' / ' + order.bairro : '') + '</strong>' +
            '<span class="order-date">' + dateStr + '</span>' +
            '</div>' +
            '<div class="order-items">' + itemsHtml + '</div>' +
            '<div class="order-total">Total: R$ ' + order.total.toFixed(2).replace('.', ',') + '</div>';
        container.appendChild(div);
    });
}

function initClearOrders() {
    var btn = document.getElementById('btn-clear-orders');
    if (btn) {
        btn.addEventListener('click', function() {
            if (confirm('Limpar todo o histórico de pedidos?')) {
                localStorage.removeItem('katech_orders');
                renderAdminOrders();
                showAdminToast('Histórico limpo.', 'success');
            }
        });
    }
}

// ── Toast Admin ───────────────────────────────────────────────
function showAdminToast(message, type) {
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
    toast.style.borderLeftColor = colors[type] || colors.success;
    toast.innerHTML = '<i class="fas ' + (icons[type] || icons.success) + '" style="color:' + (colors[type] || colors.success) + '"></i> ' + message;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(function() { toast.classList.remove('show'); }, 3500);
}
