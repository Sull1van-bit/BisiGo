import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ABJAD_SIGNS,
  ALL_SIGNS,
  ANGKA_SIGNS,
  CURRICULUM,
  WORD_MODEL_LABELS,
  generateCharacterPracticeSteps,
  generateExerciseSteps,
  getCharacterSigns,
  getLevelById,
  getSignByClass,
} from '../src/curriculum.ts';

test('Learn path has exactly 4 kata-only units in R1 order covering all 23 word labels', () => {
  assert.equal(CURRICULUM.length, 4);

  const expectedTitles = [
    'Perkenalan & Identitas Diri',
    'Sopan Santun & Konfirmasi',
    'Arah & Lokasi',
    'Aktivitas, Keinginan & Perasaan',
  ];

  const seenVocab: string[] = [];

  CURRICULUM.forEach((unit, idx) => {
    assert.equal(unit.id, `unit-${idx + 1}`);
    assert.equal(unit.modelCategory, 'kata');
    assert.ok(
      unit.title.id.includes(expectedTitles[idx]),
      `Expected unit ${unit.id} title "${unit.title.id}" to include "${expectedTitles[idx]}"`
    );

    const unitSigns = unit.levels.flatMap(lvl => lvl.signs);
    assert.ok(unitSigns.length > 0, `Unit ${unit.id} must introduce vocabulary signs`);

    for (const sign of unitSigns) {
      assert.equal(sign.modelCategory, 'kata');
      assert.equal(sign.unitId, unit.id);
      seenVocab.push(sign.roboflowClass);
    }
  });

  // Exact 23 word labels, no missing, no duplicates, no alphabet/number signs
  assert.equal(seenVocab.length, 23);
  const uniqueSeen = new Set(seenVocab);
  assert.equal(uniqueSeen.size, 23);
  assert.deepEqual([...uniqueSeen].sort(), [...WORD_MODEL_LABELS].sort());
});

test('Every unit has >=3 chained sentences using 2-3 valid kata signs from current or earlier units', () => {
  const validWordLabels = new Set<string>(WORD_MODEL_LABELS);
  const introducedSoFar = new Set<string>();

  for (const unit of CURRICULUM) {
    for (const level of unit.levels) {
      for (const sign of level.signs) {
        introducedSoFar.add(sign.roboflowClass);
      }
    }

    const unitSentences = unit.levels.flatMap(lvl => lvl.sentences ?? []);
    assert.ok(
      unitSentences.length >= 3,
      `Unit ${unit.id} should have at least 3 chained sentences, found ${unitSentences.length}`
    );

    for (const sentence of unitSentences) {
      assert.ok(
        sentence.signs.length >= 2 && sentence.signs.length <= 3,
        `Sentence ${sentence.id} must have 2-3 signs, got ${sentence.signs.length}`
      );
      assert.ok(
        sentence.meaningId.trim().length > 0,
        `Sentence ${sentence.id} must have non-empty meaningId`
      );
      assert.ok(
        sentence.meaningEn.trim().length > 0,
        `Sentence ${sentence.id} must have non-empty meaningEn`
      );

      for (const label of sentence.signs) {
        assert.ok(
          validWordLabels.has(label),
          `Sentence ${sentence.id} references invalid word-model label "${label}"`
        );
        assert.ok(
          introducedSoFar.has(label),
          `Sentence ${sentence.id} in ${unit.id} uses "${label}" before it was introduced`
        );
      }
    }
  }
});

test('Characters exports include all 26 Abjad (A-Z) and all 11 Angka (Nol-Sepuluh) signs', () => {
  const expectedAbjad = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
  const expectedAngka = [
    'Nol',
    'Satu',
    'Dua',
    'Tiga',
    'Empat',
    'Lima',
    'Enam',
    'Tujuh',
    'Delapan',
    'Sembilan',
    'Sepuluh',
  ];

  assert.equal(ABJAD_SIGNS.length, 26);
  assert.deepEqual(
    ABJAD_SIGNS.map(s => s.roboflowClass),
    expectedAbjad
  );
  for (const sign of ABJAD_SIGNS) {
    assert.equal(sign.modelCategory, 'abjad');
  }

  assert.equal(ANGKA_SIGNS.length, 11);
  assert.deepEqual(
    ANGKA_SIGNS.map(s => s.roboflowClass),
    expectedAngka
  );
  for (const sign of ANGKA_SIGNS) {
    assert.equal(sign.modelCategory, 'angka');
  }

  assert.deepEqual(getCharacterSigns('abjad'), ABJAD_SIGNS);
  assert.deepEqual(getCharacterSigns('angka'), ANGKA_SIGNS);

  assert.equal(ALL_SIGNS.length, 60);
  assert.equal(new Set(ALL_SIGNS.map(s => s.roboflowClass)).size, 60);
  assert.equal(getSignByClass('kamu')?.roboflowClass, 'Kamu');
  assert.equal(getSignByClass('nol')?.roboflowClass, 'Nol');
});

test('generateExerciseSteps emits intro, sentence (word-bank + chained-camera), and review steps', () => {
  const intro = getLevelById('1.1');
  assert.ok(intro);
  const introSteps = generateExerciseSteps(intro.level, intro.unit);
  assert.deepEqual(
    introSteps.map(s => s.type),
    ['study', 'quiz', 'camera', 'study', 'quiz', 'camera', 'study', 'quiz', 'camera']
  );

  const sentenceLevel = getLevelById('1.3');
  assert.ok(sentenceLevel);
  const sentenceSteps = generateExerciseSteps(sentenceLevel.level, sentenceLevel.unit);
  assert.ok(sentenceSteps.some(s => s.type === 'word-bank'));
  assert.ok(sentenceSteps.some(s => s.type === 'chained-camera'));

  for (const step of sentenceSteps) {
    assert.ok(step.sentence);
    assert.ok(step.sentenceSigns && step.sentenceSigns.length === step.sentence.signs.length);
    if (step.type === 'word-bank') {
      assert.ok(step.wordBankOptions && step.wordBankOptions.length >= step.sentence.signs.length + 2);
      for (const expectedWord of step.sentence.signs) {
        assert.ok(step.wordBankOptions.includes(expectedWord));
      }
    }
  }

  const reviewLevel = getLevelById('4.4');
  assert.ok(reviewLevel);
  const reviewSteps = generateExerciseSteps(reviewLevel.level, reviewLevel.unit);
  assert.ok(reviewSteps.some(s => s.type === 'camera'));
  assert.ok(reviewSteps.some(s => s.type === 'word-bank'));
  assert.ok(reviewSteps.some(s => s.type === 'chained-camera'));
});

test('generateCharacterPracticeSteps produces study -> quiz -> camera with matching modelCategory', () => {
  const focusedAbjad = generateCharacterPracticeSteps('abjad', 'A');
  assert.deepEqual(
    focusedAbjad.map(s => s.type),
    ['study', 'quiz', 'camera']
  );
  assert.equal(focusedAbjad[0].sign.roboflowClass, 'A');
  assert.equal(focusedAbjad[0].sign.modelCategory, 'abjad');
  assert.equal(focusedAbjad[1].options?.length, 4);

  const batchAngka = generateCharacterPracticeSteps('angka');
  assert.ok(batchAngka.length >= 3);
  assert.ok(batchAngka.every(s => s.sign.modelCategory === 'angka'));
  assert.ok(batchAngka.some(s => s.type === 'study'));
  assert.ok(batchAngka.some(s => s.type === 'quiz'));
  assert.ok(batchAngka.some(s => s.type === 'camera'));
});
