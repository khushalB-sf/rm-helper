export function validateUsername(username: string) {
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return "Username must be 3-20 characters, letters/numbers/underscore only.";
  }
  return null;
}

export function validateEmail(email: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Enter a valid email address.";
  }
  return null;
}

export function validatePassword(password: string) {
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must contain at least one letter and one number.";
  }
  return null;
}
