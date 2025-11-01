import React, { useState } from "react";

interface GalleryProps {
    title?: string;
    images?: Array<{
        url: string;
        alt: string;
    }>;
}

export default function Gallery({ title = "Galería", images }: GalleryProps) {
    const [selectedImage, setSelectedImage] = useState<number | null>(null);
    const [interactionCount, setInteractionCount] = React.useState(0);

    // Imágenes por defecto si no se pasan
    const defaultImages = [
        { url: "https://picsum.photos/400/300?random=1", alt: "Imagen 1" },
        { url: "https://picsum.photos/400/300?random=2", alt: "Imagen 2" },
        { url: "https://picsum.photos/400/300?random=3", alt: "Imagen 3" },
        { url: "https://picsum.photos/400/300?random=4", alt: "Imagen 4" },
        { url: "https://picsum.photos/400/300?random=5", alt: "Imagen 5" },
        { url: "https://picsum.photos/400/300?random=6", alt: "Imagen 6" },
    ];

    const galleryImages = images || defaultImages;

    return (
        <div style={{ padding: "2rem", backgroundColor: "#f5f5f5" }}>
            <h2 style={{ fontSize: "2rem", marginBottom: "1rem", textAlign: "center" }}>
                {title} 🏝️ (Island Component)
            </h2>

            <p style={{ textAlign: "center", color: "#666", marginBottom: "2rem" }}>
                Este componente se hidrata solo cuando es visible
                {interactionCount > 0 && (
                    <span style={{ display: 'block', marginTop: '0.5rem', color: 'green', fontWeight: 'bold' }}>
                        ✅ Interacciones detectadas: {interactionCount}
                    </span>
                )}
            </p>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: "1rem",
                }}
            >
                {galleryImages.map((image, index) => (
                    <div
                        key={index}
                        style={{
                            cursor: "pointer",
                            overflow: "hidden",
                            borderRadius: "8px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                            transition: "transform 0.2s",
                        }}
                        onClick={() => {
                            console.log(`🖱️ Click detected on image ${index}`);
                            setInteractionCount(prev => prev + 1);
                            setSelectedImage(index);
                        }}
                        onMouseEnter={(e) => {
                            console.log(`🐭 Mouse enter on image ${index}`);
                            setInteractionCount(prev => prev + 1);
                            e.currentTarget.style.transform = "scale(1.05)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                        }}
                    >
                        <img
                            src={image.url}
                            alt={image.alt}
                            style={{
                                width: "100%",
                                height: "200px",
                                objectFit: "cover",
                                display: "block",
                            }}
                        />
                    </div>
                ))}
            </div>

            {selectedImage !== null && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.9)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                    }}
                    onClick={() => setSelectedImage(null)}
                >
                    <div style={{ position: "relative", maxWidth: "90%", maxHeight: "90%" }}>
                        <button
                            style={{
                                position: "absolute",
                                top: "-40px",
                                right: "0",
                                background: "white",
                                border: "none",
                                borderRadius: "50%",
                                width: "40px",
                                height: "40px",
                                fontSize: "24px",
                                cursor: "pointer",
                            }}
                            onClick={() => setSelectedImage(null)}
                        >
                            ×
                        </button>
                        <img
                            src={galleryImages[selectedImage].url}
                            alt={galleryImages[selectedImage].alt}
                            style={{
                                maxWidth: "100%",
                                maxHeight: "80vh",
                                objectFit: "contain",
                            }}
                        />
                    </div>
                </div>
            )}

            <div style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.9rem", color: "#999" }}>
                💡 Este componente tiene interactividad (hover, click) que solo funciona después de hidratarse
            </div>
        </div>
    );
}
