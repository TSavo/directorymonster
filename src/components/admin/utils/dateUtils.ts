/**
 * Formats a date string or Date object into a localized, readable format
 * @param dateInput Date string or Date object
 * @returns Formatted date string
 */
export const formatDate = (dateInput: string | Date | undefined): string => {
  if (!dateInput) return 'N/A';
  
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  // Check if date is valid
  if (isNaN(date.getTime())) return 'Invalid date';
  
  // Format options for date display
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return new Intl.DateTimeFormat('en-US', options).format(date);
};

/**
 * Returns a relative time string (e.g., "2 hours ago", "3 days ago")
 * @param dateInput Date string or Date object
 * @returns Relative time string
 */
export const getRelativeTime = (dateInput: string | Date | undefined): string => {
  if (!dateInput) return 'N/A';
  
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  // Check if date is valid
  if (isNaN(date.getTime())) return 'Invalid date';
  
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  
  if (diffMinutes < 1) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays < 30) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else {
    return formatDate(date);
  }
};

/**
 * Returns a short date format (MM/DD/YYYY)
 * @param dateInput Date string or Date object
 * @returns Short date string
 */
export const getShortDate = (dateInput: string | Date | undefined): string => {
  if (!dateInput) return 'N/A';
  
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  // Check if date is valid
  if (isNaN(date.getTime())) return 'Invalid date';
  
  return date.toLocaleDateString('en-US');
};
