/*
# Expand goal options

## Overview
Updates the `profiles` table constraint to support two new goal values:
`fat_burn` and `build_muscle`, in addition to the existing `lose`,
`maintain`, and `gain`.

## Changes
- Modified table: `profiles`
  - `goal` column CHECK constraint updated to allow: 'lose', 'fat_burn',
    'maintain', 'build_muscle', 'gain'
- No data migration needed — existing rows keep their current values.
- No RLS changes.

## Notes
1. The constraint is dropped and re-created to add the new values.
2. All existing goal values remain valid.
*/

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_goal_check;

ALTER TABLE profiles ADD CONSTRAINT profiles_goal_check
  CHECK (goal IN ('lose', 'fat_burn', 'maintain', 'build_muscle', 'gain'));