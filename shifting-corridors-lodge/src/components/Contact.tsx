import React from 'react';
import { useTheme } from '../utils/ThemeContext';

const Contact: React.FC = () => {
  const { currentTheme } = useTheme();

  return (
    <div className={`contact-container ${currentTheme.components.card}`}>
      <h2>Contact Us</h2>
      <div className="contact-info">
        <p>Have questions about our events or want to join our community?</p>
        <p>Reach out to us at:</p>
        <a href="mailto:lodge@shiftingcorridor.com" className="contact-email">
          lodge@shiftingcorridor.com
        </a>
      </div>
    </div>
  );
};

export default Contact;