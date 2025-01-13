# Daily Golf Game Specification

## Overview

A daily puzzle game based on golf mechanics where players navigate through a procedurally generated course using dice rolls. Each day, all players get the same course and compete for the highest score through a combination of efficient path-finding and bonus collection.

## Core Mechanics

### Map System

- Hexagonal grid system using cube coordinates (q,r,s)
- Grid size of 8 (radius from center), creating a playable area of approximately 17x17 hexes
- Center hex at coordinates (0,0,0)
- Movement can occur in 6 directions (to adjacent hexes)

### Terrain Types

1. Fairway: Increases hit power by 1
2. Rough: Standard terrain
3. Sand Traps: Reduces hit power by 1
4. Water Hazards: Can be shot over but not landed on
5. Trees: Can only be cleared when shooting from fairway
6. Tee: Starting position
7. Green/Hole: Target position

### Bonus System

Bonuses are overlaid on terrain and provide scoring benefits when collected:

#### Bonus Types

1. 2x Multiplier (2 per course)
   - Doubles the points for the shot that collects it
2. 3x Multiplier (1 per course)
   - Triples the points for the shot that collects it
3. Point Bonus (3 per course)
   - Adds 500 points immediately
4. Extra Mulligan (1 per course)
   - Restores one mulligan use

#### Bonus Rules

- Bonuses can appear on any valid terrain (except water/trees)
- Bonuses are collected by landing on them
- Each bonus can only be collected once
- Used bonuses remain visible but faded out
- Multiple bonuses stack with skill shot multipliers

### Scoring System

#### Base Points

- 100 points per successful shot
- 1000 points base score for completing the course
- 100 points per unused mulligan

#### Skill Shot Bonuses

1. Water Carry: +250 points
   - Successfully shooting over water hazards
2. Long Putt: +100 points per hex
   - Sinking putts from 3+ spaces away
3. Streak Multiplier
   - +0.1x per consecutive skill shot
   - Maximum +0.5x bonus (6 consecutive skill shots)

#### Score Calculation

Final Score = (Base Points + Skill Shot Points + Bonus Points) × Current Multiplier

### Game Rules

#### Shot Types

1. Dice Roll

   - Roll d6 for distance
   - +1 when hitting from fairway
   - -1 when hitting from sand
   - Free re-roll on first shot

2. Putt
   - Move 1 space
   - Available at any time as alternative to rolling

#### Special Rules

- 6 "Mulligans" (re-rolls) per course
- Can't land on water hazards
- Must have clear line of sight (except from fairway)
- Trees block shots unless shooting from fairway
- Overshoot rules allow sinking if landing one space beyond hole

## Technical Implementation

### Daily Challenge System

- Course generation seeded by date
- Same course for all players each day
- Day number counted from January 13, 2024

### Map Generation Algorithm

1. Initial Setup

   - Initialize hex grid with radius of 8
   - Set all hexes to ROUGH initially

2. Path Generation

   - Define start/end points using seeded random
   - Generate control points for Bezier curve
   - Create fairway along the path
   - Add strategic gaps and width variations

3. Hazard Placement

   - Place hazards using noise functions
   - Ensure path exists from tee to hole
   - Validate water hazards don't block critical paths
   - Create natural-looking hazard clusters

4. Bonus Placement
   - Place bonuses on valid terrain
   - Distribute evenly along course
   - Avoid placing all bonuses in easily reachable spots

### Social Features

- Daily leaderboards
- Share score with breakdown
- Challenge specific players
- Achievement tracking

### Future Considerations

1. Course Themes

   - Desert courses
   - Links style
   - Parkland
   - Each with unique hazard distributions

2. Special Features

   - Elevation changes
   - Wind effects
   - Moving obstacles

3. Achievement System
   - Track longest putts
   - Count water carries
   - Record lowest scores
   - Special shot combinations
