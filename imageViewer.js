// Image Viewer functionality
class ImageViewer {
    constructor() {
        this.modal = document.getElementById('imageViewerModal');
        this.viewerImage = document.getElementById('viewerImage');
        this.productName = document.getElementById('productName');
        this.thumbnailsContainer = document.getElementById('thumbnailsContainer');
        this.currentImageIndex = 0;
        this.images = [];
        this.zoomLevel = 1;
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Close button
        document.querySelector('.image-viewer-close').addEventListener('click', () => this.close());

        // Navigation buttons
        document.getElementById('prevImage').addEventListener('click', () => this.showPreviousImage());
        document.getElementById('nextImage').addEventListener('click', () => this.showNextImage());

        // Zoom buttons
        document.getElementById('zoomIn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOut').addEventListener('click', () => this.zoomOut());
        document.getElementById('resetZoom').addEventListener('click', () => this.resetZoom());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (this.modal.style.display === 'block') {
                switch(e.key) {
                    case 'Escape':
                        this.close();
                        break;
                    case 'ArrowLeft':
                        this.showPreviousImage();
                        break;
                    case 'ArrowRight':
                        this.showNextImage();
                        break;
                    case '+':
                        this.zoomIn();
                        break;
                    case '-':
                        this.zoomOut();
                        break;
                    case '0':
                        this.resetZoom();
                        break;
                }
            }
        });
    }

    open(images, productName, initialIndex = 0) {
        this.images = images;
        this.currentImageIndex = initialIndex;
        this.productName.textContent = productName;
        this.modal.style.display = 'block';
        this.updateViewer();
    }

    close() {
        this.modal.style.display = 'none';
        this.resetZoom();
    }

    updateViewer() {
        // Update main image
        this.viewerImage.src = this.images[this.currentImageIndex];
        
        // Update thumbnails
        this.thumbnailsContainer.innerHTML = '';
        this.images.forEach((image, index) => {
            const thumbnail = document.createElement('img');
            thumbnail.src = image;
            thumbnail.className = `thumbnail ${index === this.currentImageIndex ? 'active' : ''}`;
            thumbnail.addEventListener('click', () => this.showImage(index));
            this.thumbnailsContainer.appendChild(thumbnail);
        });
    }

    showImage(index) {
        if (index >= 0 && index < this.images.length) {
            this.currentImageIndex = index;
            this.updateViewer();
        }
    }

    showPreviousImage() {
        const newIndex = (this.currentImageIndex - 1 + this.images.length) % this.images.length;
        this.showImage(newIndex);
    }

    showNextImage() {
        const newIndex = (this.currentImageIndex + 1) % this.images.length;
        this.showImage(newIndex);
    }

    zoomIn() {
        this.zoomLevel = Math.min(this.zoomLevel + 0.1, 3);
        this.viewerImage.style.transform = `scale(${this.zoomLevel})`;
    }

    zoomOut() {
        this.zoomLevel = Math.max(this.zoomLevel - 0.1, 0.5);
        this.viewerImage.style.transform = `scale(${this.zoomLevel})`;
    }

    resetZoom() {
        this.zoomLevel = 1;
        this.viewerImage.style.transform = 'scale(1)';
    }
}

// Initialize the image viewer
const imageViewer = new ImageViewer();

// Function to open the image viewer from product cards
function openImageViewer(images, productName, initialIndex = 0) {
    imageViewer.open(images, productName, initialIndex);
} 