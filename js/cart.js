const CART_STORAGE_KEY = 'kb_cart';
const CUSTOMER_STORAGE_KEY = 'kb_customer';

function getCart() {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
}

function saveCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    if (typeof updateCartUI === 'function') {
        updateCartUI();
    }
}

function addToCart(productId) {
    const products = getProducts();
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        console.error('Produto não encontrado:', productId);
        return;
    }
    
    if (product.estoque <= 0) {
        alert("Produto fora de estoque!");
        return;
    }

    let cart = getCart();
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        if (existingItem.quantity < product.estoque) {
            existingItem.quantity += 1;
        } else {
            alert("Quantidade máxima em estoque atingida!");
            return;
        }
    } else {
        cart.push({
            id: product.id,
            nome: product.nome,
            preco: product.preco,
            imagem: product.imagem,
            quantity: 1
        });
    }

    saveCart(cart);
    if (typeof showNotification === 'function') {
        showNotification(`${product.nome} adicionado ao carrinho!`);
    } else {
        alert(`${product.nome} adicionado ao carrinho!`);
    }
}

function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
}

function updateQuantity(productId, change) {
    let cart = getCart();
    const item = cart.find(i => i.id === productId);
    const products = getProducts();
    const product = products.find(p => p.id === productId);

    if (item && product) {
        const newQuantity = item.quantity + change;
        if (newQuantity > 0 && newQuantity <= product.estoque) {
            item.quantity = newQuantity;
            saveCart(cart);
        } else if (newQuantity <= 0) {
            removeFromCart(productId);
        } else {
            alert("Quantidade máxima em estoque atingida!");
        }
    }
}

function getCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (item.preco * item.quantity), 0);
}

function getCartCount() {
    const cart = getCart();
    return cart.reduce((count, item) => count + item.quantity, 0);
}

function clearCart() {
    localStorage.removeItem(CART_STORAGE_KEY);
    if (typeof updateCartUI === 'function') {
        updateCartUI();
    }
}

function saveCustomerData(data) {
    localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(data));
}

function getCustomerData() {
    return JSON.parse(localStorage.getItem(CUSTOMER_STORAGE_KEY)) || {
        nome: '',
        telefone: '',
        cidade: '',
        observacoes: ''
    };
}

function finalizeOrder(customerData) {
    const cart = getCart();
    if (cart.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
    }

    saveCustomerData(customerData);

    let message = `Olá Kaique!\n\nGostaria de fazer o seguinte pedido:\n\n`;
    
    cart.forEach(item => {
        message += `* ${item.nome} x${item.quantity} - R$ ${(item.preco * item.quantity).toFixed(2)}\n`;
    });

    message += `\nTotal: R$ ${getCartTotal().toFixed(2)}\n\n`;
    message += `Nome: ${customerData.nome}\n`;
    message += `Telefone: ${customerData.telefone}\n`;
    message += `Cidade: ${customerData.cidade}\n`;
    
    if (customerData.observacoes) {
        message += `Observações: ${customerData.observacoes}\n`;
    }

    message += `\nAguardo retorno.`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/5524992046467?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
}