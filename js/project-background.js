
// Project Background Script
// Takes the first image from the grid and sets it as the body background

document.addEventListener('DOMContentLoaded', () => {
    // Find the first grid item with a background image
    const firstItem = document.querySelector('.grid-item[style*="background-image"]');
    
    if (firstItem) {
        // Extract the URL from the background-image style
        // style.backgroundImage returns something like 'url("render-1.jpg")'
        const bgImage = firstItem.style.backgroundImage;
        
        if (bgImage) {
            document.body.style.backgroundImage = bgImage;
        }
    }
});
