import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ==========================================================================
// 1. DATASETS & CONFIGURATION
// ==========================================================================

// Texture CDN URLs
const TEXTURES = {
    skybox: "https://cdn.jsdelivr.net/gh/vlwkaos/threejs-blackhole@master/assets/milkyway.jpg",
    earthDay: "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg",
    earthNight: "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg",
    earthBump: "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png",
    earthSpecular: "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-water.png",
    clouds: "https://clouds.matteason.co.uk/images/2048x1024/clouds.jpg",
    moon: "https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/moon_1024.jpg"
};

// Globe Dimensions (ASTRONOMICALLY ACCURATE RELATIVE SCALES)
const GLOBE_RADIUS = 10;
const CLOUDS_RADIUS = GLOBE_RADIUS * 1.004;
const ATMOSPHERE_RADIUS = GLOBE_RADIUS * 1.15; // 15% Earth radius for a soft, wide atmospheric gradient
const MOON_RADIUS = GLOBE_RADIUS * 0.272; // True Moon radius is 27.2% of Earth
const MOON_ORBIT_RADIUS = GLOBE_RADIUS * 60.3; // True average Moon orbit distance is 60.3x Earth's radius (603 units)

// ==========================================================================
// 2. WEBGL SCENE SETUP
// ==========================================================================

const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

// Camera - Far plane expanded to 8000 to prevent clipping the distant Moon in its heliocentric orbit
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 8000);
camera.position.set(0, 30, 80); // Zoomed out slightly for a better initial framing

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2 for performance
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
container.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 12; // Don't let users zoom into the crust
controls.maxDistance = 4000; // Let users zoom out far enough to see the full heliocentric system
controls.enablePan = false; // Keep camera centered on Earth

// Loading Manager
const loadingScreen = document.getElementById('loading-screen');
const loaderBar = document.getElementById('loader-bar');
const loaderStatus = document.getElementById('loader-status');

const loadingManager = new THREE.LoadingManager();
loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
    const progress = (itemsLoaded / itemsTotal) * 100;
    loaderBar.style.width = progress + '%';
    
    // Friendly status updates
    if (progress < 25) {
        loaderStatus.textContent = "Connecting to Satellite CDN...";
    } else if (progress < 50) {
        loaderStatus.textContent = "Loading Earth Topographic Maps...";
    } else if (progress < 75) {
        loaderStatus.textContent = "Fetching Live Weather & Cloud Cover...";
    } else if (progress < 100) {
        loaderStatus.textContent = "Assembling Atmospheric Shaders...";
    }
};

loadingManager.onLoad = () => {
    setTimeout(() => {
        loadingScreen.classList.add('fade-out');
    }, 600);
};

const textureLoader = new THREE.TextureLoader(loadingManager);

// ==========================================================================
// 3. SHADERS DEFINITIONS
// ==========================================================================

// Custom Shader for Day/Night Texture Blending based on Sun position
const DayNightShader = {
    uniforms: {
        dayTexture: { value: null },
        nightTexture: { value: null },
        bumpMap: { value: null },
        specularMap: { value: null },
        sunDirection: { value: new THREE.Vector3(1, 0, 0) },
        topoMode: { value: 0 }, // 0: Realistic, 1: Night Only, 2: Topographic
        bumpScale: { value: 0.15 }
    },
    vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        
        void main() {
            vUv = uv;
            // Get normal and position in world space
            vNormal = normalize(vec3(modelMatrix * vec4(normal, 0.0)));
            vWorldPosition = vec3(modelMatrix * vec4(position, 1.0));
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D dayTexture;
        uniform sampler2D nightTexture;
        uniform sampler2D bumpMap;
        uniform sampler2D specularMap;
        uniform vec3 sunDirection;
        uniform int topoMode;
        uniform float bumpScale;
        
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        
        void main() {
            vec3 normal = normalize(vNormal);
            vec3 sunDir = normalize(sunDirection);
            
            // Calculate diffuse shading component
            float dotNL = dot(normal, sunDir);
            
            // Determine day/night transition blend factor
            // smoothstep transition between -0.15 (night) and 0.15 (day)
            float dayBlend = smoothstep(-0.15, 0.15, dotNL);
            
            vec4 dayColor = texture2D(dayTexture, vUv);
            vec4 nightColor = texture2D(nightTexture, vUv);
            vec4 bumpVal = texture2D(bumpMap, vUv);
            float specularVal = texture2D(specularMap, vUv).r;
            
            vec3 finalColor;
            
            if (topoMode == 0) {
                // Realistic Mode: Blend day & night
                finalColor = mix(nightColor.rgb, dayColor.rgb, dayBlend);
                
                // Add specular solar reflections on water bodies during day
                if (dotNL > 0.0) {
                    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
                    vec3 halfDir = normalize(sunDir + viewDir);
                    float specAngle = max(dot(normal, halfDir), 0.0);
                    // Specular power of 32 for sleek wet ocean reflectivity
                    float specHighlight = pow(specAngle, 32.0) * specularVal * dayBlend;
                    finalColor += vec3(specHighlight * 0.45);
                }
            } 
            else if (topoMode == 1) {
                // Night Only Mode (always night lights)
                finalColor = nightColor.rgb;
            } 
            else {
                // Topographic Mode (height map visualization with color ramp)
                float elevation = bumpVal.r;
                
                // Color ramp mapping for elevations: deep blue (ocean) -> green -> brown -> white (peaks)
                vec3 oceanColor = vec3(0.02, 0.15, 0.35);
                vec3 shoreColor = vec3(0.1, 0.45, 0.25);
                vec3 landColor = vec3(0.2, 0.5, 0.2);
                vec3 mountainColor = vec3(0.55, 0.45, 0.3);
                vec3 peakColor = vec3(0.9, 0.9, 0.9);
                
                vec3 elevationColor;
                if (elevation < 0.1) {
                    elevationColor = mix(oceanColor, shoreColor, elevation / 0.1);
                } else if (elevation < 0.4) {
                    elevationColor = mix(shoreColor, landColor, (elevation - 0.1) / 0.3);
                } else if (elevation < 0.7) {
                    elevationColor = mix(landColor, mountainColor, (elevation - 0.4) / 0.3);
                } else {
                    elevationColor = mix(mountainColor, peakColor, (elevation - 0.7) / 0.3);
                }
                
                // Apply a simple directional shading override
                float shadedLighting = 0.55 + 0.45 * max(dotNL, 0.0);
                finalColor = elevationColor * shadedLighting;
            }
            
            gl_FragColor = vec4(finalColor, 1.0);
        }
    `
};

// Custom Shader for Atmospheric Fresnel Glow (rim shading)
const AtmosphereShader = {
    vertexShader: `
        varying vec3 vNormal;
        void main() {
            // Transform normal to View Space
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying vec3 vNormal;
        void main() {
            // View vector in view-space is pointing straight out (0,0,1)
            // Fresnel intensity rises as normal becomes perpendicular to camera view vector (normal.z -> 0)
            // Lower exponent (1.25) creates an extremely soft gradient, and multiplier (0.27) makes it 50% more transparent
            float intensity = pow(max(0.95 - vNormal.z, 0.0), 1.25) * 0.27;
            
            // Atmospheric cyan/blue tint
            vec3 atmosphereColor = vec3(0.35, 0.7, 1.0);
            gl_FragColor = vec4(atmosphereColor * intensity, intensity);
        }
    `
};

// (Procedural clouds shader removed, reverted to static image mapping)

// ==========================================================================
// 4. CREATING SCENE MESHES & LIGHTS
// ==========================================================================

// Global variable holders
let skyboxMesh, earthMesh, cloudsMesh, atmosphereMesh, moonMesh;
let sunLight, sunHelper;
let moonOrbitAngle = 0;

// Alien Spaceship (UFO)
let ufoGroup, ufoModel;
let ufoOrbitAngle = 0;
const ufoRimLights = [];

// Focus Target Tracking & Camera Transitions
let focusObject = 'earth';
let transitionActive = false;
let transitionProgress = 0;
const transitionDuration = 1.2; // seconds
const transitionStartCam = new THREE.Vector3();
const transitionStartTarget = new THREE.Vector3();
const transitionStartDir = new THREE.Vector3();

// Load textures
const skyboxTexture = textureLoader.load(TEXTURES.skybox);
skyboxTexture.mapping = THREE.EquirectangularReflectionMapping;
skyboxTexture.colorSpace = THREE.SRGBColorSpace;

const earthDayTex = textureLoader.load(TEXTURES.earthDay);
const earthNightTex = textureLoader.load(TEXTURES.earthNight);
const earthBumpTex = textureLoader.load(TEXTURES.earthBump);
const earthSpecTex = textureLoader.load(TEXTURES.earthSpecular);
const cloudsTex = textureLoader.load(TEXTURES.clouds);
const moonTex = textureLoader.load(TEXTURES.moon);

// Apply color space corrections
earthDayTex.colorSpace = THREE.SRGBColorSpace;
earthNightTex.colorSpace = THREE.SRGBColorSpace;
cloudsTex.colorSpace = THREE.SRGBColorSpace;
moonTex.colorSpace = THREE.SRGBColorSpace;

// A. Skybox (Milky Way background sphere) - Expanded to radius 5000 to prevent camera clipping
const skyboxGeo = new THREE.SphereGeometry(5000, 64, 64);
const skyboxMat = new THREE.MeshBasicMaterial({
    map: skyboxTexture,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.35
});
skyboxMesh = new THREE.Mesh(skyboxGeo, skyboxMat);
scene.add(skyboxMesh);

// B. Earth Core Mesh
const earthGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
const earthMat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.clone(DayNightShader.uniforms),
    vertexShader: DayNightShader.vertexShader,
    fragmentShader: DayNightShader.fragmentShader,
    transparent: false
});

// Pass texture bindings
earthMat.uniforms.dayTexture.value = earthDayTex;
earthMat.uniforms.nightTexture.value = earthNightTex;
earthMat.uniforms.bumpMap.value = earthBumpTex;
earthMat.uniforms.specularMap.value = earthSpecTex;

earthMesh = new THREE.Mesh(earthGeo, earthMat);
scene.add(earthMesh);

// C. Clouds Mesh (floating above Earth - reverted to high-res static texture)
const cloudsGeo = new THREE.SphereGeometry(CLOUDS_RADIUS, 64, 64);
const cloudsMat = new THREE.MeshPhongMaterial({
    map: cloudsTex,
    alphaMap: cloudsTex, // Use clouds map values for opacity mapping (white is cloud, black is clear)
    transparent: true,
    depthWrite: false, // Prevents depth buffer conflicts with layers
    blending: THREE.NormalBlending,
    opacity: 0.6
});
cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
scene.add(cloudsMesh);

// D. Atmosphere Mesh (outer Fresnel glow - larger radius for soft gradient halo)
const atmosphereGeo = new THREE.SphereGeometry(ATMOSPHERE_RADIUS, 64, 64);
const atmosphereMat = new THREE.ShaderMaterial({
    vertexShader: AtmosphereShader.vertexShader,
    fragmentShader: AtmosphereShader.fragmentShader,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false
});
atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
scene.add(atmosphereMesh);

// E. Moon Mesh
const moonGeo = new THREE.SphereGeometry(MOON_RADIUS, 32, 32);
const moonMat = new THREE.MeshPhongMaterial({
    map: moonTex,
    bumpMap: moonTex,
    bumpScale: 0.05,
    shininess: 0, // rough, dusty surface
    color: 0xcccccc
});
moonMesh = new THREE.Mesh(moonGeo, moonMat);
scene.add(moonMesh);

// F. Alien Spaceship (UFO)
ufoGroup = new THREE.Group();
ufoModel = new THREE.Group();
ufoGroup.add(ufoModel);

// 1. Saucer main disk (brushed metallic titanium)
const saucerGeo = new THREE.CylinderGeometry(0.8, 1.1, 0.22, 16);
const saucerMat = new THREE.MeshStandardMaterial({
    color: 0x8899a6,
    metalness: 0.95,
    roughness: 0.15,
    flatShading: true
});
const saucerMesh = new THREE.Mesh(saucerGeo, saucerMat);
ufoModel.add(saucerMesh);

// 2. Cockpit dome (translucent glowing neon-green dome)
const domeGeo = new THREE.SphereGeometry(0.38, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
const domeMat = new THREE.MeshStandardMaterial({
    color: 0x00ffcc,
    emissive: 0x00ffcc,
    emissiveIntensity: 1.5,
    transparent: true,
    opacity: 0.75,
    roughness: 0.1
});
const domeMesh = new THREE.Mesh(domeGeo, domeMat);
domeMesh.position.y = 0.08;
ufoModel.add(domeMesh);

// 3. Bottom thruster (neon purple glowing cylinder ring)
const thrusterGeo = new THREE.CylinderGeometry(0.45, 0.2, 0.08, 16);
const thrusterMat = new THREE.MeshStandardMaterial({
    color: 0xff00ff,
    emissive: 0xff00ff,
    emissiveIntensity: 2.0,
    roughness: 0.2
});
const thrusterMesh = new THREE.Mesh(thrusterGeo, thrusterMat);
thrusterMesh.position.y = -0.12;
ufoModel.add(thrusterMesh);

// 4. Tractor Beam (cone pointing down with additive blending glow)
const beamGeo = new THREE.ConeGeometry(0.35, 1.5, 16, 1, true); // open bottom
const beamMat = new THREE.MeshBasicMaterial({
    color: 0x00ffcc,
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending
});
const beamMesh = new THREE.Mesh(beamGeo, beamMat);
// The cone's tip points upwards to touch the thruster, and its base expands downwards
beamMesh.position.y = -0.87;
ufoModel.add(beamMesh);

// 5. Alternating blinking rim lights
for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const lightGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const lightMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const lightMesh = new THREE.Mesh(lightGeo, lightMat);
    lightMesh.position.set(0.95 * Math.cos(angle), 0, 0.95 * Math.sin(angle));
    ufoModel.add(lightMesh);
    ufoRimLights.push(lightMesh);
}

scene.add(ufoGroup);

// G. Lights
// General faint environmental light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
scene.add(ambientLight);

// The Sun Point Light (placed at center, radiating outward to light Moon/Earth)
const sunPointLight = new THREE.PointLight(0xffffff, 1.8, 0, 0); // distance=0, decay=0 for solar system scale
scene.add(sunPointLight);

// The Sun Directional Light (focuses on Earth for high-quality Specular/Day-Night shading)
sunLight = new THREE.DirectionalLight(0xffffff, 1.8);
scene.add(sunLight);

// Small golden sphere representing the Sun visual position in space
const sunHelperGeo = new THREE.SphereGeometry(45.0, 32, 32); // Large scale to look prominent from Earth's orbit
const sunHelperMat = new THREE.MeshBasicMaterial({
    color: 0xfff3d1,
    toneMapped: false // Make it glow intensely in post tone map
});
sunHelper = new THREE.Mesh(sunHelperGeo, sunHelperMat);
scene.add(sunHelper); // Positioned at (0,0,0) center by default

// Apply initial coordinates (representing Earth orbiting the Sun)
let earthOrbitAngle = 180 * (Math.PI / 180); // Initial angle
const initialSunAngle = 180; // Earth orbits to 180 degrees initially
updateEarthPosition(initialSunAngle);

// ==========================================================================
// 5. COORDINATES LOGIC
// ==========================================================================

// Raycaster for Pointer Coordinates Display
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function handleMouseMove(event) {
    // Calculate normalized device mouse coords
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Raycast for Pointer Coordinates Display
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(earthMesh);
    
    const coordLat = document.getElementById('coord-lat');
    const coordLon = document.getElementById('coord-lon');
    const coordHeading = document.getElementById('coord-heading');

    if (intersects.length > 0) {
        const point = intersects[0].point;
        
        // Convert intersection point back to Lat/Lon
        const r = point.length();
        const lat = Math.asin(point.y / r) * (180 / Math.PI);
        const lon = Math.atan2(-point.x, -point.z) * (180 / Math.PI);
        
        // Update UI
        coordLat.textContent = lat.toFixed(4);
        coordLon.textContent = lon.toFixed(4);
        
        // Compute heading based on camera orientation
        const heading = (controls.getAzimuthalAngle() * (180 / Math.PI) + 360) % 360;
        coordHeading.textContent = Math.round(heading);
    } else {
        coordLat.textContent = "--";
        coordLon.textContent = "--";
    }
}

window.addEventListener('mousemove', handleMouseMove);

// ==========================================================================
// 6. USER INTERFACE CONTROLS & EVENT LISTENERS
// ==========================================================================

// Toggle Atmosphere Glow
document.getElementById('toggle-atmosphere').addEventListener('change', (e) => {
    atmosphereMesh.visible = e.target.checked;
});

// Toggle Cloud Layer
document.getElementById('toggle-clouds').addEventListener('change', (e) => {
    cloudsMesh.visible = e.target.checked;
});

// Toggle Milky Way Skybox
document.getElementById('toggle-skybox').addEventListener('change', (e) => {
    skyboxMesh.visible = e.target.checked;
});

// Toggles for Auto-rotation speed slider
const rotationToggle = document.getElementById('toggle-rotate');
const rotationSpeedSlider = document.getElementById('slider-speed');

// Earth orbit position slider
const sunSlider = document.getElementById('slider-sun');
const sunOrbitToggle = document.getElementById('toggle-sun-orbit');

sunSlider.addEventListener('input', (e) => {
    updateEarthPosition(parseInt(e.target.value));
    // Turn off automatic orbit if slider is manually grabbed
    sunOrbitToggle.checked = false;
});

function updateEarthPosition(angleDegrees) {
    const angleRad = angleDegrees * (Math.PI / 180);
    earthOrbitAngle = angleRad;
    
    // Position Earth along Sun orbit in X-Z space (radius 950)
    const orbitRadius = 950;
    const earthX = orbitRadius * Math.sin(angleRad);
    const earthZ = orbitRadius * Math.cos(angleRad);
    
    earthMesh.position.set(earthX, 0, earthZ);
    atmosphereMesh.position.copy(earthMesh.position);
    cloudsMesh.position.copy(earthMesh.position);

    // Direct the directional light to point from Sun (0,0,0) to Earth position
    sunLight.position.set(0, 0, 0);
    sunLight.target = earthMesh;

    // Vector pointing from Earth to Sun at (0, 0, 0)
    const sunDir = new THREE.Vector3().subVectors(new THREE.Vector3(0, 0, 0), earthMesh.position).normalize();
    earthMat.uniforms.sunDirection.value.copy(sunDir);
}

// Simulation modes (Realistic, Night Only, Topographic)
window.setEarthMode = function(modeName) {
    const btns = document.querySelectorAll('.btn-mode');
    btns.forEach(btn => {
        if (btn.id === `mode-${modeName}`) {
            btn.classList.add('active');
        } else if (btn.id.startsWith('mode-')) {
            btn.classList.remove('active');
        }
    });

    if (modeName === 'realistic') {
        earthMat.uniforms.topoMode.value = 0;
    } else if (modeName === 'night') {
        earthMat.uniforms.topoMode.value = 1;
    } else if (modeName === 'topology') {
        earthMat.uniforms.topoMode.value = 2;
    }
};

// Focus Target Selector
window.setFocusObject = function(name) {
    if (name === focusObject) return;

    // Update UI active buttons
    const btns = document.querySelectorAll('.btn-mode');
    btns.forEach(btn => {
        if (btn.id === `focus-${name}`) {
            btn.classList.add('active');
        } else if (btn.id.startsWith('focus-')) {
            btn.classList.remove('active');
        }
    });

    focusObject = name;

    // Set transition parameters
    transitionActive = true;
    transitionProgress = 0;
    transitionStartCam.copy(camera.position);
    transitionStartTarget.copy(controls.target);
    controls.enabled = false; // Lock user input during animation

    // Adjust camera limits per object and set up direction
    const T_end = new THREE.Vector3();
    if (name === 'earth') {
        T_end.copy(earthMesh.position);
        controls.minDistance = 12;
        controls.maxDistance = 1500;
    } else if (name === 'moon') {
        T_end.copy(moonMesh.position);
        controls.minDistance = 3.5;
        controls.maxDistance = 100;
    } else if (name === 'sun') {
        T_end.set(0, 0, 0); // Sun is at the center (0, 0, 0)
        controls.minDistance = 60;
        controls.maxDistance = 4000;
    }

    // Set start direction from new target to camera
    transitionStartDir.subVectors(camera.position, T_end).normalize();
    if (transitionStartDir.lengthSq() === 0) {
        transitionStartDir.set(0, 0.3, 0.9).normalize();
    }
};

// ==========================================================================
// 7. COSMIC AMBIENT AUDIO SYNTHESIS (Web Audio API)
// ==========================================================================

let audioContext = null;
let spaceOsc1 = null;
let spaceOsc2 = null;
let spaceFilter = null;
let spaceGain = null;
let lfoOsc = null;
const audioToggle = document.getElementById('toggle-audio');

function initSpaceAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Low drone base oscillator (A1 - 55 Hz)
    spaceOsc1 = audioContext.createOscillator();
    spaceOsc1.type = 'sawtooth';
    spaceOsc1.frequency.setValueAtTime(55, audioContext.currentTime);

    // Rich fifth harmonic oscillator (E2 - 82.41 Hz)
    spaceOsc2 = audioContext.createOscillator();
    spaceOsc2.type = 'triangle';
    spaceOsc2.frequency.setValueAtTime(82.41, audioContext.currentTime);

    // Dynamic Lowpass Filter (gives that smooth deep rumbling wind sound)
    spaceFilter = audioContext.createBiquadFilter();
    spaceFilter.type = 'lowpass';
    spaceFilter.Q.setValueAtTime(4, audioContext.currentTime);
    spaceFilter.frequency.setValueAtTime(250, audioContext.currentTime);

    // LFO Oscillator to sweep the lowpass filter frequency (frequency modulation)
    lfoOsc = audioContext.createOscillator();
    lfoOsc.type = 'sine';
    lfoOsc.frequency.setValueAtTime(0.08, audioContext.currentTime); // very slow sweep: 12 seconds per cycle

    const lfoGain = audioContext.createGain();
    lfoGain.gain.setValueAtTime(120, audioContext.currentTime); // Modulate cutoff +/- 120 Hz

    // Main Output Volume control
    spaceGain = audioContext.createGain();
    spaceGain.gain.setValueAtTime(0, audioContext.currentTime); // Start silent

    // Route connections
    spaceOsc1.connect(spaceFilter);
    spaceOsc2.connect(spaceFilter);
    lfoOsc.connect(lfoGain);
    lfoGain.connect(spaceFilter.frequency); // Sweep filter frequency via LFO
    
    spaceFilter.connect(spaceGain);
    spaceGain.connect(audioContext.destination);

    // Start sound generation
    spaceOsc1.start();
    spaceOsc2.start();
    lfoOsc.start();
}

audioToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
        if (!audioContext) {
            initSpaceAudio();
        }
        // Resume if suspended (browser security block)
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        // Smoothly fade in volume over 2 seconds to avoid popping
        spaceGain.gain.linearRampToValueAtTime(0.18, audioContext.currentTime + 2.0);
    } else {
        if (audioContext && spaceGain) {
            // Smoothly fade out volume over 1.5 seconds
            spaceGain.gain.linearRampToValueAtTime(0.0, audioContext.currentTime + 1.5);
        }
    }
});

// ==========================================================================
// 8. ANIMATION LOOP & EVENT LISTENERS
// ==========================================================================

const clock = new THREE.Clock();

// UI Elements for stats
const statDistance = document.getElementById('stat-distance');
const statSpeed = document.getElementById('stat-speed');
const statUtc = document.getElementById('stat-utc');

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    // Update UFO spaceship orbit motion
    if (ufoGroup && ufoModel) {
        ufoOrbitAngle += delta * 0.35 * parseFloat(rotationSpeedSlider.value);
        const ufoOrbitRadius = 13.5;
        const ufoInclination = 23.5 * (Math.PI / 180); // Earth-like axial inclination tilt

        const ufoX = ufoOrbitRadius * Math.sin(ufoOrbitAngle);
        const ufoZ = ufoOrbitRadius * Math.cos(ufoOrbitAngle);

        const ufoPos = new THREE.Vector3(ufoX, 0, ufoZ);
        ufoPos.applyAxisAngle(new THREE.Vector3(1, 0, 0), ufoInclination);
        ufoPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), 20 * (Math.PI / 180));
        
        // Offset relative to the moving Earth's position
        ufoGroup.position.copy(earthMesh.position).add(ufoPos);

        // Orient the UFO so that its Y-axis is aligned with the radial vector pointing out from the Earth's center,
        // and its Z-axis faces forward along the tangent trajectory. This makes the bottom (tractor beam) always point directly at the Earth.
        const upVector = ufoPos.clone().normalize();
        const nextUfoAngle = ufoOrbitAngle + 0.01;
        const nextUfoX = ufoOrbitRadius * Math.sin(nextUfoAngle);
        const nextUfoZ = ufoOrbitRadius * Math.cos(nextUfoAngle);
        const nextUfoPos = new THREE.Vector3(nextUfoX, 0, nextUfoZ);
        nextUfoPos.applyAxisAngle(new THREE.Vector3(1, 0, 0), ufoInclination);
        nextUfoPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), 20 * (Math.PI / 180));

        const tangent = nextUfoPos.clone().sub(ufoPos).normalize();
        const right = new THREE.Vector3().crossVectors(upVector, tangent).normalize();
        const forward = new THREE.Vector3().crossVectors(right, upVector).normalize();

        const basisMatrix = new THREE.Matrix4();
        basisMatrix.makeBasis(right, upVector, forward);
        ufoGroup.rotation.setFromRotationMatrix(basisMatrix);

        // Spin saucer locally
        ufoModel.rotation.y += delta * 5.0;

        // Blinking rim lights alternation (Cyan / Magenta)
        ufoRimLights.forEach((light, idx) => {
            const blinkTime = Math.floor(elapsedTime * 6);
            const isCyan = (blinkTime + idx) % 2 === 0;
            light.material.color.setHex(isCyan ? 0x00ffff : 0xff00ff);
        });
    }

    // Camera Target Tracking & Transitions
    if (transitionActive) {
        transitionProgress += delta;
        let t = transitionProgress / transitionDuration;
        if (t >= 1.0) {
            t = 1.0;
            transitionActive = false;
            controls.enabled = true; // Re-enable camera controls
        }

        const T_end = new THREE.Vector3();
        let endDistance = 45.0;
        if (focusObject === 'earth') {
            T_end.copy(earthMesh.position);
            endDistance = 45.0;
        } else if (focusObject === 'moon') {
            T_end.copy(moonMesh.position);
            endDistance = 12.0;
        } else if (focusObject === 'sun') {
            T_end.set(0, 0, 0);
            endDistance = 250.0;
        }

        // Cubic easeInOut transition
        const ease = t < 0.5 ? 4.0 * t * t * t : 1.0 - Math.pow(-2.0 * t + 2.0, 3.0) / 2.0;

        controls.target.lerpVectors(transitionStartTarget, T_end, ease);
        const C_end = T_end.clone().addScaledVector(transitionStartDir, endDistance);
        camera.position.lerpVectors(transitionStartCam, C_end, ease);
    } else {
        // Continuous lock/tracking of focused object
        const prevTarget = controls.target.clone();
        if (focusObject === 'earth') {
            controls.target.copy(earthMesh.position);
        } else if (focusObject === 'moon') {
            controls.target.copy(moonMesh.position);
        } else if (focusObject === 'sun') {
            controls.target.set(0, 0, 0); // Sun is at the center (0,0,0)
        }

        const targetDelta = controls.target.clone().sub(prevTarget);
        camera.position.add(targetDelta);
    }

    // Update Orbit controls damping
    controls.update();

    // Auto-Rotations (if checked)
    const baseRotationSpeed = delta * 0.015 * parseFloat(rotationSpeedSlider.value);
    
    if (rotationToggle.checked) {
        // Rotate Earth Core and Atmosphere synchronously
        earthMesh.rotation.y += baseRotationSpeed;
        atmosphereMesh.rotation.y += baseRotationSpeed;
        
        // Rotate clouds slightly faster for realistic parallax drift
        cloudsMesh.rotation.y += baseRotationSpeed * 1.35;
    } else {
        // Let clouds drift slowly even if Earth is rotation-locked
        cloudsMesh.rotation.y += delta * 0.003;
    }

    // Orbit Moon around Earth at True Scale distance (slow orbit speed tied to slider)
    // Real Moon orbits once every 27.3 days, so it orbits very slowly relative to Earth's rotation (ratio: 0.015 / 27.3 ≈ 0.00055)
    moonOrbitAngle += delta * 0.00055 * parseFloat(rotationSpeedSlider.value);
    
    // Moon orbits relative to the moving Earth
    const moonX = MOON_ORBIT_RADIUS * Math.sin(moonOrbitAngle);
    const moonZ = MOON_ORBIT_RADIUS * Math.cos(moonOrbitAngle);
    moonMesh.position.set(earthMesh.position.x + moonX, 0, earthMesh.position.z + moonZ);
    
    // Moon is tidally locked (look at Earth)
    moonMesh.lookAt(earthMesh.position);
    moonMesh.rotation.y += Math.PI; // Correct alignment so the visible side faces Earth

    // Earth Automatic Orbiting around the Sun
    if (sunOrbitToggle.checked) {
        const earthOrbitSpeed = 2.0; // degrees per second
        const currentEarthAngle = (elapsedTime * earthOrbitSpeed) % 360;
        updateEarthPosition(currentEarthAngle);
        // Sync UI slider
        sunSlider.value = Math.round(currentEarthAngle);
    }

    // Update UI stats
    // A. Estimate actual camera distance (in mocked planetary scale, e.g. 6371km radius)
    const realDist = Math.round((camera.position.length() / GLOBE_RADIUS) * 6371);
    statDistance.textContent = realDist.toLocaleString() + " km";

    // B. Calculate mock orbital speeds
    const mockSpeed = (29.78 * (GLOBE_RADIUS / camera.position.length())).toFixed(2);
    statSpeed.textContent = mockSpeed + " km/s";

    // C. UTC Time stamp
    const utcDate = new Date();
    statUtc.textContent = utcDate.toISOString().substr(11, 8);

    // Center the skybox at the current focus target to prevent parallax and clipping
    if (skyboxMesh) {
        skyboxMesh.position.copy(controls.target);
    }

    // Render Scene
    renderer.render(scene, camera);
}

// Window resizing adjustments
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Run animation loop
animate();
