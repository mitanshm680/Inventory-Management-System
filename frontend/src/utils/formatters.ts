/**
 * Utility functions for formatting data in the UI
 */

/**
 * Format a number as currency
 * @param value - The number to format
 * @param currency - The currency symbol (default: $)
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number, currency: string = '$'): string => {
  return `${currency}${value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
};

/**
 * Format a date string to a human-readable format
 * @param dateString - ISO date string
 * @param includeTime - Whether to include time in the output
 * @returns Formatted date string
 */
export const formatDate = (dateString: string, includeTime: boolean = false): string => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime && { hour: '2-digit', minute: '2-digit' })
  };
  
  return new Intl.DateTimeFormat('en-US', options).format(date);
};

/**
 * Truncate text with ellipsis if it exceeds a certain length
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxLength: number = 50): string => {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

/**
 * Format a number with commas as thousands separators
 * @param value - The number to format
 * @returns Formatted number string
 */
export const formatNumber = (value: number): string => {
  if (value === null || value === undefined) return 'N/A';
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Capitalize the first letter of each word in a string
 * @param text - The text to capitalize
 * @returns Capitalized text
 */
export const capitalizeWords = (text: string): string => {
  if (!text) return '';
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Get a color based on a stock level compared to reorder point
 * @param quantity - Current quantity
 * @param reorderPoint - Reorder point
 * @returns Color indicator string
 */
export const getStockLevelColor = (quantity: number, reorderPoint: number): string => {
  if (quantity <= 0) return 'error.main';
  if (quantity <= reorderPoint) return 'warning.main';
  if (quantity <= reorderPoint * 2) return 'info.main';
  return 'success.main';
};

/**
 * Format file size in human-readable format
 * @param bytes - Size in bytes
 * @returns Formatted size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}; 