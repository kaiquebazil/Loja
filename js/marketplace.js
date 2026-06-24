import { auth, db, storage, firebaseReady } from './firebase-config.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import {
    getDownloadURL,
    ref,
    uploadBytes
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js';

const PLAN_PRICE = 100;
const FALLBACK_IMG = 'https://placehold.co/700x700/0d1117/f4f7ff?text=KB+Tech';
const STORE_FALLBACK_IMG = 'https://placehold.co/1200x520/0d1117/f4f7ff?text=Loja+KB+Tech';

let currentUser = null;
let currentMerchant = null;
let merchantProducts = [];
let publicProducts = [];
let publicStores = [];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function money(value) {
    return 'R$ ' + Number(value || 0).toFixed(2).replace('.', ',');
}

function escapeHTML(value) {
    return String(value || '').replace(/[&<>"']/g, function(char) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char];
    });
}

function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
}

function todayISO() {
    return new Date().toISOString().slice(0, 10);
}

function addMonths(date, months) {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next.toISOString().slice(0, 10);
}

function isSubscriptionActive(merchant) {
    if (!merchant) return false;
    return merchant.subscriptionStatus === 'ativa' && (!merchant.subscriptionDueAt || merchant.subscriptionDueAt >= todayISO());
}

function deliveryText(store) {
    const mode = store.deliveryMode || 'ambos';
    if (mode === 'entrega') return 'Entrega própria';
    if (mode === 'retirada') return 'Retirada no local';
    return 'Entrega própria e retirada no local';
}

function showAlert(message, type = 'success', target = '#mp-alert') {
    const el = $(target);
    if (!el) return;
    el.textContent = message;
    el.className = 'mp-alert show ' + type;
    clearTimeout(el._timer);
    el._timer = setTimeout(function() { el.className = 'mp-alert'; }, 5200);
}

function requireFirebase() {
    if (firebaseReady && auth && db) return true;
    showAlert('Configure o Firebase para usar login, banco de dados e fotos.', 'error');
    return false;
}

function formData(form) {
    const data = {};
    new FormData(form).forEach(function(value, key) {
        data[key] = typeof value === 'string' ? value.trim() : value;
    });
    return data;
}

async function uploadFile(file, path) {
    if (!file || !storage) return '';
    const cleanName = file.name.replace(/[^\w.-]+/g, '-');
    const storageRef = ref(storage, path + '/' + Date.now() + '-' + cleanName);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
}

async function loadMerchant(uid) {
    const snap = await getDoc(doc(db, 'lojistas', uid));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

async function loadPublicStore(uid) {
    const snap = await getDoc(doc(db, 'lojasPublicas', uid));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

function toPublicStore(data, id) {
    return {
        id: id || data.id || '',
        companyName: data.companyName || '',
        phone: data.phone || '',
        whatsapp: data.whatsapp || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zip: data.zip || '',
        deliveryMode: data.deliveryMode || 'ambos',
        openingHours: data.openingHours || '',
        logoUrl: data.logoUrl || '',
        coverUrl: data.coverUrl || '',
        subscriptionStatus: data.subscriptionStatus || 'vencida',
        subscriptionDueAt: data.subscriptionDueAt || '',
        updatedAt: serverTimestamp()
    };
}

function baseHeader(active) {
    return `
        <div class="mp-topbar">
            <div class="mp-container">
                <span><strong>KB Tech Marketplace</strong> | Lojistas locais por assinatura mensal</span>
                <span>Plano lojista: ${money(PLAN_PRICE)}/mês</span>
            </div>
        </div>
        <header class="mp-header">
            <div class="mp-container mp-header-inner">
                <a class="mp-brand" href="marketplace.html">
                    <img src="img/logo-transparente.png" alt="KB Tech" onerror="this.src='img/logo.png'">
                    <span><strong>Marketplace</strong><span>KB Tech</span></span>
                </a>
                <form class="mp-searchbar" id="mp-public-search">
                    <input class="mp-input" name="q" placeholder="Produto, categoria ou marca" aria-label="Pesquisar">
                    <input class="mp-input" name="cidade" placeholder="Cidade" aria-label="Cidade">
                    <select class="mp-select" name="categoria" aria-label="Categoria">
                        <option value="">Todas categorias</option>
                    </select>
                    <button class="mp-btn mp-btn-primary" type="submit"><i class="fas fa-search"></i> Buscar</button>
                </form>
                <nav class="mp-nav" aria-label="Menu marketplace">
                    <a class="${active === 'marketplace' ? 'active' : ''}" href="marketplace.html">Vitrine</a>
                    <a class="${active === 'lojista' ? 'active' : ''}" href="lojista.html">Painel do lojista</a>
                    <a class="${active === 'admin' ? 'active' : ''}" href="marketplace-admin.html">Admin KB Tech</a>
                    <a href="index.html">Site KB Tech</a>
                </nav>
            </div>
        </header>
    `;
}

function baseFooter() {
    return '<footer class="mp-footer"><div class="mp-container">KB Tech Marketplace conecta clientes e lojistas. Pagamentos, fretes e comissões são tratados manualmente nesta versão.</div></footer>';
}

function productCard(product) {
    const store = product.store || {};
    const img = (product.photos && product.photos[0]) || FALLBACK_IMG;
    const stockClass = Number(product.stock || 0) > 0 ? 'mp-pill-success' : 'mp-pill-danger';
    const stockText = Number(product.stock || 0) > 0 ? 'Em estoque' : 'Sem estoque';
    return `
        <article class="mp-card">
            <a class="mp-product-img" href="produto.html?id=${product.id}">
                <img src="${escapeHTML(img)}" alt="${escapeHTML(product.name)}" loading="lazy" onerror="this.src='${FALLBACK_IMG}'">
            </a>
            <div class="mp-card-body">
                <div class="mp-meta">
                    <span class="mp-pill">${escapeHTML(product.category || 'Categoria')}</span>
                    <span class="mp-pill ${stockClass}">${stockText}</span>
                </div>
                <h3><a href="produto.html?id=${product.id}">${escapeHTML(product.name)}</a></h3>
                <p>${escapeHTML(product.brand || '')}</p>
                <div class="mp-price">${money(product.price)}</div>
                <p>Loja: <a href="loja.html?id=${product.merchantId}">${escapeHTML(store.companyName || 'Loja')}</a></p>
                <p>${escapeHTML(store.city || '')}${store.state ? ' - ' + escapeHTML(store.state) : ''}</p>
                <div class="mp-meta"><span class="mp-pill">${escapeHTML(deliveryText(store))}</span></div>
                <a class="mp-btn mp-btn-primary" href="produto.html?id=${product.id}"><i class="fas fa-eye"></i> Ver produto</a>
            </div>
        </article>
    `;
}

function storeCard(store) {
    const logo = store.logoUrl || STORE_FALLBACK_IMG;
    return `
        <article class="mp-card">
            <a class="mp-store-cover" href="loja.html?id=${store.id}">
                <img src="${escapeHTML(store.coverUrl || STORE_FALLBACK_IMG)}" alt="${escapeHTML(store.companyName)}" loading="lazy" onerror="this.src='${STORE_FALLBACK_IMG}'">
            </a>
            <div class="mp-card-body">
                <img src="${escapeHTML(logo)}" alt="" style="width:54px;height:54px;object-fit:cover;border-radius:8px;border:1px solid var(--border-color);margin-top:-42px;background:var(--bg-card);">
                <h3><a href="loja.html?id=${store.id}">${escapeHTML(store.companyName)}</a></h3>
                <p>${escapeHTML(store.city || '')}${store.state ? ' - ' + escapeHTML(store.state) : ''}</p>
                <div class="mp-meta"><span class="mp-pill">${escapeHTML(deliveryText(store))}</span></div>
                <a class="mp-btn" href="loja.html?id=${store.id}"><i class="fas fa-store"></i> Ver loja</a>
            </div>
        </article>
    `;
}

async function loadPublicData() {
    if (!firebaseReady || !db) return { products: [], stores: [] };
    const merchantsSnap = await getDocs(collection(db, 'lojasPublicas'));
    const storesById = {};
    const stores = [];
    merchantsSnap.forEach(function(item) {
        const store = { id: item.id, ...item.data() };
        storesById[store.id] = store;
        if (isSubscriptionActive(store)) stores.push(store);
    });

    const productsSnap = await getDocs(query(collection(db, 'marketplaceProdutos'), where('status', '==', 'ativo'), limit(160)));
    const products = [];
    productsSnap.forEach(function(item) {
        const product = { id: item.id, ...item.data() };
        const store = storesById[product.merchantId];
        if (store && isSubscriptionActive(store)) {
            products.push({ ...product, store });
        }
    });
    publicProducts = products;
    publicStores = stores;
    return { products, stores };
}

function fillCategorySelect(products) {
    const select = $('#mp-public-search select[name="categoria"]');
    if (!select) return;
    const current = select.value;
    const cats = Array.from(new Set(products.map(function(p) { return p.category; }).filter(Boolean))).sort();
    select.innerHTML = '<option value="">Todas categorias</option>' + cats.map(function(cat) {
        return '<option value="' + escapeHTML(cat) + '">' + escapeHTML(cat) + '</option>';
    }).join('');
    select.value = current;
}

function filterPublicProducts() {
    const form = $('#mp-public-search');
    const data = form ? formData(form) : {};
    const q = (data.q || '').toLowerCase();
    const city = (data.cidade || '').toLowerCase();
    const cat = data.categoria || '';
    return publicProducts.filter(function(product) {
        const haystack = [product.name, product.category, product.brand, product.store && product.store.companyName].join(' ').toLowerCase();
        const cityText = (product.store && product.store.city || '').toLowerCase();
        return (!q || haystack.includes(q)) && (!city || cityText.includes(city)) && (!cat || product.category === cat);
    });
}

async function initPublicMarketplace() {
    $('#mp-root').innerHTML = baseHeader('marketplace') + `
        <section class="mp-hero">
            <div class="mp-container mp-hero-grid">
                <div>
                    <div class="mp-kicker">Marketplace local</div>
                    <h1>Produtos de lojistas locais em uma vitrine da KB Tech</h1>
                    <p>Empresas e lojistas anunciam produtos por assinatura mensal. Clientes encontram, comparam e compram diretamente pelo WhatsApp da loja.</p>
                    <div class="mp-hero-actions">
                        <a class="mp-btn mp-btn-primary" href="#mp-products"><i class="fas fa-box"></i> Ver produtos</a>
                        <a class="mp-btn" href="lojista.html"><i class="fas fa-store"></i> Quero anunciar</a>
                    </div>
                </div>
                <div class="mp-hero-panel">
                    <div class="mp-stat-grid">
                        <div class="mp-stat"><strong id="mp-stat-products">0</strong><span>Produtos ativos</span></div>
                        <div class="mp-stat"><strong id="mp-stat-stores">0</strong><span>Lojas assinantes</span></div>
                        <div class="mp-stat"><strong>${money(PLAN_PRICE)}</strong><span>Plano mensal</span></div>
                        <div class="mp-stat"><strong>0%</strong><span>Comissão automática</span></div>
                    </div>
                </div>
            </div>
        </section>
        <main>
            <section class="mp-section" id="mp-products">
                <div class="mp-container">
                    <div class="mp-section-header"><div><h2>Produtos</h2><p>Somente produtos de lojas com assinatura ativa aparecem aqui.</p></div></div>
                    <div class="mp-grid" id="mp-products-grid"><div class="mp-empty">Carregando produtos...</div></div>
                </div>
            </section>
            <section class="mp-section">
                <div class="mp-container">
                    <div class="mp-section-header"><div><h2>Lojas</h2><p>Perfis públicos dos lojistas assinantes.</p></div></div>
                    <div class="mp-store-grid" id="mp-stores-grid"><div class="mp-empty">Carregando lojas...</div></div>
                </div>
            </section>
        </main>
    ` + baseFooter();

    await loadPublicData();
    fillCategorySelect(publicProducts);
    renderPublicMarketplace();
    const search = $('#mp-public-search');
    if (search) search.addEventListener('submit', function(e) {
        e.preventDefault();
        renderPublicMarketplace();
        $('#mp-products').scrollIntoView({ behavior: 'smooth' });
    });
}

function renderPublicMarketplace() {
    const filtered = filterPublicProducts();
    const grid = $('#mp-products-grid');
    const storesGrid = $('#mp-stores-grid');
    $('#mp-stat-products').textContent = publicProducts.length;
    $('#mp-stat-stores').textContent = publicStores.length;
    grid.innerHTML = filtered.length ? filtered.map(productCard).join('') : '<div class="mp-empty">Nenhum produto encontrado.</div>';
    storesGrid.innerHTML = publicStores.length ? publicStores.map(storeCard).join('') : '<div class="mp-empty">Nenhuma loja ativa no momento.</div>';
}

function initAuthTabs() {
    $$('.mp-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
            $$('.mp-tab').forEach(function(t) { t.classList.remove('active'); });
            tab.classList.add('active');
            const target = tab.dataset.authTab;
            $$('.mp-auth-form').forEach(function(form) {
                form.style.display = form.id === target ? 'grid' : 'none';
            });
        });
    });
}

function renderMerchantAuth() {
    $('#mp-root').innerHTML = baseHeader('lojista') + `
        <main class="mp-auth-shell">
            <div class="mp-auth-card">
                <aside class="mp-auth-aside">
                    <div class="mp-kicker">Painel do lojista</div>
                    <h1>Anuncie no marketplace KB Tech</h1>
                    <p>Plano mensal de ${money(PLAN_PRICE)}. Produtos só ficam visíveis enquanto a assinatura estiver ativa.</p>
                </aside>
                <section class="mp-auth-main">
                    <div class="mp-tabs">
                        <button class="mp-tab active" data-auth-tab="mp-login-form" type="button">Entrar</button>
                        <button class="mp-tab" data-auth-tab="mp-register-form" type="button">Cadastrar</button>
                    </div>
                    <div id="mp-alert" class="mp-alert"></div>
                    <form class="mp-form mp-auth-form" id="mp-login-form">
                        <div class="mp-field"><label>E-mail</label><input class="mp-input" name="email" type="email" required></div>
                        <div class="mp-field"><label>Senha</label><input class="mp-input" name="password" type="password" required></div>
                        <button class="mp-btn mp-btn-primary" type="submit">Entrar</button>
                    </form>
                    <form class="mp-form mp-auth-form" id="mp-register-form" style="display:none;">
                        <div class="mp-form-grid">
                            <div class="mp-field"><label>Nome da empresa</label><input class="mp-input" name="companyName" required></div>
                            <div class="mp-field"><label>Responsável</label><input class="mp-input" name="ownerName" required></div>
                            <div class="mp-field"><label>CPF ou CNPJ</label><input class="mp-input" name="document" required></div>
                            <div class="mp-field"><label>Telefone</label><input class="mp-input" name="phone" required></div>
                            <div class="mp-field"><label>WhatsApp</label><input class="mp-input" name="whatsapp" required></div>
                            <div class="mp-field"><label>E-mail</label><input class="mp-input" name="email" type="email" required></div>
                            <div class="mp-field"><label>Senha</label><input class="mp-input" name="password" type="password" required minlength="6"></div>
                            <div class="mp-field"><label>CEP</label><input class="mp-input" name="zip" required></div>
                            <div class="mp-field"><label>Cidade</label><input class="mp-input" name="city" required></div>
                            <div class="mp-field"><label>Estado</label><input class="mp-input" name="state" maxlength="2" required></div>
                        </div>
                        <div class="mp-field"><label>Endereço completo</label><input class="mp-input" name="address" required></div>
                        <button class="mp-btn mp-btn-primary" type="submit">Criar conta de lojista</button>
                        <p class="mp-help">A conta é criada com assinatura vencida. A KB Tech ativa manualmente após o pagamento.</p>
                    </form>
                </section>
            </div>
        </main>
    ` + baseFooter();

    initAuthTabs();
    $('#mp-login-form').addEventListener('submit', loginMerchant);
    $('#mp-register-form').addEventListener('submit', registerMerchant);
}

async function loginMerchant(e) {
    e.preventDefault();
    if (!requireFirebase()) return;
    const data = formData(e.target);
    try {
        await signInWithEmailAndPassword(auth, data.email, data.password);
    } catch (error) {
        showAlert('Não foi possível entrar. Confira e-mail e senha.', 'error');
    }
}

async function registerMerchant(e) {
    e.preventDefault();
    if (!requireFirebase()) return;
    const data = formData(e.target);
    try {
        const credential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const uid = credential.user.uid;
        await setDoc(doc(db, 'lojistas', uid), {
            companyName: data.companyName,
            ownerName: data.ownerName,
            document: data.document,
            phone: data.phone,
            whatsapp: data.whatsapp,
            email: data.email,
            address: data.address,
            city: data.city,
            state: data.state.toUpperCase(),
            zip: data.zip,
            deliveryMode: 'ambos',
            openingHours: '',
            logoUrl: '',
            coverUrl: '',
            role: 'lojista',
            subscriptionStatus: 'vencida',
            subscriptionDueAt: '',
            planPrice: PLAN_PRICE,
            commissionRate: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        await setDoc(doc(db, 'lojasPublicas', uid), toPublicStore({
            companyName: data.companyName,
            phone: data.phone,
            whatsapp: data.whatsapp,
            address: data.address,
            city: data.city,
            state: data.state.toUpperCase(),
            zip: data.zip,
            deliveryMode: 'ambos',
            subscriptionStatus: 'vencida',
            subscriptionDueAt: ''
        }, uid));
        showAlert('Conta criada. A assinatura precisa ser ativada pela KB Tech.', 'success');
    } catch (error) {
        showAlert('Não foi possível cadastrar. Verifique os dados e tente novamente.', 'error');
    }
}

async function initMerchantPanel() {
    if (!firebaseReady) {
        renderMerchantAuth();
        showAlert('Firebase não configurado.', 'error');
        return;
    }
    onAuthStateChanged(auth, async function(user) {
        currentUser = user;
        if (!user) {
            renderMerchantAuth();
            return;
        }
        currentMerchant = await loadMerchant(user.uid);
        if (!currentMerchant) {
            renderMerchantAuth();
            showAlert('Conta sem cadastro de lojista.', 'error');
            return;
        }
        await renderMerchantPanel();
    });
}

async function renderMerchantPanel() {
    const active = isSubscriptionActive(currentMerchant);
    $('#mp-root').innerHTML = baseHeader('lojista') + `
        <main class="mp-app-shell">
            <div class="mp-container mp-app-layout">
                <aside class="mp-sidebar">
                    <button class="active" data-view="dashboard">Dashboard</button>
                    <button data-view="products">Meus Produtos</button>
                    <button data-view="orders">Pedidos</button>
                    <button data-view="finance">Financeiro</button>
                    <button data-view="store">Minha Loja</button>
                    <button data-view="settings">Configurações</button>
                    <button id="mp-logout">Sair</button>
                </aside>
                <section>
                    <div id="mp-alert" class="mp-alert"></div>
                    <div class="mp-view active" id="view-dashboard"></div>
                    <div class="mp-view" id="view-products"></div>
                    <div class="mp-view" id="view-orders"></div>
                    <div class="mp-view" id="view-finance"></div>
                    <div class="mp-view" id="view-store"></div>
                    <div class="mp-view" id="view-settings"></div>
                </section>
            </div>
        </main>
    ` + baseFooter();

    $$('.mp-sidebar button[data-view]').forEach(function(btn) {
        btn.addEventListener('click', function() {
            $$('.mp-sidebar button').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            $$('.mp-view').forEach(function(view) { view.classList.remove('active'); });
            $('#view-' + btn.dataset.view).classList.add('active');
        });
    });
    $('#mp-logout').addEventListener('click', function() { signOut(auth); });

    await loadMerchantProducts();
    renderDashboard(active);
    renderMerchantProducts(active);
    renderOrders();
    renderFinance(active);
    renderStoreForm();
    renderSettings();
}

async function loadMerchantProducts() {
    const snap = await getDocs(query(collection(db, 'marketplaceProdutos'), where('merchantId', '==', currentUser.uid)));
    merchantProducts = [];
    snap.forEach(function(item) { merchantProducts.push({ id: item.id, ...item.data() }); });
}

function renderDashboard(active) {
    $('#view-dashboard').innerHTML = `
        <div class="mp-panel">
            <div class="mp-section-header">
                <div><h2>Dashboard</h2><p>${escapeHTML(currentMerchant.companyName)}</p></div>
                <span class="mp-pill ${active ? 'mp-pill-success' : 'mp-pill-danger'}">${active ? 'Assinatura ativa' : 'Assinatura vencida'}</span>
            </div>
            <div class="mp-stat-grid">
                <div class="mp-stat"><strong>${merchantProducts.length}</strong><span>Produtos cadastrados</span></div>
                <div class="mp-stat"><strong>${merchantProducts.filter(p => p.status === 'ativo').length}</strong><span>Produtos ativos</span></div>
                <div class="mp-stat"><strong>${currentMerchant.subscriptionDueAt || '-'}</strong><span>Próximo vencimento</span></div>
                <div class="mp-stat"><strong>${money(PLAN_PRICE)}</strong><span>Mensalidade</span></div>
            </div>
        </div>
    `;
}

function renderMerchantProducts(active) {
    $('#view-products').innerHTML = `
        <div class="mp-panel">
            <div class="mp-section-header">
                <div><h2>Meus Produtos</h2><p>Produtos vencidos ficam ocultos da vitrine pública.</p></div>
            </div>
            ${active ? productFormHTML() : '<div class="mp-alert show error">Assinatura vencida. Não é possível cadastrar novos produtos.</div>'}
        </div>
        <div class="mp-panel">
            <div class="mp-table-wrap">
                <table class="mp-table">
                    <thead><tr><th>Produto</th><th>Categoria</th><th>Preço</th><th>Estoque</th><th>Status</th><th>Ações</th></tr></thead>
                    <tbody id="merchant-products-tbody"></tbody>
                </table>
            </div>
        </div>
    `;
    if (active) $('#mp-product-form').addEventListener('submit', saveMerchantProduct);
    renderMerchantProductRows();
}

function productFormHTML() {
    return `
        <form class="mp-form" id="mp-product-form">
            <input type="hidden" name="id">
            <div class="mp-form-grid">
                <div class="mp-field"><label>Nome</label><input class="mp-input" name="name" required></div>
                <div class="mp-field"><label>Categoria</label><input class="mp-input" name="category" required></div>
                <div class="mp-field"><label>Marca</label><input class="mp-input" name="brand"></div>
                <div class="mp-field"><label>Preço</label><input class="mp-input" name="price" type="number" min="0" step="0.01" required></div>
                <div class="mp-field"><label>Estoque</label><input class="mp-input" name="stock" type="number" min="0" step="1" required></div>
                <div class="mp-field"><label>Garantia</label><input class="mp-input" name="warranty"></div>
                <div class="mp-field"><label>Peso</label><input class="mp-input" name="weight"></div>
                <div class="mp-field"><label>Dimensões</label><input class="mp-input" name="dimensions"></div>
                <div class="mp-field"><label>Status</label><select class="mp-select" name="status"><option value="ativo">Ativo</option><option value="inativo">Inativo</option></select></div>
                <div class="mp-field"><label>Foto</label><input class="mp-input" name="photo" type="file" accept="image/*"></div>
            </div>
            <div class="mp-field"><label>Descrição</label><textarea class="mp-textarea" name="description" required></textarea></div>
            <button class="mp-btn mp-btn-primary" type="submit">Salvar produto</button>
        </form>
    `;
}

function renderMerchantProductRows() {
    const tbody = $('#merchant-products-tbody');
    if (!tbody) return;
    tbody.innerHTML = merchantProducts.length ? merchantProducts.map(function(p) {
        return `
            <tr>
                <td>${escapeHTML(p.name)}</td>
                <td>${escapeHTML(p.category)}</td>
                <td>${money(p.price)}</td>
                <td>${Number(p.stock || 0)}</td>
                <td><span class="mp-pill ${p.status === 'ativo' ? 'mp-pill-success' : 'mp-pill-warning'}">${escapeHTML(p.status)}</span></td>
                <td>
                    <button class="mp-btn mp-btn-small" data-edit-product="${p.id}">Editar</button>
                    <button class="mp-btn mp-btn-small mp-btn-danger" data-delete-product="${p.id}">Excluir</button>
                </td>
            </tr>
        `;
    }).join('') : '<tr><td colspan="6">Nenhum produto cadastrado.</td></tr>';

    $$('[data-edit-product]').forEach(function(btn) { btn.addEventListener('click', function() { editProduct(btn.dataset.editProduct); }); });
    $$('[data-delete-product]').forEach(function(btn) { btn.addEventListener('click', function() { deleteProduct(btn.dataset.deleteProduct); }); });
}

async function saveMerchantProduct(e) {
    e.preventDefault();
    const data = formData(e.target);
    const id = data.id || '';
    const file = e.target.elements.photo.files[0];
    const old = merchantProducts.find(function(p) { return p.id === id; });
    let photoUrl = old && old.photos && old.photos[0] ? old.photos[0] : '';
    try {
        if (file) photoUrl = await uploadFile(file, 'marketplace/produtos/' + currentUser.uid);
        const product = {
            merchantId: currentUser.uid,
            name: data.name,
            category: data.category,
            brand: data.brand,
            description: data.description,
            price: Number(data.price || 0),
            stock: Number(data.stock || 0),
            photos: photoUrl ? [photoUrl] : [],
            warranty: data.warranty,
            weight: data.weight,
            dimensions: data.dimensions,
            status: data.status,
            commissionRate: 0,
            updatedAt: serverTimestamp()
        };
        if (id) {
            await updateDoc(doc(db, 'marketplaceProdutos', id), product);
        } else {
            product.createdAt = serverTimestamp();
            await addDoc(collection(db, 'marketplaceProdutos'), product);
        }
        e.target.reset();
        await loadMerchantProducts();
        renderMerchantProductRows();
        showAlert('Produto salvo com sucesso.', 'success');
    } catch (error) {
        showAlert('Não foi possível salvar o produto.', 'error');
    }
}

function editProduct(id) {
    const product = merchantProducts.find(function(p) { return p.id === id; });
    const form = $('#mp-product-form');
    if (!product || !form) return;
    form.elements.id.value = product.id;
    form.elements.name.value = product.name || '';
    form.elements.category.value = product.category || '';
    form.elements.brand.value = product.brand || '';
    form.elements.price.value = product.price || '';
    form.elements.stock.value = product.stock || '';
    form.elements.warranty.value = product.warranty || '';
    form.elements.weight.value = product.weight || '';
    form.elements.dimensions.value = product.dimensions || '';
    form.elements.status.value = product.status || 'ativo';
    form.elements.description.value = product.description || '';
    form.scrollIntoView({ behavior: 'smooth' });
}

async function deleteProduct(id) {
    if (!confirm('Excluir este produto?')) return;
    await deleteDoc(doc(db, 'marketplaceProdutos', id));
    await loadMerchantProducts();
    renderMerchantProductRows();
    showAlert('Produto excluído.', 'success');
}

async function renderOrders() {
    const snap = await getDocs(query(collection(db, 'marketplacePedidos'), where('merchantId', '==', currentUser.uid), limit(80)));
    const orders = [];
    snap.forEach(function(item) { orders.push({ id: item.id, ...item.data() }); });
    $('#view-orders').innerHTML = `
        <div class="mp-panel">
            <div class="mp-section-header"><div><h2>Pedidos</h2><p>Registros de interesse gerados pela página do produto.</p></div></div>
            <div class="mp-table-wrap">
                <table class="mp-table"><thead><tr><th>Cliente</th><th>Produto</th><th>Contato</th><th>Status</th></tr></thead>
                <tbody>${orders.length ? orders.map(function(o) {
                    return '<tr><td>' + escapeHTML(o.customerName || '-') + '</td><td>' + escapeHTML(o.productName || '-') + '</td><td>' + escapeHTML(o.customerPhone || '-') + '</td><td>' + escapeHTML(o.status || 'novo') + '</td></tr>';
                }).join('') : '<tr><td colspan="4">Nenhum pedido registrado.</td></tr>'}</tbody></table>
            </div>
        </div>
    `;
}

function renderFinance(active) {
    $('#view-finance').innerHTML = `
        <div class="mp-panel">
            <h2>Financeiro</h2>
            <div class="mp-stat-grid">
                <div class="mp-stat"><strong>${active ? 'Ativa' : 'Vencida'}</strong><span>Assinatura</span></div>
                <div class="mp-stat"><strong>${currentMerchant.subscriptionDueAt || '-'}</strong><span>Próximo vencimento</span></div>
                <div class="mp-stat"><strong>${money(PLAN_PRICE)}</strong><span>Plano mensal</span></div>
                <div class="mp-stat"><strong>0%</strong><span>Comissão automática nesta versão</span></div>
            </div>
            <p class="mp-help">A ativação é manual pela KB Tech. A estrutura já guarda comissão para versões futuras.</p>
        </div>
    `;
}

function renderStoreForm() {
    $('#view-store').innerHTML = `
        <div class="mp-panel">
            <h2>Minha Loja</h2>
            <form class="mp-form" id="mp-store-form">
                <div class="mp-form-grid">
                    <div class="mp-field"><label>Nome da empresa</label><input class="mp-input" name="companyName" value="${escapeHTML(currentMerchant.companyName)}" required></div>
                    <div class="mp-field"><label>Telefone</label><input class="mp-input" name="phone" value="${escapeHTML(currentMerchant.phone)}" required></div>
                    <div class="mp-field"><label>WhatsApp</label><input class="mp-input" name="whatsapp" value="${escapeHTML(currentMerchant.whatsapp)}" required></div>
                    <div class="mp-field"><label>Horário de funcionamento</label><input class="mp-input" name="openingHours" value="${escapeHTML(currentMerchant.openingHours || '')}"></div>
                    <div class="mp-field"><label>Cidade</label><input class="mp-input" name="city" value="${escapeHTML(currentMerchant.city)}" required></div>
                    <div class="mp-field"><label>Estado</label><input class="mp-input" name="state" value="${escapeHTML(currentMerchant.state)}" required></div>
                    <div class="mp-field"><label>Opções de entrega</label><select class="mp-select" name="deliveryMode"><option value="entrega">Entrega própria</option><option value="retirada">Retirada no local</option><option value="ambos">Ambos</option></select></div>
                    <div class="mp-field"><label>Logo</label><input class="mp-input" name="logo" type="file" accept="image/*"></div>
                    <div class="mp-field"><label>Foto de capa</label><input class="mp-input" name="cover" type="file" accept="image/*"></div>
                </div>
                <div class="mp-field"><label>Endereço</label><input class="mp-input" name="address" value="${escapeHTML(currentMerchant.address)}" required></div>
                <button class="mp-btn mp-btn-primary" type="submit">Salvar minha loja</button>
            </form>
        </div>
    `;
    $('#mp-store-form').elements.deliveryMode.value = currentMerchant.deliveryMode || 'ambos';
    $('#mp-store-form').addEventListener('submit', saveStoreProfile);
}

async function saveStoreProfile(e) {
    e.preventDefault();
    const data = formData(e.target);
    let logoUrl = currentMerchant.logoUrl || '';
    let coverUrl = currentMerchant.coverUrl || '';
    try {
        if (e.target.elements.logo.files[0]) logoUrl = await uploadFile(e.target.elements.logo.files[0], 'marketplace/lojas/' + currentUser.uid);
        if (e.target.elements.cover.files[0]) coverUrl = await uploadFile(e.target.elements.cover.files[0], 'marketplace/lojas/' + currentUser.uid);
        await updateDoc(doc(db, 'lojistas', currentUser.uid), {
            companyName: data.companyName,
            phone: data.phone,
            whatsapp: data.whatsapp,
            openingHours: data.openingHours,
            city: data.city,
            state: data.state.toUpperCase(),
            deliveryMode: data.deliveryMode,
            address: data.address,
            logoUrl,
            coverUrl,
            updatedAt: serverTimestamp()
        });
        currentMerchant = await loadMerchant(currentUser.uid);
        await setDoc(doc(db, 'lojasPublicas', currentUser.uid), toPublicStore(currentMerchant, currentUser.uid), { merge: true });
        showAlert('Loja atualizada.', 'success');
    } catch (error) {
        showAlert('Não foi possível atualizar a loja.', 'error');
    }
}

function renderSettings() {
    $('#view-settings').innerHTML = `
        <div class="mp-panel">
            <h2>Configurações</h2>
            <p class="mp-help">E-mail da conta: ${escapeHTML(currentMerchant.email || currentUser.email)}</p>
            <p class="mp-help">Cada lojista acessa apenas seus próprios dados. O acesso total fica reservado ao administrador KB Tech pelas regras do Firebase.</p>
        </div>
    `;
}

async function initProductPage() {
    $('#mp-root').innerHTML = baseHeader('marketplace') + '<main class="mp-section"><div class="mp-container"><div class="mp-empty">Carregando produto...</div></div></main>' + baseFooter();
    const id = getParam('id');
    if (!id || !firebaseReady) return;
    const productSnap = await getDoc(doc(db, 'marketplaceProdutos', id));
    if (!productSnap.exists()) return $('.mp-empty').textContent = 'Produto não encontrado.';
    const product = { id: productSnap.id, ...productSnap.data() };
    const store = await loadPublicStore(product.merchantId);
    if (!store || !isSubscriptionActive(store) || product.status !== 'ativo') return $('.mp-empty').textContent = 'Produto indisponível.';
    const img = product.photos && product.photos[0] ? product.photos[0] : FALLBACK_IMG;
    const wa = String(store.whatsapp || '').replace(/\D/g, '');
    const waMsg = `Olá, tenho interesse no produto ${product.name} anunciado no Marketplace KB Tech.`;
    $('#mp-root').innerHTML = baseHeader('marketplace') + `
        <main class="mp-section">
            <div class="mp-container mp-detail-layout">
                <div class="mp-detail-gallery"><img src="${escapeHTML(img)}" alt="${escapeHTML(product.name)}" onerror="this.src='${FALLBACK_IMG}'"></div>
                <section>
                    <div class="mp-kicker">${escapeHTML(product.category)}</div>
                    <h1>${escapeHTML(product.name)}</h1>
                    <div class="mp-price">${money(product.price)}</div>
                    <div class="mp-meta">
                        <span class="mp-pill">${Number(product.stock || 0)} em estoque</span>
                        <span class="mp-pill">${escapeHTML(product.brand || 'Marca não informada')}</span>
                        <span class="mp-pill">${escapeHTML(product.warranty || 'Garantia a consultar')}</span>
                    </div>
                    <p>${escapeHTML(product.description)}</p>
                    <div class="mp-panel">
                        <h2>${escapeHTML(store.companyName)}</h2>
                        <p>${escapeHTML(store.address || '')}</p>
                        <p>${escapeHTML(store.city || '')} - ${escapeHTML(store.state || '')}</p>
                        <div class="mp-meta"><span class="mp-pill">${escapeHTML(deliveryText(store))}</span></div>
                    </div>
                    <a class="mp-btn mp-btn-primary" target="_blank" rel="noopener" href="https://wa.me/55${wa}?text=${encodeURIComponent(waMsg)}"><i class="fab fa-whatsapp"></i> Comprar pelo WhatsApp</a>
                </section>
            </div>
        </main>
    ` + baseFooter();
}

async function initStorePage() {
    $('#mp-root').innerHTML = baseHeader('marketplace') + '<main class="mp-section"><div class="mp-container"><div class="mp-empty">Carregando loja...</div></div></main>' + baseFooter();
    const id = getParam('id');
    if (!id || !firebaseReady) return;
    const store = await loadPublicStore(id);
    if (!store || !isSubscriptionActive(store)) return $('.mp-empty').textContent = 'Loja indisponível.';
    const snap = await getDocs(query(collection(db, 'marketplaceProdutos'), where('merchantId', '==', id), where('status', '==', 'ativo')));
    const products = [];
    snap.forEach(function(item) { products.push({ id: item.id, ...item.data(), store }); });
    $('#mp-root').innerHTML = baseHeader('marketplace') + `
        <section class="mp-store-hero" style="background-image:linear-gradient(rgba(5,7,12,.55),rgba(5,7,12,.88)),url('${escapeHTML(store.coverUrl || STORE_FALLBACK_IMG)}');background-size:cover;background-position:center;">
            <div class="mp-container">
                <img class="mp-store-logo" src="${escapeHTML(store.logoUrl || STORE_FALLBACK_IMG)}" alt="">
                <div class="mp-kicker">${escapeHTML(deliveryText(store))}</div>
                <h1>${escapeHTML(store.companyName)}</h1>
                <p>${escapeHTML(store.address || '')} | ${escapeHTML(store.phone || '')}</p>
            </div>
        </section>
        <main class="mp-section">
            <div class="mp-container">
                <div class="mp-section-header"><div><h2>Produtos da loja</h2><p>${escapeHTML(store.openingHours || '')}</p></div></div>
                <div class="mp-grid">${products.length ? products.map(productCard).join('') : '<div class="mp-empty">Esta loja ainda não possui produtos ativos.</div>'}</div>
            </div>
        </main>
    ` + baseFooter();
}

async function initMarketplaceAdmin() {
    $('#mp-root').innerHTML = baseHeader('admin') + '<main class="mp-auth-shell"><div class="mp-container"><div class="mp-empty">Verificando acesso...</div></div></main>' + baseFooter();
    onAuthStateChanged(auth, async function(user) {
        if (!user) {
            renderMerchantAuth();
            return;
        }
        const merchant = await loadMerchant(user.uid);
        if (!merchant || merchant.role !== 'admin') {
            $('#mp-root').innerHTML = baseHeader('admin') + '<main class="mp-section"><div class="mp-container"><div class="mp-empty">Acesso restrito ao administrador KB Tech.</div></div></main>' + baseFooter();
            return;
        }
        await renderAdminPanel();
    });
}

async function renderAdminPanel() {
    const merchantsSnap = await getDocs(collection(db, 'lojistas'));
    const productsSnap = await getDocs(collection(db, 'marketplaceProdutos'));
    const merchants = [];
    const products = [];
    merchantsSnap.forEach(function(item) { merchants.push({ id: item.id, ...item.data() }); });
    productsSnap.forEach(function(item) { products.push({ id: item.id, ...item.data() }); });
    $('#mp-root').innerHTML = baseHeader('admin') + `
        <main class="mp-app-shell">
            <div class="mp-container">
                <div id="mp-alert" class="mp-alert"></div>
                <div class="mp-panel">
                    <div class="mp-section-header"><div><h2>Admin KB Tech</h2><p>Controle de usuários, lojistas, produtos e assinaturas.</p></div><button class="mp-btn" id="mp-admin-logout">Sair</button></div>
                    <div class="mp-stat-grid">
                        <div class="mp-stat"><strong>${merchants.length}</strong><span>Lojistas</span></div>
                        <div class="mp-stat"><strong>${merchants.filter(isSubscriptionActive).length}</strong><span>Assinaturas ativas</span></div>
                        <div class="mp-stat"><strong>${products.length}</strong><span>Produtos</span></div>
                        <div class="mp-stat"><strong>${money(merchants.filter(isSubscriptionActive).length * PLAN_PRICE)}</strong><span>Receita mensal estimada</span></div>
                    </div>
                </div>
                <div class="mp-panel">
                    <h2>Lojistas e assinaturas</h2>
                    <div class="mp-table-wrap"><table class="mp-table"><thead><tr><th>Empresa</th><th>E-mail</th><th>Status</th><th>Vencimento</th><th>Ações</th></tr></thead><tbody>
                    ${merchants.map(function(m) {
                        const active = isSubscriptionActive(m);
                        return `<tr><td>${escapeHTML(m.companyName)}</td><td>${escapeHTML(m.email)}</td><td><span class="mp-pill ${active ? 'mp-pill-success' : 'mp-pill-danger'}">${active ? 'Ativa' : 'Vencida'}</span></td><td>${escapeHTML(m.subscriptionDueAt || '-')}</td><td><button class="mp-btn mp-btn-small mp-btn-success" data-activate="${m.id}">Ativar 30 dias</button> <button class="mp-btn mp-btn-small mp-btn-danger" data-expire="${m.id}">Vencer</button></td></tr>`;
                    }).join('')}
                    </tbody></table></div>
                </div>
                <div class="mp-panel">
                    <h2>Produtos</h2>
                    <div class="mp-table-wrap"><table class="mp-table"><thead><tr><th>Produto</th><th>Lojista</th><th>Preço</th><th>Status</th></tr></thead><tbody>
                    ${products.map(function(p) {
                        const m = merchants.find(function(item) { return item.id === p.merchantId; }) || {};
                        return `<tr><td>${escapeHTML(p.name)}</td><td>${escapeHTML(m.companyName || p.merchantId)}</td><td>${money(p.price)}</td><td>${escapeHTML(p.status || '-')}</td></tr>`;
                    }).join('')}
                    </tbody></table></div>
                </div>
            </div>
        </main>
    ` + baseFooter();
    $('#mp-admin-logout').addEventListener('click', function() { signOut(auth); });
    $$('[data-activate]').forEach(function(btn) {
        btn.addEventListener('click', async function() {
            await updateDoc(doc(db, 'lojistas', btn.dataset.activate), {
                subscriptionStatus: 'ativa',
                subscriptionDueAt: addMonths(new Date(), 1),
                updatedAt: serverTimestamp()
            });
            const updated = await loadMerchant(btn.dataset.activate);
            await setDoc(doc(db, 'lojasPublicas', btn.dataset.activate), toPublicStore(updated, btn.dataset.activate), { merge: true });
            showAlert('Assinatura ativada.', 'success');
            await renderAdminPanel();
        });
    });
    $$('[data-expire]').forEach(function(btn) {
        btn.addEventListener('click', async function() {
            await updateDoc(doc(db, 'lojistas', btn.dataset.expire), {
                subscriptionStatus: 'vencida',
                subscriptionDueAt: todayISO(),
                updatedAt: serverTimestamp()
            });
            const updated = await loadMerchant(btn.dataset.expire);
            await setDoc(doc(db, 'lojasPublicas', btn.dataset.expire), toPublicStore(updated, btn.dataset.expire), { merge: true });
            showAlert('Assinatura marcada como vencida.', 'success');
            await renderAdminPanel();
        });
    });
}

const page = document.body.dataset.page;
if (page === 'marketplace') initPublicMarketplace();
if (page === 'lojista') initMerchantPanel();
if (page === 'produto') initProductPage();
if (page === 'loja') initStorePage();
if (page === 'marketplace-admin') initMarketplaceAdmin();
