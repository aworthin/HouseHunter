// src/lib/items.js

export const ITEM_CATEGORIES = [
  'Appliances',
  'Furniture',
  'Electronics',
  'Bedding & Bath',
  'Decor',
  'Outdoor',
  'Tools & Hardware',
  'Other',
]

export const ITEM_STATUS = {
  NEEDED: 'needed',
  ORDERED: 'ordered',
  PURCHASED: 'purchased',
  NOT_NEEDED: 'not_needed',
}

export const ITEM_STATUS_LABELS = {
  needed: 'Needed',
  ordered: 'Ordered',
  purchased: 'Purchased',
  not_needed: 'Not Needed',
}

export const ITEM_STATUS_ORDER = ['needed', 'ordered', 'purchased']

export const REQUESTED_BY = ['Ben', 'Abby']

export const ITEM_STATUS_STYLE = {
  needed: 'bg-stone-700 text-stone-300',
  ordered: 'bg-blue-900/60 text-blue-300',
  purchased: 'bg-green-900/60 text-green-400',
  not_needed: 'bg-stone-800 text-stone-500',
}
