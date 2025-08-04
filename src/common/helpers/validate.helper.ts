export function isEmail(email?: string) {
  if (!email) return false;
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}

export function isMongoId(id?: string) {
  if (!id) return false;
  const regex = /^[0-9a-fA-F]{24}$/;
  return regex.test(id);
}
export function isBusinessEmail(email?: string) {
  if (!email) return false;

  // Validate email format first
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;

  // List of common free email domains
  const freeEmailDomains = [
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "aol.com",
    "icloud.com",
    "mail.com",
    "protonmail.com",
    "zoho.com",
    "yandex.com",
    "gmx.com",
    "inbox.com",
    "live.com",
    "me.com",
    "msn.com",
    "googlemail.com",
  ];

  // Extract domain from email
  const domain = email.split("@")[1].toLowerCase();

  // If domain is in the free email list, it's not a business email
  return !freeEmailDomains.includes(domain);
}
