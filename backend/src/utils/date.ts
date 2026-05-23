/**
 * Timezone-safe Date utilities for the AI-Powered Intern Management System
 */

/**
 * Normalizes any date input (string or Date) to a UTC midnight Date object
 * representing the correct local calendar day, immune to server/client timezone shifts.
 */
export function normalizeToUtcMidnight(dateInput?: Date | string): Date {
  if (!dateInput) {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
  }

  if (typeof dateInput === 'string') {
    const match = dateInput.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
    if (match) {
      const [_, year, month, day] = match;
      return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
    }
  }

  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  
  // If it is already a UTC midnight date (like from DB), use UTC components
  if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0 && d.getUTCMilliseconds() === 0) {
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
  } else {
    // Otherwise, use local components
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
  }
}
