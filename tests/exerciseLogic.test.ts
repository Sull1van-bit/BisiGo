import test from 'node:test';
import assert from 'node:assert/strict';
import type { RoboflowPrediction } from '../src/types.ts';
import {
  advanceChainedCamera,
  advanceChainedCameraSlot,
  buildWordBankOptions,
  createChainedCameraState,
  gradeWordBankSelection,
} from '../src/utils/sentenceExercise.ts';

function makePred(signClass: string, confidence: number): RoboflowPrediction {
  return {
    x: 160,
    y: 160,
    width: 100,
    height: 100,
    confidence,
    class: signClass,
  };
}

test('gradeWordBankSelection accepts only exact ordered chip sequences', () => {
  assert.equal(gradeWordBankSelection(['Kamu', 'Laki-laki'], ['Kamu', 'Laki-laki']), true);
  assert.equal(
    gradeWordBankSelection(['Saya', 'Ingin', 'Menulis'], ['Saya', 'Ingin', 'Menulis']),
    true
  );

  // Wrong order
  assert.equal(gradeWordBankSelection(['Laki-laki', 'Kamu'], ['Kamu', 'Laki-laki']), false);
  assert.equal(
    gradeWordBankSelection(['Ingin', 'Saya', 'Menulis'], ['Saya', 'Ingin', 'Menulis']),
    false
  );

  // Incomplete or over-selected
  assert.equal(gradeWordBankSelection([], ['Kamu', 'Laki-laki']), false);
  assert.equal(gradeWordBankSelection(['Kamu'], ['Kamu', 'Laki-laki']), false);
  assert.equal(
    gradeWordBankSelection(['Kamu', 'Laki-laki', 'Saya'], ['Kamu', 'Laki-laki']),
    false
  );

  // Wrong word at matching length & empty expected
  assert.equal(gradeWordBankSelection(['Kamu', 'Perempuan'], ['Kamu', 'Laki-laki']), false);
  assert.equal(gradeWordBankSelection([], []), false);
});

test('buildWordBankOptions includes expected signs (including duplicates) plus 2-4 distinct distractors', () => {
  const pool = ['Saya', 'Kamu', 'Siapa', 'Laki-laki', 'Perempuan', 'Sahabat', 'Betul', 'Salah'];
  const options = buildWordBankOptions(['Kamu', 'Sahabat', 'Saya'], pool, 42);

  assert.ok(options.includes('Kamu'));
  assert.ok(options.includes('Sahabat'));
  assert.ok(options.includes('Saya'));
  assert.ok(options.length >= 5 && options.length <= 7);

  // Distractors should be distinct and not overlap with expectedSigns
  const distractors = options.filter(w => !['Kamu', 'Sahabat', 'Saya'].includes(w));
  assert.ok(distractors.length >= 2 && distractors.length <= 4);
  assert.equal(new Set(distractors).size, distractors.length);

  // Duplicate word in expected sentence preserved
  const dupOptions = buildWordBankOptions(['Saya', 'Cinta', 'Saya'], [...pool, 'Cinta'], 7);
  assert.equal(dupOptions.filter(w => w === 'Saya').length, 2);
});

test('chained camera advances strictly in sequence at >= threshold and ignores wrong or out-of-order signs', () => {
  let state = createChainedCameraState(['Saya', 'Ingin', 'Menulis']);
  assert.equal(state.activeSlotIndex, 0);
  assert.deepEqual(state.completedSlots, [false, false, false]);
  assert.equal(state.completed, false);

  // Out-of-order later slot signs must NOT advance
  let step = advanceChainedCamera(state, [makePred('Ingin', 0.96), makePred('Menulis', 0.95)]);
  assert.equal(step.advanced, false);
  assert.equal(step.state.activeSlotIndex, 0);
  assert.deepEqual(step.state.completedSlots, [false, false, false]);

  // Wrong sign must NOT advance
  step = advanceChainedCamera(step.state, [makePred('Kamu', 0.99)]);
  assert.equal(step.advanced, false);
  assert.equal(step.state.activeSlotIndex, 0);

  // Expected sign below threshold (0.38) must NOT advance
  step = advanceChainedCamera(step.state, [makePred('Saya', 0.37)]);
  assert.equal(step.advanced, false);
  assert.equal(step.state.activeSlotIndex, 0);

  // Expected sign at threshold advances slot 0 -> slot 1
  step = advanceChainedCamera(step.state, [makePred('Saya', 0.38)]);
  assert.equal(step.advanced, true);
  assert.equal(step.matchedSign, 'Saya');
  state = step.state;
  assert.equal(state.activeSlotIndex, 1);
  assert.deepEqual(state.completedSlots, [true, false, false]);
  assert.equal(state.completed, false);

  // Slot 1 ignores previous sign ('Saya') and future sign ('Menulis')
  step = advanceChainedCamera(state, [makePred('Saya', 0.98), makePred('Menulis', 0.92)]);
  assert.equal(step.advanced, false);
  assert.equal(step.state.activeSlotIndex, 1);

  // Slot 1 matches case-insensitively with whitespace
  step = advanceChainedCamera(state, [makePred('  ingin ', 0.72)]);
  assert.equal(step.advanced, true);
  assert.equal(step.matchedSign, 'Ingin');
  state = step.state;
  assert.equal(state.activeSlotIndex, 2);
  assert.deepEqual(state.completedSlots, [true, true, false]);
  assert.equal(state.completed, false);

  // Final slot matches -> completed becomes true
  step = advanceChainedCamera(state, [makePred('Menulis', 0.85)]);
  assert.equal(step.advanced, true);
  assert.equal(step.matchedSign, 'Menulis');
  state = step.state;
  assert.deepEqual(state.completedSlots, [true, true, true]);
  assert.equal(state.completed, true);

  // Subsequent predictions after completion do nothing
  const afterComplete = advanceChainedCamera(state, [makePred('Menulis', 0.99)]);
  assert.equal(afterComplete.advanced, false);
  assert.equal(afterComplete.state.completed, true);
});

test('chained camera supports hyphen/space normalization and manual active-slot fallback advancement', () => {
  let state = createChainedCameraState(['Kamu', 'Laki-laki']);

  const first = advanceChainedCamera(state, [makePred('kamu', 0.5)]);
  assert.equal(first.advanced, true);
  state = first.state;
  assert.equal(state.activeSlotIndex, 1);

  // Matches normalized hyphen/space label
  const second = advanceChainedCamera(state, [makePred('laki laki', 0.6)]);
  assert.equal(second.advanced, true);
  assert.equal(second.matchedSign, 'Laki-laki');
  assert.equal(second.state.completed, true);

  // Manual slot advancement fallback (simulate / upload per active slot)
  let manualState = createChainedCameraState(['Kamu', 'Laki-laki']);
  manualState = advanceChainedCameraSlot(manualState);
  assert.deepEqual(manualState.completedSlots, [true, false]);
  assert.equal(manualState.activeSlotIndex, 1);
  assert.equal(manualState.completed, false);

  manualState = advanceChainedCameraSlot(manualState);
  assert.deepEqual(manualState.completedSlots, [true, true]);
  assert.equal(manualState.completed, true);
});
