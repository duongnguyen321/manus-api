export default function timer(time: string): number {
  // Trim whitespace and convert to lowercase for easier parsing
  const trimmedTime = time.trim().toLowerCase();

  // Regular expression to match the number and unit
  const timePattern =
    /^(\d+)\s*(seconds?|minutes?|hours?|days?|months?|years?)$/;
  const match = trimmedTime.match(timePattern);

  if (!match) {
    throw new Error('Invalid time format');
  }

  const quantity = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 'second':
    case 'seconds':
      return quantity;
    case 'minute':
    case 'minutes':
      return quantity * 60;
    case 'hour':
    case 'hours':
      return quantity * 60 * 60;
    case 'day':
    case 'days':
      return quantity * 60 * 60 * 24;
    case 'month':
    case 'months':
      return quantity * 60 * 60 * 24 * 30; // Approximation, considering a month as 30 days
    case 'year':
    case 'years':
      return quantity * 60 * 60 * 24 * 365; // Approximation, considering a year as 365 days
    default:
      throw new Error('Invalid time unit');
  }
}
