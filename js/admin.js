/* ============================================================
   KA TECH - admin.js
   Lógica do painel administrativo completo (Sistema KAOS)
   ============================================================ */

var ADMIN_PASSWORD = 'katech2024';
var ADMIN_SESSION_KEY = 'katech_admin_session';

// ── Autenticação ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    if (sessionStorage.getItem(ADMIN_SESSION_KEY) === '1') {
        showAdminPanel();
    }

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

    var btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', function() {
            sessionStorage.removeItem(ADMIN_SESSION_KEY);
            location.reload();
        });
    }
});

function showAdminPanel() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'flex';
    initAdminPanel();
}

function initAdminPanel() {
    initAdminTabs();
    renderDashboard();
    renderAdminProducts();
    renderCustomers();
    renderOS();
    renderGuarantees();
    renderQuotes();
    renderFinance();
    renderPartners();
    renderDocuments();
    renderAdminShipping();
    renderAdminOrders();
    
    initProductModal();
    initCustomerModal();
    initOSModal();
    initQuoteModal();
    initFinanceModal();
    initShippingModal();
    initKaosSystem();
    initBackupSystem();
    initResetCatalog();
    initClearOrders();

    // Busca de Produtos
    var searchInput = document.getElementById('admin-search');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            renderAdminProducts(e.target.value);
        });
    }
}

// ── Tabs ──────────────────────────────────────────────────────
function initAdminTabs() {
    var navBtns = document.querySelectorAll('.admin-nav-btn');
    var tabs = document.querySelectorAll('.admin-tab');

    navBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            // Remover active de todos os botões
            navBtns.forEach(function(b) { b.classList.remove('active'); });
            // Adicionar active no botão clicado
            btn.classList.add('active');
            
            var tabId = btn.getAttribute('data-tab');
            
            // Remover active de todas as abas e esconder
            tabs.forEach(function(t) { 
                t.classList.remove('active');
                t.style.display = 'none'; 
            });

            // Mostrar a aba alvo
            var targetTab = document.getElementById('tab-' + tabId);
            if (targetTab) {
                targetTab.classList.add('active');
                targetTab.style.display = 'block';
            }

            // Refresh data based on tab
            if (tabId === 'dashboard') renderDashboard();
            if (tabId === 'products') renderAdminProducts();
            if (tabId === 'customers') renderCustomers();
            if (tabId === 'os') renderOS();
            if (tabId === 'guarantees') renderGuarantees();
            if (tabId === 'quotes') renderQuotes();
            if (tabId === 'finance') renderFinance();
            if (tabId === 'partners') renderPartners();
            if (tabId === 'documents') renderDocuments();
            if (tabId === 'shipping') renderAdminShipping();
            if (tabId === 'orders') renderAdminOrders();
        });
    });
}

// ── Dashboard ─────────────────────────────────────────────────
function renderDashboard() {
    var os = JSON.parse(localStorage.getItem('kaos_os') || '[]');
    var customers = JSON.parse(localStorage.getItem('kaos_customers') || '[]');
    var orders = JSON.parse(localStorage.getItem('katech_orders') || '[]');

    document.getElementById('dash-os-abertas').textContent = os.filter(function(o) { return o.status === 'Aberto'; }).length;
    document.getElementById('dash-total-clientes').textContent = customers.length;
    document.getElementById('dash-pedidos-site').textContent = orders.length;

    var totalVendas = os.reduce(function(acc, o) { 
        if (o.status === 'Entregue' || o.status === 'Pronto') return acc + (o.valorServico + o.valorPecas);
        return acc;
    }, 0);
    document.getElementById('dash-vendas-mes').textContent = 'R$ ' + totalVendas.toFixed(2).replace('.', ',');

    var dashOsList = document.getElementById('dash-os-list');
    dashOsList.innerHTML = '';
    os.slice(-5).reverse().forEach(function(o) {
        var c = customers.find(function(cust) { return cust.id == o.customerId; });
        var tr = document.createElement('tr');
        tr.innerHTML = ' \
            <td>' + (c ? c.nome : 'Excluído') + '</td> \
            <td>' + o.equipamento + '</td> \
            <td><span class="status-badge status-' + o.status.toLowerCase().replace(" ", "") + '">' + o.status + '</span></td> \
            <td>R$ ' + (o.valorServico + o.valorPecas).toFixed(2).replace('.', ',') + '</td> \
        ';
        dashOsList.appendChild(tr);
    });
}

// ── Clientes ──────────────────────────────────────────────────
function getCustomers() { return JSON.parse(localStorage.getItem('kaos_customers') || '[]'); }
function saveCustomers(data) { localStorage.setItem('kaos_customers', JSON.stringify(data)); }

function renderCustomers(filter) {
    var customers = getCustomers();
    var list = document.getElementById('customers-list');
    if (!list) return;

    if (filter) {
        customers = customers.filter(function(c) {
            return c.nome.toLowerCase().includes(filter.toLowerCase()) || (c.doc && c.doc.includes(filter));
        });
    }

    list.innerHTML = '';
    customers.forEach(function(c) {
        var tr = document.createElement('tr');
        tr.innerHTML = ' \
            <td>' + c.nome + '</td> \
            <td>' + (c.doc || '-') + '</td> \
            <td>' + c.tel + '</td> \
            <td>' + c.cidade + '</td> \
            <td> \
                <div class="table-actions"> \
                    <button onclick="editCustomer(' + c.id + ')" class="btn-edit-row"><i class="fas fa-edit"></i></button> \
                    <button onclick="deleteCustomer(' + c.id + ')" class="btn-delete-row"><i class="fas fa-trash"></i></button> \
                </div> \
            </td> \
        ';
        list.appendChild(tr);
    });
}

function initCustomerModal() {
    var modal = document.getElementById('customer-modal');
    var form = document.getElementById('customer-form');
    
    document.getElementById('btn-add-customer').addEventListener('click', function() {
        form.reset();
        document.getElementById('cust-id').value = '';
        document.getElementById('customer-modal-title').textContent = 'Novo Cliente';
        modal.classList.add('active');
    });

    document.getElementById('close-customer-modal').onclick = function() { modal.classList.remove('active'); };
    document.getElementById('cancel-customer-modal').onclick = function() { modal.classList.remove('active'); };

    form.onsubmit = function(e) {
        e.preventDefault();
        var customers = getCustomers();
        var id = document.getElementById('cust-id').value;
        var data = {
            id: id ? parseInt(id) : Date.now(),
            nome: document.getElementById('cust-nome').value,
            doc: document.getElementById('cust-doc').value,
            tel: document.getElementById('cust-tel').value,
            end: document.getElementById('cust-end').value,
            cidade: document.getElementById('cust-cidade').value,
            bairro: document.getElementById('cust-bairro').value
        };

        if (id) {
            var idx = customers.findIndex(function(c) { return c.id == id; });
            customers[idx] = data;
        } else {
            customers.push(data);
        }

        saveCustomers(customers);
        modal.classList.remove('active');
        renderCustomers();
        showAdminToast('Cliente salvo!');
    };
}

function editCustomer(id) {
    var c = getCustomers().find(function(item) { return item.id == id; });
    document.getElementById('cust-id').value = c.id;
    document.getElementById('cust-nome').value = c.nome;
    document.getElementById('cust-doc').value = c.doc;
    document.getElementById('cust-tel').value = c.tel;
    document.getElementById('cust-end').value = c.end;
    document.getElementById('cust-cidade').value = c.cidade;
    document.getElementById('cust-bairro').value = c.bairro;
    document.getElementById('customer-modal-title').textContent = 'Editar Cliente';
    document.getElementById('customer-modal').classList.add('active');
}

function deleteCustomer(id) {
    if (confirm('Excluir este cliente?')) {
        var customers = getCustomers().filter(function(c) { return c.id != id; });
        saveCustomers(customers);
        renderCustomers();
    }
}

// ── Ordens de Serviço ─────────────────────────────────────────
function getOS() { return JSON.parse(localStorage.getItem('kaos_os') || '[]'); }
function saveOS(data) { localStorage.setItem('kaos_os', JSON.stringify(data)); }

function renderOS() {
    var os = getOS();
    var customers = getCustomers();
    var list = document.getElementById('os-list');
    if (!list) return;

    list.innerHTML = '';
    os.reverse().forEach(function(o) {
        var c = customers.find(function(cust) { return cust.id == o.customerId; });
        var tr = document.createElement('tr');
        tr.innerHTML = ' \
            <td>#' + o.id.toString().slice(-4) + '</td> \
            <td>' + (c ? c.nome : 'Excluído') + '</td> \
            <td>' + o.equipamento + '</td> \
            <td>' + o.data.split('-').reverse().join('/') + '</td> \
            <td><span class="status-badge status-' + o.status.toLowerCase().replace(" ", "") + '">' + o.status + '</span></td> \
            <td>R$ ' + (o.valorServico + o.valorPecas).toFixed(2).replace('.', ',') + '</td> \
            <td> \
                <div class="table-actions"> \
                    <button onclick="printOS(' + o.id + ')" class="btn-edit-row" style="color:#25d366; border-color:#25d366;" title="Imprimir OS"><i class="fas fa-print"></i></button> \
                    <button onclick="editOS(' + o.id + ')" class="btn-edit-row"><i class="fas fa-edit"></i></button> \
                    <button onclick="deleteOS(' + o.id + ')" class="btn-delete-row"><i class="fas fa-trash"></i></button> \
                </div> \
            </td> \
        ';
        list.appendChild(tr);
    });
}

function initOSModal() {
    var modal = document.getElementById('os-modal');
    var form = document.getElementById('os-form');
    
    document.getElementById('btn-add-os').onclick = function() {
        form.reset();
        document.getElementById('os-id').value = '';
        document.getElementById('os-data').valueAsDate = new Date();
        document.getElementById('os-garantia').value = 90;
        populateOSCustomers();
        modal.classList.add('active');
    };

    document.getElementById('close-os-modal').onclick = function() { modal.classList.remove('active'); };
    document.getElementById('cancel-os-modal').onclick = function() { modal.classList.remove('active'); };

        form.onsubmit = function(e) {
        e.preventDefault();
        var os = getOS();
        var id = document.getElementById('os-id').value;
        var data = {
            id: id ? parseInt(id) : Date.now(),
            customerId: document.getElementById('os-cust-id').value,
            data: document.getElementById('os-data').value,
            equipamento: document.getElementById('os-equip').value,
            status: document.getElementById('os-status').value,
            defeito: document.getElementById('os-defeito').value,
            laudo: document.getElementById('os-laudo').value,
            valorServico: parseFloat(document.getElementById('os-valor-serv').value) || 0,
            valorPecas: parseFloat(document.getElementById('os-valor-pecas').value) || 0,
            garantia: parseInt(document.getElementById('os-garantia').value) || 0,
            pagamento: document.getElementById('os-pagamento').value || 'Não informado'
        };

        if (id) {
            var idx = os.findIndex(function(o) { return o.id == id; });
            os[idx] = data;
        } else {
            os.push(data);
        }

        saveOS(os);
        
        // Geração automática de Garantia se entregue
        if (data.status === 'Entregue') {
            var guarantees = getGuarantees();
            var customer = getCustomers().find(function(c) { return c.id == data.customerId; });
            var inicio = new Date().toISOString().split('T')[0];
            var fimDate = new Date();
            fimDate.setDate(fimDate.getDate() + (data.garantia || 90));
            var fim = fimDate.toISOString().split('T')[0];
            
            guarantees.push({
                id: Date.now(),
                cliente: customer ? customer.nome : 'Cliente',
                equipamento: data.equipamento,
                inicio: inicio,
                fim: fim,
                status: 'Ativa'
            });
            saveGuarantees(guarantees);
            
            // Registrar no financeiro como receita
            var finance = getFinance();
            finance.push({
                id: Date.now() + 1,
                desc: 'OS #' + data.id.toString().slice(-4) + ' - ' + data.equipamento,
                valor: data.valorServico + data.valorPecas,
                data: inicio,
                cat: 'Serviços',
                tipo: 'Receita'
            });
            saveFinance(finance);
        }

        modal.classList.remove('active');
        renderOS();
        showAdminToast('OS salva com sucesso!');
    };
}

function populateOSCustomers(selectedId) {
    var select = document.getElementById('os-cust-id');
    var customers = getCustomers();
    select.innerHTML = '<option value="">Selecione um cliente</option>';
    customers.forEach(function(c) {
        var opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.nome;
        if (c.id == selectedId) opt.selected = true;
        select.appendChild(opt);
    });
}

function editOS(id) {
    var o = getOS().find(function(item) { return item.id == id; });
    populateOSCustomers(o.customerId);
    document.getElementById('os-id').value = o.id;
    document.getElementById('os-data').value = o.data;
    document.getElementById('os-equip').value = o.equipamento;
    document.getElementById('os-status').value = o.status;
    document.getElementById('os-defeito').value = o.defeito;
    document.getElementById('os-laudo').value = o.laudo;
    document.getElementById('os-valor-serv').value = o.valorServico;
    document.getElementById('os-valor-pecas').value = o.valorPecas;
    document.getElementById('os-garantia').value = o.garantia || 90;
    document.getElementById('os-pagamento').value = o.pagamento || '';
    document.getElementById('os-modal').classList.add('active');
}

function deleteOS(id) {
    if (confirm('Excluir esta OS?')) {
        var os = getOS().filter(function(o) { return o.id != id; });
        saveOS(os);
        renderOS();
    }
}

// ── Backup System ─────────────────────────────────────────────
function initBackupSystem() {
    document.getElementById('btn-export-data').onclick = function() {
        var data = {
            products: getProducts(),
            customers: getCustomers(),
            os: getOS(),
            guarantees: getGuarantees(),
            quotes: getQuotes(),
            finance: getFinance(),
            documents: JSON.parse(localStorage.getItem('kaos_documents') || '[]'),
            shipping: getShipping(),
            orders: JSON.parse(localStorage.getItem('katech_orders') || '[]'),
            timestamp: new Date().toISOString()
        };
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'backup_katech_' + new Date().toLocaleDateString().replace(/\//g, '-') + '.json';
        a.click();
    };

    document.getElementById('btn-import-data').onclick = function() {
        document.getElementById('import-file').click();
    };

    document.getElementById('import-file').onchange = function(e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var data = JSON.parse(e.target.result);
                if (confirm('Isso irá substituir todos os dados atuais. Continuar?')) {
                    if (data.products) saveProducts(data.products);
                    if (data.customers) saveCustomers(data.customers);
                    if (data.os) saveOS(data.os);
                    if (data.guarantees) saveGuarantees(data.guarantees);
                    if (data.quotes) saveQuotes(data.quotes);
                    if (data.finance) saveFinance(data.finance);
                    if (data.documents) localStorage.setItem('kaos_documents', JSON.stringify(data.documents));
                    if (data.shipping) saveShipping(data.shipping);
                    if (data.orders) localStorage.setItem('katech_orders', JSON.stringify(data.orders));
                    alert('Backup restaurado com sucesso! O painel será reiniciado.');
                    location.reload();
                }
            } catch (err) {
                alert('Erro ao importar arquivo: ' + err.message);
            }
        };
        reader.readAsText(file);
    };
}

// ── Reuso de Funções Existentes (Produtos, Frete, NF, Toast) ──
function renderAdminProducts(filter) {
    var products = getProducts();
    var tbody = document.getElementById('products-tbody');
    if (!tbody) return;

    if (filter) {
        products = products.filter(function(p) {
            return p.nome.toLowerCase().includes(filter.toLowerCase()) || 
                   p.categoria.toLowerCase().includes(filter.toLowerCase());
        });
    }

    // Atualizar Estatísticas
    if (document.getElementById('stat-total')) document.getElementById('stat-total').textContent = products.length;
    if (document.getElementById('stat-destaque')) document.getElementById('stat-destaque').textContent = products.filter(function(p) { return p.destaque; }).length;
    if (document.getElementById('stat-oferta')) document.getElementById('stat-oferta').textContent = products.filter(function(p) { return p.oferta; }).length;
    if (document.getElementById('stat-zerado')) document.getElementById('stat-zerado').textContent = products.filter(function(p) { return p.estoque <= 0; }).length;

    tbody.innerHTML = '';
    products.forEach(function(p) {
        var tr = document.createElement('tr');
        
        var flags = '';
        if (p.destaque) flags += '<span class="flag-badge flag-destaque">Destaque</span>';
        if (p.oferta) flags += '<span class="flag-badge flag-oferta">Oferta</span>';
        if (p.maisVendido) flags += '<span class="flag-badge flag-mais-vendido">Mais Vendido</span>';

        var minStock = p.estoqueMin || 5;
        var stockClass = p.estoque <= 0 ? 'stock-zero' : (p.estoque <= minStock ? 'stock-low' : '');

        tr.innerHTML = ' \
            <td>#' + p.id.toString().slice(-4) + '</td> \
            <td><img src="' + p.imagem + '" alt="' + p.nome + '"></td> \
            <td class="product-name"><strong>' + p.nome + '</strong></td> \
            <td>' + p.categoria + '</td> \
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
        tbody.appendChild(tr);
    });
}

function initProductModal() {
    var modal = document.getElementById('product-modal');
    var form = document.getElementById('product-form');
    if (document.getElementById('btn-add-product')) {
        document.getElementById('btn-add-product').onclick = function() {
            form.reset();
            document.getElementById('prod-id').value = '';
            modal.classList.add('active');
        };
    }
    if (document.getElementById('close-product-modal')) document.getElementById('close-product-modal').onclick = function() { modal.classList.remove('active'); };
    if (form) {
        form.onsubmit = function(e) {
            e.preventDefault();
            var products = getProducts();
            var id = document.getElementById('prod-id').value;
            var data = {
                id: id ? parseInt(id) : Date.now(),
                nome: document.getElementById('prod-nome').value,
                preco: parseFloat(document.getElementById('prod-preco').value),
                custo: parseFloat(document.getElementById('prod-custo').value) || 0,
                estoque: parseInt(document.getElementById('prod-estoque').value),
                estoqueMin: parseInt(document.getElementById('prod-estoque-min').value) || 5,
                fornecedor: document.getElementById('prod-fornecedor').value,
                categoria: document.getElementById('prod-categoria').value,
                imagem: document.getElementById('prod-imagem').value || 'https://placehold.co/100',
                destaque: document.getElementById('prod-destaque').checked,
                oferta: document.getElementById('prod-oferta').checked,
                maisVendido: document.getElementById('prod-mais-vendido').checked,
                desconto: parseInt(document.getElementById('prod-desconto').value) || 0
            };
            if (id) {
                var idx = products.findIndex(function(p) { return p.id == id; });
                products[idx] = data;
            } else {
                products.push(data);
            }
            saveProducts(products);
            modal.classList.remove('active');
            renderAdminProducts();
            showAdminToast('Produto salvo!');
        };
    }
}

function editProduct(id) {
    var p = getProducts().find(function(item) { return item.id == id; });
    document.getElementById('prod-id').value = p.id;
    document.getElementById('prod-nome').value = p.nome;
    document.getElementById('prod-preco').value = p.preco;
    document.getElementById('prod-custo').value = p.custo || 0;
    document.getElementById('prod-estoque').value = p.estoque;
    document.getElementById('prod-estoque-min').value = p.estoqueMin || 5;
    document.getElementById('prod-fornecedor').value = p.fornecedor || '';
    document.getElementById('prod-categoria').value = p.categoria;
    document.getElementById('prod-imagem').value = p.imagem;
    document.getElementById('prod-destaque').checked = p.destaque;
    document.getElementById('prod-oferta').checked = p.oferta;
    document.getElementById('prod-mais-vendido').checked = p.maisVendido;
    document.getElementById('prod-desconto').value = p.desconto || 0;
    document.getElementById('product-modal').classList.add('active');
}

function deleteProduct(id) {
    if (confirm('Excluir produto?')) {
        var products = getProducts().filter(function(p) { return p.id != id; });
        saveProducts(products);
        renderAdminProducts();
    }
}

function renderAdminShipping() {
    var shipping = getShipping();
    var tbody = document.getElementById('shipping-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
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
        tbody.appendChild(tr);
    });
}

function initShippingModal() {
    var modal = document.getElementById('bairro-modal');
    var form = document.getElementById('bairro-form');
    if (document.getElementById('btn-add-bairro')) {
        document.getElementById('btn-add-bairro').onclick = function() {
            form.reset();
            document.getElementById('bairro-original').value = '';
            modal.classList.add('active');
        };
    }
    if (document.getElementById('close-bairro-modal')) document.getElementById('close-bairro-modal').onclick = function() { modal.classList.remove('active'); };
    if (form) {
        form.onsubmit = function(e) {
            e.preventDefault();
            var shipping = getShipping();
            var original = document.getElementById('bairro-original').value;
            var data = { nome: document.getElementById('bairro-nome').value, valor: parseFloat(document.getElementById('bairro-valor').value) };
            if (original) {
                var idx = shipping.findIndex(function(s) { return s.nome == original; });
                shipping[idx] = data;
            } else {
                shipping.push(data);
            }
            saveShipping(shipping);
            modal.classList.remove('active');
            renderAdminShipping();
        };
    }
}

function editBairro(nome) {
    var s = getShipping().find(function(item) { return item.nome == nome; });
    document.getElementById('bairro-original').value = s.nome;
    document.getElementById('bairro-nome').value = s.nome;
    document.getElementById('bairro-valor').value = s.valor;
    document.getElementById('bairro-modal').classList.add('active');
}

function deleteBairro(nome) {
    if (confirm('Excluir bairro?')) {
        var shipping = getShipping().filter(function(s) { return s.nome != nome; });
        saveShipping(shipping);
        renderAdminShipping();
    }
}

function renderAdminOrders() {
    var orders = JSON.parse(localStorage.getItem('katech_orders') || '[]');
    var container = document.getElementById('orders-list');
    if (!container) return;
    container.innerHTML = '';
    orders.reverse().forEach(function(o) {
        var div = document.createElement('div');
        div.className = 'order-card';
        div.innerHTML = '<strong>' + o.cliente.nome + '</strong> - ' + o.date + '<br><small>' + o.total.toFixed(2) + '</small>';
        container.appendChild(div);
    });
}

function initKaosSystem() {
    var btnAddItem = document.getElementById('btn-nf-add-item');
    if (btnAddItem) btnAddItem.onclick = function() { addNfItemRow(); };
    var form = document.getElementById('kaos-nf-form');
    if (form) {
        form.onsubmit = function(e) {
            e.preventDefault();
            renderNotaFiscal();
        };
    }
    var closeBtn = document.getElementById('close-print-modal');
    if (closeBtn) closeBtn.onclick = function() { document.getElementById('print-modal').classList.remove('active'); };
}

function addNfItemRow() {
    var container = document.getElementById('nf-items-container');
    var row = document.createElement('div');
    row.className = 'nf-item-row';
    var products = getProducts();
    var options = products.map(function(p) { return '<option value="' + p.id + '" data-price="' + p.preco + '">' + p.nome + '</option>'; }).join('');
    row.innerHTML = '<div class="form-group"><label>Produto</label><select class="nf-item-select"><option value="">Selecione</option>' + options + '</select></div><div class="form-group"><label>Qtd</label><input type="number" class="nf-item-qty" value="1"></div><div class="form-group"><label>Preço</label><input type="number" class="nf-item-price" step="0.01"></div><div class="form-group"><label>Subtotal</label><input type="text" class="nf-item-subtotal" readonly></div><button type="button" class="btn-remove-item"><i class="fas fa-trash"></i></button>';
    container.appendChild(row);
    var sel = row.querySelector('.nf-item-select');
    var pr = row.querySelector('.nf-item-price');
    var qt = row.querySelector('.nf-item-qty');
    var sub = row.querySelector('.nf-item-subtotal');
    sel.onchange = function() { var p = sel.options[sel.selectedIndex].getAttribute('data-price'); if (p) pr.value = p; update(); };
    pr.oninput = qt.oninput = update;
    function update() { sub.value = 'R$ ' + ((parseFloat(pr.value) || 0) * (parseInt(qt.value) || 0)).toFixed(2); }
    row.querySelector('.btn-remove-item').onclick = function() { row.remove(); };
}

function getCompanyHeader(title, docId) {
    return ' \
        <div class="print-header"> \
            <div class="company-info"> \
                <h2>KA TECH</h2> \
                <p><strong>CNPJ:</strong> 55.452.123/0001-89</p> \
                <p><strong>Endereço:</strong> Petrópolis, RJ</p> \
                <p><strong>WhatsApp:</strong> (24) 99204-6467</p> \
            </div> \
            <div class="doc-title"> \
                <h1>' + title + '</h1> \
                <p>Nº ' + docId.toString().slice(-6) + '</p> \
                <p>Data: ' + new Date().toLocaleDateString() + '</p> \
            </div> \
        </div> \
    ';
}

function renderNotaFiscal() {
    var area = document.getElementById('print-render-area');
    var total = 0;
    var itemsHtml = '';
    
    document.querySelectorAll('.nf-item-row').forEach(function(row) {
        var select = row.querySelector('.nf-item-select');
        if (select.value) {
            var n = select.options[select.selectedIndex].text;
            var q = parseInt(row.querySelector('.nf-item-qty').value) || 0;
            var p = parseFloat(row.querySelector('.nf-item-price').value) || 0;
            total += q * p;
            itemsHtml += '<tr><td>' + n + '</td><td>' + q + '</td><td>R$ ' + p.toFixed(2).replace('.', ',') + '</td><td>R$ ' + (q * p).toFixed(2).replace('.', ',') + '</td></tr>';
        }
    });

    var html = getCompanyHeader('Nota de Venda', Date.now());
    html += ' \
        <div class="print-box" style="margin-bottom:20px;"> \
            <h4>Dados do Cliente</h4> \
            <p><strong>Nome:</strong> ' + document.getElementById('nf-cliente-nome').value + '</p> \
            <p><strong>CPF/CNPJ:</strong> ' + document.getElementById('nf-cliente-cpf').value + '</p> \
        </div> \
        <table class="print-table"> \
            <thead><tr><th>Descrição</th><th>Qtd</th><th>Unitário</th><th>Total</th></tr></thead> \
            <tbody>' + itemsHtml + '</tbody> \
        </table> \
        <div class="print-summary"> \
            <div class="garantia-box"> \
                <h4>Termos de Garantia</h4> \
                <p>Garantia legal de 90 dias conforme CDC. A garantia não cobre danos por mau uso, quedas ou contato com líquidos.</p> \
            </div> \
            <div class="total-box"> \
                <p>Subtotal: R$ ' + total.toFixed(2).replace('.', ',') + '</p> \
                <p class="grand-total">TOTAL: R$ ' + total.toFixed(2).replace('.', ',') + '</p> \
            </div> \
        </div> \
        <div class="signature-area"> \
            <div class="sig-line">KA TECH</div> \
            <div class="sig-line">ASSINATURA DO CLIENTE</div> \
        </div> \
    ';

    area.innerHTML = html;
    document.getElementById('print-modal-title').textContent = 'Visualizar Nota Fiscal';
    document.getElementById('print-modal').classList.add('active');
}

function printOS(id) {
    var o = getOS().find(function(item) { return item.id == id; });
    var c = getCustomers().find(function(cust) { return cust.id == o.customerId; });
    var area = document.getElementById('print-render-area');
    
    var html = getCompanyHeader('Ordem de Serviço', o.id);
    html += ' \
        <div class="print-grid"> \
            <div class="print-box"> \
                <h4>Cliente</h4> \
                <p><strong>Nome:</strong> ' + (c ? c.nome : 'N/A') + '</p> \
                <p><strong>CPF/CNPJ:</strong> ' + (c && c.doc ? c.doc : '-') + '</p> \
                <p><strong>Tel:</strong> ' + (c ? c.tel : '-') + '</p> \
            </div> \
            <div class="print-box"> \
                <h4>Equipamento</h4> \
                <p><strong>Modelo:</strong> ' + o.equipamento + '</p> \
                <p><strong>Status:</strong> ' + o.status + '</p> \
                <p><strong>Entrada:</strong> ' + o.data.split('-').reverse().join('/') + '</p> \
            </div> \
        </div> \
        <div class="print-box" style="margin-bottom:20px;"> \
            <h4>Defeito / Laudo Técnico</h4> \
            <p><strong>Defeito:</strong> ' + o.defeito + '</p> \
            <p><strong>Laudo:</strong> ' + o.laudo + '</p> \
        </div> \
        <table class="print-table"> \
            <thead><tr><th>Descrição</th><th>Valor</th></tr></thead> \
            <tbody> \
                <tr><td>Mão de Obra / Serviço</td><td>R$ ' + o.valorServico.toFixed(2).replace('.', ',') + '</td></tr> \
                <tr><td>Peças / Componentes</td><td>R$ ' + o.valorPecas.toFixed(2).replace('.', ',') + '</td></tr> \
            </tbody> \
        </table> \
        <div class="print-summary"> \
            <div class="garantia-box"> \
                <h4>Garantia e Observações</h4> \
                <p>Garantia de ' + (o.garantia || 90) + ' dias para os serviços realizados. Pagamento: ' + (o.pagamento || '-') + '.</p> \
            </div> \
            <div class="total-box"> \
                <p class="grand-total">TOTAL: R$ ' + (o.valorServico + o.valorPecas).toFixed(2).replace('.', ',') + '</p> \
            </div> \
        </div> \
        <div class="signature-area"> \
            <div class="sig-line">KA TECH</div> \
            <div class="sig-line">ASSINATURA DO CLIENTE</div> \
        </div> \
    ';

    area.innerHTML = html;
    document.getElementById('print-modal-title').textContent = 'Visualizar Ordem de Serviço';
    document.getElementById('print-modal').classList.add('active');
}

function showAdminToast(msg) {
    var t = document.getElementById('admin-toast');
    if (!t) { t = document.createElement('div'); t.id = 'admin-toast'; t.className = 'toast-notification'; document.body.appendChild(t); }
    t.innerHTML = msg; t.classList.add('show');
    setTimeout(function() { t.classList.remove('show'); }, 3000);
}

function initResetCatalog() {
    var btn = document.getElementById('btn-reset-catalog');
    if (btn) btn.onclick = function() { if (confirm('Restaurar catálogo?')) { resetProducts(); renderAdminProducts(); } };
}

function initClearOrders() {
    var btn = document.getElementById('btn-clear-orders');
    if (btn) btn.onclick = function() { if (confirm('Limpar pedidos?')) { localStorage.setItem('katech_orders', '[]'); renderAdminOrders(); } };
}

// ── Garantias ────────────────────────────────────────────────
function getGuarantees() { return JSON.parse(localStorage.getItem('kaos_guarantees') || '[]'); }
function saveGuarantees(data) { localStorage.setItem('kaos_guarantees', JSON.stringify(data)); }

function renderGuarantees() {
    var guarantees = getGuarantees();
    var list = document.getElementById('guarantees-list');
    if (!list) return;
    list.innerHTML = '';
    guarantees.reverse().forEach(function(g) {
        var statusClass = g.status === 'Ativa' ? 'status-pronto' : (g.status === 'Vencendo' ? 'status-emanalise' : 'status-cancelado');
        var tr = document.createElement('tr');
        tr.innerHTML = ' \
            <td>#' + g.id.toString().slice(-4) + '</td> \
            <td>' + g.cliente + '</td> \
            <td>' + g.equipamento + '</td> \
            <td>' + g.inicio.split('-').reverse().join('/') + '</td> \
            <td>' + g.fim.split('-').reverse().join('/') + '</td> \
            <td><span class="status-badge ' + statusClass + '">' + g.status + '</span></td> \
            <td> \
                <div class="table-actions"> \
                    <button onclick="printGuarantee(' + g.id + ')" class="btn-edit-row" style="color:#25d366; border-color:#25d366;"><i class="fas fa-print"></i></button> \
                </div> \
            </td> \
        ';
        list.appendChild(tr);
    });
}

// ── Orçamentos ──────────────────────────────────────────────
function getQuotes() { return JSON.parse(localStorage.getItem('kaos_quotes') || '[]'); }
function saveQuotes(data) { localStorage.setItem('kaos_quotes', JSON.stringify(data)); }

function renderQuotes() {
    var quotes = getQuotes();
    var customers = getCustomers();
    var list = document.getElementById('quotes-list');
    if (!list) return;
    list.innerHTML = '';
    quotes.reverse().forEach(function(q) {
        var c = customers.find(function(cust) { return cust.id == q.customerId; });
        var tr = document.createElement('tr');
        tr.innerHTML = ' \
            <td>#' + q.id.toString().slice(-4) + '</td> \
            <td>' + (c ? c.nome : 'Excluído') + '</td> \
            <td>' + q.itens.substring(0, 30) + '...</td> \
            <td>R$ ' + parseFloat(q.valor).toFixed(2).replace('.', ',') + '</td> \
            <td><span class="status-badge status-' + q.status.toLowerCase() + '">' + q.status + '</span></td> \
            <td> \
                <div class="table-actions"> \
                    <button onclick="convertToOS(' + q.id + ')" class="btn-edit-row" style="color:#25d366; border-color:#25d366;" title="Converter em OS"><i class="fas fa-tools"></i></button> \
                    <button onclick="editQuote(' + q.id + ')" class="btn-edit-row"><i class="fas fa-edit"></i></button> \
                    <button onclick="deleteQuote(' + q.id + ')" class="btn-delete-row"><i class="fas fa-trash"></i></button> \
                </div> \
            </td> \
        ';
        list.appendChild(tr);
    });
}

function initQuoteModal() {
    var modal = document.getElementById('quote-modal');
    var form = document.getElementById('quote-form');
    if (!modal || !form) return;

    document.getElementById('btn-add-quote').onclick = function() {
        form.reset();
        document.getElementById('quote-id').value = '';
        populateQuoteCustomers();
        modal.classList.add('active');
    };

    document.getElementById('close-quote-modal').onclick = function() { modal.classList.remove('active'); };
    document.getElementById('cancel-quote-modal').onclick = function() { modal.classList.remove('active'); };

    form.onsubmit = function(e) {
        e.preventDefault();
        var quotes = getQuotes();
        var id = document.getElementById('quote-id').value;
        var data = {
            id: id ? parseInt(id) : Date.now(),
            customerId: document.getElementById('quote-cust-id').value,
            itens: document.getElementById('quote-items').value,
            valor: parseFloat(document.getElementById('quote-valor').value) || 0,
            status: document.getElementById('quote-status').value
        };
        if (id) {
            var idx = quotes.findIndex(function(q) { return q.id == id; });
            quotes[idx] = data;
        } else {
            quotes.push(data);
        }
        saveQuotes(quotes);
        modal.classList.remove('active');
        renderQuotes();
        showAdminToast('Orçamento salvo!');
    };
}

function populateQuoteCustomers(selectedId) {
    var select = document.getElementById('quote-cust-id');
    var customers = getCustomers();
    if (!select) return;
    select.innerHTML = '<option value="">Selecione um cliente</option>';
    customers.forEach(function(c) {
        var opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.nome;
        if (c.id == selectedId) opt.selected = true;
        select.appendChild(opt);
    });
}

function convertToOS(quoteId) {
    var q = getQuotes().find(function(item) { return item.id == quoteId; });
    var os = getOS();
    var newOS = {
        id: Date.now(),
        customerId: q.customerId,
        data: new Date().toISOString().split('T')[0],
        equipamento: 'Equipamento do Orçamento',
        status: 'Aberto',
        defeito: q.itens,
        laudo: '',
        valorServico: q.valor,
        valorPecas: 0,
        garantia: 90
    };
    os.push(newOS);
    saveOS(os);
    showAdminToast('Orçamento convertido em OS!');
    initAdminTabs(); // Simular clique para mudar de aba ou apenas avisar
}

// ── Financeiro ──────────────────────────────────────────────
function getFinance() { return JSON.parse(localStorage.getItem('kaos_finance') || '[]'); }
function saveFinance(data) { localStorage.setItem('kaos_finance', JSON.stringify(data)); }

function renderFinance() {
    var finance = getFinance();
    var list = document.getElementById('finance-list');
    if (!list) return;
    list.innerHTML = '';
    
    var totalReceitas = 0;
    var totalDespesas = 0;

    finance.reverse().forEach(function(f) {
        if (f.tipo === 'Receita') totalReceitas += f.valor;
        else totalDespesas += f.valor;

        var tr = document.createElement('tr');
        tr.innerHTML = ' \
            <td>' + f.data.split('-').reverse().join('/') + '</td> \
            <td>' + f.desc + '</td> \
            <td>' + f.cat + '</td> \
            <td><span class="status-badge ' + (f.tipo === 'Receita' ? 'status-pronto' : 'status-cancelado') + '">' + f.tipo + '</span></td> \
            <td>R$ ' + f.valor.toFixed(2).replace('.', ',') + '</td> \
            <td> \
                <button onclick="deleteFinance(' + f.id + ')" class="btn-delete-row"><i class="fas fa-trash"></i></button> \
            </td> \
        ';
        list.appendChild(tr);
    });

    document.getElementById('fin-receitas').textContent = 'R$ ' + totalReceitas.toFixed(2).replace('.', ',');
    document.getElementById('fin-despesas').textContent = 'R$ ' + totalDespesas.toFixed(2).replace('.', ',');
    document.getElementById('fin-lucro').textContent = 'R$ ' + (totalReceitas - totalDespesas).toFixed(2).replace('.', ',');
}

function initFinanceModal() {
    var modal = document.getElementById('finance-modal');
    var form = document.getElementById('finance-form');
    if (!modal || !form) return;

    document.getElementById('btn-add-income').onclick = function() {
        form.reset();
        document.getElementById('fin-id').value = '';
        document.getElementById('fin-tipo').value = 'Receita';
        document.getElementById('fin-data').valueAsDate = new Date();
        document.getElementById('finance-modal-title').textContent = 'Nova Receita';
        modal.classList.add('active');
    };

    document.getElementById('btn-add-expense').onclick = function() {
        form.reset();
        document.getElementById('fin-id').value = '';
        document.getElementById('fin-tipo').value = 'Despesa';
        document.getElementById('fin-data').valueAsDate = new Date();
        document.getElementById('finance-modal-title').textContent = 'Nova Despesa';
        modal.classList.add('active');
    };

    document.getElementById('close-finance-modal').onclick = function() { modal.classList.remove('active'); };
    document.getElementById('cancel-finance-modal').onclick = function() { modal.classList.remove('active'); };

    form.onsubmit = function(e) {
        e.preventDefault();
        var finance = getFinance();
        var data = {
            id: Date.now(),
            desc: document.getElementById('fin-desc').value,
            valor: parseFloat(document.getElementById('fin-valor').value) || 0,
            data: document.getElementById('fin-data').value,
            cat: document.getElementById('fin-cat').value,
            tipo: document.getElementById('fin-tipo').value
        };
        finance.push(data);
        saveFinance(finance);
        modal.classList.remove('active');
        renderFinance();
        showAdminToast('Lançamento realizado!');
    };
}

function deleteFinance(id) {
    if (confirm('Excluir este lançamento?')) {
        var finance = getFinance().filter(function(f) { return f.id != id; });
        saveFinance(finance);
        renderFinance();
    }
}

// ── Sócios ──────────────────────────────────────────────────
function renderPartners() {
    var os = getOS();
    var partnersGrid = document.querySelector('.partners-grid');
    if (!partnersGrid) return;
    
    // Simulação de sócios (Kaique e Alex conforme prompt)
    var partners = [
        { nome: 'Kaique', comissao: 0.5 },
        { nome: 'Alex', comissao: 0.5 }
    ];

    partnersGrid.innerHTML = '';
    partners.forEach(function(p) {
        var totalGerado = os.reduce(function(acc, o) {
            if (o.status === 'Entregue') return acc + o.valorServico;
            return acc;
        }, 0);
        
        var pCard = document.createElement('div');
        pCard.className = 'stat-card';
        pCard.innerHTML = ' \
            <h3 style="color:var(--primary-blue)">' + p.nome + '</h3> \
            <span class="stat-number">R$ ' + (totalGerado * p.comissao).toFixed(2).replace('.', ',') + '</span> \
            <span class="stat-label">Comissão Acumulada (50%)</span> \
        ';
        partnersGrid.appendChild(pCard);
    });
}

// ── Documentos ──────────────────────────────────────────────
function renderDocuments() {
    var docs = JSON.parse(localStorage.getItem('kaos_documents') || '[]');
    var list = document.getElementById('documents-list');
    if (!list) return;
    list.innerHTML = '';
    docs.reverse().forEach(function(d) {
        var tr = document.createElement('tr');
        tr.innerHTML = ' \
            <td>' + d.data + '</td> \
            <td>' + d.tipo + '</td> \
            <td>' + d.cliente + '</td> \
            <td>' + d.ref + '</td> \
            <td> \
                <button onclick="reprintDoc(' + d.id + ')" class="btn-edit-row"><i class="fas fa-print"></i></button> \
            </td> \
        ';
        list.appendChild(tr);
    });
}

function saveDocumentRecord(tipo, cliente, ref) {
    var docs = JSON.parse(localStorage.getItem('kaos_documents') || '[]');
    docs.push({
        id: Date.now(),
        data: new Date().toLocaleDateString('pt-BR'),
        tipo: tipo,
        cliente: cliente,
        ref: ref
    });
    localStorage.setItem('kaos_documents', JSON.stringify(docs));
}

function printGuarantee(id) {
    var g = getGuarantees().find(function(item) { return item.id == id; });
    var renderArea = document.getElementById('print-render-area');
    renderArea.innerHTML = ' \
        <div class="print-header"> \
            <div class="company-info"> \
                <h2>KA TECH</h2> \
                <p>Assistência Técnica e Acessórios</p> \
                <p>Petrópolis, RJ</p> \
            </div> \
            <div class="doc-title"> \
                <h1>Certificado de Garantia</h1> \
                <p>Nº ' + g.id.toString().slice(-6) + '</p> \
            </div> \
        </div> \
        <div class="print-box"> \
            <h4>Dados do Cliente</h4> \
            <p><strong>Nome:</strong> ' + g.cliente + '</p> \
            <p><strong>Equipamento:</strong> ' + g.equipamento + '</p> \
        </div> \
        <div class="print-box" style="margin-top:20px"> \
            <h4>Informações da Garantia</h4> \
            <p><strong>Início:</strong> ' + g.inicio.split('-').reverse().join('/') + '</p> \
            <p><strong>Vencimento:</strong> ' + g.fim.split('-').reverse().join('/') + '</p> \
            <p><strong>Status:</strong> ' + g.status + '</p> \
        </div> \
        <div style="margin-top:30px; font-size:12px; color:#555;"> \
            <p>* Esta garantia cobre apenas defeitos relacionados ao serviço executado ou peças substituídas.</p> \
            <p>* Danos por mau uso, queda ou contato com líquidos anulam esta garantia.</p> \
        </div> \
    ';
    document.getElementById('print-modal-title').textContent = 'Impressão de Garantia';
    document.getElementById('print-modal').classList.add('active');
    saveDocumentRecord('Garantia', g.cliente, '#' + g.id.toString().slice(-6));
}

function editQuote(id) {
    var q = getQuotes().find(function(item) { return item.id == id; });
    populateQuoteCustomers(q.customerId);
    document.getElementById('quote-id').value = q.id;
    document.getElementById('quote-items').value = q.itens;
    document.getElementById('quote-valor').value = q.valor;
    document.getElementById('quote-status').value = q.status;
    document.getElementById('quote-modal').classList.add('active');
}

function deleteQuote(id) {
    if (confirm('Excluir orçamento?')) {
        var quotes = getQuotes().filter(function(q) { return q.id != id; });
        saveQuotes(quotes);
        renderQuotes();
    }
}

function reprintDoc(id) {
    alert('Funcionalidade de reimpressão de histórico em desenvolvimento. Por favor, use a impressão direta no módulo correspondente.');
}

