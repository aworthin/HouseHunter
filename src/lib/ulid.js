// src/lib/ulid.js
// Simple ULID implementation - time-sortable unique IDs
// Format: 01ARZ3NDEKTSV4RRFFQ69G5FAV (26 chars, lexicographically sortable)

const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
const ENCODING_LEN = ENCODING.length
const TIME_LEN = 10
const RANDOM_LEN = 16

function encodeTime(now, len) {
  let str = ''
  for (let i = len - 1; i >= 0; i--) {
    str = ENCODING[now % ENCODING_LEN] + str
    now = Math.floor(now / ENCODING_LEN)
  }
  return str
}

function encodeRandom(len) {
  let str = ''
  for (let i = 0; i < len; i++) {
    str += ENCODING[Math.floor(Math.random() * ENCODING_LEN)]
  }
  return str
}

export function ulid() {
  return encodeTime(Date.now(), TIME_LEN) + encodeRandom(RANDOM_LEN)
}

export function ulidToDate(id) {
  // Extract timestamp from first 10 chars
  let time = 0
  for (let i = 0; i < TIME_LEN; i++) {
    time = time * ENCODING_LEN + ENCODING.indexOf(id[i])
  }
  return new Date(time)
}
