/**
 * Local storage utility for managing joined events history
 * Since there's no backend API to list events joined by a user,
 * we track joined event IDs locally in localStorage
 */

const STORAGE_KEY = 'joinedEventIds';

/**
 * Get list of joined event IDs from localStorage
 */
export function getJoinedEventIds(): number[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter(id => typeof id === 'number') : [];
  } catch (error) {
    console.error('Failed to parse joined event IDs:', error);
    return [];
  }
}

/**
 * Add an event ID to the joined events list
 */
export function addJoinedEventId(eventId: number): void {
  try {
    const existing = getJoinedEventIds();
    
    // Avoid duplicates
    if (existing.includes(eventId)) {
      return;
    }
    
    const updated = [...existing, eventId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save joined event ID:', error);
  }
}

/**
 * Remove an event ID from the joined events list
 */
export function removeJoinedEventId(eventId: number): void {
  try {
    const existing = getJoinedEventIds();
    const updated = existing.filter(id => id !== eventId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to remove joined event ID:', error);
  }
}

/**
 * Clear all joined event IDs
 */
export function clearJoinedEventIds(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear joined event IDs:', error);
  }
}
