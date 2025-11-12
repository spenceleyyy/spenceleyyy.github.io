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
