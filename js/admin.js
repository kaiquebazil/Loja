/* ============================================================
   KB Tech - admin.js
   Lógica do painel administrativo - CORRIGIDO
   ============================================================ */

var ADMIN_PASSWORD = 'katech2024';
var ADMIN_SESSION_KEY = 'katech_admin_session';

// ── Autenticação ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin JS carregado');
    
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

    var togglePassword = document.getElementById('toggle-password');
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            var pwdInput = document.getElementById('admin-password');
            var icon = togglePassword.querySelector('i');
            if (pwdInput.type === 'password') {
                pwdInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                pwdInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
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
    
    // Menu mobile toggle
    var menuToggle = document.getElementById('admin-menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            document.body.classList.toggle('sidebar-mobile-open');
        });
    }
});

function showAdminPanel() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'flex';
    initAdminPanel();
}

function initAdminPanel() {
    console.log('Inicializando admin panel');
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
    initGlobalAdminSearch();

    var searchInput = document.getElementById('admin-search');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            renderAdminProducts(e.target.value);
        });
    }
    
    var customerSearch = document.getElementById('customer-search');
    if (customerSearch) {
        customerSearch.addEventListener('input', function(e) {
            renderCustomers(e.target.value);
        });
    }
    
    var guaranteeSearch = document.getElementById('guarantee-search');
    if (guaranteeSearch) {
        guaranteeSearch.addEventListener('input', function(e) {
            renderGuarantees(e.target.value);
        });
    }
}

function showAdminToast(msg, type) {
    type = type || 'success';
    var toast = document.getElementById('admin-toast');
    if (!toast) { 
        toast = document.createElement('div'); 
        toast.id = 'admin-toast'; 
        toast.className = 'toast-notification'; 
        document.body.appendChild(toast); 
    }
    toast.innerHTML = '<i class="fas fa-info-circle"></i> ' + msg;
    toast.classList.add('show');
    setTimeout(function() { toast.classList.remove('show'); }, 3000);
}

// ── Tabs ──────────────────────────────────────────────────────
function initAdminTabs() {
    var navBtns = document.querySelectorAll('.admin-nav-btn');
    var tabs = document.querySelectorAll('.admin-tab');

    navBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            navBtns.forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            
            var tabId = btn.getAttribute('data-tab');
            
            tabs.forEach(function(t) { 
                t.classList.remove('active');
                t.style.display = 'none'; 
            });

            var targetTab = document.getElementById('tab-' + tabId);
            if (targetTab) {
                targetTab.classList.add('active');
                targetTab.style.display = 'block';
            }

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
            
            if (window.innerWidth <= 768) {
                document.body.classList.remove('sidebar-mobile-open');
            }
        });
    });
}

// ── Dashboard ─────────────────────────────────────────────────
function renderDashboard() {
    var os = JSON.parse(localStorage.getItem('kaos_os') || '[]');
    var customers = JSON.parse(localStorage.getItem('kaos_customers') || '[]');
    var products = getProducts();
    var quotes = getQuotes();
    
    var osAbertas = os.filter(function(o) { 
        return o.status === 'Aberto' || o.status === 'Em Análise' || o.status === 'Aguardando Peça'; 
    }).length;
    
    var estoqueBaixo = products.filter(function(p) { 
        return p.estoque <= (p.estoqueMin || 5); 
    }).length;
    
    var totalVendas = os.reduce(function(acc, o) { 
        if (o.status === 'Entregue' || o.status === 'Pronto') {
            return acc + (o.valorServico + o.valorPecas);
        }
        return acc;
    }, 0);
    
    var lucroEstimado = totalVendas * 0.3;
    
    var dashVendas = document.getElementById('dash-vendas-mes');
    var dashLucro = document.getElementById('dash-lucro-mes');
    var dashOsAbertas = document.getElementById('dash-os-abertas');
    var dashEstoqueBaixo = document.getElementById('dash-estoque-baixo');
    
    if (dashVendas) dashVendas.textContent = 'R$ ' + totalVendas.toFixed(2).replace('.', ',');
    if (dashLucro) dashLucro.textContent = 'R$ ' + lucroEstimado.toFixed(2).replace('.', ',');
    if (dashOsAbertas) dashOsAbertas.textContent = osAbertas;
    if (dashEstoqueBaixo) dashEstoqueBaixo.textContent = estoqueBaixo;
    renderDashboardNotifications(os, quotes, getGuarantees(), products);

    var dashOsList = document.getElementById('dash-os-list');
    if (dashOsList) {
        dashOsList.innerHTML = '';
        var recentOS = os.slice(-5);
        recentOS.reverse();
        for (var i = 0; i < recentOS.length; i++) {
            var o = recentOS[i];
            var c = customers.find(function(cust) { return cust.id == o.customerId; });
            var tr = document.createElement('tr');
            var statusClass = (o.status || 'aberto').toLowerCase().replace(/ /g, '');
            tr.innerHTML = '<td>' + (c ? c.nome : 'Excluído') + '</td><td>' + o.equipamento + '<td><span class="status-badge status-' + statusClass + '">' + (o.status || 'Aberto') + '</span></td><td>R$ ' + (o.valorServico + o.valorPecas).toFixed(2).replace('.', ',') + '</td>';
            dashOsList.appendChild(tr);
        }
    }
}

function isOpenOS(status) {
    return status === 'Aberto' || status === 'Em Análise' || status === 'Aguardando Peça';
}

function isPendingQuote(status) {
    return !status || status === 'Pendente' || status === 'Em Análise' || status === 'Aguardando Cliente';
}

function isGuaranteeExpiring(guarantee) {
    if (!guarantee || !guarantee.fim) return false;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var end = new Date(guarantee.fim + 'T00:00:00');
    var diffDays = Math.ceil((end - today) / 86400000);
    return diffDays >= 0 && diffDays <= 15;
}

function renderDashboardNotifications(os, quotes, guarantees, products) {
    var container = document.getElementById('dash-notifications');
    if (!container) return;

    var osAbertas = os.filter(function(o) { return isOpenOS(o.status); }).length;
    var orcamentosPendentes = quotes.filter(function(q) { return isPendingQuote(q.status); }).length;
    var garantiasVencendo = guarantees.filter(isGuaranteeExpiring).length;
    var estoqueBaixo = products.filter(function(p) { return p.estoque > 0 && p.estoque <= (p.estoqueMin || 5); }).length;
    var semEstoque = products.filter(function(p) { return p.estoque <= 0; }).length;

    var cards = [
        { label: 'OS em aberto', value: osAbertas, icon: 'fa-tools', type: osAbertas ? 'warning' : 'success' },
        { label: 'Orçamentos pendentes', value: orcamentosPendentes, icon: 'fa-file-invoice-dollar', type: orcamentosPendentes ? 'warning' : 'success' },
        { label: 'Garantias vencendo', value: garantiasVencendo, icon: 'fa-shield-alt', type: garantiasVencendo ? 'warning' : 'success' },
        { label: 'Produtos com estoque baixo', value: estoqueBaixo, icon: 'fa-box-open', type: estoqueBaixo ? 'warning' : 'success' },
        { label: 'Produtos sem estoque', value: semEstoque, icon: 'fa-ban', type: semEstoque ? 'danger' : 'success' }
    ];

    container.innerHTML = cards.map(function(card) {
        return '<div class="dashboard-alert ' + card.type + '">' +
            '<strong><i class="fas ' + card.icon + '"></i> ' + card.value + '</strong>' +
            '<span>' + card.label + '</span>' +
            '</div>';
    }).join('');
}

function normalizeSearchText(value) {
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function shortId(id) {
    return String(id || '').slice(-4);
}

function matchesQuery(values, query) {
    var normalized = normalizeSearchText(query);
    for (var i = 0; i < values.length; i++) {
        if (normalizeSearchText(values[i]).indexOf(normalized) !== -1) return true;
    }
    return false;
}

function initGlobalAdminSearch() {
    var input = document.getElementById('global-admin-search');
    var results = document.getElementById('global-search-results');
    if (!input || !results) return;

    input.addEventListener('input', function() {
        var query = input.value.trim();
        if (query.length < 2) {
            results.classList.remove('active');
            results.innerHTML = '';
            return;
        }
        renderGlobalSearchResults(query);
    });
}

function renderGlobalSearchResults(query) {
    var results = document.getElementById('global-search-results');
    if (!results) return;

    var customers = getCustomers();
    var os = getOS();
    var guarantees = getGuarantees();
    var quotes = getQuotes();
    var products = getProducts();
    var items = [];

    customers.forEach(function(c) {
        if (matchesQuery([c.nome, c.tel, c.doc], query)) {
            items.push({ type: 'Cliente', title: c.nome || 'Cliente', meta: 'Telefone: ' + (c.tel || '-') });
        }
    });

    os.forEach(function(o) {
        var customerName = getCustomerNameById(customers, o.customerId);
        if (matchesQuery([o.id, shortId(o.id), customerName, o.equipamento, o.status], query)) {
            items.push({ type: 'OS', title: '#' + shortId(o.id) + ' - ' + (o.equipamento || '-'), meta: customerName + ' | Status: ' + (o.status || 'Aberto') });
        }
    });

    guarantees.forEach(function(g) {
        if (matchesQuery([g.id, shortId(g.id), g.cliente, g.equipamento, g.status], query)) {
            items.push({ type: 'Garantia', title: '#' + shortId(g.id) + ' - ' + (g.equipamento || '-'), meta: (g.cliente || '-') + ' | Vence: ' + (g.fim || '-') });
        }
    });

    quotes.forEach(function(q) {
        var customerName = getCustomerNameById(customers, q.customerId);
        if (matchesQuery([q.id, shortId(q.id), customerName, q.itens, q.status], query)) {
            items.push({ type: 'Orçamento', title: '#' + shortId(q.id) + ' - ' + (q.itens || '-'), meta: customerName + ' | Status: ' + (q.status || 'Pendente') });
        }
    });

    products.forEach(function(p) {
        if (matchesQuery([p.id, shortId(p.id), p.nome, p.categoria], query)) {
            items.push({ type: 'Produto', title: p.nome || 'Produto', meta: (p.categoria || '-') + ' | Estoque: ' + (p.estoque || 0) });
        }
    });

    if (!items.length) {
        results.innerHTML = '<div class="global-result-item"><span class="global-result-type">Busca</span><div><div class="global-result-title">Nenhum registro encontrado</div><div class="global-result-meta">Tente outro nome, telefone ou número.</div></div></div>';
        results.classList.add('active');
        return;
    }

    results.innerHTML = items.slice(0, 12).map(function(item) {
        return '<div class="global-result-item">' +
            '<span class="global-result-type">' + item.type + '</span>' +
            '<div><div class="global-result-title">' + item.title + '</div>' +
            '<div class="global-result-meta">' + item.meta + '</div></div>' +
            '</div>';
    }).join('');
    results.classList.add('active');
}

function getCustomerNameById(customers, customerId) {
    for (var i = 0; i < customers.length; i++) {
        if (customers[i].id == customerId) return customers[i].nome || 'Cliente';
    }
    return 'Cliente não identificado';
}

// ── Clientes ──────────────────────────────────────────────────
function getCustomers() { 
    return JSON.parse(localStorage.getItem('kaos_customers') || '[]'); 
}

function saveCustomers(data) { 
    localStorage.setItem('kaos_customers', JSON.stringify(data)); 
}

function renderCustomers(filter) {
    var customers = getCustomers();
    var list = document.getElementById('customers-list');
    if (!list) return;

    if (filter) {
        var f = filter.toLowerCase();
        customers = customers.filter(function(c) {
            return c.nome.toLowerCase().includes(f) || 
                   (c.doc && c.doc.includes(f)) ||
                   (c.tel && c.tel.includes(f));
        });
    }

    list.innerHTML = '';
    for (var i = 0; i < customers.length; i++) {
        var c = customers[i];
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>' + c.nome + '</td><td>' + (c.doc || '-') + '<tr><td>' + (c.tel || '-') + '</td><td>' + (c.cidade || 'Petrópolis') + '</td><td><div class="table-actions"><button onclick="editCustomer(' + c.id + ')" class="btn-edit-row"><i class="fas fa-edit"></i></button><button onclick="deleteCustomer(' + c.id + ')" class="btn-delete-row"><i class="fas fa-trash"></i></button></div></td>';
        list.appendChild(tr);
    }
}

function initCustomerModal() {
    var modal = document.getElementById('customer-modal');
    var form = document.getElementById('customer-form');
    var btnAdd = document.getElementById('btn-add-customer');
    var btnClose = document.getElementById('close-customer-modal');
    var btnCancel = document.getElementById('cancel-customer-modal');
    var overlay = document.getElementById('overlay');
    
    if (!modal || !form) return;
    
    if (btnAdd) {
        btnAdd.onclick = function() {
            form.reset();
            document.getElementById('cust-id').value = '';
            document.getElementById('customer-modal-title').textContent = 'Novo Cliente';
            modal.style.display = 'flex';
            modal.classList.add('active');
            if (overlay) overlay.classList.add('active');
        };
    }
    
    function closeModal() {
        modal.classList.remove('active');
        modal.style.display = 'none';
        if (overlay) overlay.classList.remove('active');
    }
    
    if (btnClose) btnClose.onclick = closeModal;
    if (btnCancel) btnCancel.onclick = closeModal;
    if (overlay) overlay.onclick = closeModal;

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
            var idx = -1;
            for (var i = 0; i < customers.length; i++) {
                if (customers[i].id == id) {
                    idx = i;
                    break;
                }
            }
            if (idx !== -1) customers[idx] = data;
        } else {
            customers.push(data);
        }

        saveCustomers(customers);
        closeModal();
        renderCustomers();
        showAdminToast('Cliente salvo!');
    };
}

window.editCustomer = function(id) {
    var customers = getCustomers();
    var c = null;
    for (var i = 0; i < customers.length; i++) {
        if (customers[i].id == id) {
            c = customers[i];
            break;
        }
    }
    if (!c) return;
    document.getElementById('cust-id').value = c.id;
    document.getElementById('cust-nome').value = c.nome;
    document.getElementById('cust-doc').value = c.doc || '';
    document.getElementById('cust-tel').value = c.tel || '';
    document.getElementById('cust-end').value = c.end || '';
    document.getElementById('cust-cidade').value = c.cidade || 'Petrópolis';
    document.getElementById('cust-bairro').value = c.bairro || '';
    document.getElementById('customer-modal-title').textContent = 'Editar Cliente';
    var modal = document.getElementById('customer-modal');
    modal.style.display = 'flex';
    modal.classList.add('active');
    document.getElementById('overlay').classList.add('active');
};

window.deleteCustomer = function(id) {
    if (confirm('Excluir este cliente?')) {
        var customers = getCustomers();
        var newCustomers = [];
        for (var i = 0; i < customers.length; i++) {
            if (customers[i].id != id) {
                newCustomers.push(customers[i]);
            }
        }
        saveCustomers(newCustomers);
        renderCustomers();
        showAdminToast('Cliente excluído!');
    }
};

// ── Ordens de Serviço ─────────────────────────────────────────
function getOS() { 
    return JSON.parse(localStorage.getItem('kaos_os') || '[]'); 
}

function saveOS(data) { 
    localStorage.setItem('kaos_os', JSON.stringify(data)); 
}

function renderOS() {
    var os = getOS();
    var customers = getCustomers();
    var list = document.getElementById('os-list');
    if (!list) return;

    list.innerHTML = '';
    for (var i = os.length - 1; i >= 0; i--) {
        var o = os[i];
        var c = null;
        for (var j = 0; j < customers.length; j++) {
            if (customers[j].id == o.customerId) {
                c = customers[j];
                break;
            }
        }
        var statusClass = (o.status || 'aberto').toLowerCase().replace(/ /g, '');
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>#' + o.id.toString().slice(-4) + '</td><td>' + (c ? c.nome : 'Excluído') + '</td><td>' + o.equipamento + '</td><td>' + (o.data ? o.data.split('-').reverse().join('/') : '-') + '<td><span class="status-badge status-' + statusClass + '">' + (o.status || 'Aberto') + '</span></td><td>R$ ' + (o.valorServico + o.valorPecas).toFixed(2).replace('.', ',') + '</td><td><div class="table-actions"><button onclick="printOSAsPDF(' + o.id + ')" class="btn-edit-row" style="color:#25d366;" title="Baixar PDF"><i class="fas fa-file-pdf"></i></button><button onclick="editOS(' + o.id + ')" class="btn-edit-row"><i class="fas fa-edit"></i></button><button onclick="deleteOS(' + o.id + ')" class="btn-delete-row"><i class="fas fa-trash"></i></button></div></td>';
        list.appendChild(tr);
    }
}

function populateOSCustomers(selectedId) {
    var select = document.getElementById('os-cust-id');
    if (!select) return;
    var customers = getCustomers();
    select.innerHTML = '<option value="">Selecione um cliente</option>';
    for (var i = 0; i < customers.length; i++) {
        var c = customers[i];
        var opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.nome;
        if (c.id == selectedId) opt.selected = true;
        select.appendChild(opt);
    }
}

function initOSModal() {
    var modal = document.getElementById('os-modal');
    var form = document.getElementById('os-form');
    var btnAdd = document.getElementById('btn-add-os');
    var btnClose = document.getElementById('close-os-modal');
    var btnCancel = document.getElementById('cancel-os-modal');
    var overlay = document.getElementById('overlay');
    
    if (!modal || !form) return;
    
    if (btnAdd) {
        btnAdd.onclick = function() {
            form.reset();
            document.getElementById('os-id').value = '';
            document.getElementById('os-data').valueAsDate = new Date();
            document.getElementById('os-garantia').value = 90;
            populateOSCustomers();
            modal.style.display = 'flex';
            modal.classList.add('active');
            if (overlay) overlay.classList.add('active');
        };
    }
    
    function closeModal() {
        modal.classList.remove('active');
        modal.style.display = 'none';
        if (overlay) overlay.classList.remove('active');
    }
    
    if (btnClose) btnClose.onclick = closeModal;
    if (btnCancel) btnCancel.onclick = closeModal;

    form.onsubmit = function(e) {
        e.preventDefault();
        var os = getOS();
        var id = document.getElementById('os-id').value;
        var customerId = document.getElementById('os-cust-id').value;
        
        if (!customerId) {
            showAdminToast('Selecione um cliente!', 'error');
            return;
        }
        
        var data = {
            id: id ? parseInt(id) : Date.now(),
            customerId: parseInt(customerId),
            data: document.getElementById('os-data').value || new Date().toISOString().split('T')[0],
            equipamento: document.getElementById('os-equip').value,
            status: document.getElementById('os-status').value,
            defeito: document.getElementById('os-defeito').value,
            laudo: document.getElementById('os-laudo').value,
            valorServico: parseFloat(document.getElementById('os-valor-serv').value) || 0,
            valorPecas: parseFloat(document.getElementById('os-valor-pecas').value) || 0,
            garantia: parseInt(document.getElementById('os-garantia').value) || 90,
            pagamento: document.getElementById('os-pagamento').value || 'Não informado'
        };

        if (id) {
            var idx = -1;
            for (var i = 0; i < os.length; i++) {
                if (os[i].id == id) {
                    idx = i;
                    break;
                }
            }
            if (idx !== -1) os[idx] = data;
        } else {
            os.push(data);
        }

        saveOS(os);
        closeModal();
        renderOS();
        renderDashboard();
        showAdminToast('OS salva!');
    };
}

window.editOS = function(id) {
    var os = getOS();
    var o = null;
    for (var i = 0; i < os.length; i++) {
        if (os[i].id == id) {
            o = os[i];
            break;
        }
    }
    if (!o) return;
    populateOSCustomers(o.customerId);
    document.getElementById('os-id').value = o.id;
    document.getElementById('os-data').value = o.data;
    document.getElementById('os-equip').value = o.equipamento;
    document.getElementById('os-status').value = o.status;
    document.getElementById('os-defeito').value = o.defeito || '';
    document.getElementById('os-laudo').value = o.laudo || '';
    document.getElementById('os-valor-serv').value = o.valorServico;
    document.getElementById('os-valor-pecas').value = o.valorPecas;
    document.getElementById('os-garantia').value = o.garantia || 90;
    document.getElementById('os-pagamento').value = o.pagamento || '';
    var modal = document.getElementById('os-modal');
    modal.style.display = 'flex';
    modal.classList.add('active');
    document.getElementById('overlay').classList.add('active');
};

window.deleteOS = function(id) {
    if (confirm('Excluir esta OS?')) {
        var os = getOS();
        var newOS = [];
        for (var i = 0; i < os.length; i++) {
            if (os[i].id != id) {
                newOS.push(os[i]);
            }
        }
        saveOS(newOS);
        renderOS();
        showAdminToast('OS excluída!');
    }
};

// ── IMPRESSÃO COMO PDF ───────────────────────────────────────
function generateOSHTML(o, c) {
    var total = (o.valorServico + o.valorPecas).toFixed(2).replace('.', ',');
    var dataEntrada = o.data ? o.data.split('-').reverse().join('/') : '-';
    
    return '<!DOCTYPE html>\n' +
        '<html>\n' +
        '<head>\n' +
        '    <meta charset="UTF-8">\n' +
        '    <title>OS_' + o.id + '_KB_Tech</title>\n' +
        '    <style>\n' +
        '        * { margin: 0; padding: 0; box-sizing: border-box; }\n' +
        '        body { font-family: Arial, sans-serif; background: white; padding: 20px; }\n' +
        '        .document { max-width: 800px; margin: 0 auto; background: white; }\n' +
        '        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }\n' +
        '        .company h2 { margin: 0; color: #0066ff; }\n' +
        '        .company p { margin: 2px 0; font-size: 12px; color: #555; }\n' +
        '        .title { text-align: right; }\n' +
        '        .title h1 { margin: 0; font-size: 20px; }\n' +
        '        .title p { margin: 5px 0; }\n' +
        '        .section { border: 1px solid #ddd; padding: 12px; border-radius: 4px; margin-bottom: 15px; }\n' +
        '        .section h4 { margin: 0 0 8px 0; color: #0066ff; font-size: 12px; }\n' +
        '        .section p { margin: 3px 0; font-size: 13px; }\n' +
        '        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }\n' +
        '        table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }\n' +
        '        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }\n' +
        '        th { background: #f5f5f5; }\n' +
        '        .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 10px; }\n' +
        '        .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; margin-top: 50px; text-align: center; }\n' +
        '        .signature { border-top: 1px solid #000; padding-top: 8px; width: 200px; margin: 0 auto; font-size: 12px; }\n' +
        '    </style>\n' +
        '</head>\n' +
        '<body>\n' +
        '    <div class="document">\n' +
        '        <div class="header">\n' +
        '            <div class="company">\n' +
        '                <h2>KB Tech</h2>\n' +
        '                <p>CNPJ: 55.452.123/0001-89</p>\n' +
        '                <p>Petrópolis, RJ</p>\n' +
        '                <p>WhatsApp: (21) 97729-7049</p>\n' +
        '            </div>\n' +
        '            <div class="title">\n' +
        '                <h1>ORDEM DE SERVIÇO</h1>\n' +
        '                <p><strong>Nº:</strong> ' + o.id.toString().slice(-6) + '</p>\n' +
        '                <p><strong>Data:</strong> ' + dataEntrada + '</p>\n' +
        '            </div>\n' +
        '        </div>\n' +
        '        <div class="grid">\n' +
        '            <div class="section">\n' +
        '                <h4>DADOS DO CLIENTE</h4>\n' +
        '                <p><strong>Nome:</strong> ' + (c ? c.nome : 'N/A') + '</p>\n' +
        '                <p><strong>CPF/CNPJ:</strong> ' + (c && c.doc ? c.doc : '-') + '</p>\n' +
        '                <p><strong>Telefone:</strong> ' + (c ? c.tel : '-') + '</p>\n' +
        '            </div>\n' +
        '            <div class="section">\n' +
        '                <h4>DADOS DO EQUIPAMENTO</h4>\n' +
        '                <p><strong>Equipamento:</strong> ' + o.equipamento + '</p>\n' +
        '                <p><strong>Status:</strong> ' + o.status + '</p>\n' +
        '                <p><strong>Garantia:</strong> ' + (o.garantia || 90) + ' dias</p>\n' +
        '            </div>\n' +
        '        </div>\n' +
        '        <div class="section">\n' +
        '            <h4>DEFEITO / RECLAMAÇÃO</h4>\n' +
        '            <p>' + (o.defeito || 'Nenhum defeito informado.') + '</p>\n' +
        '        </div>\n' +
        '        <div class="section">\n' +
        '            <h4>LAUDO TÉCNICO / SERVIÇO REALIZADO</h4>\n' +
        '            <p>' + (o.laudo || 'Aguardando análise.') + '</p>\n' +
        '        </div>\n' +
        '        <table>\n' +
        '            <thead><tr><th>Descrição</th><th style="text-align:right">Valor (R$)</th></tr></thead>\n' +
        '            <tbody>\n' +
        '                <tr><td>Mão de Obra / Serviço</td><td style="text-align:right">R$ ' + o.valorServico.toFixed(2).replace('.', ',') + '</td></tr>\n' +
        '                <tr><td>Peças / Componentes</td><td style="text-align:right">R$ ' + o.valorPecas.toFixed(2).replace('.', ',') + '</td></tr>\n' +
        '            </tbody>\n' +
        '            <tfoot><tr style="background:#f9f9f9; font-weight:bold;"><td>TOTAL</td><td style="text-align:right">R$ ' + total + '</td></tr></tfoot>\n' +
        '        </table>\n' +
        '        <div class="section">\n' +
        '            <h4>INFORMAÇÕES ADICIONAIS</h4>\n' +
        '            <p><strong>Forma de Pagamento:</strong> ' + (o.pagamento || 'A definir') + '</p>\n' +
        '        </div>\n' +
        '        <div class="signatures">\n' +
        '            <div><div class="signature">KB Tech</div></div>\n' +
        '            <div><div class="signature">ASSINATURA DO CLIENTE</div></div>\n' +
        '        </div>\n' +
        '    </div>\n' +
        '</body>\n' +
        '</html>';
}

window.printOSAsPDF = function(id) {
    console.log('Gerando PDF para OS ID:', id);
    
    var os = getOS();
    var o = null;
    for (var i = 0; i < os.length; i++) {
        if (os[i].id == id) {
            o = os[i];
            break;
        }
    }
    
    if (!o) {
        showAdminToast('OS não encontrada!', 'error');
        return;
    }
    
    var customers = getCustomers();
    var c = null;
    for (var i = 0; i < customers.length; i++) {
        if (customers[i].id == o.customerId) {
            c = customers[i];
            break;
        }
    }
    
    var htmlContent = generateOSHTML(o, c);
    var blob = new Blob([htmlContent], { type: 'text/html' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'OS_' + o.id + '_KB_Tech.html';
    a.click();
    URL.revokeObjectURL(url);
    showAdminToast('OS exportada! Abra o arquivo e imprima como PDF.');
};

// ── Produtos ──────────────────────────────────────────────────
function renderAdminProducts(filter) {
    var products = getProducts();
    var tbody = document.getElementById('products-tbody');
    if (!tbody) return;

    if (filter) {
        var f = filter.toLowerCase();
        var filtered = [];
        for (var i = 0; i < products.length; i++) {
            var p = products[i];
            if (p.nome.toLowerCase().includes(f) || p.categoria.toLowerCase().includes(f)) {
                filtered.push(p);
            }
        }
        products = filtered;
    }

    var statTotal = document.getElementById('stat-total');
    var statDestaque = document.getElementById('stat-destaque');
    var statOferta = document.getElementById('stat-oferta');
    var statZerado = document.getElementById('stat-zerado');
    
    if (statTotal) statTotal.textContent = products.length;
    
    var destaqueCount = 0, ofertaCount = 0, zeradoCount = 0;
    for (var i = 0; i < products.length; i++) {
        if (products[i].destaque) destaqueCount++;
        if (products[i].oferta) ofertaCount++;
        if (products[i].estoque <= 0) zeradoCount++;
    }
    if (statDestaque) statDestaque.textContent = destaqueCount;
    if (statOferta) statOferta.textContent = ofertaCount;
    if (statZerado) statZerado.textContent = zeradoCount;

    tbody.innerHTML = '';
    for (var i = 0; i < products.length; i++) {
        var p = products[i];
        var flags = '';
        if (p.destaque) flags += '<span class="flag-badge flag-destaque">Destaque</span>';
        if (p.oferta) flags += '<span class="flag-badge flag-oferta">Oferta</span>';
        if (p.maisVendido) flags += '<span class="flag-badge flag-mais-vendido">+Vendido</span>';

        var stockClass = '';
        if (p.estoque <= 0) stockClass = 'stock-zero';
        else if (p.estoque <= 5) stockClass = 'stock-low';
        
        var lucro = (p.preco || 0) - (p.custo || 0);
        var margem = p.preco > 0 ? ((lucro / p.preco) * 100).toFixed(1) : 0;
        var lucroClass = lucro < 0 ? 'lucro-negativo' : '';

        var tr = document.createElement('tr');
        tr.innerHTML = '<td>#' + p.id.toString().slice(-4) + '</td><td><img src="' + (p.imagem || 'https://placehold.co/100') + '" width="40" onerror="this.src=\'https://placehold.co/100\'"></td><td><strong>' + p.nome.substring(0, 30) + (p.nome.length > 30 ? '...' : '') + '</strong></td><td>' + p.categoria + '</td><td>R$ ' + (p.custo || 0).toFixed(2).replace('.', ',') + '</td><td>R$ ' + (p.preco || 0).toFixed(2).replace('.', ',') + '<td><td class="' + lucroClass + '">R$ ' + lucro.toFixed(2).replace('.', ',') + '</td><td>' + margem + '%</td><td class="' + stockClass + '">' + (p.estoque > 0 ? 'Em estoque' : 'Sem estoque') + '</td><td>' + flags + '</td><td><div class="table-actions"><button onclick="editProduct(' + p.id + ')" class="btn-edit-row"><i class="fas fa-edit"></i></button><button onclick="deleteProduct(' + p.id + ')" class="btn-delete-row"><i class="fas fa-trash"></i></button></div></td>';
        tbody.appendChild(tr);
    }
}

function initProductModal() {
    var modal = document.getElementById('product-modal');
    var form = document.getElementById('product-form');
    var btnAdd = document.getElementById('btn-add-product');
    var btnClose = document.getElementById('close-product-modal');
    var btnCancel = document.getElementById('cancel-product-modal');
    var overlay = document.getElementById('overlay');
    
    if (!modal || !form) return;
    
    if (btnAdd) {
        btnAdd.onclick = function() {
            form.reset();
            document.getElementById('prod-id').value = '';
            document.getElementById('product-modal-title').textContent = 'Novo Produto';
            modal.style.display = 'flex';
            modal.classList.add('active');
            if (overlay) overlay.classList.add('active');
        };
    }
    
    function closeModal() {
        modal.classList.remove('active');
        modal.style.display = 'none';
        if (overlay) overlay.classList.remove('active');
    }
    
    if (btnClose) btnClose.onclick = closeModal;
    if (btnCancel) btnCancel.onclick = closeModal;
    
    form.onsubmit = function(e) {
        e.preventDefault();
        var products = getProducts();
        var id = document.getElementById('prod-id').value;
        var data = {
            id: id ? parseInt(id) : Date.now(),
            nome: document.getElementById('prod-nome').value,
            preco: parseFloat(document.getElementById('prod-preco').value) || 0,
            custo: parseFloat(document.getElementById('prod-custo').value) || 0,
            estoque: parseInt(document.getElementById('prod-estoque').value) || 0,
            estoqueMin: parseInt(document.getElementById('prod-estoque-min').value) || 5,
            fornecedor: document.getElementById('prod-fornecedor').value || '',
            categoria: document.getElementById('prod-categoria').value,
            imagem: document.getElementById('prod-imagem').value || 'https://placehold.co/400',
            destaque: document.getElementById('prod-destaque').checked,
            oferta: document.getElementById('prod-oferta').checked,
            maisVendido: document.getElementById('prod-mais-vendido').checked,
            desconto: parseInt(document.getElementById('prod-desconto').value) || 0
        };
        
        if (id) {
            var idx = -1;
            for (var i = 0; i < products.length; i++) {
                if (products[i].id == id) {
                    idx = i;
                    break;
                }
            }
            if (idx !== -1) products[idx] = data;
        } else {
            products.push(data);
        }
        
        saveProducts(products);
        closeModal();
        renderAdminProducts();
        showAdminToast('Produto salvo!');
    };
}

window.editProduct = function(id) {
    var products = getProducts();
    var p = null;
    for (var i = 0; i < products.length; i++) {
        if (products[i].id == id) {
            p = products[i];
            break;
        }
    }
    if (!p) return;
    document.getElementById('prod-id').value = p.id;
    document.getElementById('prod-nome').value = p.nome;
    document.getElementById('prod-preco').value = p.preco;
    document.getElementById('prod-custo').value = p.custo || 0;
    document.getElementById('prod-estoque').value = p.estoque;
    document.getElementById('prod-estoque-min').value = p.estoqueMin || 5;
    document.getElementById('prod-fornecedor').value = p.fornecedor || '';
    document.getElementById('prod-categoria').value = p.categoria;
    document.getElementById('prod-imagem').value = p.imagem || '';
    document.getElementById('prod-destaque').checked = p.destaque || false;
    document.getElementById('prod-oferta').checked = p.oferta || false;
    document.getElementById('prod-mais-vendido').checked = p.maisVendido || false;
    document.getElementById('prod-desconto').value = p.desconto || 0;
    document.getElementById('product-modal-title').textContent = 'Editar Produto';
    var modal = document.getElementById('product-modal');
    modal.style.display = 'flex';
    modal.classList.add('active');
    document.getElementById('overlay').classList.add('active');
};

window.deleteProduct = function(id) {
    if (confirm('Excluir este produto?')) {
        var products = getProducts();
        var newProducts = [];
        for (var i = 0; i < products.length; i++) {
            if (products[i].id != id) {
                newProducts.push(products[i]);
            }
        }
        saveProducts(newProducts);
        renderAdminProducts();
        showAdminToast('Produto excluído!');
    }
};

// ── Frete ─────────────────────────────────────────────────────
function renderAdminShipping() {
    var shipping = getShipping();
    var tbody = document.getElementById('shipping-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    for (var i = 0; i < shipping.length; i++) {
        var s = shipping[i];
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>' + s.nome + '</td><td>R$ ' + s.valor.toFixed(2).replace('.', ',') + '</td><td><div class="table-actions"><button onclick="editBairro(\'' + s.nome.replace(/'/g, "\\'") + '\')" class="btn-edit-row"><i class="fas fa-edit"></i></button><button onclick="deleteBairro(\'' + s.nome.replace(/'/g, "\\'") + '\')" class="btn-delete-row"><i class="fas fa-trash"></i></button></div></td>';
        tbody.appendChild(tr);
    }
}

function initShippingModal() {
    var modal = document.getElementById('bairro-modal');
    var form = document.getElementById('bairro-form');
    var btnAdd = document.getElementById('btn-add-bairro');
    var btnClose = document.getElementById('close-bairro-modal');
    var btnCancel = document.getElementById('cancel-bairro-modal');
    var overlay = document.getElementById('overlay');
    
    if (!modal || !form) return;
    
    if (btnAdd) {
        btnAdd.onclick = function() {
            form.reset();
            document.getElementById('bairro-original').value = '';
            document.getElementById('bairro-modal-title').textContent = 'Novo Bairro';
            modal.style.display = 'flex';
            modal.classList.add('active');
            if (overlay) overlay.classList.add('active');
        };
    }
    
    function closeModal() {
        modal.classList.remove('active');
        modal.style.display = 'none';
        if (overlay) overlay.classList.remove('active');
    }
    
    if (btnClose) btnClose.onclick = closeModal;
    if (btnCancel) btnCancel.onclick = closeModal;
    
    form.onsubmit = function(e) {
        e.preventDefault();
        var shipping = getShipping();
        var original = document.getElementById('bairro-original').value;
        var data = { 
            nome: document.getElementById('bairro-nome').value, 
            valor: parseFloat(document.getElementById('bairro-valor').value) || 0 
        };
        if (original) {
            var idx = -1;
            for (var i = 0; i < shipping.length; i++) {
                if (shipping[i].nome == original) {
                    idx = i;
                    break;
                }
            }
            if (idx !== -1) shipping[idx] = data;
        } else {
            shipping.push(data);
        }
        saveShipping(shipping);
        closeModal();
        renderAdminShipping();
        showAdminToast('Bairro salvo!');
    };
}

window.editBairro = function(nome) {
    var shipping = getShipping();
    var s = null;
    for (var i = 0; i < shipping.length; i++) {
        if (shipping[i].nome == nome) {
            s = shipping[i];
            break;
        }
    }
    if (!s) return;
    document.getElementById('bairro-original').value = s.nome;
    document.getElementById('bairro-nome').value = s.nome;
    document.getElementById('bairro-valor').value = s.valor;
    document.getElementById('bairro-modal-title').textContent = 'Editar Bairro';
    var modal = document.getElementById('bairro-modal');
    modal.style.display = 'flex';
    modal.classList.add('active');
    document.getElementById('overlay').classList.add('active');
};

window.deleteBairro = function(nome) {
    if (confirm('Excluir este bairro?')) {
        var shipping = getShipping();
        var newShipping = [];
        for (var i = 0; i < shipping.length; i++) {
            if (shipping[i].nome != nome) {
                newShipping.push(shipping[i]);
            }
        }
        saveShipping(newShipping);
        renderAdminShipping();
        showAdminToast('Bairro excluído!');
    }
};

function renderAdminOrders() {
    var orders = JSON.parse(localStorage.getItem('katech_orders') || '[]');
    var container = document.getElementById('orders-list');
    if (!container) return;
    container.innerHTML = '';
    if (orders.length === 0) {
        container.innerHTML = '<p class="empty-state"><i class="fas fa-inbox"></i> Nenhum pedido registrado.</p>';
        return;
    }
    for (var i = orders.length - 1; i >= 0; i--) {
        var o = orders[i];
        var div = document.createElement('div');
        div.className = 'order-card';
        div.innerHTML = '<div class="order-card-header"><strong>' + (o.cliente?.nome || 'Cliente') + '</strong><span class="order-date">' + (o.date || '-') + '</span></div><div class="order-total">Total: R$ ' + (o.total || 0).toFixed(2).replace('.', ',') + '</div>';
        container.appendChild(div);
    }
}

// ── Garantias ────────────────────────────────────────────────
function getGuarantees() { 
    return JSON.parse(localStorage.getItem('kaos_guarantees') || '[]'); 
}

function saveGuarantees(data) { 
    localStorage.setItem('kaos_guarantees', JSON.stringify(data)); 
}

function renderGuarantees(filter) {
    var guarantees = getGuarantees();
    var list = document.getElementById('guarantees-list');
    if (!list) return;
    
    if (filter) {
        var f = filter.toLowerCase();
        var filtered = [];
        for (var i = 0; i < guarantees.length; i++) {
            var g = guarantees[i];
            if (g.cliente.toLowerCase().includes(f) || g.equipamento.toLowerCase().includes(f)) {
                filtered.push(g);
            }
        }
        guarantees = filtered;
    }
    
    list.innerHTML = '';
    for (var i = guarantees.length - 1; i >= 0; i--) {
        var g = guarantees[i];
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>#' + g.id.toString().slice(-4) + '</td><td>' + g.cliente + '</td><td>' + g.equipamento + '<td>' + (g.inicio ? g.inicio.split('-').reverse().join('/') : '-') + '<td>' + (g.fim ? g.fim.split('-').reverse().join('/') : '-') + '<td><span class="status-badge">' + g.status + '</span></td><td><button onclick="printGuaranteeAsPDF(' + g.id + ')" class="btn-edit-row" style="color:#25d366;"><i class="fas fa-file-pdf"></i></button></td>';
        list.appendChild(tr);
    }
}

window.printGuaranteeAsPDF = function(id) {
    var guarantees = getGuarantees();
    var g = null;
    for (var i = 0; i < guarantees.length; i++) {
        if (guarantees[i].id == id) {
            g = guarantees[i];
            break;
        }
    }
    if (!g) return;
    
    var htmlContent = '<!DOCTYPE html>\n' +
        '<html>\n' +
        '<head><meta charset="UTF-8"><title>Garantia_' + g.id + '</title>\n' +
        '<style>\n' +
        '    body { font-family: Arial; padding: 20px; }\n' +
        '    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }\n' +
        '    .content { max-width: 600px; margin: 0 auto; }\n' +
        '    .section { margin-bottom: 15px; }\n' +
        '    .signature { margin-top: 50px; border-top: 1px solid #000; padding-top: 8px; text-align: center; width: 250px; }\n' +
        '</style>\n' +
        '</head>\n' +
        '<body>\n' +
        '<div class="content">\n' +
        '    <div class="header"><h2>KB Tech</h2><p>Certificado de Garantia</p></div>\n' +
        '    <div class="section"><strong>Cliente:</strong> ' + g.cliente + '</div>\n' +
        '    <div class="section"><strong>Equipamento:</strong> ' + g.equipamento + '</div>\n' +
        '    <div class="section"><strong>Data de Início:</strong> ' + g.inicio + '</div>\n' +
        '    <div class="section"><strong>Data de Vencimento:</strong> ' + g.fim + '</div>\n' +
        '    <div class="section"><strong>Status:</strong> ' + g.status + '</div>\n' +
        '    <div class="signature">KB Tech</div>\n' +
        '</div>\n' +
        '</body>\n' +
        '</html>';
    
    var blob = new Blob([htmlContent], { type: 'text/html' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'Garantia_' + g.id + '_KB_Tech.html';
    a.click();
    URL.revokeObjectURL(url);
    showAdminToast('Garantia exportada!');
};

// ── Orçamentos ──────────────────────────────────────────────
function getQuotes() { 
    return JSON.parse(localStorage.getItem('kaos_quotes') || '[]'); 
}

function saveQuotes(data) { 
    localStorage.setItem('kaos_quotes', JSON.stringify(data)); 
}

function renderQuotes() {
    var quotes = getQuotes();
    var customers = getCustomers();
    var list = document.getElementById('quotes-list');
    if (!list) return;
    list.innerHTML = '';
    for (var i = quotes.length - 1; i >= 0; i--) {
        var q = quotes[i];
        var c = null;
        for (var j = 0; j < customers.length; j++) {
            if (customers[j].id == q.customerId) {
                c = customers[j];
                break;
            }
        }
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>#' + q.id.toString().slice(-4) + '</td><td>' + (c ? c.nome : 'Excluído') + '</td><td>' + (q.itens ? q.itens.substring(0, 30) : '-') + '<td>R$ ' + (q.valor || 0).toFixed(2).replace('.', ',') + '</td><td>' + (q.status || 'Pendente') + '<td><div class="table-actions"><button onclick="convertToOS(' + q.id + ')" class="btn-edit-row" style="color:#25d366;"><i class="fas fa-tools"></i></button><button onclick="editQuote(' + q.id + ')" class="btn-edit-row"><i class="fas fa-edit"></i></button><button onclick="deleteQuote(' + q.id + ')" class="btn-delete-row"><i class="fas fa-trash"></i></button></div></td>';
        list.appendChild(tr);
    }
}

// ── Financeiro ──────────────────────────────────────────────
function getFinance() { 
    return JSON.parse(localStorage.getItem('kaos_finance') || '[]'); 
}

function saveFinance(data) { 
    localStorage.setItem('kaos_finance', JSON.stringify(data)); 
}

function renderFinance() {
    var finance = getFinance();
    var list = document.getElementById('finance-list');
    if (!list) return;
    list.innerHTML = '';
    var totalReceitas = 0, totalDespesas = 0;
    for (var i = finance.length - 1; i >= 0; i--) {
        var f = finance[i];
        if (f.tipo === 'Receita') totalReceitas += f.valor;
        else totalDespesas += f.valor;
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>' + (f.data ? f.data.split('-').reverse().join('/') : '-') + '</td><td>' + f.desc + '</td><td>' + f.cat + '<td><span class="status-badge ' + (f.tipo === 'Receita' ? 'status-pronto' : 'status-cancelado') + '">' + f.tipo + '</span></td><td>R$ ' + f.valor.toFixed(2).replace('.', ',') + '</td><td><button onclick="deleteFinance(' + f.id + ')" class="btn-delete-row"><i class="fas fa-trash"></i></button></td>';
        list.appendChild(tr);
    }
    var finReceitas = document.getElementById('fin-receitas');
    var finDespesas = document.getElementById('fin-despesas');
    var finLucro = document.getElementById('fin-lucro');
    if (finReceitas) finReceitas.textContent = 'R$ ' + totalReceitas.toFixed(2).replace('.', ',');
    if (finDespesas) finDespesas.textContent = 'R$ ' + totalDespesas.toFixed(2).replace('.', ',');
    if (finLucro) finLucro.textContent = 'R$ ' + (totalReceitas - totalDespesas).toFixed(2).replace('.', ',');
}

// ── Parceiros / Comissões ────────────────────────────────────
function renderPartners() {
    var os = getOS();
    var partnersGrid = document.querySelector('.partners-grid');
    if (!partnersGrid) return;
    var totalServicos = 0;
    for (var i = 0; i < os.length; i++) {
        if (os[i].status === 'Entregue') {
            totalServicos += os[i].valorServico;
        }
    }
    partnersGrid.innerHTML = '<div class="stat-card"><h3>Kaique</h3><span class="stat-number">R$ ' + (totalServicos * 0.5).toFixed(2).replace('.', ',') + '</span><span class="stat-label">Comissão (50%)</span></div><div class="stat-card"><h3>Alex</h3><span class="stat-number">R$ ' + (totalServicos * 0.5).toFixed(2).replace('.', ',') + '</span><span class="stat-label">Comissão (50%)</span></div>';
}

// ── Documentos ──────────────────────────────────────────────
function renderDocuments() {
    var docs = JSON.parse(localStorage.getItem('kaos_documents') || '[]');
    var list = document.getElementById('documents-list');
    if (!list) return;
    list.innerHTML = '';
    for (var i = docs.length - 1; i >= 0; i--) {
        var d = docs[i];
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>' + d.data + '</td><td>' + d.tipo + '</td><td>' + d.cliente + '<td>' + d.ref + '<td><button onclick="reprintDoc(' + d.id + ')" class="btn-edit-row"><i class="fas fa-print"></i></button></td>';
        list.appendChild(tr);
    }
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
    renderDocuments();
}

// ── Backup ──────────────────────────────────────────────────
function initBackupSystem() {
    var btnExport = document.getElementById('btn-export-data');
    var btnImport = document.getElementById('btn-import-data');
    var importFile = document.getElementById('import-file');
    
    if (btnExport) {
        btnExport.onclick = function() {
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
            showAdminToast('Backup exportado!');
        };
    }
    
    if (btnImport && importFile) {
        btnImport.onclick = function() { importFile.click(); };
        importFile.onchange = function(e) {
            var file = e.target.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function(e) {
                try {
                    var data = JSON.parse(e.target.result);
                    if (confirm('Substituir todos os dados?')) {
                        if (data.products) saveProducts(data.products);
                        if (data.customers) saveCustomers(data.customers);
                        if (data.os) saveOS(data.os);
                        if (data.guarantees) saveGuarantees(data.guarantees);
                        if (data.quotes) saveQuotes(data.quotes);
                        if (data.finance) saveFinance(data.finance);
                        if (data.documents) localStorage.setItem('kaos_documents', JSON.stringify(data.documents));
                        if (data.shipping) saveShipping(data.shipping);
                        if (data.orders) localStorage.setItem('katech_orders', JSON.stringify(data.orders));
                        showAdminToast('Backup restaurado! Reiniciando...');
                        setTimeout(function() { location.reload(); }, 1500);
                    }
                } catch (err) { 
                    showAdminToast('Erro no arquivo!', 'error'); 
                }
            };
            reader.readAsText(file);
        };
    }
}

// ── KAOS / Nota Fiscal ──────────────────────────────────────
function initKaosSystem() {
    var btnAddItem = document.getElementById('btn-nf-add-item');
    if (btnAddItem) btnAddItem.onclick = addNfItemRow;
    
    var form = document.getElementById('kaos-nf-form');
    if (form) form.onsubmit = function(e) { e.preventDefault(); generateNFAsPDF(); };
    
    var previewBtn = document.getElementById('btn-nf-preview');
    if (previewBtn) previewBtn.onclick = function() { generateNFAsPDF(); };
    
    var nfData = document.getElementById('nf-data');
    if (nfData && !nfData.value) nfData.valueAsDate = new Date();
    addNfItemRow();
}

function addNfItemRow() {
    var container = document.getElementById('nf-items-container');
    if (!container) return;
    var products = getProducts();
    var options = '<option value="">Selecione</option>';
    for (var i = 0; i < products.length; i++) {
        options += '<option value="' + products[i].id + '" data-price="' + products[i].preco + '">' + products[i].nome + '</option>';
    }
    var row = document.createElement('div');
    row.className = 'nf-item-row';
    row.innerHTML = '<div class="form-group"><label>Produto</label><select class="nf-item-select">' + options + '</select></div><div class="form-group"><label>Qtd</label><input type="number" class="nf-item-qty" value="1" min="1"></div><div class="form-group"><label>Preço</label><input type="number" class="nf-item-price" step="0.01" value="0"></div><div class="form-group"><label>Subtotal</label><input type="text" class="nf-item-subtotal" readonly></div><button type="button" class="btn-remove-item"><i class="fas fa-trash"></i></button>';
    
    var sel = row.querySelector('.nf-item-select');
    var pr = row.querySelector('.nf-item-price');
    var qt = row.querySelector('.nf-item-qty');
    var sub = row.querySelector('.nf-item-subtotal');
    
    var update = function() { 
        sub.value = 'R$ ' + ((parseFloat(pr.value) || 0) * (parseInt(qt.value) || 0)).toFixed(2); 
    };
    sel.onchange = function() { 
        var opt = sel.options[sel.selectedIndex]; 
        if (opt.getAttribute('data-price')) pr.value = opt.getAttribute('data-price'); 
        update(); 
    };
    pr.oninput = update;
    qt.oninput = update;
    row.querySelector('.btn-remove-item').onclick = function() { row.remove(); };
    container.appendChild(row);
}

function generateNFAsPDF() {
    var total = 0;
    var itemsHtml = '';
    var rows = document.querySelectorAll('.nf-item-row');
    for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var select = row.querySelector('.nf-item-select');
        if (select && select.value) {
            var nome = select.options[select.selectedIndex]?.text || 'Produto';
            var q = parseInt(row.querySelector('.nf-item-qty')?.value) || 0;
            var p = parseFloat(row.querySelector('.nf-item-price')?.value) || 0;
            total += q * p;
            itemsHtml += '<tr><td>' + nome + '</td><td>' + q + '</td><td>R$ ' + p.toFixed(2).replace('.', ',') + '</td><td>R$ ' + (q * p).toFixed(2).replace('.', ',') + '</td></tr>';
        }
    }
    
    var clienteNome = document.getElementById('nf-cliente-nome')?.value || '';
    var clienteDoc = document.getElementById('nf-cliente-doc')?.value || '';
    
    var htmlContent = '<!DOCTYPE html>\n' +
        '<html>\n' +
        '<head><meta charset="UTF-8"><title>NF_KB_Tech</title>\n' +
        '<style>\n' +
        '    body { font-family: Arial; padding: 20px; }\n' +
        '    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }\n' +
        '    .company h2 { margin: 0; color: #0066ff; }\n' +
        '    .title { text-align: right; }\n' +
        '    table { width: 100%; border-collapse: collapse; margin: 15px 0; }\n' +
        '    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }\n' +
        '    th { background: #f5f5f5; }\n' +
        '    .signature { margin-top: 50px; border-top: 1px solid #000; padding-top: 8px; width: 250px; text-align: center; }\n' +
        '</style>\n' +
        '</head>\n' +
        '<body>\n' +
        '<div class="header">\n' +
        '    <div class="company"><h2>KB Tech</h2><p>CNPJ: 55.452.123/0001-89</p><p>Petrópolis, RJ</p></div>\n' +
        '    <div class="title"><h1>NOTA FISCAL</h1><p>Data: ' + new Date().toLocaleDateString() + '</p></div>\n' +
        '</div>\n' +
        '<div><strong>Cliente:</strong> ' + clienteNome + '<br><strong>CPF/CNPJ:</strong> ' + clienteDoc + '</div>\n' +
        '<table><thead><tr><th>Produto</th><th>Qtd</th><th>Unitário</th><th>Total</th></tr></thead>\n' +
        '<tbody>' + (itemsHtml || '<tr><td colspan="4">Nenhum produto</td></tr>') + '</tbody>\n' +
        '<tfoot><tr><td colspan="3" style="text-align:right"><strong>TOTAL:</strong></td><td><strong>R$ ' + total.toFixed(2).replace('.', ',') + '</strong></td></tr></tfoot>\n' +
        '</table>\n' +
        '<div class="signature">KB Tech</div>\n' +
        '</body>\n' +
        '</html>';
    
    var blob = new Blob([htmlContent], { type: 'text/html' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'NF_KB_Tech_' + new Date().toLocaleDateString().replace(/\//g, '-') + '.html';
    a.click();
    URL.revokeObjectURL(url);
    showAdminToast('Nota Fiscal exportada!');
}

function initResetCatalog() { 
    var btn = document.getElementById('btn-reset-catalog'); 
    if (btn) btn.onclick = function() { 
        if (confirm('Restaurar catálogo original?')) { 
            resetProducts(); 
            renderAdminProducts(); 
            showAdminToast('Catálogo restaurado!'); 
        } 
    }; 
}

function initClearOrders() { 
    var btn = document.getElementById('btn-clear-orders'); 
    if (btn) btn.onclick = function() { 
        if (confirm('Limpar pedidos?')) { 
            localStorage.setItem('katech_orders', '[]'); 
            renderAdminOrders(); 
            showAdminToast('Pedidos limpos!'); 
        } 
    }; 
}

function convertToOS(quoteId) { 
    var quotes = getQuotes();
    var q = null;
    for (var i = 0; i < quotes.length; i++) {
        if (quotes[i].id == quoteId) {
            q = quotes[i];
            break;
        }
    }
    if (q) { 
        var os = getOS(); 
        os.push({ 
            id: Date.now(), 
            customerId: q.customerId, 
            data: new Date().toISOString().split('T')[0], 
            equipamento: 'Equipamento do Orçamento', 
            status: 'Aberto', 
            defeito: q.itens || '', 
            laudo: '', 
            valorServico: q.valor || 0, 
            valorPecas: 0, 
            garantia: 90, 
            pagamento: 'A definir' 
        }); 
        saveOS(os); 
        renderOS(); 
        showAdminToast('Orçamento convertido em OS!'); 
    } 
}

function editQuote(id) { 
    var quotes = getQuotes();
    var q = null;
    for (var i = 0; i < quotes.length; i++) {
        if (quotes[i].id == id) {
            q = quotes[i];
            break;
        }
    }
    if (q) { 
        document.getElementById('quote-id').value = q.id; 
        document.getElementById('quote-items').value = q.itens || ''; 
        document.getElementById('quote-valor').value = q.valor; 
        document.getElementById('quote-status').value = q.status || 'Pendente'; 
        
        var select = document.getElementById('quote-cust-id');
        var customers = getCustomers();
        select.innerHTML = '<option value="">Selecione</option>';
        for (var i = 0; i < customers.length; i++) {
            var opt = document.createElement('option');
            opt.value = customers[i].id;
            opt.textContent = customers[i].nome;
            if (customers[i].id == q.customerId) opt.selected = true;
            select.appendChild(opt);
        }
        
        var modal = document.getElementById('quote-modal'); 
        modal.style.display = 'flex'; 
        modal.classList.add('active'); 
        document.getElementById('overlay').classList.add('active'); 
    } 
}

function deleteQuote(id) { 
    if (confirm('Excluir orçamento?')) { 
        var quotes = getQuotes();
        var newQuotes = [];
        for (var i = 0; i < quotes.length; i++) {
            if (quotes[i].id != id) {
                newQuotes.push(quotes[i]);
            }
        }
        saveQuotes(newQuotes); 
        renderQuotes(); 
        showAdminToast('Orçamento excluído!'); 
    } 
}

function deleteFinance(id) { 
    if (confirm('Excluir lançamento?')) { 
        var finance = getFinance();
        var newFinance = [];
        for (var i = 0; i < finance.length; i++) {
            if (finance[i].id != id) {
                newFinance.push(finance[i]);
            }
        }
        saveFinance(newFinance); 
        renderFinance(); 
    } 
}

function reprintDoc(id) { 
    showAdminToast('Reimpressão em desenvolvimento.'); 
}

function initQuoteModal() {
    var modal = document.getElementById('quote-modal');
    var form = document.getElementById('quote-form');
    var btnAdd = document.getElementById('btn-add-quote');
    var overlay = document.getElementById('overlay');
    
    if (btnAdd) {
        btnAdd.onclick = function() {
            form.reset();
            document.getElementById('quote-id').value = '';
            var select = document.getElementById('quote-cust-id');
            var customers = getCustomers();
            select.innerHTML = '<option value="">Selecione</option>';
            for (var i = 0; i < customers.length; i++) {
                select.innerHTML += '<option value="' + customers[i].id + '">' + customers[i].nome + '</option>';
            }
            modal.style.display = 'flex';
            modal.classList.add('active');
            if (overlay) overlay.classList.add('active');
        };
    }
    
    var closeModal = function() {
        modal.classList.remove('active');
        modal.style.display = 'none';
        if (overlay) overlay.classList.remove('active');
    };
    
    var btnClose = document.getElementById('close-quote-modal');
    var btnCancel = document.getElementById('cancel-quote-modal');
    if (btnClose) btnClose.onclick = closeModal;
    if (btnCancel) btnCancel.onclick = closeModal;
    
    form.onsubmit = function(e) {
        e.preventDefault();
        var quotes = getQuotes();
        var id = document.getElementById('quote-id').value;
        var data = { 
            id: id ? parseInt(id) : Date.now(), 
            customerId: parseInt(document.getElementById('quote-cust-id').value), 
            itens: document.getElementById('quote-items').value, 
            valor: parseFloat(document.getElementById('quote-valor').value) || 0, 
            status: document.getElementById('quote-status').value 
        };
        if (id) { 
            var idx = -1;
            for (var i = 0; i < quotes.length; i++) {
                if (quotes[i].id == id) {
                    idx = i;
                    break;
                }
            }
            if (idx !== -1) quotes[idx] = data; 
        } else { 
            quotes.push(data); 
        }
        saveQuotes(quotes);
        closeModal();
        renderQuotes();
        showAdminToast('Orçamento salvo!');
    };
}

function initFinanceModal() {
    var modal = document.getElementById('finance-modal');
    var form = document.getElementById('finance-form');
    var overlay = document.getElementById('overlay');
    
    var closeModal = function() {
        modal.classList.remove('active');
        modal.style.display = 'none';
        if (overlay) overlay.classList.remove('active');
    };
    
    var btnClose = document.getElementById('close-finance-modal');
    var btnCancel = document.getElementById('cancel-finance-modal');
    if (btnClose) btnClose.onclick = closeModal;
    if (btnCancel) btnCancel.onclick = closeModal;
    
    var btnIncome = document.getElementById('btn-add-income');
    var btnExpense = document.getElementById('btn-add-expense');
    
    if (btnIncome) {
        btnIncome.onclick = function() {
            form.reset();
            document.getElementById('fin-tipo').value = 'Receita';
            document.getElementById('fin-data').valueAsDate = new Date();
            modal.style.display = 'flex';
            modal.classList.add('active');
            if (overlay) overlay.classList.add('active');
        };
    }
    
    if (btnExpense) {
        btnExpense.onclick = function() {
            form.reset();
            document.getElementById('fin-tipo').value = 'Despesa';
            document.getElementById('fin-data').valueAsDate = new Date();
            modal.style.display = 'flex';
            modal.classList.add('active');
            if (overlay) overlay.classList.add('active');
        };
    }
    
    form.onsubmit = function(e) {
        e.preventDefault();
        var finance = getFinance();
        finance.push({ 
            id: Date.now(), 
            desc: document.getElementById('fin-desc').value, 
            valor: parseFloat(document.getElementById('fin-valor').value) || 0, 
            data: document.getElementById('fin-data').value, 
            cat: document.getElementById('fin-cat').value, 
            tipo: document.getElementById('fin-tipo').value 
        });
        saveFinance(finance);
        closeModal();
        renderFinance();
        showAdminToast('Lançamento salvo!');
    };
}
