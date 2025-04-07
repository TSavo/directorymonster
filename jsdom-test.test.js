// Simple test to verify that jsdom is working
test('jsdom environment is working', () => {
  expect(typeof window).toBe('object');
  expect(typeof document).toBe('object');
  expect(typeof document.createElement).toBe('function');
  
  // Create a simple element
  const div = document.createElement('div');
  div.innerHTML = 'Test';
  document.body.appendChild(div);
  
  // Verify that the element was created
  expect(document.body.innerHTML).toContain('Test');
});
