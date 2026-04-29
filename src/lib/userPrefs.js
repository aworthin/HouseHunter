// src/lib/userPrefs.js
// Local storage utilities for per-device user preferences

const KEYS = {
  USER_NAME: 'hq_user_name',
  LAST_SEEN_ULID: 'hq_last_seen_ulid',
}

export function getUserName() {
  return localStorage.getItem(KEYS.USER_NAME) || null
}

export function setUserName(name) {
  localStorage.setItem(KEYS.USER_NAME, name.trim())
}

export function getLastSeenUlid() {
  return localStorage.getItem(KEYS.LAST_SEEN_ULID) || null
}

export function setLastSeenUlid(ulid) {
  localStorage.setItem(KEYS.LAST_SEEN_ULID, ulid)
}
