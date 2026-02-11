import React from 'react';
import styled from 'styled-components';
import { useTheme } from '../utils/ThemeContext';

const AboutContainer = styled.section<{ theme: any }>`
  background-color: ${props => props.theme.colors.background};
  border: 2px solid ${props => props.theme.colors.accent};
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const Title = styled.h2<{ theme: any }>`
  font-family: ${props => props.theme.fonts.heading};
  color: ${props => props.theme.colors.primary};
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 1.8em;
`;

const Content = styled.div<{ theme: any }>`
  font-family: ${props => props.theme.fonts.main};
  color: ${props => props.theme.colors.text};
  line-height: 1.6;
  
  p {
    margin-bottom: 15px;
  }
  
  a {
    color: ${props => props.theme.colors.secondary};
    text-decoration: none;
    font-weight: bold;
    transition: color 0.3s ease;
    
    &:hover {
      color: ${props => props.theme.colors.accent};
      text-decoration: underline;
    }
  }
`;

const StoreList = styled.ul<{ theme: any }>`
  list-style: none;
  padding: 0;
  margin: 15px 0;
  
  li {
    margin-bottom: 12px;
    padding-left: 20px;
    position: relative;
    
    &:before {
      content: "▸";
      position: absolute;
      left: 0;
      color: ${props => props.theme.colors.accent};
      font-weight: bold;
    }
  }
  
  .store-name {
    font-weight: bold;
    color: ${props => props.theme.colors.secondary};
  }
  
  .store-details {
    display: block;
    margin-top: 4px;
    font-size: 0.95em;
    opacity: 0.9;
  }
  
  .coming-soon {
    color: ${props => props.theme.colors.accent};
    font-style: italic;
  }
`;

const About: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <AboutContainer theme={theme}>
      <Title theme={theme}>What is Shifting Corridors?</Title>
      <Content theme={theme}>
        <p>
          Shifting Corridors is a Lodge of Paizo Organized Play for Pathfinder and Starfinder games 
          in the Eastern Iowa area. Games are played at multiple stores across the area as well as 
          local conventions.
        </p>
        <p>
          Paizo Organized Play is a way to play Pathfinder and Starfinder so that you can take your 
          character between stores, Lodges, and conventions with standard rules. We can help you get 
          started, or you can learn more at:
        </p>
        <p>
          <a 
            href="https://lorespire.paizo.com/tiki-index.php?page=Guide-to-Organized-Play:-Pathfinder-Society---Second-Edition#Welcome_to_Pathfinder_Society" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            Pathfinder Society Guide
          </a>
          {' | '}
          <a 
            href="https://lorespire.paizo.com/tiki-index.php?page=Guide-to-Organized-Play:-Starfinder-Society---Second-Edition#Welcome_to_Starfinder_Society" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            Starfinder Society Guide
          </a>
        </p>
        <p>
          Our Venture Officers are glad to help at each store or throughout the area.
        </p>
        
        <p>
          <strong>Where We Play:</strong>
        </p>
        <StoreList theme={theme}>
          <li>
            <a href="https://tempestgames.net" target="_blank" rel="noopener noreferrer" className="store-name">
              Tempest Games
            </a>
            <span className="store-details">Cedar Rapids, IA - 1st and 3rd Thursdays</span>
          </li>
          <li>
            <a href="https://diversionsic.com/" target="_blank" rel="noopener noreferrer" className="store-name">
              Diversions Game Lounge
            </a>
            <span className="store-details">Coralville, IA - 2nd and 4th Wednesdays</span>
          </li>
          <li>
            <a href="https://www.geek-city.com/" target="_blank" rel="noopener noreferrer" className="store-name">
              Geek City Games
            </a>
            <span className="store-details">North Liberty, IA - 1st and 3rd Sundays</span>
          </li>
          <li>
            <a href="https://www.replaycr.com/" target="_blank" rel="noopener noreferrer" className="store-name">
              Replay Games
            </a>
            <span className="store-details">Cedar Rapids, IA - <span className="coming-soon">Coming Soon!</span></span>
          </li>
        </StoreList>
      </Content>
    </AboutContainer>
  );
};

export default About;
