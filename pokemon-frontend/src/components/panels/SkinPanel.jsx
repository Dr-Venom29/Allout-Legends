import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import './SkinPanel.css';

export default function SkinPanel({ title = 'ALLOUT LEGENDS', quantity = 8, onVaultReach }) {
  const containerRef = useRef(null);
  const cardsRef = useRef([]);
  const [selectedSkin, setSelectedSkin] = useState(null);

  const [flippedCards, setFlippedCards] = useState(new Set());

  const handleFlip = (idx, e) => {
    e.stopPropagation(); // Prevent select/unlock when flipping
    setFlippedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(idx)) {
        newSet.delete(idx);
      } else {
        newSet.add(idx);
      }
      return newSet;
    });
  };

  const getBackImage = (rarity) => {
    return new URL(`./images/${rarity}.png`, import.meta.url).href;
  };

  const images = Array.from({ length: quantity }, (_, i) => {
    const index = i + 1;
    return new URL(`./images/dragon_${index}.png`, import.meta.url).href;
  });

  const rarities = ['Legendary', 'Epic', 'Rare', 'Epic', 'Rare', 'Legendary', 'Rare', 'Epic'];
  const skinNames = [
    'Infernal Drake', 'Void Walker', 'Storm Caller', 'Frost Wyrm',
    'Earth Shaker', 'Celestial Dragon', 'Shadow Fang', 'Blood Wing'
  ];

  useEffect(() => {
    // Initial Staggered Entrance
    gsap.fromTo(cardsRef.current, 
      { opacity: 0, y: 30, scale: 0.95 },
      { 
        opacity: 1, 
        y: 0, 
        scale: 1, 
        duration: 0.6, 
        stagger: 0.1, 
        ease: "power2.out",
        clearProps: "all" 
      }
    );

    // Subtle Parallax Tilt Effect
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (isMobile) return;

    cardsRef.current.forEach((card) => {
      if (!card) return;
      
      const tiltLayer = card.querySelector(".skin-card-tilt");
      if (!tiltLayer) return;

      const xTo = gsap.quickTo(tiltLayer, "rotationY", { duration: 0.4, ease: "power2.out" });
      const yTo = gsap.quickTo(tiltLayer, "rotationX", { duration: 0.4, ease: "power2.out" });

      const handleMouseMove = (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        // Max rotation 2.5 degrees (Subtle = premium)
        xTo(x * 5); 
        yTo(-y * 5); 
      };

      const handleMouseLeave = () => {
        xTo(0);
        yTo(0);
      };

      card.addEventListener("mousemove", handleMouseMove);
      card.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        card.removeEventListener("mousemove", handleMouseMove);
        card.removeEventListener("mouseleave", handleMouseLeave);
      };
    });
  }, []);

  const handleScroll = (e) => {
    if (onVaultReach) {
      // The banner is 100vh, so if we scroll past ~40% of the screen height, 
      // the Appearance Vault is coming into view.
      onVaultReach(e.target.scrollTop > window.innerHeight * 0.4);
    }
  };

  return (
    <div className="skin-panel-container" onScroll={handleScroll}>
      <div className="banner">
        <div className="slider" style={{ ['--quantity']: String(quantity) }}>
          {images.map((src, idx) => (
            <div className="item" key={idx} style={{ ['--position']: String(idx + 1) }}>
              <img src={src} alt={`dragon ${idx + 1}`} />
            </div>
          ))}
        </div>

        <div className="content">
          <h1 data-content={title}>{title}</h1>
          <div className="model" />
        </div>
      </div>

      <section className="skin-gallery" ref={containerRef}>
        <div className="gallery-header">
          <h2>Appearance Vault</h2>
          <p>Customize your trainers with unique skins</p>
        </div>
        <div className="gallery-grid">
          {images.map((src, idx) => {
            const isSelected = selectedSkin === idx;
            const isFlipped = flippedCards.has(idx);
            const rarityClass = rarities[idx].toLowerCase();
            
            return (
              <div 
                className={`skin-card ${isSelected ? 'selected' : ''}`} 
                key={`skin-${idx}`}
                ref={el => cardsRef.current[idx] = el}
              >
                <div className="skin-card-tilt">
                  <div 
                    className={`skin-card-inner ${isFlipped ? 'is-flipped' : ''}`}
                    onClick={(e) => handleFlip(idx, e)}
                  >
                    {/* FRONT SIDE */}
                    <div className={`skin-card-front rarity-shadow-${rarityClass}`}>
                      <img src={src} alt={`Dragon Skin ${idx + 1}`} className="skin-image" />
                      
                      <div className="visually-hidden">
                        <h3>{skinNames[idx]}</h3>
                        <p>Dragon Class</p>
                      </div>
                      
                      <button 
                        className="unlock-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSkin(idx);
                        }}
                      >
                        <span>{isSelected ? 'Unlocked' : 'Unlock Skin'}</span>
                      </button>
                    </div>

                    {/* BACK SIDE */}
                    <div className={`skin-card-back rarity-back-glow-${rarityClass}`}>
                      <img src={getBackImage(rarityClass)} alt={`${rarities[idx]} Card Back`} className="skin-back-image" />
                      <div className="back-glow-layer"></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
