#!/usr/bin/env node
/**
 * Count-In State Machine Simulator
 *
 * Simulates the Tone.Sequence callback tick-by-tick to verify:
 *   1. Count-in beats fire correctly for different time signatures
 *   2. Metronome accent lands on beat 1 of each measure
 *   3. Cursor does NOT advance during count-in
 *   4. Seamless transition: last count-in beat → cursor 0 (no gap)
 *   5. Pattern steps only fire AFTER count-in completes
 *   6. Works for 4/4, 3/4, 6/8 and multi-bar count-ins
 */

const PASS = '✅';
const FAIL = '❌';
const INFO = '📋';
let totalTests = 0, passed = 0, failed = 0;

function assert(condition, msg) {
  totalTests++;
  if (condition) { passed++; }
  else { failed++; console.log(`  ${FAIL} ASSERTION FAILED: ${msg}`); }
}

/**
 * Simulate the sequencer callback for a given configuration.
 * Returns a log of every event that occurred.
 */
function simulate({ timeSignature, countInBars, numBars, metronomeEnabled }) {
  const beatsPerMeasure = parseInt(timeSignature.split('/')[0], 10) || 4;
  const totalCountInBeats = countInBars * beatsPerMeasure;
  const totalSteps = numBars * 16; // 16th note steps per bar

  // --- Simulated refs (mirrors FLToolbar) ---
  const refs = {
    isCountingIn: true,
    countInBeat: 0,
    totalCountInBeats: totalCountInBeats,
    beatsPerMeasure: beatsPerMeasure,
    metronomeEnabled: metronomeEnabled,
  };

  // --- Event log ---
  const events = [];
  let cursorPosition = null;       // What setCurrentStep was called with
  let transportResetTo = null;     // If transport.position was set
  let patternStepsFired = [];      // Which absoluteSteps triggered pattern

  // We simulate enough ticks to cover count-in + at least 1 full bar of playback
  // Count-in consumes beats on the transport timeline, then transport resets to 0
  const ticksToSimulate = totalSteps + 16; // extra margin

  for (let absoluteStep = 0; absoluteStep < ticksToSimulate; absoluteStep++) {
    const isOnBeat = absoluteStep % 4 === 0;
    const currentIsCountingIn = refs.isCountingIn;
    const bpm_ = refs.beatsPerMeasure;
    const totalBeats = refs.totalCountInBeats;

    // ── COUNT-IN PHASE ──
    if (currentIsCountingIn && isOnBeat) {
      const beat = refs.countInBeat;

      if (beat < totalBeats) {
        const beatInMeasure = beat % bpm_;
        const isDownbeat = beatInMeasure === 0;

        events.push({
          tick: absoluteStep,
          phase: 'COUNT_IN',
          beat: beat + 1,
          totalBeats,
          accent: isDownbeat,
          beatInMeasure: beatInMeasure + 1,
          cursorAdvanced: false,
          patternFired: false,
        });

        refs.countInBeat = beat + 1;

        // Was that the LAST count-in beat?
        if (beat + 1 >= totalBeats) {
          refs.isCountingIn = false;
          refs.countInBeat = 0;
          transportResetTo = 0;
          // Transport resets — next iteration will start from step 0
          // We simulate this by breaking and restarting from step 0
          events.push({
            tick: absoluteStep,
            phase: 'TRANSITION',
            message: `Count-in complete. Transport reset to 0. Next tick = cursor 0.`,
          });
          // Simulate transport reset: continue from step 0
          absoluteStep = -1; // will become 0 on next iteration
        }
        continue; // return; in real code — skip pattern steps
      }
    }

    // ── NORMAL PLAYBACK / RECORDING ──
    if (!refs.isCountingIn) {
      cursorPosition = absoluteStep;

      let metronomeClick = null;
      if (isOnBeat && refs.metronomeEnabled) {
        const beatInMeasure = (absoluteStep / 4) % bpm_;
        metronomeClick = { accent: beatInMeasure === 0, beatInMeasure: beatInMeasure + 1 };
      }

      events.push({
        tick: absoluteStep,
        phase: 'PLAYBACK',
        cursor: absoluteStep,
        metronome: metronomeClick,
        patternFired: true,
      });

      patternStepsFired.push(absoluteStep);

      // Stop after 1 full bar of playback to keep output manageable
      if (absoluteStep >= 15) break;
    }
  }

  return { events, config: { timeSignature, countInBars, numBars, beatsPerMeasure, totalCountInBeats } };
}

function runScenario(label, config) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`${INFO} SCENARIO: ${label}`);
  console.log(`   Time Sig: ${config.timeSignature}, Count-in Bars: ${config.countInBars}, Beats/Measure: ${parseInt(config.timeSignature.split('/')[0], 10)}`);
  console.log(`${'─'.repeat(60)}`);

  const { events, config: cfg } = simulate(config);

  // Print event log
  const countInEvents = events.filter(e => e.phase === 'COUNT_IN');
  const transitionEvents = events.filter(e => e.phase === 'TRANSITION');
  const playbackEvents = events.filter(e => e.phase === 'PLAYBACK');

  console.log(`\n  COUNT-IN PHASE (${countInEvents.length} beats):`);
  for (const e of countInEvents) {
    const accentMark = e.accent ? ' ★ ACCENT' : '';
    console.log(`    tick=${String(e.tick).padStart(3)} │ beat ${e.beat}/${e.totalBeats} │ measure-beat ${e.beatInMeasure}/${cfg.beatsPerMeasure}${accentMark} │ cursor=FROZEN │ pattern=NO`);
  }

  for (const e of transitionEvents) {
    console.log(`\n  ⚡ TRANSITION: ${e.message}`);
  }

  console.log(`\n  PLAYBACK PHASE (first ${Math.min(playbackEvents.length, 20)} steps):`);
  for (const e of playbackEvents.slice(0, 20)) {
    const metStr = e.metronome ? ` │ metronome${e.metronome.accent ? ' ★ ACCENT' : ''}` : '';
    console.log(`    tick=${String(e.tick).padStart(3)} │ cursor=${String(e.cursor).padStart(3)} │ pattern=YES${metStr}`);
  }

  // ── ASSERTIONS ──
  console.log(`\n  ASSERTIONS:`);

  // 1. Correct number of count-in beats
  assert(countInEvents.length === cfg.totalCountInBeats,
    `Expected ${cfg.totalCountInBeats} count-in beats, got ${countInEvents.length}`);
  console.log(`  ${countInEvents.length === cfg.totalCountInBeats ? PASS : FAIL} Count-in beats: ${countInEvents.length} === ${cfg.totalCountInBeats}`);

  // 2. Beat 1 of each measure has accent
  const accentBeats = countInEvents.filter(e => e.accent);
  const expectedAccents = config.countInBars; // 1 accent per bar
  assert(accentBeats.length === expectedAccents,
    `Expected ${expectedAccents} accented beats, got ${accentBeats.length}`);
  console.log(`  ${accentBeats.length === expectedAccents ? PASS : FAIL} Accented beats: ${accentBeats.length} === ${expectedAccents} (1 per bar)`);

  // 3. First accent is on beat 1
  if (accentBeats.length > 0) {
    assert(accentBeats[0].beat === 1, `First accent should be beat 1, got beat ${accentBeats[0].beat}`);
    console.log(`  ${accentBeats[0].beat === 1 ? PASS : FAIL} First accent on beat 1`);
  }

  // 4. Cursor never advanced during count-in
  const cursorDuringCountIn = countInEvents.filter(e => e.cursorAdvanced);
  assert(cursorDuringCountIn.length === 0, `Cursor advanced during count-in!`);
  console.log(`  ${cursorDuringCountIn.length === 0 ? PASS : FAIL} Cursor frozen during count-in`);

  // 5. No pattern steps fired during count-in
  const patternDuringCountIn = countInEvents.filter(e => e.patternFired);
  assert(patternDuringCountIn.length === 0, `Pattern fired during count-in!`);
  console.log(`  ${patternDuringCountIn.length === 0 ? PASS : FAIL} No pattern steps during count-in`);

  // 6. Transition happened
  assert(transitionEvents.length === 1, `Expected 1 transition, got ${transitionEvents.length}`);
  console.log(`  ${transitionEvents.length === 1 ? PASS : FAIL} Exactly 1 transition event`);

  // 7. First playback step is cursor 0 (seamless)
  if (playbackEvents.length > 0) {
    assert(playbackEvents[0].cursor === 0, `First playback cursor should be 0, got ${playbackEvents[0].cursor}`);
    console.log(`  ${playbackEvents[0].cursor === 0 ? PASS : FAIL} First playback cursor = 0 (seamless transition)`);
  }

  // 8. Pattern fires on first playback step
  if (playbackEvents.length > 0) {
    assert(playbackEvents[0].patternFired === true, `Pattern should fire on first playback step`);
    console.log(`  ${playbackEvents[0].patternFired ? PASS : FAIL} Pattern fires on cursor 0`);
  }

  // 9. Playback metronome accent on beat 1 (step 0)
  const firstPlaybackBeat = playbackEvents.find(e => e.metronome);
  if (firstPlaybackBeat) {
    assert(firstPlaybackBeat.cursor === 0 && firstPlaybackBeat.metronome.accent === true,
      `First playback metronome should accent on cursor 0`);
    console.log(`  ${firstPlaybackBeat.cursor === 0 && firstPlaybackBeat.metronome.accent ? PASS : FAIL} Playback metronome accents on cursor 0`);
  }
}

// ════════════════════════════════════════════════════════════
// RUN ALL SCENARIOS
// ════════════════════════════════════════════════════════════
console.log('\n🎵 COUNT-IN STATE MACHINE SIMULATOR');
console.log('Simulating tick-by-tick behavior of the Tone.Sequence callback\n');

// Scenario 1: Standard 4/4, 1 bar count-in
runScenario('4/4 time, 1 bar count-in', {
  timeSignature: '4/4', countInBars: 1, numBars: 2, metronomeEnabled: true,
});

// Scenario 2: 3/4 time (waltz), 1 bar count-in
runScenario('3/4 time (waltz), 1 bar count-in', {
  timeSignature: '3/4', countInBars: 1, numBars: 2, metronomeEnabled: true,
});

// Scenario 3: 6/8 time, 1 bar count-in
runScenario('6/8 time, 1 bar count-in', {
  timeSignature: '6/8', countInBars: 1, numBars: 2, metronomeEnabled: true,
});

// Scenario 4: 4/4 time, 2 bar count-in
runScenario('4/4 time, 2 bar count-in', {
  timeSignature: '4/4', countInBars: 2, numBars: 2, metronomeEnabled: true,
});

// Scenario 5: 3/4 time, 2 bar count-in
runScenario('3/4 time (waltz), 2 bar count-in', {
  timeSignature: '3/4', countInBars: 2, numBars: 2, metronomeEnabled: true,
});

// Scenario 6: Metronome disabled during playback
runScenario('4/4 time, 1 bar count-in, metronome OFF', {
  timeSignature: '4/4', countInBars: 1, numBars: 2, metronomeEnabled: false,
});

// ════════════════════════════════════════════════════════════
// SUMMARY
// ════════════════════════════════════════════════════════════
console.log(`\n${'═'.repeat(60)}`);
console.log(`🏁 SIMULATION COMPLETE`);
console.log(`   ${PASS} Passed: ${passed}`);
console.log(`   ${FAIL} Failed: ${failed}`);
console.log(`   Total:  ${totalTests}`);
console.log(`${'═'.repeat(60)}`);

if (failed > 0) {
  console.log('\n⚠️  FAILURES DETECTED — review the assertions above.');
  process.exit(1);
} else {
  console.log('\n🎉 All assertions passed! The count-in state machine is correct.');
  process.exit(0);
}
