document.addEventListener('DOMContentLoaded', () => {
    // Clock
    const clockElement = document.getElementById('clock');

    function updateClock() {
        const now = new Date();
        let hours = now.getHours();
        let minutes = now.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';

        hours = hours % 12;
        hours = hours ? hours : 12;
        minutes = minutes < 10 ? '0' + minutes : minutes;

        clockElement.textContent = `${hours}:${minutes} ${ampm}`;
    }

    setInterval(updateClock, 1000);
    updateClock();

    // Start Menu Toggle
    const startBtn = document.getElementById('start-btn');
    const startMenu = document.getElementById('start-menu');

    startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        startMenu.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
        if (!startMenu.contains(e.target) && !startBtn.contains(e.target)) {
            startMenu.classList.remove('open');
        }
    });

    // RSS Feed Fetching (Ars Technica)
    const newsContent = document.getElementById('news-content');
    const rssUrl = encodeURIComponent('https://feeds.arstechnica.com/arstechnica/index');
    // Using rss2json proxy to bypass CORS on static pages
    const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`;

    async function fetchNews() {
        try {
            const response = await fetch(proxyUrl);
            const data = await response.json();

            if (data.status === 'ok') {
                let html = `<h1>Ars Technica - Latest News</h1>`;

                // Render top 10 articles
                const articles = data.items.slice(0, 10);

                articles.forEach(article => {
                    // Extracting text snippet from potentially HTML description
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = article.description;
                    const snippet = tempDiv.textContent || tempDiv.innerText || "";

                    const date = new Date(article.pubDate).toLocaleString();

                    html += `
                        <div class="article">
                            <a href="${article.link}" target="_blank" class="article-title">${article.title}</a>
                            <div class="article-meta">Published: ${date} by ${article.author}</div>
                            <div class="article-desc">${snippet.substring(0, 200)}...</div>
                        </div>
                    `;
                });

                newsContent.innerHTML = html;
            } else {
                newsContent.innerHTML = `<div class="loading">Failed to load news feed.</div>`;
            }
        } catch (error) {
            console.error('Error fetching RSS:', error);
            newsContent.innerHTML = `<div class="loading">Error loading news feed. Please try again later.</div>`;
        }
    }

    fetchNews();

    // Draggable Window Logic
    // Window Focus Logic
    function bringToFront(win) {
        document.querySelectorAll('.window').forEach(w => w.style.zIndex = '100');
        win.style.zIndex = '101';
    }

    const ie6Window = document.getElementById('ie6-window');
    ie6Window.addEventListener('mousedown', () => bringToFront(ie6Window));

    const paintWindow = document.getElementById('paint-window');
    paintWindow.addEventListener('mousedown', () => bringToFront(paintWindow));

    const titleBar = ie6Window.querySelector('.title-bar');

    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let initialWindowX = 0;
    let initialWindowY = 0;
    let activeWindow = null;

    titleBar.addEventListener('mousedown', (e) => {
        // Prevent dragging if clicking window controls
        if (e.target.closest('.title-bar-controls')) return;

        isDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        activeWindow = ie6Window;

        // Get currect style positions, or computed if not set in style
        const rect = ie6Window.getBoundingClientRect();
        // Calculate offset from parent so it stays accurate to css left/top
        const desktopRect = document.querySelector('.desktop').getBoundingClientRect();

        initialWindowX = rect.left - desktopRect.left;
        initialWindowY = rect.top - desktopRect.top;

        document.body.style.userSelect = 'none'; // prevent text selection while dragging
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging || !activeWindow) return;

        const deltaX = e.clientX - dragStartX;
        const deltaY = e.clientY - dragStartY;

        activeWindow.style.left = `${initialWindowX + deltaX}px`;
        activeWindow.style.top = `${initialWindowY + deltaY}px`;
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        document.body.style.userSelect = '';
        activeWindow = null;
    });

    // MS Paint Logic
    const paintTitleBar = paintWindow.querySelector('.title-bar');
    const canvas = document.getElementById('paint-canvas');
    const ctx = canvas.getContext('2d');

    // Make Paint window draggable
    paintTitleBar.addEventListener('mousedown', (e) => {
        if (e.target.closest('.title-bar-controls')) return;

        isDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        activeWindow = paintWindow;

        const rect = paintWindow.getBoundingClientRect();
        const desktopRect = document.querySelector('.desktop').getBoundingClientRect();

        initialWindowX = rect.left - desktopRect.left;
        initialWindowY = rect.top - desktopRect.top;

        // Bring to front handled by window mousedown event
        document.body.style.userSelect = 'none';
    });

    // Drawing Logic
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    // Fill background with white initially
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Default brush settings
    ctx.strokeStyle = "black";
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = 2;

    function draw(e) {
        if (!isDrawing) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();

        [lastX, lastY] = [x, y];
    }

    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        [lastX, lastY] = [e.clientX - rect.left, e.clientY - rect.top];
    });

    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', () => isDrawing = false);
    canvas.addEventListener('mouseout', () => isDrawing = false);

    // Color Selection Logic
    const swatches = document.querySelectorAll('.color-swatch');
    swatches.forEach(swatch => {
        swatch.addEventListener('click', (e) => {
            const color = window.getComputedStyle(e.target).backgroundColor;
            ctx.strokeStyle = color;
            // Update the active color indicator in UI
            document.querySelector('.window.active #paint-window .color-swatch')?.parentNode.previousElementSibling.lastElementChild.setAttribute('style', `position: absolute; width: 14px; height: 14px; background: ${color}; border: 1px solid #888; top: 2px; left: 2px; z-index: 2;`);
        });
    });
});
