export const validatePasswordStrength = (password: string): string | null => {
  const isLengthValid = password.length >= 12;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (!isLengthValid || !hasUpper || !hasLower || !hasSpecial) {
    return 'Password must be at least 12 characters long and contain at least one uppercase letter, one lowercase letter, and one special character.';
  }
  
  return null;
}
