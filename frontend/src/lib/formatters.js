/**
 * @module lib/formatters
 * @description Shared time and date formatting utilities for CrossCrafted.
 */

/**
 * Format a date string into a human-readable relative time string.
 * Returns short abbreviations: "now", "5m", "2h", "3d", "1w".
 *
 * @param {string|Date} d - The date to format.
 * @returns {string} Relative time string, or empty string if falsy.
 */
export function timeAgo(d) {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return `${Math.floor(s / 604800)}w`;
}

/**
 * Format a date string into a readable time + optional day label.
 * Examples: "3:45 PM", "Yesterday 3:45 PM", "Mon 3:45 PM"
 *
 * @param {string|Date} d - The date to format.
 * @returns {string} Formatted time string.
 */
export function formatTime(d) {
  if (!d) return '';
  const date = new Date(d);
  const now = new Date();
  const diffDays = Math.floor((now - date) / 86400000);
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  if (diffDays === 0) return time;
  if (diffDays === 1) return `Yesterday ${time}`;
  if (diffDays < 7) return `${date.toLocaleDateString('en-US', { weekday: 'short' })} ${time}`;
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${time}`;
}

/**
 * Format a date string into a readable date.
 * Examples: "Jan 15", "Dec 25, 2024"
 *
 * @param {string|Date} d - The date to format.
 * @param {object} [options] - Intl.DateTimeFormat options overrides.
 * @returns {string} Formatted date string.
 */
export function formatDate(d, options) {
  if (!d) return '';
  const defaults = { month: 'short', day: 'numeric', year: 'numeric' };
  return new Date(d).toLocaleDateString('en-US', { ...defaults, ...options });
}