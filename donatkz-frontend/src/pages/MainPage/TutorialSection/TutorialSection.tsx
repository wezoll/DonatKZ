import React, { useState } from 'react';
import './TutorialSection.css';

const TutorialSection: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <section className="tutorial-section" id="tutorial">
      <div className="tutorial-container">
        <div className="tutorial-content">
          <h2 className="tutorial-title">Туториал</h2>
          <p className="tutorial-description">
            В этом видео-фрагменте подробно и наглядно рассказывается о том, как использовать приложение DonatKZ.
          </p>
        </div>

        <div className="video-preview">
          <div 
            className="video-preview-content"
            onClick={() => setIsPlaying(true)}
          >
            {!isPlaying ? (
              <>
                <div 
                  className="video-placeholder"
                  style={{
                    backgroundImage: 'linear-gradient(135deg, rgba(136, 183, 2, 0.2) 0%, rgba(0, 0, 0, 0.8) 100%)',
                  }}
                >
                  <button className="play-btn" aria-label="Play video">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                title="DonatKZ Tutorial"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ borderRadius: '8px' }}
              ></iframe>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TutorialSection;