document.addEventListener('DOMContentLoaded', function() {
    var menuToggle = document.getElementById('menu-toggle');
    var navMenu = document.getElementById('nav-menu');
    var closeMenuBtn = document.getElementById('close-menu');
    var overlay = document.getElementById('overlay');

    if (!menuToggle || !navMenu) return;

    function openMenu() {
        navMenu.classList.add('active');
        document.body.classList.add('menu-open');
        menuToggle.setAttribute('aria-expanded', 'true');
        if (overlay) overlay.classList.add('active');
    }

    function closeMenu() {
        if (!navMenu.classList.contains('active')) return;
        navMenu.classList.remove('active');
        document.body.classList.remove('menu-open');
        menuToggle.setAttribute('aria-expanded', 'false');
        if (overlay) overlay.classList.remove('active');
    }

    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.addEventListener('click', openMenu);

    if (closeMenuBtn) {
        closeMenuBtn.addEventListener('click', closeMenu);
    }

    if (overlay) {
        overlay.addEventListener('click', function() {
            if (navMenu.classList.contains('active')) closeMenu();
        });
    }

    navMenu.querySelectorAll('a').forEach(function(link) {
        link.addEventListener('click', function() {
            closeMenu();
        });
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            closeMenu();
            menuToggle.focus();
        }
    });
});
