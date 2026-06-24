/* ============================================================
   KB Tech - orcamento.js
   Lógica do formulário de orçamento
   ============================================================ */

document.addEventListener('DOMContentLoaded', function() {
    populateBairroSelect();
    initOrcamentoForm();
    updateCartBadge();
    handleUrlParams();
});

function handleUrlParams() {
    var params = new URLSearchParams(window.location.search);
    var tipo = params.get('tipo');
    if (tipo) {
        var select = document.getElementById('orc-tipo');
        if (select) {
            // Mapeamento simples para garantir compatibilidade
            var map = {
                'Celular': 'Manutenção de Celular',
                'Computador': 'Manutenção de Computador',
                'Montagem': 'Montagem de PC',
                'Infraestrutura': 'Infraestrutura'
            };
            select.value = map[tipo] || tipo;
        }
    }
}

function populateBairroSelect() {
    var select = document.getElementById('orc-bairro');
    if (!select) return;
    var shipping = getShipping();
    select.innerHTML = '<option value="">Selecione o bairro (opcional)</option>';
    shipping.sort(function(a, b) { return a.nome.localeCompare(b.nome); }).forEach(function(s) {
        var opt = document.createElement('option');
        opt.value = s.nome;
        opt.textContent = s.nome;
        select.appendChild(opt);
    });
}

function initOrcamentoForm() {
    var form = document.getElementById('orcamento-form');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        sendOrcamentoWhatsApp();
    });
}

function sendOrcamentoWhatsApp() {
    var nome = document.getElementById('orc-nome').value.trim();
    var telefone = document.getElementById('orc-telefone').value.trim();
    var cidade = document.getElementById('orc-cidade').value.trim();
    var bairro = document.getElementById('orc-bairro') ? document.getElementById('orc-bairro').value.trim() : '';
    var tipo = document.getElementById('orc-tipo').value;
    var descricao = document.getElementById('orc-descricao').value.trim();
    var orcamento = document.getElementById('orc-orcamento').value.trim();
    var urgencia = document.getElementById('orc-urgencia').value;

    if (!nome || !telefone || !cidade || !tipo || !descricao) {
        showOrcToast('Preencha todos os campos obrigatórios.', 'error');
        return;
    }

    var msg = 'Olá *KB Tech*! 👋\n';
    msg += 'Gostaria de solicitar um orçamento:\n\n';
    msg += '━━━━━━━━━━━━━━━━━━\n';
    msg += '📋 *DETALHES DO ORÇAMENTO*\n';
    msg += '━━━━━━━━━━━━━━━━━━\n';
    msg += '🔧 Tipo: ' + tipo + '\n';
    msg += '📝 Descrição: ' + descricao + '\n';
    if (orcamento) msg += '💰 Orçamento disponível: ' + orcamento + '\n';
    if (urgencia) msg += '⏰ Urgência: ' + urgencia + '\n';
    msg += '━━━━━━━━━━━━━━━━━━\n';
    msg += '📋 *DADOS DO CLIENTE*\n';
    msg += 'Nome: ' + nome + '\n';
    msg += 'Telefone: ' + telefone + '\n';
    msg += 'Cidade: ' + cidade + '\n';
    if (bairro) msg += 'Bairro: ' + bairro + '\n';
    msg += '━━━━━━━━━━━━━━━━━━\n';
    msg += 'Aguardo retorno! 😊';

    var url = 'https://wa.me/5524992046467?text=' + encodeURIComponent(msg);
    window.open(url, '_blank');

    document.getElementById('orcamento-form').reset();
    showOrcToast('Orçamento enviado! Redirecionando para o WhatsApp...', 'success');
}

function showOrcToast(message, type) {
    type = type || 'success';
    var toast = document.getElementById('toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
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
