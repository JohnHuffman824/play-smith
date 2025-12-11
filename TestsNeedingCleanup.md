Tests needing cleanup

- `tests/unit/canvas/canvas-undo.test.ts`
	- `snapshot should include players and drawings`: Uses handmade
		snapshots only; no production undo calls (tests mock data).
	- `undo should restore previous state after player deletion`: Fabricated
		history arrays, never exercising real undo logic.
	- `undo should restore previous state after drawing deletion`: Asserts on
		synthetic snapshots instead of canvas undo code.
	- `undo on empty history should clear canvas`: Checks undefined from
		manual data; real undo handler never invoked.
	- `multiple undos should restore progressively earlier states`: Walks fake
		history arrays without using production undo functions.
- `tests/unit/canvas/line-ends.test.ts`
	- `sharp mode line should calculate direction from last two points`:
		Calculates Math.atan2 on local points instead of sharp-path code.
	- `sharp mode vertical line should point down`: Validates raw Math.atan2
		on hard-coded points, not the production helper.
	- `multi-segment sharp path uses last segment direction`: Checks local
		angle math rather than path direction logic.
- `tests/unit/canvas/selection-sync.test.ts`
	- `selection glow and delete target should use same source`: Asserts on
		hand-built arrays with no selection/render logic invoked.
	- `control nodes should show only for selected drawings`: Filters
		fabricated data instead of PathRenderer/selection code.
	- `when selection changes, both glow and nodes update together`: Mutates
		arrays and compares includes; no production selection logic used.
- `tests/unit/canvas/undo-after-erase-bug.test.ts`
	- `should save history when canvas becomes empty after erase`: Defines a
		test-only shouldSaveHistory and never calls Canvas undo code.
	- `correct implementation should always save history for undo`: Uses an
		in-test helper instead of production behavior.
	- `demonstrates the undo flow with the bug`: Reimplements history tracking
		in the test, not the real undo module.
	- `demonstrates correct behavior after fix`: Exercises a test-only
		saveToHistoryFixed helper, not the production undo.
- `tests/unit/hooks/useDialogAutoClose.test.tsx`
	- `should not set up listener when dialog is closed`: Only asserts `true`;
		no verification of listener setup or onClose behavior.
	- `should set up event listener when dialog is open`: Just checks for no
		errors; never confirms listeners or close handling.
	- `should use custom buffer size`: Assertion is `true` only; buffer and
		close behavior untested.
	- `should remove event listeners on unmount`: Only checks `true` after
		unmount; does not verify listener cleanup or onClose.
- `tests/unit/pages/PlaybookManagerPage.test.tsx`
	- `PlaybookManagerPage - Create Playbook Error Handling`: Entire suite is
		skipped and relies on removed contexts; no real behavior is exercised,
		leaving error handling untested (tests-as-afterthought).
