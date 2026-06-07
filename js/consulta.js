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
            input.placeholder = currentType === 'pedido' ? 'Ex: 1001' : 'Ex: 1234';
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
            } else if (currentType === 'pedido') {
                await searchOrderDelivery(query);
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

function escapeHTML(value) {
    return String(value === undefined || value === null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatMoney(value) {
    if (value === undefined || value === null || value === '') return '-';
    var number = Number(String(value).replace(',', '.'));
    if (Number.isNaN(number)) return escapeHTML(value);
    return 'R$ ' + number.toFixed(2).replace('.', ',');
}

function getFirstValue(record, fields, fallback) {
    fallback = fallback === undefined ? '-' : fallback;
    if (!record) return fallback;
    for (var i = 0; i < fields.length; i++) {
        var value = record[fields[i]];
        if (value !== undefined && value !== null && value !== '') return value;
    }
    return fallback;
}

function findByNumber(items, query) {
    for (var i = 0; i < items.length; i++) {
        var possibleNumbers = [
            items[i].id,
            items[i].numero,
            items[i].codigo,
            items[i].numeroOS,
            items[i].numeroOrdem,
            items[i].numeroGarantia,
            items[i].numeroPedido,
            items[i].pedidoNumero,
            items[i].pedidoId,
            items[i].orderId,
            items[i].orderNumber
        ];
        for (var j = 0; j < possibleNumbers.length; j++) {
            var id = normalizeNumber(possibleNumbers[j]);
            if (!id) continue;
            if (id === query || id.slice(-4) === query || id.slice(-6) === query) {
                return items[i];
            }
        }
    }
    return null;
}

function findDeliveryForOrder(items, query, order) {
    var orderNumbers = [
        query,
        order && order.id,
        order && order.numero,
        order && order.codigo,
        order && order.numeroPedido,
        order && order.pedidoNumero,
        order && order.orderNumber
    ];

    for (var i = 0; i < items.length; i++) {
        for (var j = 0; j < orderNumbers.length; j++) {
            var normalized = normalizeNumber(orderNumbers[j]);
            if (!normalized) continue;
            var delivery = findByNumber([items[i]], normalized);
            if (delivery) {
                return delivery;
            }
        }
    }
    return null;
}

function getLocalArray(keys) {
    for (var i = 0; i < keys.length; i++) {
        try {
            var data = JSON.parse(localStorage.getItem(keys[i]) || '[]');
            if (Array.isArray(data) && data.length) return data;
        } catch (error) {
            console.warn('Dados locais invalidos em ' + keys[i], error);
        }
    }
    return [];
}

function normalizeStatusText(value) {
    return String(value || '').toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function getTimelineStep(orderStatus, deliveryStatus, paymentStatus) {
    var status = normalizeStatusText([orderStatus, deliveryStatus, paymentStatus].join(' '));
    if (status.indexOf('entregue') !== -1 || status.indexOf('finalizado') !== -1) return 6;
    if (status.indexOf('chegando') !== -1 || status.indexOf('perto') !== -1 || status.indexOf('proximo') !== -1) return 5;
    if (status.indexOf('saiu') !== -1 || status.indexOf('rota') !== -1 || status.indexOf('transporte') !== -1 || status.indexOf('delivery') !== -1) return 4;
    if (status.indexOf('separ') !== -1 || status.indexOf('prepar') !== -1 || status.indexOf('produto') !== -1) return 3;
    if (status.indexOf('pago') !== -1 || status.indexOf('pagamento confirmado') !== -1 || status.indexOf('confirmado') !== -1) return 2;
    return 1;
}

function renderTimeline(currentStep) {
    var steps = [
        'Pedido recebido',
        'Pagamento confirmado',
        'Separando produto',
        'Saiu para entrega',
        'Chegando perto',
        'Entregue'
    ];
    var html = '<div class="order-timeline" aria-label="Linha do tempo do pedido">';
    for (var i = 0; i < steps.length; i++) {
        var stepNumber = i + 1;
        var stateClass = stepNumber < currentStep ? 'done' : (stepNumber === currentStep ? 'active' : '');
        html += '<div class="timeline-step ' + stateClass + '">' +
            '<span class="timeline-dot">' + stepNumber + '</span>' +
            '<span class="timeline-label">' + steps[i] + '</span>' +
            '</div>';
    }
    html += '</div>';
    return html;
}

function getFirebaseOrderDelivery(query) {
    if (!window.KBTFirebaseConsulta || typeof window.KBTFirebaseConsulta.getOrderDeliveryFromFirebase !== 'function') {
        return Promise.resolve(null);
    }
    return window.KBTFirebaseConsulta.getOrderDeliveryFromFirebase(query).catch(function(error) {
        console.warn('Nao foi possivel consultar pedido/entrega no Firebase. Tentando localStorage.', error);
        return null;
    });
}

async function searchOrderDelivery(query) {
    var firebaseResult = await getFirebaseOrderDelivery(query);
    if (firebaseResult) {
        showOrderDelivery(firebaseResult.pedido, firebaseResult.entrega);
        return;
    }

    var orders = getLocalArray(['katech_orders', 'kbtech_orders', 'pedidos']);
    var deliveries = getLocalArray(['katech_deliveries', 'kbtech_deliveries', 'entregas']);
    var order = findByNumber(orders, query);
    var delivery = findByNumber(deliveries, query) || findDeliveryForOrder(deliveries, query, order);

    if (!order && delivery) {
        var deliveryOrderNumber = getFirstValue(delivery, ['numeroPedido', 'pedidoNumero', 'pedidoId', 'orderId', 'numero', 'codigo'], '');
        order = findByNumber(orders, normalizeNumber(deliveryOrderNumber));
    }

    if (!order && !delivery) {
        showNotFound();
        return;
    }

    showOrderDelivery(order, delivery);
}

function showOrderDelivery(order, delivery) {
    order = order || {};
    delivery = delivery || {};

    var numero = getFirstValue(order, ['numeroPedido', 'pedidoNumero', 'numero', 'codigo', 'orderNumber', 'id'],
        getFirstValue(delivery, ['numeroPedido', 'pedidoNumero', 'pedidoId', 'orderId', 'numero', 'codigo', 'id']));
    var cliente = getFirstValue(order, ['clienteNome', 'nomeCliente', 'cliente', 'nome'],
        getFirstValue(delivery, ['clienteNome', 'nomeCliente', 'cliente', 'nome'], 'Cliente nao identificado'));
    var statusPedido = getFirstValue(order, ['statusPedido', 'status', 'situacao'], 'Pedido recebido');
    var statusEntrega = getFirstValue(delivery, ['statusEntrega', 'status', 'situacao'], 'Aguardando envio');
    var previsao = getFirstValue(delivery, ['previsaoEntrega', 'previsao', 'dataPrevista', 'dataEntregaPrevista'],
        getFirstValue(order, ['previsaoEntrega', 'previsao', 'dataPrevista']));
    var taxaEntrega = getFirstValue(delivery, ['taxaEntrega', 'frete', 'valorEntrega', 'valor'],
        getFirstValue(order, ['taxaEntrega', 'frete', 'valorEntrega']));
    var total = getFirstValue(order, ['valorTotal', 'total', 'valor'], getFirstValue(delivery, ['valorTotal', 'total']));
    var observacoes = getFirstValue(delivery, ['observacoes', 'observacao', 'obs'],
        getFirstValue(order, ['observacoes', 'observacao', 'obs'], ''));
    var pagamento = getFirstValue(order, ['statusPagamento', 'pagamentoStatus', 'pagamento'], '');
    var currentStep = getTimelineStep(statusPedido, statusEntrega, pagamento);
    var whatsappText = encodeURIComponent('Ola, gostaria de falar sobre o pedido ' + numero + '.');

    showResult(
        '<h3>Pedido #' + escapeHTML(String(numero).slice(-6)) + '</h3>' +
        renderTimeline(currentStep) +
        '<div class="order-summary-grid">' +
        '<p><strong>Número do pedido:</strong> ' + escapeHTML(numero) + '</p>' +
        '<p><strong>Cliente:</strong> ' + escapeHTML(cliente) + '</p>' +
        '<p><strong>Status do pedido:</strong> ' + escapeHTML(statusPedido) + '</p>' +
        '<p><strong>Status da entrega:</strong> ' + escapeHTML(statusEntrega) + '</p>' +
        '<p><strong>Previsão de entrega:</strong> ' + escapeHTML(formatDate(previsao)) + '</p>' +
        '<p><strong>Taxa de entrega:</strong> ' + formatMoney(taxaEntrega) + '</p>' +
        '<p><strong>Valor total:</strong> ' + formatMoney(total) + '</p>' +
        (observacoes ? '<p class="order-notes"><strong>Observações:</strong> ' + escapeHTML(observacoes) + '</p>' : '<p class="order-notes"><strong>Observações:</strong> -</p>') +
        '</div>' +
        '<a href="https://wa.me/5524992046467?text=' + whatsappText + '" target="_blank" rel="noopener" class="btn-whatsapp-direct">' +
        '<i class="fab fa-whatsapp"></i> Falar no WhatsApp</a>'
    );
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
