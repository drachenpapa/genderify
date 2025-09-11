function openLightbox(imageSrc) {
    document.getElementById('lightbox-img').src = imageSrc;
    document.getElementById('lightbox-overlay').style.display = 'flex';
}

function closeLightbox(event) {
    if (event.target.id === 'lightbox-close' || event.target.id === 'lightbox-overlay') {
        document.getElementById('lightbox-overlay').style.display = 'none';
    }
}
