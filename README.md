# Loja / Marketplace KB Tech

Projeto em HTML, CSS, JavaScript e Firebase, compatível com GitHub Pages.

## Páginas principais

- `index.html`: site atual da KB Tech.
- `marketplace.html`: vitrine pública do marketplace.
- `lojista.html`: cadastro, login e painel do lojista.
- `produto.html?id=ID`: página pública do produto.
- `loja.html?id=ID`: página pública da loja.
- `marketplace-admin.html`: área administrativa KB Tech para lojistas, produtos e assinaturas.

## Firebase

O marketplace usa:

- Firebase Authentication para login dos lojistas.
- Firestore para lojistas, produtos, pedidos e categorias.
- Storage para fotos de produtos, logo e capa das lojas.

Arquivos de regras incluídos:

- `firestore.rules`
- `storage.rules`

Publique essas regras no Firebase antes de colocar a plataforma em produção.

## Coleções

- `lojistas`
- `lojasPublicas`
- `marketplaceProdutos`
- `marketplacePedidos`
- `marketplaceCategorias`

`lojistas` guarda dados privados do cadastro. `lojasPublicas` guarda apenas os dados exibidos na vitrine, como nome, endereço, telefone, WhatsApp, logo, capa e opções de entrega.

## Assinatura

Plano mensal: R$100.

Quando a assinatura está vencida:

- Produtos ficam ocultos da vitrine pública.
- A conta continua existindo.
- O lojista não consegue cadastrar novos produtos.

## Admin

Para criar o primeiro administrador, cadastre uma conta normalmente e altere manualmente no Console do Firebase o campo `role` do documento correspondente em `lojistas` para `admin`.
