document.addEventListener('DOMContentLoaded', function() {
    var currentType = 'os';
    var tabs = document.querySelectorAll('.consulta-tab');
    var form = document.getElementById('consulta-form');
    var input = document.getElementById('consulta-numero');
    var result = document.getElementById('consulta-result');

    tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            tabs.forEach(function(t) { t.classList.remove('active'); });
            tab.classList.add('active');
            currentType = tab.getAttribute('data-consulta');
            input.value = '';
            result.classList.remove('visible');
            result.innerHTML = '';
            input.placeholder = currentType === 'os' ? 'Ex: 1234' : 'Ex: 1234';
            input.focus();
        });
    });

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var query = normalizeNumber(input.value);
            if (!query) return;
            if (currentType === 'os') {
                searchOS(query);
            } else {
                searchGuarantee(query);
            }
        });
    }
});

function normalizeNumber(value) {
    return String(value || '').replace(/[^0-9]/g, '');
}

function formatDate(value) {
    if (!value) return '-';
    var parts = value.split('-');
    if (parts.length === 3) return parts.reverse().join('/');
    return value;
}

function findByNumber(items, query) {
    for (var i = 0; i < items.length; i++) {
        var id = normalizeNumber(items[i].id);
        if (id === query || id.slice(-4) === query || id.slice(-6) === query) {
            return items[i];
        }
    }
    return null;
}

function getCustomerName(customerId) {
    var customers = JSON.parse(localStorage.getItem('kaos_customers') || '[]');
    for (var i = 0; i < customers.length; i++) {
        if (customers[i].id == customerId) return customers[i].nome;
    }
    return 'Cliente não identificado';
}

function showResult(html) {
    var result = document.getElementById('consulta-result');
    if (!result) return;
    result.innerHTML = html;
    result.classList.add('visible');
}

function showNotFound() {
    showResult(
        '<p class="not-found">Registro não encontrado. Entre em contato pelo WhatsApp.</p>' +
        '<a href="https://wa.me/5524992046467?text=Ol%C3%A1%2C%20gostaria%20de%20um%20or%C3%A7amento." target="_blank" rel="noopener" class="btn-whatsapp-direct">' +
        '<i class="fab fa-whatsapp"></i> Falar no WhatsApp</a>'
    );
}

function searchOS(query) {
    var osList = JSON.parse(localStorage.getItem('kaos_os') || '[]');
    var os = findByNumber(osList, query);
    if (!os) {
        showNotFound();
        return;
    }

    var total = ((os.valorServico || 0) + (os.valorPecas || 0)).toFixed(2).replace('.', ',');
    showResult(
        '<h3>Ordem de Serviço #' + String(os.id).slice(-4) + '</h3>' +
        '<p><strong>Cliente:</strong> ' + getCustomerName(os.customerId) + '</p>' +
        '<p><strong>Equipamento:</strong> ' + (os.equipamento || '-') + '</p>' +
        '<p><strong>Status:</strong> ' + (os.status || 'Aberto') + '</p>' +
        '<p><strong>Entrada:</strong> ' + formatDate(os.data) + '</p>' +
        '<p><strong>Defeito informado:</strong> ' + (os.defeito || '-') + '</p>' +
        '<p><strong>Laudo:</strong> ' + (os.laudo || '-') + '</p>' +
        '<p><strong>Total:</strong> R$ ' + total + '</p>'
    );
}

function searchGuarantee(query) {
    var guarantees = JSON.parse(localStorage.getItem('kaos_guarantees') || '[]');
    var guarantee = findByNumber(guarantees, query);
    if (!guarantee) {
        showNotFound();
        return;
    }

    showResult(
        '<h3>Garantia #' + String(guarantee.id).slice(-4) + '</h3>' +
        '<p><strong>Cliente:</strong> ' + (guarantee.cliente || '-') + '</p>' +
        '<p><strong>Equipamento:</strong> ' + (guarantee.equipamento || '-') + '</p>' +
        '<p><strong>Início:</strong> ' + formatDate(guarantee.inicio) + '</p>' +
        '<p><strong>Fim:</strong> ' + formatDate(guarantee.fim) + '</p>' +
        '<p><strong>Status:</strong> ' + (guarantee.status || '-') + '</p>'
    );
}
