'use client';

const TOKEN_KEY = 'road-to-offer-edit-token';

export function getEditToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setEditToken(password) {
  localStorage.setItem(TOKEN_KEY, password);
}

export function clearEditToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// Verifies a password against the server by attempting a harmless POST
// (re-saving the same data). Returns true/false.
export async function verifyEditToken(password, currentDays) {
  const res = await fetch('/api/progress', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-edit-password': password,
    },
    body: JSON.stringify({ days: currentDays }),
  });
  return res.ok;
}
