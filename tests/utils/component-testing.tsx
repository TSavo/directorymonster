import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { act } from 'react-dom/test-utils';

/**
 * Options for rendering a component with a container/presentation pattern
 */
export interface RenderWithContainerOptions extends RenderOptions {
  /**
   * Mock props to pass to the presentation component
   */
  mockPresentationProps?: Record<string, any>;
  
  /**
   * Mock props to pass to the container component
   */
  mockContainerProps?: Record<string, any>;
  
  /**
   * Whether to wrap the render in an act() call
   * @default true
   */
  wrapInAct?: boolean;
}

/**
 * Renders a component with a container/presentation pattern
 * 
 * @param ContainerComponent The container component to render
 * @param PresentationComponent The presentation component that will be mocked
 * @param options Render options
 * @returns The render result
 */
export function renderWithContainerPattern<
  ContainerProps extends Record<string, any>,
  PresentationProps extends Record<string, any>
>(
  ContainerComponent: React.ComponentType<ContainerProps>,
  PresentationComponent: React.ComponentType<PresentationProps>,
  options: RenderWithContainerOptions = {}
): RenderResult {
  const {
    mockPresentationProps = {},
    mockContainerProps = {},
    wrapInAct = true,
    ...renderOptions
  } = options;
  
  // Create a mock for the presentation component
  const MockedPresentationComponent = jest.fn(
    (props: PresentationProps) => {
      // Merge the mock props with the actual props
      const mergedProps = { ...props, ...mockPresentationProps };
      return <div data-testid="mocked-presentation" {...mergedProps} />;
    }
  );
  
  // Mock the presentation component
  jest.mock(PresentationComponent, () => MockedPresentationComponent);
  
  // Render the container component
  const renderFn = () => render(
    <ContainerComponent {...mockContainerProps as ContainerProps} />,
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
 * @param mockProps Mock props to pass to the component
 * @param options Render options
 * @returns The render result
 */
export function renderPresentation<Props extends Record<string, any>>(
  PresentationComponent: React.ComponentType<Props>,
  mockProps: Partial<Props> = {},
  options: RenderOptions = {}
): RenderResult {
  const renderFn = () => render(
    <PresentationComponent {...mockProps as Props} />,
    options
  );
  
  let result: RenderResult;
  act(() => {
    result = renderFn();
  });
  return result!;
}

/**
 * Creates a mock for a hook that returns the provided values
 * 
 * @param returnValue The value to return from the hook
 * @returns A mocked hook function
 */
export function createMockHook<T>(returnValue: T): jest.Mock<T> {
  return jest.fn().mockReturnValue(returnValue);
}
