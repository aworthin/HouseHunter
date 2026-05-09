// src/lib/tourRooms.js
// Questions are documented in TOUR_QUESTIONS.md at the project root
// To add questions: update TOUR_QUESTIONS.md and provide it to Claude

// Abby's furniture data for popups
export const ABBYS_FURNITURE_ALL = [
  { item: 'Desk',                  w: '27"', l: '48"',  h: '29"',   d: '—'    },
  { item: 'Mirror',                w: '25.5"', l: '—',  h: '68"',   d: '15.5"'},
  { item: 'Dresser',               w: '31.5"', l: '—',  h: '48"',   d: '19"'  },
  { item: 'Bed',                   w: '55"', l: '75"',  h: '22"',   d: '—'    },
  { item: 'Hallway Cabinet (books)',w: '11.5"',l: '31.5"',h: '34"', d: '—'    },
  { item: 'Shelf (Dad built)',     w: '25"', l: '—',    h: '65.5"', d: '14.5"'},
  { item: 'Dog Crate',             w: '27.5"',l: '42"', h: '30"',   d: '—'    },
  { item: 'Entertainment Table',   w: '15.5"',l: '55"', h: '22.5"', d: '—'    },
  { item: 'Coffee Table',          w: '31.5" dia', l: '—', h: '18"',d: '—'    },
  { item: 'Couch',                 w: '35"', l: '72"',  h: '30"',   d: '—'    },
  { item: 'Green Rug',             w: '52.5"',l: '72"', h: '—',     d: '—'    },
  { item: 'Cream Rug',             w: '96"', l: '120"', h: '—',     d: '—'    },
  { item: 'Bathroom Storage',      w: '17.5"',l: '—',   h: '66"',   d: '—'    },
]

export const ABBYS_FURNITURE_BATHROOM = [
  { item: 'Mirror',           w: '25.5"', l: '—', h: '68"', d: '15.5"' },
  { item: 'Bathroom Storage', w: '17.5"', l: '—', h: '66"', d: '—'     },
]

export const TOUR_ROOMS = [
  {
    id: 'frontYard',
    label: 'Front Yard',
    emoji: '🌳',
    questions: [
      { id: 'bothVehiclesFit', label: 'Will both vehicles fit in the driveway?', type: 'yesno' },
      { id: 'isGrassed', label: 'Grassed?', type: 'yesno' },
      { id: 'notes', label: 'Notes', type: 'text', placeholder: 'General front yard notes...', multiline: true },
    ],
  },
  {
    id: 'frontPorch',
    label: 'Front Porch',
    emoji: '🚪',
    questions: [
      { id: 'isCovered', label: 'Is porch covered?', type: 'yesno' },
      { id: 'roomForPackages', label: 'Room for packages under covering?', type: 'yesno' },
      { id: 'roomForSitting', label: 'Room for sitting on front porch?', type: 'yesno' },
      { id: 'notes', label: 'Notes', type: 'text', placeholder: 'Front porch notes...', multiline: true },
    ],
  },
  {
    id: 'garage',
    label: 'Garage',
    emoji: '🚗',
    questions: [
      { id: 'truckFits', label: "Will Ben's truck fit (210\"L × 76\"W)?", type: 'yesno' },
      { id: 'bothVehiclesFit', label: 'Will both vehicles fit?', type: 'yesno' },
      { id: 'roomForStorage', label: 'Room for storage shelf or workshop desk?', type: 'yesno' },
      { id: 'notes', label: 'Notes', type: 'text', placeholder: 'Garage notes...', multiline: true },
    ],
  },
  {
    id: 'entryway',
    label: 'Entryway',
    emoji: '🏠',
    questions: [
      { id: 'hasCoatCloset', label: 'Is there a coat closet?', type: 'yesno' },
      { id: 'hasEntryway', label: 'Is there an entryway?', type: 'yesno' },
      { id: 'notes', label: 'Notes', type: 'text', placeholder: 'Entryway notes...', multiline: true },
    ],
  },
  {
    id: 'livingRoom',
    label: 'Living Room',
    emoji: '🛋️',
    questions: [
      { id: 'wallForTV', label: 'Wall for TV to be mounted?', type: 'yesno' },
      { id: 'gusDoors', label: 'How many doors will have to be blocked for Gus?', type: 'number', placeholder: '0' },
      { id: 'notes', label: 'Notes', type: 'text', placeholder: 'Living room notes...', multiline: true },
    ],
  },
  {
    id: 'kitchen',
    label: 'Kitchen',
    emoji: '🍳',
    questions: [
      { id: 'cabinetsToCeiling', label: 'Cabinets go to the ceiling?', type: 'yesno' },
      { id: 'fridgeSize', label: 'Fridge size?', type: 'choice', options: ['30in', '33in', '36in'] },
      { id: 'counterDepth', label: 'Counter depth for fridge (measure in inches)?', type: 'number', placeholder: 'e.g. 24' },
      { id: 'pantryLargeEnough', label: 'Is pantry large enough for food and pet foods?', type: 'yesno' },
      { id: 'notes', label: 'Notes', type: 'text', placeholder: 'Kitchen notes...', multiline: true },
    ],
  },
  {
    id: 'diningRoom',
    label: 'Dining Room',
    emoji: '🍽️',
    questions: [
      { id: 'tableChairsFit', label: "Will Ben's table/chairs fit?", type: 'yesno' },
      { id: 'notes', label: 'Notes', type: 'text', placeholder: 'Dining room notes...', multiline: true },
    ],
  },
  {
    id: 'laundryRoom',
    label: 'Laundry Room',
    emoji: '🧺',
    questions: [
      { id: 'roomForLR4', label: 'Is there room for a LR4 (22"W × 27"D × 30"H)?', type: 'yesno' },
      { id: 'lr4Location', label: 'If not, where?', type: 'text', placeholder: 'Location...' },
      { id: 'roomForCatFood', label: 'Is there room for the cat food?', type: 'yesno' },
      { id: 'catFoodLocation', label: 'If not, where?', type: 'text', placeholder: 'Location...' },
      { id: 'hasFoldingArea', label: 'Is there a folding area?', type: 'yesno' },
      { id: 'foldingAreaAdded', label: 'If not, can one be added?', type: 'yesno' },
      { id: 'hasHangingArea', label: 'Is there a hanging area?', type: 'yesno' },
      { id: 'hangingAreaAdded', label: 'If not, can one be added?', type: 'yesno' },
      { id: 'notes', label: 'Notes', type: 'text', placeholder: 'Laundry room notes...', multiline: true },
    ],
  },
  {
    id: 'masterBedroom',
    label: 'Master Bedroom',
    emoji: '🛏️',
    questions: [
      { id: 'notes', label: 'Notes', type: 'text', placeholder: 'Master bedroom notes...', multiline: true },
    ],
  },
  {
    id: 'masterBathroom',
    label: 'Master Bathroom',
    emoji: '🚿',
    questions: [
      { id: 'catWaterPlacement', label: 'Can the cat water be placed in here?', type: 'yesno' },
      { id: 'notes', label: 'Notes', type: 'text', placeholder: 'Master bathroom notes...', multiline: true },
    ],
  },
  {
    id: 'spareBedroom',
    label: 'Spare Bedroom',
    emoji: '🛏️',
    questions: [
      { id: 'abbyFurnitureFits', label: "Will Abby's furniture fit?", type: 'yesno', furniturePopup: 'all' },
      { id: 'closetSize', label: 'How large is the closet (120"W × 19"D)?', type: 'text', placeholder: 'e.g. 4ft wide walk-in' },
      { id: 'hasSecondCloset', label: 'Is there a second closet?', type: 'yesno' },
      { id: 'secondClosetSize', label: 'How large is the second closet?', type: 'text', placeholder: 'e.g. 3ft wide' },
      { id: 'notes', label: 'Notes', type: 'text', placeholder: 'Spare bedroom notes...', multiline: true },
    ],
  },
  {
    id: 'spareBathroom',
    label: 'Spare Bathroom',
    emoji: '🚿',
    questions: [
      { id: 'abbyFurnitureFits', label: "Will Abby's bathroom furniture fit?", type: 'yesno', furniturePopup: 'bathroom' },
      { id: 'notes', label: 'Notes', type: 'text', placeholder: 'Spare bathroom notes...', multiline: true },
    ],
  },
  {
    id: 'office',
    label: 'Office',
    emoji: '💼',
    questions: [
      { id: 'deskFits', label: "Will Ben's desk fit (27\"W × 48\"L × 29\"H)?", type: 'yesno' },
      { id: 'hasEthernet', label: 'Are there ethernet ports?', type: 'yesno' },
      { id: 'notes', label: 'Notes', type: 'text', placeholder: 'Office notes...', multiline: true },
    ],
  },
  {
    id: 'backPorch',
    label: 'Back Porch / Deck',
    emoji: '🪑',
    questions: [
      { id: 'doorType', label: 'Door?', type: 'choice', options: ['Normal', 'Glass', 'Sliding'] },
      { id: 'hasWindowToDeck', label: 'Window to deck?', type: 'yesno' },
      { id: 'windowFrom', label: 'Window from where?', type: 'text', placeholder: 'e.g. Kitchen, Living Room' },
      { id: 'isCovered', label: 'Covered?', type: 'yesno' },
      { id: 'width', label: 'Width (inches)?', type: 'number', placeholder: 'e.g. 120' },
      { id: 'length', label: 'Length (inches)?', type: 'number', placeholder: 'e.g. 180' },
      { id: 'notes', label: 'Notes', type: 'text', placeholder: 'Back porch notes...', multiline: true },
    ],
  },
  {
    id: 'backYard',
    label: 'Back Yard',
    emoji: '🌿',
    questions: [
      { id: 'isGrassed', label: 'Grassed?', type: 'yesno' },
      { id: 'mowDifficulty', label: 'How hard to mow?', type: 'choice', options: ['Easy', 'Medium', 'Hard'] },
      { id: 'needsRidingMower', label: 'Need riding mower?', type: 'yesno' },
      { id: 'fenceDims', label: 'Fence dimensions?', type: 'text', placeholder: 'e.g. 6ft privacy, 3 sides' },
      { id: 'notes', label: 'Notes', type: 'text', placeholder: 'Back yard notes...', multiline: true },
    ],
  },
  {
    id: 'storage',
    label: 'Storage',
    emoji: '📦',
    questions: [
      { id: 'underHouseStorage', label: 'Under house storage?', type: 'yesno' },
      { id: 'underDeckStorage', label: 'Under deck storage?', type: 'yesno' },
      { id: 'shedLocation', label: 'Location for shed?', type: 'yesno' },
      { id: 'trailerStorage', label: 'Is there room to store the trailer?', type: 'yesno' },
      { id: 'trailerAccess', label: 'Is there access to store the trailer?', type: 'yesno' },
      { id: 'notes', label: 'Notes', type: 'text', placeholder: 'Storage notes...', multiline: true },
    ],
  },
]

export const ROOM_COUNT = TOUR_ROOMS.length

export function getRoomIndex(roomId) {
  return TOUR_ROOMS.findIndex(r => r.id === roomId)
}
