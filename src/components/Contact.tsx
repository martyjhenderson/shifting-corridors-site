import React from 'react';
import { useTheme } from '../utils/ThemeContext';
import styled from 'styled-components';

const StyledContactContainer = styled.div<{ theme: any }>`
  padding: 20px;
  background-color: ${props => props.theme.colors.background};
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  text-align: center;

  h2 {
    font-family: ${props => props.theme.fonts.heading};
    color: ${props => props.theme.colors.primary};
    margin-bottom: 15px;
  }

  .contact-info {
    font-family: ${props => props.theme.fonts.main};
    color: ${props => props.theme.colors.text};
    font-size: 1.1rem;
    line-height: 1.6;
  }

  .contact-link {
    display: inline-block;
    margin-top: 10px;
    padding: 8px 16px;
    background-color: ${props => props.theme.colors.accent};
    color: white;
    text-decoration: none;
    border-radius: 4px;
    font-weight: bold;
    transition: all 0.3s ease;
  }

  .contact-link:hover {
    background-color: ${props => props.theme.colors.secondary};
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  .email-link {
    color: ${props => props.theme.colors.accent};
    text-decoration: none;
    font-weight: bold;
    transition: color 0.3s ease;
  }

  .email-link:hover {
    color: ${props => props.theme.colors.secondary};
    text-decoration: underline;
  }
`;

const Contact: React.FC = () => {
  const { theme } = useTheme();

  return (
    <StyledContactContainer theme={theme}>
      <h2>Contact Us</h2>
      <div className="contact-info">
        <p>Have questions about our events or want to join our community?</p>
        <p>Join us on Discord:</p>
        <a href="https://discord.gg/X6gmXYVDJA" className="contact-link" target="_blank" rel="noopener noreferrer">
          Join Our Discord Server
        </a>
        <p style={{ marginTop: '20px' }}>Or reach us via email at <a href="mailto:lodge@shiftingcorridors.com" className="email-link">lodge@shiftingcorridors.com</a></p>
      </div>
    </StyledContactContainer>
  );
};

export default Contact;