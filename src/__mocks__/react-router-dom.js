const reactRouterDom = jest.createMockFromModule('react-router-dom');

reactRouterDom.BrowserRouter = function BrowserRouter(props) {
  return props.children;
};

reactRouterDom.Link = function Link(props) {
  return props.children;
};

module.exports = reactRouterDom;