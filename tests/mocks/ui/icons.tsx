import React from 'react';

// Create a generic icon component factory
const createIconComponent = (name: string) => {
  const IconComponent = ({ size = 24, className = '', ...props }: any) => {
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
  IconComponent.displayName = name;
  return IconComponent;
};

// Export all commonly used Lucide icons
export const AlertCircle = createIconComponent('AlertCircle');
export const Eye = createIconComponent('Eye');
export const Edit = createIconComponent('Edit');
export const Trash2 = createIconComponent('Trash2');
export const Search = createIconComponent('Search');
export const X = createIconComponent('X');
export const Plus = createIconComponent('Plus');
export const ChevronDown = createIconComponent('ChevronDown');
export const ChevronUp = createIconComponent('ChevronUp');
export const ChevronLeft = createIconComponent('ChevronLeft');
export const ChevronRight = createIconComponent('ChevronRight');
export const Menu = createIconComponent('Menu');
export const Settings = createIconComponent('Settings');
export const User = createIconComponent('User');
export const Home = createIconComponent('Home');
export const LogOut = createIconComponent('LogOut');
export const Check = createIconComponent('Check');
export const Bell = createIconComponent('Bell');
export const Calendar = createIconComponent('Calendar');
export const Clock = createIconComponent('Clock');
export const Filter = createIconComponent('Filter');
export const ArrowRight = createIconComponent('ArrowRight');
export const ArrowLeft = createIconComponent('ArrowLeft');
export const ArrowUp = createIconComponent('ArrowUp');
export const ArrowDown = createIconComponent('ArrowDown');
export const MoreHorizontal = createIconComponent('MoreHorizontal');
export const MoreVertical = createIconComponent('MoreVertical');
export const ExternalLink = createIconComponent('ExternalLink');
export const Download = createIconComponent('Download');
export const Upload = createIconComponent('Upload');
export const Save = createIconComponent('Save');
export const Loader = createIconComponent('Loader');
export const Info = createIconComponent('Info');

// Add a default export that returns a proxy to handle any icon request
export default new Proxy({}, {
  get: function(target, prop) {
    // If the property exists on the target, return it
    if (prop in target) {
      return target[prop as keyof typeof target];
    }

    // Otherwise create a new icon component
    return createIconComponent(prop.toString());
  }
});
