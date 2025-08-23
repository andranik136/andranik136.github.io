
    const CACHE_NAME = 'weather-app-cache-v1';
    // Add the path to your HTML file here. If it's the root, index.html is common.
    const URLS_TO_CACHE = [
        '/',
        '/index.html', // Or whatever your HTML file is named
        'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-solid-900.woff2'
    ];

    // Install the service worker and cache the static assets
    self.addEventListener('install', event => {
        event.waitUntil(
            caches.open(CACHE_NAME)
                .then(cache => {
                    console.log('Opened cache');
                    return cache.addAll(URLS_TO_CACHE);
                })
        );
    });

    // Serve cached content when offline
    self.addEventListener('fetch', event => {
        // We only want to cache GET requests
        if (event.request.method !== 'GET') {
            return;
        }

        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    // Cache hit - return response
                    if (response) {
                        return response;
                    }

                    // Clone the request because it's a stream and can only be consumed once
                    const fetchRequest = event.request.clone();

                    return fetch(fetchRequest).then(
                        response => {
                            // Check if we received a valid response
                            if (!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') {
                                return response;
                            }
                            
                            // Don't cache weather API calls, only static assets
                            if(event.request.url.includes('api.weather.gov') || event.request.url.includes('api.open-meteo.com')) {
                                return response;
                            }

                            // Clone the response because it's also a stream
                            const responseToCache = response.clone();

                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                });

                            return response;
                        }
                    );
                })
        );
    });

    // Clean up old caches
    self.addEventListener('activate', event => {
        const cacheWhitelist = [CACHE_NAME];
        event.waitUntil(
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheWhitelist.indexOf(cacheName) === -1) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
        );
    });