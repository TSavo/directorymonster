import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

/**
 * Options for rendering a component with a container/presentation pattern
 */
export interface RenderContainerOptions extends RenderOptions {
  /**
   * Mock props to pass to the container component
   */
  containerProps?: Record<string, any>;
  
  /**
   * Mock implementation for the presentation component
   */
  mockPresentation?: React.ComponentType<any>;
  
  /**
   * Whether to wrap the render in an act() call
   * @default true
   */
  wrapInAct?: boolean;
}

/**
 * Options for rendering a presentation component
 */
export interface RenderPresentationOptions extends RenderOptions {
  /**
   * Mock props to pass to the presentation component
   */
  presentationProps?: Record<string, any>;
  
  /**
   * Whether to wrap the render in an act() call
   * @default true
   */
  wrapInAct?: boolean;
}

/**
 * Renders a container component with a mocked presentation component
 * 
 * @param ContainerComponent The container component to render
 * @param options Render options
 * @returns The render result
 */
export function renderContainer(
  ContainerComponent: React.ComponentType<any>,
  options: RenderContainerOptions = {}
): RenderResult {
  const {
    containerProps = {},
    mockPresentation,
    wrapInAct = true,
    ...renderOptions
  } = options;
  
  // If a mock presentation component is provided, mock it
  if (mockPresentation) {
    jest.mock(
      ContainerComponent.name.replace('Container', 'Presentation'),
      () => mockPresentation
    );
  }
  
  // Render the container component
  const renderFn = () => render(
    <ContainerComponent {...containerProps} />,
    renderOptions
  );
  
  // Wrap in act if needed
  if (wrapInAct) {
    let result: RenderResult;
    act(() => {
      result = renderFn();
    });
    return result!;
  }
  
  return renderFn();
}

/**
 * Renders a presentation component with mock props
 * 
 * @param PresentationComponent The presentation component to render
 * @param options Render options
 * @returns The render result
 */
export function renderPresentation(
  PresentationComponent: React.ComponentType<any>,
  options: RenderPresentationOptions = {}
): RenderResult {
  const {
    presentationProps = {},
    wrapInAct = true,
    ...renderOptions
  } = options;
  
  // Render the presentation component
  const renderFn = () => render(
    <PresentationComponent {...presentationProps} />,
    renderOptions
  );
  
  // Wrap in act if needed
  if (wrapInAct) {
    let result: RenderResult;
    act(() => {
      result = renderFn();
    });
    return result!;
  }
  
  return renderFn();
}

/**
 * Creates a test wrapper for components that need context providers
 * 
 * @param providers Array of context providers to wrap the component with
 * @returns A wrapper component
 */
export function createTestWrapper(
  providers: Array<{
    Provider: React.ComponentType<any>;
    props?: Record<string, any>;
  }>
): React.ComponentType<{ children: React.ReactNode }> {
  return ({ children }: { children: React.ReactNode }) => {
    return providers.reduce(
      (acc, { Provider, props = {} }) => (
        <Provider {...props}>{acc}</Provider>
      ),
      children
    );
  };
}
