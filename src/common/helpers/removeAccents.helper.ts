/**
 * Function to remove Vietnamese accents from a string
 * @function
 * @param {string} str - The string from which to remove accents
 * @returns {string} - The string after removing accents
 */
function removeAccents(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD') // Normalize the string to Unicode Normalization Form D (NFD)
    .replace(/[\u0300-\u036f]/g, '') // Remove all combining diacritical marks
    .replace('đ', 'd') // Replace specific Vietnamese characters with their non-accented counterparts
    .replace('Đ', 'D'); // Replace specific Vietnamese characters with their non-accented counterparts
}

export default removeAccents;
