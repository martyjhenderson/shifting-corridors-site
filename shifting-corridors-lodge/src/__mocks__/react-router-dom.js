const React = require('react');
const reactRouterDom = jest.createMockFromModule('react-router-dom');

reactRouterDom.BrowserRouter = function BrowserRouter(props) {
  return React.createElement('div', null, props.children);
};

reactRouterDom.MemoryRouter = function MemoryRouter(props) {
  return React.createElement('div', null, props.children);
};

reactRouterDom.Routes = function Routes(props) {
  return React.createElement('div', null, props.children);
};

reactRouterDom.Route = function Route(props) {
  return React.createElement('div', { 'data-testid': 'route' }, props.element || null);
};

reactRouterDom.Navigate = function Navigate(props) {
  return React.createElement('div', { 'data-testid': 'navigate' }, 'Navigate to ' + props.to);
};

reactRouterDom.Link = function Link(props) {
  return React.createElement('a', { href: props.to }, props.children);
};

// Create a stable mock that always returns a valid location object
const mockLocation = {
  pathname: '/',
  search: '',
  hash: '',
  state: null,
  key: 'default'
};

reactRouterDom.useLocation = jest.fn(() => mockLocation);

reactRouterDom.useNavigate = jest.fn().mockReturnValue(jest.fn());

reactRouterDom.useParams = jest.fn(() => ({ eventId: 'test-event-id' }));

module.exports = reactRouterDom;