// src/lib/db.js
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'

const HOUSES_COL = 'houses'

export function subscribeToHouses(callback) {
  const q = query(collection(db, HOUSES_COL), orderBy('addedAt', 'desc'))
  return onSnapshot(q, (snap) => {
    const houses = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(houses)
  })
}

export async function addHouse(data) {
  return addDoc(collection(db, HOUSES_COL), {
    ...data,
    status: 'pending',
    rank: null,
    addedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
}

export async function updateHouse(id, data) {
  return updateDoc(doc(db, HOUSES_COL, id), {
    ...data,
    updatedAt: serverTimestamp()
  })
}

export async function deleteHouse(id) {
  return deleteDoc(doc(db, HOUSES_COL, id))
}

export async function updateRanks(rankedIds) {
  const updates = rankedIds.map((id, index) =>
    updateDoc(doc(db, HOUSES_COL, id), { rank: index + 1, updatedAt: serverTimestamp() })
  )
  return Promise.all(updates)
}
