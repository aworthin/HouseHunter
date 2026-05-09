# Tour Mode Questions

This file documents all questions asked during a house tour, organized by room.
Update this file when adding new questions, then provide it to Claude to update the code.

## Question Types
- `yesno` — Yes / No buttons
- `text` — Free text input (single line)
- `multiline` — Free text input (multiple lines)
- `number` — Numeric input
- `choice` — Multiple choice (options listed)

---

## Front Yard
| ID | Question | Type | Options |
|----|----------|------|---------|
| bothVehiclesFit | Will both vehicles fit in the driveway? | yesno | |
| isGrassed | Grassed? | yesno | |
| notes | Notes | multiline | |

## Front Porch
| ID | Question | Type | Options |
|----|----------|------|---------|
| isCovered | Is porch covered? | yesno | |
| roomForPackages | Room for packages under covering? | yesno | |
| roomForSitting | Room for sitting on front porch? | yesno | |
| notes | Notes | multiline | |

## Garage
| ID | Question | Type | Options |
|----|----------|------|---------|
| truckFits | Will Ben's truck fit (210"L × 76"W)? | yesno | |
| bothVehiclesFit | Will both vehicles fit? | yesno | |
| roomForStorage | Room for storage shelf or workshop desk? | yesno | |
| notes | Notes | multiline | |

## Entryway
| ID | Question | Type | Options |
|----|----------|------|---------|
| hasCoatCloset | Is there a coat closet? | yesno | |
| hasEntryway | Is there an entryway? | yesno | |
| notes | Notes | multiline | |

## Living Room
| ID | Question | Type | Options |
|----|----------|------|---------|
| wallForTV | Wall for TV to be mounted not above fireplace? | yesno | |
| gusDoors | How many doors will have to be blocked for Gus? | number | |
| notes | Notes | multiline | |

## Kitchen
| ID | Question | Type | Options |
|----|----------|------|---------|
| cabinetsToCeiling | Cabinets go to the ceiling? | yesno | |
| fridgeSize | Fridge size? | choice | 30in, 33in, 36in |
| counterDepth | Counter depth for fridge (measure in inches)? | number | |
| pantryLargeEnough | Is pantry large enough for food and pet foods? | yesno | |
| notes | Notes | multiline | |

## Dining Room
| ID | Question | Type | Options |
|----|----------|------|---------|
| tableChairsFit | Will Ben's table/chairs fit? | yesno | |
| notes | Notes | multiline | |

## Laundry Room
| ID | Question | Type | Options |
|----|----------|------|---------|
| roomForLR4 | Is there room for a LR4 (22"W × 27"D × 30"H)? | yesno | |
| lr4Location | If not, where? | text | |
| roomForCatFood | Is there room for the cat food? | yesno | |
| catFoodLocation | If not, where? | text | |
| hasFoldingArea | Is there a folding area? | yesno | |
| foldingAreaAdded | If not, can one be added? | yesno | |
| hasHangingArea | Is there a hanging area? | yesno | |
| hangingAreaAdded | If not, can one be added? | yesno | |
| notes | Notes | multiline | |

## Master Bedroom
| ID | Question | Type | Options |
|----|----------|------|---------|
| notes | Notes | multiline | |

## Master Bathroom
| ID | Question | Type | Options |
|----|----------|------|---------|
| catWaterPlacement | Can the cat water be placed in here? | yesno | |
| notes | Notes | multiline | |

## Spare Bedroom
Popup available: Abby's Furniture (all items from measurement sheet)

| ID | Question | Type | Options |
|----|----------|------|---------|
| abbyFurnitureFits | Will Abby's furniture fit? (tap for measurements) | yesno | |
| closetSize | How large is the closet (120"W × 19"D)? | text | |
| hasSecondCloset | Is there a second closet? | yesno | |
| secondClosetSize | How large is the second closet? | text | |
| notes | Notes | multiline | |

## Spare Bathroom
Popup available: Abby's Bathroom Furniture (Mirror, Bathroom Storage)

| ID | Question | Type | Options |
|----|----------|------|---------|
| abbyFurnitureFits | Will Abby's bathroom furniture fit? (tap for measurements) | yesno | |
| notes | Notes | multiline | |

## Office
| ID | Question | Type | Options |
|----|----------|------|---------|
| deskFits | Will Abby's desk fit? | yesno | |
| hasEthernet | Are there ethernet ports? | yesno | |
| notes | Notes | multiline | |

## Back Porch / Deck
| ID | Question | Type | Options |
|----|----------|------|---------|
| doorType | Door? | choice | Normal, Glass, Sliding |
| hasWindowToDeck | Window to deck? | yesno | |
| windowFrom | Window from where? | text | |
| isCovered | Covered? | yesno | |
| width | Width (inches)? | number | |
| length | Length (inches)? | number | |
| notes | Notes | multiline | |

## Back Yard
| ID | Question | Type | Options |
|----|----------|------|---------|
| isGrassed | Grassed? | yesno | |
| mowDifficulty | How hard to mow? | choice | Easy, Medium, Hard |
| needsRidingMower | Need riding mower? | yesno | |
| fenceDims | Fence dimensions? | text | |
| hammockSpace | Place to hang a hammock? | yesno | |
| notes | Notes | multiline | |

## Storage
| ID | Question | Type | Options |
|----|----------|------|---------|
| underHouseStorage | Under house storage? | yesno | |
| underDeckStorage | Under deck storage? | yesno | |
| shedLocation | Location for shed? | yesno | |
| trailerStorage | Is there room to store the trailer? | yesno | |
| trailerAccess | Is there access to store the trailer? | yesno | |
| notes | Notes | multiline | |

---

## Abby's Furniture Measurements (All Items)
Used in Spare Bedroom popup

| Item | W | L | H | D |
|------|---|---|---|---|
| Desk | 27" | 48" | 29" | — |
| Mirror | 25.5" | — | 68" | 15.5" |
| Dresser | 31.5" | — | 48" | 19" |
| Bed | 55" | 75" | 22" | — |
| Hallway Cabinet (books) | 11.5" | 31.5" | 34" | — |
| Shelf (Dad built) | 25" | — | 65.5" | 14.5" |
| Dog Crate | 27.5" | 42" | 30" | — |
| Entertainment Table | 15.5" | 55" | 22.5" | — |
| Coffee Table | 31.5" dia | — | 18" | — |
| Couch | 35" | 72" | 30" | — |
| Green Rug | 52.5" | 72" | — | — |
| Cream Rug | 96" | 120" | — | — |
| Bathroom Storage | 17.5" | — | 66" | — |

## Abby's Bathroom Furniture Measurements
Used in Spare Bathroom popup

| Item | W | L | H | D |
|------|---|---|---|---|
| Mirror | 25.5" | — | 68" | 15.5" |
| Bathroom Storage | 17.5" | — | 66" | — |
