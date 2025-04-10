// React 18 setup for testing
const React = require('react');
const ReactDOM = require('react-dom');
const { createRoot } = require('react-dom/client');

// Ensure we're using React 18 APIs
global.React = React;
global.ReactDOM = ReactDOM;

// Override render and unmount methods to use React 18's createRoot
const originalRender = ReactDOM.render;
const originalUnmount = ReactDOM.unmountComponentAtNode;

// Store created roots for cleanup
const rootsMap = new Map();

// Override render to use createRoot
ReactDOM.render = (element, container, callback) => {
  if (!rootsMap.has(container)) {
    const root = createRoot(container);
    rootsMap.set(container, root);
  }
  
  const root = rootsMap.get(container);
  root.render(element);
  
  // Call the callback if provided
  if (typeof callback === 'function') {
    callback();
  }
  
  return null;
};

// Override unmountComponentAtNode to use root.unmount
ReactDOM.unmountComponentAtNode = (container) => {
  const root = rootsMap.get(container);
  
  if (root) {
    root.unmount();
    rootsMap.delete(container);
    return true;
  }
  
  return false;
};

// Export the original methods for reference
module.exports = {
  originalRender,
  originalUnmount,
  createRoot
};
