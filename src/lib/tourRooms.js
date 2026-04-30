// src/lib/tourRooms.js
// Room definitions and questions for tour mode
// Add questions by adding to the room's questions array

export const TOUR_ROOMS = [
  {
    id: 'frontYard',
    label: 'Front Yard',
    emoji: '🌳',
    questions: [
      { id: 'drivewayLength', label: 'How long is the driveway?', type: 'text', placeholder: 'e.g. Short, 2 cars, long' },
      { id: 'isGrassed', label: 'Is it grassed?', type: 'yesno' },
      { id: 'notes', label: 'Notes', type: 'text', placeholder: 'General front yard notes...', multiline: true },
    ],
  },
  {
    id: 'frontPorch',
    label: 'Front Porch',
    emoji: '🚪',
    questions: [
      { id: 'isCovered', label: 'Is the front porch covered?', type: 'yesno' },
      { id: 'size', label: 'Front porch size?', type: 'choice', options: ['None', 'Small', 'Medium', 'Large'] },
      { id: 'notes', label: 'Notes', type: 'text', placeholder: 'Front porch notes...', multiline: true },
    ],
  },
  {
    id: 'entryway',
    label: 'Entryway',
    emoji: '🏠',
    questions: [
      { id: 'notes', label: 'Notes', type: 'text', placeholder: 'Entryway notes...', multiline: true },
    ],
  },
  {
    id: 'livingRoom',
    label: 'Living Room',
    emoji: '🛋️',
    questions: [
      { id: 'notes', label: 'Notes', type: 'text', placeholder: 'Living room notes...', multiline: true },
    ],
  },
  {
    id: 'kitchen',
    label: 'Kitchen',
    emoji: '🍳',
    questions: [
      { id: 'notes', label: 'Notes', type: 'text', placeholder: 'Kitchen notes...', multiline: true },
    ],
  },
  {
    id: 'diningRoom',
    label: 'Dining Room',
    emoji: '🍽️',
    questions: [
      { id: 'notes', label: 'Notes', type: 'text', placeholder: 'Dining room notes...', multiline: true },
    ],
  },
  {
    id: 'laundryRoom',
    label: 'Laundry Room',
    emoji: '🧺',
    questions: [
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
      { id: 'notes', label: 'Notes', type: 'text', placeholder: 'Master bathroom notes...', multiline: true },
    ],
  },
  {
    id: 'spareBedroom',
    label: 'Spare Bedroom',
    emoji: '🛏️',
    questions: [
      { id: 'notes', label: 'Notes', type: 'text', placeholder: 'Spare bedroom notes...', multiline: true },
    ],
  },
  {
    id: 'spareBathroom',
    label: 'Spare Bathroom',
    emoji: '🚿',
    questions: [
      { id: 'notes', label: 'Notes', type: 'text', placeholder: 'Spare bathroom notes...', multiline: true },
    ],
  },
  {
    id: 'office',
    label: 'Office',
    emoji: '💼',
    questions: [
      { id: 'notes', label: 'Notes', type: 'text', placeholder: 'Office notes...', multiline: true },
    ],
  },
  {
    id: 'garage',
    label: 'Garage',
    emoji: '🚗',
    questions: [
      { id: 'notes', label: 'Notes', type: 'text', placeholder: 'Garage notes...', multiline: true },
    ],
  },
  {
    id: 'backPorch',
    label: 'Back Porch / Deck',
    emoji: '🪑',
    questions: [
      { id: 'notes', label: 'Notes', type: 'text', placeholder: 'Back porch notes...', multiline: true },
    ],
  },
  {
    id: 'backYard',
    label: 'Back Yard',
    emoji: '🌿',
    questions: [
      { id: 'notes', label: 'Notes', type: 'text', placeholder: 'Back yard notes...', multiline: true },
    ],
  },
  {
    id: 'storage',
    label: 'Storage',
    emoji: '📦',
    questions: [
      { id: 'notes', label: 'Notes', type: 'text', placeholder: 'Storage notes...', multiline: true },
    ],
  },
]

export const ROOM_COUNT = TOUR_ROOMS.length

export function getRoomIndex(roomId) {
  return TOUR_ROOMS.findIndex(r => r.id === roomId)
}
