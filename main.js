document.addEventListener('DOMContentLoaded', () => {

    // --- Unsplash Gallery Loader ---
    // Function to dynamically load images into the gallery
    const loadUnsplashGallery = async () => {
        // Your Unsplash Access Key has been added here.
        const UNSPLASH_ACCESS_KEY = '6nfjVgoDX5ERToVMGXVrRIrqhXHZbszv2uyr_3tW874'; 
        
        const galleryContainer = document.querySelector('.gallery-container');
        if (!galleryContainer) return;

        if (!UNSPLASH_ACCESS_KEY || UNSPLASH_ACCESS_KEY === 'YOUR_UNSPLASH_ACCESS_KEY') {
            galleryContainer.innerHTML = `<p class="text-center text-red-400 mx-auto">Please add your Unsplash API key to main.js to load the gallery.</p>`;
            return;
        }

        const query = 'experimental photography';
        const count = 6;
        const apiUrl = `http://googleusercontent.com/unsplash.com/1`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`Unsplash API request failed. Status: ${response.status}`);
            }
            const photos = await response.json();

            // Clear placeholder content
            galleryContainer.innerHTML = ''; 

            photos.forEach(photo => {
                const title = photo.alt_description || 'Untitled';
                const author = photo.user.name || 'Unknown Artist';

                const galleryItem = `
                    <div class="group relative flex-shrink-0 w-full max-w-xl aspect-video overflow-hidden rounded-lg">
                        <img src="${photo.urls.regular}" alt="${title}" class="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110">
                        <div class="gallery-item-overlay absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out flex flex-col justify-end p-8">
                            <h3 class="text-2xl font-semibold text-white capitalize">${title}</h3>
                            <p class="text-gray-300 mt-1">Photo by ${author}</p>
                        </div>
                    </div>
                `;
                galleryContainer.insertAdjacentHTML('beforeend', galleryItem);
            });

        } catch (error) {
            console.error("Error loading Unsplash gallery:", error);
            galleryContainer.innerHTML = `<p class="text-center text-red-400 mx-auto">Could not load images from Unsplash. Please check the API key and network connection.</p>`;
        }
    };

    // Call the new function to load the gallery
    loadUnsplashGallery();


    // --- Three.js Void Animation ---
    const canvas = document.getElementById('void-canvas');
    if (canvas) {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const particlesGeometry = new THREE.BufferGeometry();
        const count = 7000;
        const positions = new Float32Array(count * 3);
        
        for (let i = 0; i < count; i++) {
            positions[i * 3 + 0] = (Math.random() - 0.5) * 15;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 15;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 15;
        }
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.025,
            sizeAttenuation: true,
            color: 0xffffff,
            transparent: true,
            opacity: 0.7
        });

        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particles);
        camera.position.z = 5;

        const mouse = new THREE.Vector2();
        window.addEventListener('mousemove', (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });

        const clock = new THREE.Clock();
        const animate = () => {
            const elapsedTime = clock.getElapsedTime();
            
            particles.position.z += 0.01;
            if(particles.position.z > 5) particles.position.z = -5;

            camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.02;
            camera.position.y += (mouse.y * 0.5 - camera.position.y) * 0.02;
            camera.lookAt(scene.position);

            renderer.render(scene, camera);
            window.requestAnimationFrame(animate);
        };
        animate();

        window.addEventListener('resize', () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        });
    }

    // --- Hero Text Scroll & Parallax Animation ---
    const heroText = document.getElementById('hero-text');
    const heroTextTop = document.getElementById('hero-text-top');
    const heroTextBottom = document.getElementById('hero-text-bottom');
    let collisionFired = false;

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        const scrollThreshold = 50;
        const opacity = Math.max(0, 1 - (scrollY / (window.innerHeight * 0.5)));
        
        if(heroText) heroText.style.opacity = opacity;

        if (scrollY > scrollThreshold) {
            heroTextTop.style.
