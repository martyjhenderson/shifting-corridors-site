import React from 'react';
import { useTheme } from '../utils/ThemeContext';

const Contact: React.FC = () => {
  const { currentTheme } = useTheme();
  


  return (
    <div className={`contact-container ${currentTheme.components.card}`}>
      <h2>Contact Information</h2>
      <div className="contact-content">
        <div className="contact-section">
          <h3>Shifting Corridors Lodge</h3>
          <p>Join us for tabletop gaming adventures!</p>
        </div>
        
        <div className="contact-section">
          <h4>Get In Touch</h4>
          <p>For additional information about our games, events, or to join our community, please reach out to us at:</p>
          <div className="contact-email-section">
            <a href="mailto:lodge@shiftingcorridor.com" className="contact-email">
              lodge@shiftingcorridor.com
            </a>
          </div>
        </div>

        <div className="contact-section">
          <h4>Game Times</h4>
          <p>Check our calendar for specific game times and dates.</p>
        </div>

        <div className="contact-section">
          <h4>New Players Welcome</h4>
          <p>Never played before? No problem! Our game masters are happy to help new players learn.</p>
        </div>
      </div>
    </div>
  );
};

export default Contact;