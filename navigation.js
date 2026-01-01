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
    const nav = document.querySelector('nav');
    if (!nav) {
        return;
    }
    const navLinks = nav.querySelector('.nav-links');
    if (!navLinks) {
        return;
    }

    let chicken = navLinks.querySelector('.nav-chicken');
    if (!chicken) {
        chicken = document.createElement('li');
        chicken.className = 'nav-chicken';
        chicken.setAttribute('aria-hidden', 'true');
        chicken.innerHTML = '&#128020;';
        navLinks.appendChild(chicken);
    }

    const items = Array.from(navLinks.querySelectorAll('li'))
        .filter(item => !item.classList.contains('nav-chicken'));
    const links = items.map(item => item.querySelector('a')).filter(Boolean);
    if (!links.length) {
        return;
    }

    const moveChickenTo = (link) => {
        const navRect = navLinks.getBoundingClientRect();
        const linkRect = link.getBoundingClientRect();
        const left = linkRect.left - navRect.left + linkRect.width / 2;
        const top = linkRect.top - navRect.top;
        chicken.style.left = `${left}px`;
        chicken.style.top = `${top}px`;
        navLinks.classList.add('chicken-ready');
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
