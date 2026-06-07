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
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            var query = normalizeNumber(input.value);
            if (!query) return;
            if (currentType === 'os') {
                await searchOS(query);
            } else {
                await searchGuarantee(query);
            }
        });
    }
});

function normalizeNumber(value) {
    return String(value || '').replace(/[^0-9]/g, '');
}

function formatDate(value) {
    if (!value) return '-';
    if (typeof value.toDate === 'function') {
        value = value.toDate().toISOString().split('T')[0];
    }
    if (value instanceof Date) {
        value = value.toISOString().split('T')[0];
    }
    value = String(value);
    var parts = value.split('-');
    if (parts.length === 3) return parts.reverse().join('/');
    return value;
}

function getFirstValue(record, fields, fallback) {
    fallback = fallback || '-';
    if (!record) return fallback;
    for (var i = 0; i < fields.length; i++) {
        var value = record[fields[i]];
        if (value !== undefined && value !== null && value !== '') return value;
    }
    return fallback;
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

async function getFirebaseOS(query) {
    if (!window.KBTFirebaseConsulta || typeof window.KBTFirebaseConsulta.getOSFromFirebase !== 'function') {
        return null;
    }
    try {
        return await window.KBTFirebaseConsulta.getOSFromFirebase(query);
    } catch (error) {
        console.warn('Não foi possível consultar OS no Firebase. Tentando localStorage.', error);
        return null;
    }
}

async function getFirebaseGuarantee(query) {
    if (!window.KBTFirebaseConsulta || typeof window.KBTFirebaseConsulta.getGuaranteeFromFirebase !== 'function') {
        return null;
    }
    try {
        return await window.KBTFirebaseConsulta.getGuaranteeFromFirebase(query);
    } catch (error) {
        console.warn('Não foi possível consultar garantia no Firebase. Tentando localStorage.', error);
        return null;
    }
}

async function searchOS(query) {
    var firebaseOS = await getFirebaseOS(query);
    if (firebaseOS) {
        showOS(firebaseOS, false);
        return;
    }

    var osList = JSON.parse(localStorage.getItem('kaos_os') || '[]');
    var os = findByNumber(osList, query);
    if (!os) {
        showNotFound();
        return;
    }

    showOS(os, true);
}

function showOS(os, isLocal) {
    var numero = getFirstValue(os, ['numeroOS', 'numero', 'codigo', 'id']);
    var cliente = isLocal ? getCustomerName(os.customerId) : getFirstValue(os, ['cliente', 'clienteNome', 'nomeCliente']);
    var equipamento = getFirstValue(os, ['equipamento', 'aparelho', 'dispositivo']);
    var status = getFirstValue(os, ['status'], 'Aberto');
    var entrada = getFirstValue(os, ['dataEntrada', 'entrada', 'data']);
    var previsao = getFirstValue(os, ['dataPrevista', 'previsao', 'dataConclusao', 'conclusao', 'dataFinalizacao']);
    var servico = getFirstValue(os, ['servicoRealizado', 'servico', 'laudo', 'descricaoServico'], '');

    showResult(
        '<h3>Ordem de Serviço #' + String(numero).slice(-6) + '</h3>' +
        '<p><strong>Número da OS:</strong> ' + numero + '</p>' +
        '<p><strong>Cliente:</strong> ' + cliente + '</p>' +
        '<p><strong>Equipamento:</strong> ' + equipamento + '</p>' +
        '<p><strong>Status:</strong> ' + status + '</p>' +
        '<p><strong>Data de entrada:</strong> ' + formatDate(entrada) + '</p>' +
        '<p><strong>Data prevista/conclusão:</strong> ' + formatDate(previsao) + '</p>' +
        (servico ? '<p><strong>Serviço realizado:</strong> ' + servico + '</p>' : '')
    );
}

async function searchGuarantee(query) {
    var firebaseGuarantee = await getFirebaseGuarantee(query);
    if (firebaseGuarantee) {
        showGuarantee(firebaseGuarantee);
        return;
    }

    var guarantees = JSON.parse(localStorage.getItem('kaos_guarantees') || '[]');
    var guarantee = findByNumber(guarantees, query);
    if (!guarantee) {
        showNotFound();
        return;
    }

    showGuarantee(guarantee);
}

function showGuarantee(guarantee) {
    var numero = getFirstValue(guarantee, ['numeroGarantia', 'numero', 'codigo', 'id']);
    var cliente = getFirstValue(guarantee, ['cliente', 'clienteNome', 'nomeCliente']);
    var equipamento = getFirstValue(guarantee, ['equipamento', 'aparelho', 'dispositivo']);
    var servico = getFirstValue(guarantee, ['servico', 'servicoRealizado', 'descricaoServico']);
    var inicio = getFirstValue(guarantee, ['dataInicio', 'inicio']);
    var fim = getFirstValue(guarantee, ['dataFim', 'fim', 'validade']);
    var status = getFirstValue(guarantee, ['status']);

    showResult(
        '<h3>Garantia #' + String(numero).slice(-6) + '</h3>' +
        '<p><strong>Número da garantia:</strong> ' + numero + '</p>' +
        '<p><strong>Cliente:</strong> ' + cliente + '</p>' +
        '<p><strong>Equipamento:</strong> ' + equipamento + '</p>' +
        '<p><strong>Serviço:</strong> ' + servico + '</p>' +
        '<p><strong>Data início:</strong> ' + formatDate(inicio) + '</p>' +
        '<p><strong>Data fim:</strong> ' + formatDate(fim) + '</p>' +
        '<p><strong>Status:</strong> ' + status + '</p>'
    );
}
