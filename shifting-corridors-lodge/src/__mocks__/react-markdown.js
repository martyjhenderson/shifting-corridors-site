import React from 'react';

const ReactMarkdown = ({ children }) => {
  return React.createElement('div', { 'data-testid': 'markdown-content' }, children);
};

export default ReactMarkdown;