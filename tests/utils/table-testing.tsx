import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';

/**
 * Options for rendering a table component
 */
export interface TableRenderOptions extends RenderOptions {
  /**
   * Whether to wrap the component in a table
   * @default true
   */
  wrapInTable?: boolean;
  
  /**
   * Whether to wrap the component in a table row
   * @default true
   */
  wrapInRow?: boolean;
}

/**
 * Renders a table cell component properly wrapped in a table structure
 * to avoid DOM nesting warnings
 * 
 * @param Component The component to render
 * @param props Props to pass to the component
 * @param options Render options
 * @returns The render result
 */
export function renderTableCell<P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  props: P,
  options: TableRenderOptions = {}
): RenderResult {
  const {
    wrapInTable = true,
    wrapInRow = true,
    ...renderOptions
  } = options;
  
  // If we don't need to wrap in a table or row, just render the component
  if (!wrapInTable && !wrapInRow) {
    return render(<Component {...props} />, renderOptions);
  }
  
  // If we only need to wrap in a row, render the component in a row
  if (!wrapInTable && wrapInRow) {
    return render(<tr><Component {...props} /></tr>, renderOptions);
  }
  
  // If we need to wrap in a table but not a row, render the component in a table
  if (wrapInTable && !wrapInRow) {
    return render(
      <table>
        <tbody>
          <Component {...props} />
        </tbody>
      </table>,
      renderOptions
    );
  }
  
  // Otherwise, wrap in both a table and a row
  return render(
    <table>
      <tbody>
        <tr>
          <Component {...props} />
        </tr>
      </tbody>
    </table>,
    renderOptions
  );
}

/**
 * Renders a table row component properly wrapped in a table structure
 * to avoid DOM nesting warnings
 * 
 * @param Component The component to render
 * @param props Props to pass to the component
 * @param options Render options
 * @returns The render result
 */
export function renderTableRow<P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  props: P,
  options: TableRenderOptions = {}
): RenderResult {
  const {
    wrapInTable = true,
    ...renderOptions
  } = options;
  
  // If we don't need to wrap in a table, just render the component
  if (!wrapInTable) {
    return render(<Component {...props} />, renderOptions);
  }
  
  // Otherwise, wrap in a table
  return render(
    <table>
      <tbody>
        <Component {...props} />
      </tbody>
    </table>,
    renderOptions
  );
}

/**
 * Renders a table component properly
 * 
 * @param Component The component to render
 * @param props Props to pass to the component
 * @param options Render options
 * @returns The render result
 */
export function renderTable<P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  props: P,
  options: RenderOptions = {}
): RenderResult {
  return render(<Component {...props} />, options);
}
