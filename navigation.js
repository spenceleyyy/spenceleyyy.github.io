// Load navigation
document.addEventListener('DOMContentLoaded', function() {
    fetch('navigation.html')
        .then(response => response.text())
        .then(data => {
            // Insert navigation at the start of body
            document.body.insertAdjacentHTML('afterbegin', data);
            
            // Reinitialize dropdown functionality after loading
            initializeDropdowns();
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
