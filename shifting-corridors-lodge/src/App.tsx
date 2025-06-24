import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import { ThemeProvider, useTheme } from './utils/ThemeContext';
import CalendarComponent from './components/Calendar';
import GameMasters from './components/GameMasters';
import Contact from './components/Contact';
import News from './components/News';
import EventDetails from './components/EventDetails';
import './App.css';

const GlobalStyle = createGlobalStyle<{ theme: any }>`
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Lora:wght@400;700&family=Orbitron:wght@400;700&family=Roboto:wght@400;700&display=swap');
  
  body {
    margin: 0;
    padding: 0;
    background-color: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text};
    font-family: ${props => props.theme.fonts.main};
    transition: all 0.3s ease;
  }
`;

const AppContainer = styled.div<{ theme: any }>`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const Header = styled.header<{ theme: any }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  margin-bottom: 30px;
  border-bottom: 2px solid ${props => props.theme.colors.accent};
`;

const Title = styled.h1<{ theme: any }>`
  font-family: ${props => props.theme.fonts.heading};
  color: ${props => props.theme.colors.primary};
  margin: 0;
  font-size: 2.5rem;
`;

const ThemeToggleButton = styled.button<{ theme: any }>`
  background-color: ${props => props.theme.colors.secondary};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 15px;
  font-family: ${props => props.theme.fonts.main};
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: ${props => props.theme.colors.accent};
    transform: translateY(-2px);
  }
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;

  @media (min-width: 768px) {
    grid-template-columns: 2fr 1fr;
  }
`;

const MainContent = styled.main`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Sidebar = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const AppContent: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <GlobalStyle theme={theme} />
      <AppContainer theme={theme}>
        <Header theme={theme}>
          <Title theme={theme}>Shifting Corridors Lodge</Title>
          <ThemeToggleButton 
            theme={theme} 
            onClick={toggleTheme}
          >
            Switch to {theme.name === 'medieval' ? 'Sci-Fi' : 'Medieval'} Theme
          </ThemeToggleButton>
        </Header>

        <Routes>
          <Route path="/events/:eventId" element={
            <EventDetails />
          } />
          <Route path="/" element={
            <MainGrid>
              <MainContent>
                <CalendarComponent />
                <News />
              </MainContent>
              <Sidebar>
                <GameMasters />
                <Contact />
              </Sidebar>
            </MainGrid>
          } />
        </Routes>
      </AppContainer>
    </>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
};

export default App;