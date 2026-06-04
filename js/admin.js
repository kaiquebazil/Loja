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
    initResetCatalog();
    initProductModal();
    initShippingModal();
    initClearOrders();
    initKaosSystem();
}

// ── Tabs ──────────────────────────────────────────────────────
function initAdminTabs() {
    var navBtns = document.querySelectorAll('.admin-nav-btn');
    navBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            navBtns.forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            
            var tabId = btn.getAttribute('data-tab');
            document.querySelectorAll('.admin-tab').forEach(function(t) { t.style.display = 'none'; });
            var targetTab = document.getElementById('tab-' + tabId);
            if (targetTab) targetTab.style.display = 'block';
        });
    });
}

// ── Produtos ──────────────────────────────────────────────────
function renderAdminProducts(filter) {
    var products = getProducts();
    var grid = document.getElementById('admin-products-list');
    if (!grid) return;

    var all = products;
    if (filter) {
        products = products.filter(function(p) {
            return p.nome.toLowerCase().includes(filter.toLowerCase()) || 
                   p.categoria.toLowerCase().includes(filter.toLowerCase());
        });
    }

    // Atualizar stats
    document.getElementById('stat-total').textContent = all.length;
    document.getElementById('stat-destaque').textContent = all.filter(function(p) { return p.destaque; }).length;
    document.getElementById('stat-oferta').textContent = all.filter(function(p) { return p.oferta || p.desconto > 0; }).length;
    document.getElementById('stat-zerado').textContent = all.filter(function(p) { return p.estoque <= 0; }).length;

    grid.innerHTML = '';
    if (products.length === 0) {
        grid.innerHTML = '<tr><td colspan="7" class="empty-state">Nenhum produto encontrado.</td></tr>';
        return;
    }

    products.forEach(function(p) {
        var tr = document.createElement('tr');
        var flags = '';
        if (p.destaque) flags += '<span class="flag-badge flag-destaque">Destaque</span>';
        if (p.oferta || p.desconto > 0) flags += '<span class="flag-badge flag-oferta">Oferta</span>';
        if (p.maisVendido) flags += '<span class="flag-badge flag-mais-vendido">Mais Vendido</span>';

        var stockClass = p.estoque <= 0 ? 'stock-zero' : (p.estoque < 5 ? 'stock-low' : '');

        tr.innerHTML = ' \
            <td><img src="' + p.imagem + '" alt="' + p.nome + '" onerror="this.src=\'https://placehold.co/400x400/11141b/ffffff?text=Produto\'"></td> \
            <td><div class="product-name"><strong>' + p.nome + '</strong><br><small>' + p.categoria + '</small></div></td> \
            <td>R$ ' + p.preco.toFixed(2).replace('.', ',') + '</td> \
            <td class="' + stockClass + '">' + p.estoque + '</td> \
            <td>' + flags + '</td> \
            <td> \
                <div class="table-actions"> \
                    <button onclick="editProduct(' + p.id + ')" class="btn-edit-row" title="Editar"><i class="fas fa-edit"></i></button> \
                    <button onclick="deleteProduct(' + p.id + ')" class="btn-delete-row" title="Excluir"><i class="fas fa-trash"></i></button> \
                </div> \
            </td> \
        ';
        grid.appendChild(tr);
    });
}

function initAdminSearch() {
    var searchInput = document.getElementById('admin-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            renderAdminProducts(searchInput.value);
        });
    }
}

function initResetCatalog() {
    var btn = document.getElementById('btn-reset-catalog');
    if (btn) {
        btn.addEventListener('click', function() {
            if (confirm('Deseja restaurar o catálogo original? Todas as alterações manuais serão perdidas.')) {
                resetProducts();
                renderAdminProducts();
                showAdminToast('Catálogo restaurado com sucesso!', 'success');
            }
        });
    }
}

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
    document.getElementById('prod-desconto').value = p.desconto;
    document.getElementById('prod-imagem').value = p.imagem;
    document.getElementById('prod-destaque').checked = p.destaque;
    document.getElementById('prod-mais-vendido').checked = p.maisVendido;
    document.getElementById('prod-oferta').checked = p.oferta;

    document.getElementById('product-modal-title').textContent = 'Editar Produto';
    document.getElementById('product-modal').classList.add('active');
}

function deleteProduct(id) {
    if (confirm('Deseja realmente excluir este produto?')) {
        var products = getProducts().filter(function(p) { return p.id !== id; });
        saveProducts(products);
        renderAdminProducts();
        showAdminToast('Produto removido.', 'success');
    }
}

// ── Frete ─────────────────────────────────────────────────────
function renderAdminShipping() {
    var shipping = getShipping();
    var list = document.getElementById('admin-shipping-list');
    if (!list) return;

    shipping.sort(function(a, b) { return a.nome.localeCompare(b.nome); });
    list.innerHTML = '';

    shipping.forEach(function(s) {
        var tr = document.createElement('tr');
        tr.innerHTML = ' \
            <td>' + s.nome + '</td> \
            <td>R$ ' + s.valor.toFixed(2).replace('.', ',') + '</td> \
            <td> \
                <div class="table-actions"> \
                    <button onclick="editBairro(\'' + s.nome + '\')" class="btn-edit-row"><i class="fas fa-edit"></i></button> \
                    <button onclick="deleteBairro(\'' + s.nome + '\')" class="btn-delete-row"><i class="fas fa-trash"></i></button> \
                </div> \
            </td> \
        ';
        list.appendChild(tr);
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
            var shipping = getShipping();

            if (original) {
                var idx = shipping.findIndex(function(s) { return s.nome === original; });
                if (idx !== -1) shipping[idx] = { nome: nome, valor: valor };
            } else {
                if (shipping.find(function(s) { return s.nome.toLowerCase() === nome.toLowerCase(); })) {
                    showAdminToast('Este bairro já está cadastrado.', 'error');
                    return;
                }
                shipping.push({ nome: nome, valor: valor });
            }

            saveShipping(shipping);
            closeModal();
            renderAdminShipping();
            showAdminToast('Frete atualizado!', 'success');
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
    if (confirm('Excluir frete para o bairro ' + nome + '?')) {
        var shipping = getShipping().filter(function(s) { return s.nome !== nome; });
        saveShipping(shipping);
        renderAdminShipping();
        showAdminToast('Bairro removido.', 'success');
    }
}

// ── Pedidos ───────────────────────────────────────────────────
function renderAdminOrders() {
    var orders = JSON.parse(localStorage.getItem('katech_orders') || '[]');
    var container = document.getElementById('orders-list');
    if (!container) return;

    if (orders.length === 0) {
        container.innerHTML = '<p class="empty-state"><i class="fas fa-inbox"></i> Nenhum pedido registrado ainda.</p>';
        return;
    }

    container.innerHTML = '';
    orders.reverse().forEach(function(order) {
        var card = document.createElement('div');
        card.className = 'order-card';
        
        var itemsStr = '';
        order.cart.forEach(function(item) {
            itemsStr += item.qty + 'x ' + item.nome + ' (R$ ' + (item.preco * item.qty).toFixed(2).replace('.', ',') + ')\n';
        });

        card.innerHTML = ' \
            <div class="order-card-header"> \
                <strong>Cliente: ' + order.cliente.nome + '</strong> \
                <span class="order-date">' + order.date + '</span> \
            </div> \
            <div class="order-items">' + itemsStr + '</div> \
            <div class="order-total">Total: R$ ' + order.total.toFixed(2).replace('.', ',') + '</div> \
            <div style="margin-top:10px; font-size:12px; color:var(--text-muted);"> \
                <i class="fas fa-map-marker-alt"></i> ' + order.cliente.bairro + ', ' + order.cliente.cidade + ' | <i class="fab fa-whatsapp"></i> ' + order.cliente.telefone + ' \
            </div> \
        ';
        container.appendChild(card);
    });
}

function initClearOrders() {
    var btn = document.getElementById('btn-clear-orders');
    if (btn) {
        btn.addEventListener('click', function() {
            if (confirm('Deseja limpar todo o histórico de pedidos?')) {
                localStorage.setItem('katech_orders', '[]');
                renderAdminOrders();
                showAdminToast('Histórico limpo.', 'success');
            }
        });
    }
}

// ── Sistema KAOS / Nota Fiscal ───────────────────────────────
function initKaosSystem() {
    var btnAddItem = document.getElementById('btn-nf-add-item');
    var kaosForm = document.getElementById('kaos-nf-form');
    var btnPreview = document.getElementById('btn-nf-preview');
    var btnCloseModal = document.getElementById('close-nf-modal');
    var modal = document.getElementById('nf-preview-modal');

    // Definir data de hoje por padrão
    var dateInput = document.getElementById('nf-data');
    if (dateInput) dateInput.valueAsDate = new Date();

    // Adicionar primeiro item por padrão
    addNfItemRow();

    if (btnAddItem) {
        btnAddItem.addEventListener('click', function() {
            addNfItemRow();
        });
    }

    if (kaosForm) {
        kaosForm.addEventListener('submit', function(e) {
            e.preventDefault();
            renderNotaFiscal();
            modal.classList.add('active');
            setTimeout(function() { window.print(); }, 500);
        });
    }

    if (btnPreview) {
        btnPreview.addEventListener('click', function() {
            renderNotaFiscal();
            modal.classList.add('active');
        });
    }

    if (btnCloseModal) {
        btnCloseModal.addEventListener('click', function() {
            modal.classList.remove('active');
        });
    }
}

function addNfItemRow() {
    var container = document.getElementById('nf-items-container');
    var row = document.createElement('div');
    row.className = 'nf-item-row';
    
    var products = getProducts();
    var options = products.map(function(p) { 
        return '<option value="' + p.id + '" data-price="' + p.preco + '">' + p.nome + '</option>';
    }).join('');

    row.innerHTML = ' \
        <div class="form-group"> \
            <label>Produto</label> \
            <select class="nf-item-select"> \
                <option value="">Selecione um produto</option> \
                ' + options + ' \
            </select> \
        </div> \
        <div class="form-group"> \
            <label>Qtd</label> \
            <input type="number" class="nf-item-qty" value="1" min="1"> \
        </div> \
        <div class="form-group"> \
            <label>Preço Un.</label> \
            <input type="number" class="nf-item-price" step="0.01"> \
        </div> \
        <div class="form-group"> \
            <label>Subtotal</label> \
            <input type="text" class="nf-item-subtotal" readonly value="R$ 0,00"> \
        </div> \
        <button type="button" class="btn-remove-item" title="Remover"><i class="fas fa-trash"></i></button> \
    ';

    container.appendChild(row);

    // Lógica de atualização de preço ao selecionar produto
    var select = row.querySelector('.nf-item-select');
    var priceInput = row.querySelector('.nf-item-price');
    var qtyInput = row.querySelector('.nf-item-qty');
    var subtotalInput = row.querySelector('.nf-item-subtotal');
    var btnRemove = row.querySelector('.btn-remove-item');

    select.addEventListener('change', function() {
        var opt = select.options[select.selectedIndex];
        var price = opt.getAttribute('data-price');
        if (price) priceInput.value = price;
        updateRowSubtotal();
    });

    [priceInput, qtyInput].forEach(function(input) {
        input.addEventListener('input', updateRowSubtotal);
    });

    function updateRowSubtotal() {
        var p = parseFloat(priceInput.value) || 0;
        var q = parseInt(qtyInput.value) || 0;
        subtotalInput.value = 'R$ ' + (p * q).toFixed(2).replace('.', ',');
    }

    btnRemove.addEventListener('click', function() {
        if (container.children.length > 1) {
            row.remove();
        } else {
            showAdminToast('A nota deve ter pelo menos um item.', 'error');
        }
    });
}

function renderNotaFiscal() {
    var renderArea = document.getElementById('nf-render-area');
    var nome = document.getElementById('nf-cliente-nome').value || 'CONSUMIDOR FINAL';
    var doc = document.getElementById('nf-cliente-doc').value || 'NÃO INFORMADO';
    var end = document.getElementById('nf-cliente-end').value || 'NÃO INFORMADO';
    var cidade = document.getElementById('nf-cliente-cidade').value || 'Petrópolis / RJ';
    var data = document.getElementById('nf-data').value;
    var pagamento = document.getElementById('nf-pagamento').value;
    var obs = document.getElementById('nf-obs').value;

    var itemsHtml = '';
    var total = 0;
    var rows = document.querySelectorAll('.nf-item-row');
    
    rows.forEach(function(row) {
        var select = row.querySelector('.nf-item-select');
        var nomeProd = select.options[select.selectedIndex].text;
        var qty = parseInt(row.querySelector('.nf-item-qty').value) || 0;
        var price = parseFloat(row.querySelector('.nf-item-price').value) || 0;
        var sub = qty * price;
        total += sub;

        if (select.value) {
            itemsHtml += ' \
                <tr> \
                    <td>' + nomeProd + '</td> \
                    <td>' + qty + '</td> \
                    <td>R$ ' + price.toFixed(2).replace('.', ',') + '</td> \
                    <td>R$ ' + sub.toFixed(2).replace('.', ',') + '</td> \
                </tr>';
        }
    });

    var nfNumber = Math.floor(Math.random() * 900000) + 100000;

    renderArea.innerHTML = ' \
        <div class="nf-header"> \
            <div class="nf-header-info"> \
                <h2>KA TECH</h2> \
                <p>Eletrônicos e Acessórios</p> \
                <p>Petrópolis, RJ | (24) 99204-6467</p> \
            </div> \
            <div class="nf-header-number"> \
                <p><strong>NOTA DE VENDA Nº ' + nfNumber + '</strong></p> \
                <p>Data: ' + data.split("-").reverse().join("/") + '</p> \
            </div> \
        </div> \
        <div class="nf-grid"> \
            <div> \
                <strong>CLIENTE:</strong> ' + nome + '<br> \
                <strong>CPF/CNPJ:</strong> ' + doc + ' \
            </div> \
            <div> \
                <strong>ENDEREÇO:</strong> ' + end + '<br> \
                <strong>CIDADE:</strong> ' + cidade + ' \
            </div> \
        </div> \
        <table class="nf-table"> \
            <thead> \
                <tr> \
                    <th>DESCRIÇÃO DO PRODUTO</th> \
                    <th>QTD</th> \
                    <th>VLR. UN</th> \
                    <th>TOTAL</th> \
                </tr> \
            </thead> \
            <tbody> \
                ' + itemsHtml + ' \
            </tbody> \
        </table> \
        <div class="nf-total-area"> \
            TOTAL A PAGAR: R$ ' + total.toFixed(2).replace('.', ',') + ' \
        </div> \
        <div style="margin-top:10px;"> \
            <strong>FORMA DE PAGAMENTO:</strong> ' + pagamento + ' \
        </div> \
        <div class="nf-footer"> \
            <p><strong>OBSERVAÇÕES:</strong> ' + (obs || 'Garantia legal de 90 dias para defeitos de fabricação.') + '</p> \
            <p style="text-align:center; margin-top:30px;">__________________________________________<br>Assinatura KA TECH</p> \
        </div> \
    ';
}

function showAdminToast(message, type) {
    type = type || 'success';
    var toast = document.getElementById('admin-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'admin-toast';
        toast.className = 'toast-notification';
        document.body.appendChild(toast);
    }
    var icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle' };
    var colors = { success: '#25d366', error: '#e52e2e' };
    toast.style.borderLeftColor = colors[type] || colors.success;
    toast.innerHTML = '<i class="fas ' + (icons[type] || icons.success) + '" style="color:' + (colors[type] || colors.success) + '"></i> ' + message;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(function() { toast.classList.remove('show'); }, 3500);
}
