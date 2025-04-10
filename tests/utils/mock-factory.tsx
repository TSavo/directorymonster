import React from 'react';

/**
 * Creates a mock component with the given name and props
 * 
 * @param name The name of the component
 * @param defaultProps Default props to merge with the provided props
 * @returns A mocked React component
 */
export function createMockComponent(name: string, defaultProps: Record<string, any> = {}) {
  const MockComponent = (props: any) => {
    const mergedProps = { ...defaultProps, ...props };
    return (
      <div data-testid={`mock-${name.toLowerCase()}`} {...mergedProps}>
        {props.children}
      </div>
    );
  };
  
  MockComponent.displayName = `Mock${name}`;
  return MockComponent;
}

/**
 * Creates a mock icon component
 * 
 * @param name The name of the icon
 * @returns A mocked icon component
 */
export function createMockIcon(name: string) {
  const MockIcon = ({ size = 24, className = '', ...props }: any) => {
    return (
      <svg
        data-testid={`${name.toLowerCase()}-icon`}
        className={className}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <rect width="24" height="24" fill="none" stroke="none" />
      </svg>
    );
  };
  
  MockIcon.displayName = name;
  return MockIcon;
}

/**
 * Creates a mock hook that returns the provided values
 * 
 * @param returnValue The value to return from the hook
 * @returns A mocked hook function
 */
export function createMockHook<T>(returnValue: T): jest.Mock<T> {
  return jest.fn().mockReturnValue(returnValue);
}

/**
 * Creates a mock context provider
 * 
 * @param name The name of the context provider
 * @param defaultValue The default value for the context
 * @returns A mocked context provider component
 */
export function createMockContextProvider(name: string, defaultValue: any = {}) {
  const MockProvider = ({ children, value = defaultValue }: { children: React.ReactNode, value?: any }) => {
    return (
      <div data-testid={`mock-${name.toLowerCase()}-provider`}>
        {children}
      </div>
    );
  };
  
  MockProvider.displayName = `Mock${name}Provider`;
  return MockProvider;
}

/**
 * Creates a mock for Next.js Link component
 * 
 * @returns A mocked Next.js Link component
 */
export function createMockNextLink() {
  const MockLink = ({ href, children, ...props }: { href: string, children: React.ReactNode }) => {
    return (
      <a href={href} data-testid="mock-next-link" {...props}>
        {children}
      </a>
    );
  };
  
  MockLink.displayName = 'MockNextLink';
  return MockLink;
}

/**
 * Creates a mock for Next.js Image component
 * 
 * @returns A mocked Next.js Image component
 */
export function createMockNextImage() {
  const MockImage = ({ src, alt, width, height, ...props }: { src: string, alt: string, width: number, height: number }) => {
    return (
      <img 
        src={src} 
        alt={alt} 
        width={width} 
        height={height} 
        data-testid="mock-next-image" 
        {...props} 
      />
    );
  };
  
  MockImage.displayName = 'MockNextImage';
  return MockImage;
}

/**
 * Creates a mock for Next.js Router
 * 
 * @param initialPath The initial path for the router
 * @returns A mocked Next.js router object
 */
export function createMockRouter(initialPath: string = '/') {
  return {
    pathname: initialPath,
    route: initialPath,
    query: {},
    asPath: initialPath,
    push: jest.fn().mockResolvedValue(true),
    replace: jest.fn().mockResolvedValue(true),
    reload: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn().mockResolvedValue(undefined),
    beforePopState: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
    isFallback: false,
  };
}
