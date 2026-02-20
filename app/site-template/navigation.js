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
        const duckSrc = document.body.dataset.navDuck || 'assets/nav-duck.png';
        const duckImage = document.createElement('img');
        duckImage.src = duckSrc;
        duckImage.alt = '';
        duckImage.decoding = 'async';
        duckImage.loading = 'eager';
        chicken.appendChild(duckImage);
        navContent.appendChild(chicken);
    }

    const links = Array.from(navLinks.querySelectorAll(':scope > li > a'));
    if (!links.length) {
        return;
    }

    const hopDuration = 240;
    let activeJumpId = 0;
    let currentIndex = null;

    const linkIndexMap = new Map(links.map((link, index) => [link, index]));

    const triggerHop = () => {
        chicken.classList.remove('hopping');
        void chicken.offsetWidth;
        chicken.classList.add('hopping');
    };

    const markLanding = (link) => {
        const item = link.closest('li');
        if (!item) {
            return;
        }
        item.classList.add('chicken-landing');
        window.setTimeout(() => {
            item.classList.remove('chicken-landing');
        }, hopDuration);
    };

    const moveChickenTo = (link, index) => {
        const navRect = navContent.getBoundingClientRect();
        const linkRect = link.getBoundingClientRect();
        const left = linkRect.left - navRect.left + linkRect.width / 2;
        const top = linkRect.top - navRect.top;
        chicken.style.left = `${left}px`;
        chicken.style.top = `${top}px`;
        const direction = currentIndex === null || index >= currentIndex ? -1 : 1;
        chicken.style.setProperty('--chicken-scale-x', direction);
        nav.classList.add('chicken-ready');
        triggerHop();
        markLanding(link);
        currentIndex = index;
    };

    const jumpAcross = (targetIndex) => {
        if (targetIndex == null) {
            return;
        }
        if (currentIndex === null) {
            moveChickenTo(links[targetIndex], targetIndex);
            return;
        }
        if (targetIndex === currentIndex) {
            moveChickenTo(links[targetIndex], targetIndex);
            return;
        }

        const direction = targetIndex > currentIndex ? 1 : -1;
        const path = [];
        for (let i = currentIndex + direction; direction > 0 ? i <= targetIndex : i >= targetIndex; i += direction) {
            path.push(i);
        }

        const jumpId = ++activeJumpId;
        const stepJump = () => {
            if (jumpId !== activeJumpId) {
                return;
            }
            const nextIndex = path.shift();
            if (nextIndex === undefined) {
                return;
            }
            moveChickenTo(links[nextIndex], nextIndex);
            if (path.length) {
                setTimeout(stepJump, hopDuration);
            }
        };
        stepJump();
    };

    const setDefaultChicken = () => {
        const active = navLinks.querySelector('li.active a') || links[0];
        if (active) {
            jumpAcross(linkIndexMap.get(active));
        }
    };

    links.forEach(link => {
        link.addEventListener('mouseenter', () => jumpAcross(linkIndexMap.get(link)));
        link.addEventListener('focus', () => jumpAcross(linkIndexMap.get(link)));
    });

    navLinks.addEventListener('mouseleave', setDefaultChicken);
    window.addEventListener('resize', () => {
        updateNavHeight();
        window.requestAnimationFrame(setDefaultChicken);
    });
    window.requestAnimationFrame(setDefaultChicken);
}
