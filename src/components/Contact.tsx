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
      </div>
    </StyledContactContainer>
  );
};

export default Contact;