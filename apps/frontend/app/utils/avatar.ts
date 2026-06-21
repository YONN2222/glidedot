export const getAvatarColor = (_username?: string | null): string => {
  return '#e5e5e5'; // Always gray
}

export const getAvatarText = (_username?: string | null): string => {
  if (!_username) return '?';
  return _username.charAt(0).toUpperCase();
}
