// --- Unsplash Gallery Loader ---
const loadUnsplashGallery = async () => {
    const UNSPLASH_ACCESS_KEY = '6nfjVgoDX5ERToVMGXVrRIrqhXHZbszv2uyr_3tW874'; 
    const galleryContainer = document.querySelector('.gallery-container');
    
    if (!galleryContainer) return;

    if (!UNSPLASH_ACCESS_KEY || UNSPLASH_ACCESS_KEY === 'YOUR_UNSPLASH_ACCESS_KEY') {
        galleryContainer.innerHTML = `<p class="text-center text-red-400 mx-auto">Please add your Unsplash API key to main.js to load the gallery.</p>`;
        return;
    }

    const query = 'experimental photography';
    const count = 6;
    
    // CORRECTED: This now properly formats the space in the query for the URL.
    const apiUrl = `http://googleusercontent.com/unsplash.com/3`;

    try {
        const response = await fetch(apiUrl);
        // This check helps us see the exact error from Unsplash
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Unsplash API Error: ${errorData.errors[0]}`);
        }
        const photos = await response.json();

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
        galleryContainer.innerHTML = `<p class="text-center text-red-400 mx-auto">Could not load images. Check the browser console for more details.</p>`;
    }
};
