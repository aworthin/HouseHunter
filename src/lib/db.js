// src/lib/db.js
import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, limit, serverTimestamp, getDocs, where
} from 'firebase/firestore'
import { db } from './firebase'
import { ulid } from './ulid'
import { getUserName } from './userPrefs'

const HOUSES_COL = 'houses'
const HISTORY_COL = 'history'

// ─── Status constants ───────────────────────────────────────────────
export const STATUS = {
  NEW: 'new',
  REVIEWED: 'reviewed',
  READY_TO_TOUR: 'ready_to_tour',
  TOURED: 'toured',
  REJECTED: 'rejected',
  SOLD: 'sold',
}

export const STATUS_LABELS = {
  new: 'New',
  reviewed: 'Reviewed',
  ready_to_tour: 'Ready to Tour',
  toured: 'Toured',
  rejected: 'Rejected',
  sold: 'Sold',
}

// ─── Houses ─────────────────────────────────────────────────────────

export function subscribeToHouses(callback) {
  const q = query(collection(db, HOUSES_COL), orderBy('addedAt', 'desc'))
  return onSnapshot(q, (snap) => {
    const houses = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(houses)
  })
}

export async function addHouse(data) {
  const ref = await addDoc(collection(db, HOUSES_COL), {
    ...data,
    status: STATUS.NEW,
    rank: null,
    addedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    zillowLastChecked: serverTimestamp(),
  })
  await addHistory({
    houseId: ref.id,
    address: data.address,
    event: 'added',
    toStatus: STATUS.NEW,
  })
  return ref
}

export async function updateHouse(id, data) {
  return updateDoc(doc(db, HOUSES_COL, id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function changeStatus(house, newStatus, note) {
  const oldStatus = house.status
  await updateDoc(doc(db, HOUSES_COL, house.id), {
    status: newStatus,
    updatedAt: serverTimestamp(),
    ...(newStatus !== STATUS.TOURED && oldStatus === STATUS.TOURED ? { rank: null } : {}),
    // Save previous status when marking sold so we can restore it later
    ...(newStatus === STATUS.SOLD ? { previousStatus: oldStatus } : {}),
    // Clear previousStatus when restoring from sold
    ...(oldStatus === STATUS.SOLD && newStatus !== STATUS.SOLD ? { previousStatus: null } : {}),
  })
  await addHistory({
    houseId: house.id,
    address: house.address,
    event: 'status_changed',
    fromStatus: oldStatus,
    toStatus: newStatus,
    note: note || null,
  })
}

export async function deleteHouse(house) {
  await deleteDoc(doc(db, HOUSES_COL, house.id))
  await addHistory({
    houseId: house.id,
    address: house.address,
    event: 'deleted',
    fromStatus: house.status,
  })
}

export async function updateRanks(rankedIds) {
  const updates = rankedIds.map((id, index) =>
    updateDoc(doc(db, HOUSES_COL, id), {
      rank: index + 1,
      updatedAt: serverTimestamp(),
    })
  )
  await Promise.all(updates)
  await addHistory({
    houseId: null,
    address: null,
    event: 'ranked',
    note: `Rankings updated for ${rankedIds.length} houses`,
  })
}

export async function markZillowChecked(id, isSold) {
  const updates = { zillowLastChecked: serverTimestamp() }
  if (isSold) {
    updates.previousStatus = isSold.previousStatus || null
    updates.status = STATUS.SOLD
    updates.updatedAt = serverTimestamp()
    updates.soldDetectedAt = serverTimestamp()
  }
  await updateDoc(doc(db, HOUSES_COL, id), updates)
}

export async function findHouseByZpid(zpid) {
  const q = query(collection(db, HOUSES_COL), where('zpid', '==', String(zpid)))
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { id: snap.docs[0].id, ...snap.docs[0].data() }
}

// ─── History ─────────────────────────────────────────────────────────

export async function addHistory({ houseId, address, event, fromStatus, toStatus, note }) {
  const id = ulid()
  const userName = getUserName() || 'Unknown'
  await setDoc(doc(db, HISTORY_COL, id), {
    id,
    houseId: houseId || null,
    address: address || null,
    event,
    fromStatus: fromStatus || null,
    toStatus: toStatus || null,
    note: note || null,
    userName,
    timestamp: serverTimestamp(),
  })
  return id
}

export async function getPreviousStatusFromHistory(houseId) {
  // Query history for this house, find the last status_changed event before sold
  const q = query(
    collection(db, HISTORY_COL),
    where('houseId', '==', houseId),
    orderBy('id', 'desc'),
    limit(20)
  )
  const snap = await getDocs(q)
  const events = snap.docs.map(d => d.data())
  // Find the most recent status_changed event where toStatus is not sold
  const lastNonSold = events.find(e =>
    e.event === 'status_changed' &&
    e.toStatus !== STATUS.SOLD &&
    e.toStatus != null
  )
  return lastNonSold?.toStatus || null
}

export function subscribeToHistory(callback, limitCount) {
  const q = query(
    collection(db, HISTORY_COL),
    orderBy('id', 'desc'),
    limit(limitCount || 200)
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ ...d.data() })))
  })
}

export function subscribeToLatestHistoryId(callback) {
  const q = query(collection(db, HISTORY_COL), orderBy('id', 'desc'), limit(1))
  return onSnapshot(q, (snap) => {
    callback(snap.empty ? null : snap.docs[0].data().id)
  })
}

// ─── Tour ─────────────────────────────────────────────────────────────

export async function startTour(house) {
  const newStatus = house.status === STATUS.READY_TO_TOUR ? STATUS.READY_TO_TOUR : STATUS.READY_TO_TOUR
  const updates = {
    tourStartedAt: serverTimestamp(),
    tourData: house.tourData || {},
    status: STATUS.READY_TO_TOUR,
    updatedAt: serverTimestamp(),
  }
  await updateDoc(doc(db, HOUSES_COL, house.id), updates)
  await addHistory({
    houseId: house.id,
    address: house.address,
    event: 'toured',
    fromStatus: house.status,
    toStatus: STATUS.READY_TO_TOUR,
    note: 'Tour started',
  })
}

export async function saveRoomAnswers(houseId, roomId, answers) {
  await updateDoc(doc(db, HOUSES_COL, houseId), {
    [`tourData.${roomId}`]: { answers, savedAt: new Date().toISOString() },
    updatedAt: serverTimestamp(),
  })
}

export async function completeTour(house) {
  await updateDoc(doc(db, HOUSES_COL, house.id), {
    tourCompletedAt: serverTimestamp(),
    status: STATUS.TOURED,
    rank: house.rank || null,
    updatedAt: serverTimestamp(),
  })
  await addHistory({
    houseId: house.id,
    address: house.address,
    event: 'status_changed',
    fromStatus: STATUS.REVIEWED,
    toStatus: STATUS.TOURED,
    note: 'Tour completed',
  })
}

// ─── Items ────────────────────────────────────────────────────────────

const ITEMS_COL = 'items'

export function subscribeToItems(callback) {
  const q = query(collection(db, ITEMS_COL), orderBy('addedAt', 'desc'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export async function addItem(data) {
  return addDoc(collection(db, ITEMS_COL), {
    ...data,
    addedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateItem(id, data) {
  return updateDoc(doc(db, ITEMS_COL, id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteItem(id) {
  return deleteDoc(doc(db, ITEMS_COL, id))
}
