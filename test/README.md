# Testing Infrastructure

## Overview
This directory contains property-based tests for the BattleZone tank game using fast-check.

## Running Tests
```bash
npm test
```

## Test Structure
- `game.test.js` - Main test file for game property-based tests

## Property-Based Testing
We use fast-check to verify correctness properties across many randomly generated inputs. Each property test runs 100 iterations by default.

## Adding New Tests
When implementing new features, add corresponding property tests that validate the correctness properties defined in the design document. Each test should:
1. Reference the property number from the design doc
2. Reference the requirement it validates
3. Use appropriate generators for game entities
4. Run at least 100 iterations

Example format:
```javascript
it('Property X: Description', () => {
  // **Feature: advanced-game-features, Property X: Description**
  // **Validates: Requirements Y.Z**
  fc.assert(
    fc.property(
      // generators here
      (inputs) => {
        // test logic here
        return true; // or assertion
      }
    ),
    { numRuns: 100 }
  );
});
```
