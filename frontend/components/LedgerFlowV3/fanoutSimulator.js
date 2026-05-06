// fanoutSimulator.js

export function buildFanoutRun() {
  return {
    timeline: [
      { stage: "FANOUT_JOURNAL_COMMITTED", payload: {} },
      { stage: "FANOUT_STREAM_OPENED",     payload: {} },
      { stage: "FANOUT_EVENT_RECEIVED",    payload: {} },
      { stage: "FANOUT_CONSUMER_BALANCE",  payload: {} },
      { stage: "FANOUT_CONSUMER_FRAUD",    payload: {} },
      { stage: "FANOUT_CONSUMER_WORM",     payload: {} },
      {
        stage: "FANOUT_DLQ",
        payload: {
          deadLetter: {
            _id: "DLQ-20260506-0001",
            pipeline: "balanceProjection",
            journalEntryId: "JNL-20260506-001",
            errorClass: "projection_failure",
            errorMessage: "Connection timeout to accountBalances collection",
            rawEvent: { operationType: "insert", ns: { db: "leafy_bank_bian", coll: "journalEntries" } },
            resumeToken: "rt-3f8a2c1e-7b4d",
            retryCount: 3,
            dispositioned: false,
            capturedAt: { $date: new Date().toISOString() },
          },
        },
      },
    ],
  };
}

export function runFanoutMode(timeline, dispatch, mode = "STEP") {
  let cancelled = false, cursor = 0, autoHandles = [];
  const fire = (i) => { if (cancelled || i >= timeline.length) return; dispatch({ type: "FANOUT_STAGE_EVENT", event: timeline[i] }); cursor = i + 1; };
  if (mode === "SLOW") autoHandles = timeline.map((_, i) => setTimeout(() => fire(i), i * 2000));
  return {
    next: () => { if (cancelled || cursor >= timeline.length) return; fire(cursor); },
    cancel: () => { cancelled = true; autoHandles.forEach(clearTimeout); autoHandles = []; },
  };
}
