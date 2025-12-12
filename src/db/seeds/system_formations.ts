export interface SystemFormationPosition {
  role: string
  x: number
  y: number
}

export interface SystemFormation {
  name: string
  description: string
  positions: SystemFormationPosition[]
}

// Field coordinates: x=0 is left sideline, x=100 is right sideline
// y=0 is line of scrimmage, positive y is backfield
export const SYSTEM_FORMATIONS: SystemFormation[] = [
  {
    name: 'I-Form',
    description: 'Traditional I-Formation with fullback and tailback aligned behind QB',
    positions: [
      { role: 'C', x: 50, y: 0 },
      { role: 'LG', x: 47, y: 0 },
      { role: 'RG', x: 53, y: 0 },
      { role: 'LT', x: 44, y: 0 },
      { role: 'RT', x: 56, y: 0 },
      { role: 'TE', x: 41, y: 0 },
      { role: 'X', x: 20, y: 0 },
      { role: 'QB', x: 50, y: 5 },
      { role: 'FB', x: 50, y: 8 },
      { role: 'RB', x: 50, y: 12 },
      { role: 'Z', x: 80, y: 0 }
    ]
  },
  {
    name: 'Shotgun',
    description: 'QB in shotgun with RB offset',
    positions: [
      { role: 'C', x: 50, y: 0 },
      { role: 'LG', x: 47, y: 0 },
      { role: 'RG', x: 53, y: 0 },
      { role: 'LT', x: 44, y: 0 },
      { role: 'RT', x: 56, y: 0 },
      { role: 'TE', x: 41, y: 0 },
      { role: 'X', x: 15, y: 0 },
      { role: 'QB', x: 50, y: 7 },
      { role: 'RB', x: 45, y: 7 },
      { role: 'H', x: 60, y: 2 },
      { role: 'Z', x: 85, y: 0 }
    ]
  },
  {
    name: 'Spread',
    description: '4 wide receivers spread across the field',
    positions: [
      { role: 'C', x: 50, y: 0 },
      { role: 'LG', x: 47, y: 0 },
      { role: 'RG', x: 53, y: 0 },
      { role: 'LT', x: 44, y: 0 },
      { role: 'RT', x: 56, y: 0 },
      { role: 'X', x: 10, y: 0 },
      { role: 'H', x: 35, y: 2 },
      { role: 'QB', x: 50, y: 7 },
      { role: 'RB', x: 50, y: 10 },
      { role: 'Y', x: 65, y: 2 },
      { role: 'Z', x: 90, y: 0 }
    ]
  },
  {
    name: 'Twins',
    description: 'Two receivers on one side',
    positions: [
      { role: 'C', x: 50, y: 0 },
      { role: 'LG', x: 47, y: 0 },
      { role: 'RG', x: 53, y: 0 },
      { role: 'LT', x: 44, y: 0 },
      { role: 'RT', x: 56, y: 0 },
      { role: 'TE', x: 41, y: 0 },
      { role: 'X', x: 15, y: 0 },
      { role: 'QB', x: 50, y: 5 },
      { role: 'RB', x: 45, y: 8 },
      { role: 'H', x: 75, y: 2 },
      { role: 'Z', x: 85, y: 0 }
    ]
  },
  {
    name: 'Trips',
    description: 'Three receivers on one side',
    positions: [
      { role: 'C', x: 50, y: 0 },
      { role: 'LG', x: 47, y: 0 },
      { role: 'RG', x: 53, y: 0 },
      { role: 'LT', x: 44, y: 0 },
      { role: 'RT', x: 56, y: 0 },
      { role: 'X', x: 15, y: 0 },
      { role: 'QB', x: 50, y: 7 },
      { role: 'RB', x: 45, y: 7 },
      { role: 'H', x: 70, y: 2 },
      { role: 'Y', x: 80, y: 2 },
      { role: 'Z', x: 90, y: 0 }
    ]
  },
  {
    name: 'Empty',
    description: 'No backs in backfield, all receivers split out',
    positions: [
      { role: 'C', x: 50, y: 0 },
      { role: 'LG', x: 47, y: 0 },
      { role: 'RG', x: 53, y: 0 },
      { role: 'LT', x: 44, y: 0 },
      { role: 'RT', x: 56, y: 0 },
      { role: 'X', x: 10, y: 0 },
      { role: 'A', x: 30, y: 2 },
      { role: 'QB', x: 50, y: 7 },
      { role: 'H', x: 60, y: 2 },
      { role: 'Y', x: 75, y: 2 },
      { role: 'Z', x: 90, y: 0 }
    ]
  },
  {
    name: 'Singleback',
    description: 'Single running back behind QB',
    positions: [
      { role: 'C', x: 50, y: 0 },
      { role: 'LG', x: 47, y: 0 },
      { role: 'RG', x: 53, y: 0 },
      { role: 'LT', x: 44, y: 0 },
      { role: 'RT', x: 56, y: 0 },
      { role: 'TE', x: 57, y: 0 },
      { role: 'X', x: 15, y: 0 },
      { role: 'QB', x: 50, y: 5 },
      { role: 'RB', x: 50, y: 8 },
      { role: 'H', x: 70, y: 2 },
      { role: 'Z', x: 85, y: 0 }
    ]
  },
  {
    name: 'Pistol',
    description: 'QB in pistol with RB directly behind',
    positions: [
      { role: 'C', x: 50, y: 0 },
      { role: 'LG', x: 47, y: 0 },
      { role: 'RG', x: 53, y: 0 },
      { role: 'LT', x: 44, y: 0 },
      { role: 'RT', x: 56, y: 0 },
      { role: 'TE', x: 41, y: 0 },
      { role: 'X', x: 15, y: 0 },
      { role: 'QB', x: 50, y: 4 },
      { role: 'RB', x: 50, y: 8 },
      { role: 'H', x: 65, y: 2 },
      { role: 'Z', x: 85, y: 0 }
    ]
  }
]
