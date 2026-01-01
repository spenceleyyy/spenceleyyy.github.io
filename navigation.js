// Load navigation
document.addEventListener('DOMContentLoaded', function() {
    fetch('navigation.html')
        .then(response => response.text())
        .then(data => {
            // Insert navigation at the start of body
            document.body.insertAdjacentHTML('afterbegin', data);
            
            // Reinitialize dropdown functionality after loading
            initializeDropdowns();
            highlightActiveNavLink();
            updateNavHeight();
            initializeChickenNav();
            window.addEventListener('load', updateNavHeight);
        })
        .catch(error => console.error('Error loading navigation:', error));
});

// Dropdown functionality
function initializeDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown');
    
    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        const menu = dropdown.querySelector('.dropdown-menu');
        
        // Prevent default link behavior
        if (toggle) {
            toggle.addEventListener('click', (e) => {
                e.preventDefault();
            });
        }
    });
}

// Highlight the active nav link based on current page
function highlightActiveNavLink() {
    const path = window.location.pathname.split('/').pop();
    const currentPath = path === '' ? 'index.html' : path;
    
    document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
    
    document.querySelectorAll('.nav-links a').forEach(link => {
        const href = link.getAttribute('href');
        if (!href || href === '#' || href.includes('#')) {
            return;
        }
        
        const linkPath = href.split('/').pop();
        if (linkPath === currentPath) {
            const parent = link.closest('li');
            if (parent) {
                parent.classList.add('active');
            }
        }
    });
}

function updateNavHeight() {
    const nav = document.querySelector('nav');
    if (!nav) {
        return;
    }
    document.documentElement.style.setProperty('--nav-height', `${nav.offsetHeight}px`);
}

function initializeChickenNav() {
    if (!document.body.classList.contains('mentorship-page')) {
        return;
    }
    const nav = document.querySelector('nav');
    if (!nav) {
        return;
    }
    const navLinks = nav.querySelector('.nav-links');
    const navContent = nav.querySelector('.nav-content');
    if (!navLinks || !navContent) {
        return;
    }

    navLinks.querySelectorAll('.nav-chicken').forEach((node) => node.remove());

    let chicken = navContent.querySelector('.nav-chicken');
    if (!chicken) {
        chicken = document.createElement('div');
        chicken.className = 'nav-chicken';
        chicken.setAttribute('aria-hidden', 'true');
        chicken.innerHTML = `
            <svg viewBox="0 0 64 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                <rect x="20" y="14" width="28" height="14" rx="2" fill="#f7f7f7" stroke="#d9dde4" stroke-width="1"></rect>
                <rect x="20" y="22" width="28" height="6" rx="1" fill="#e6e9ef"></rect>
                <rect x="8" y="12" width="14" height="12" rx="2" fill="#f7f7f7" stroke="#d9dde4" stroke-width="1"></rect>
                <rect x="2" y="16" width="6" height="6" rx="1" fill="#f2a23a"></rect>
                <rect x="11" y="16" width="3" height="3" fill="#1b1b1b"></rect>
                <rect x="12" y="8" width="6" height="4" rx="1" fill="#f2a23a"></rect>
                <rect x="48" y="16" width="6" height="8" rx="1" fill="#f7f7f7" stroke="#d9dde4" stroke-width="1"></rect>
                <rect x="24" y="28" width="4" height="4" fill="#f2a23a"></rect>
                <rect x="36" y="28" width="4" height="4" fill="#f2a23a"></rect>
            </svg>
        `;
        navContent.appendChild(chicken);
    }

    const links = Array.from(navLinks.querySelectorAll('a'));
    if (!links.length) {
        return;
    }

    let lastLeft = null;

    const triggerHop = () => {
        chicken.classList.remove('hopping');
        void chicken.offsetWidth;
        chicken.classList.add('hopping');
    };

    const moveChickenTo = (link) => {
        const navRect = navContent.getBoundingClientRect();
        const linkRect = link.getBoundingClientRect();
        const left = linkRect.left - navRect.left + linkRect.width / 2;
        const top = linkRect.top - navRect.top;
        chicken.style.left = `${left}px`;
        chicken.style.top = `${top}px`;
        if (lastLeft !== null) {
            const direction = left >= lastLeft ? 1 : -1;
            chicken.style.setProperty('--chicken-scale-x', direction);
        }
        nav.classList.add('chicken-ready');
        triggerHop();
        lastLeft = left;
    };

    const setDefaultChicken = () => {
        const active = navLinks.querySelector('li.active a') || links[0];
        if (active) {
            moveChickenTo(active);
        }
    };

    links.forEach(link => {
        link.addEventListener('mouseenter', () => moveChickenTo(link));
        link.addEventListener('focus', () => moveChickenTo(link));
    });

    navLinks.addEventListener('mouseleave', setDefaultChicken);
    window.addEventListener('resize', () => {
        updateNavHeight();
        window.requestAnimationFrame(setDefaultChicken);
    });
    window.requestAnimationFrame(setDefaultChicken);
}
