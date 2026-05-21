import { useState, useRef } from "react";
import { EVENT_HANDLERS } from "../events/eventHandlers";
import { assertEventShape } from "../events/eventValidation";
import { executeCommands } from "../presentation/presentationAdapter";

export const QUEUE_STATES = {
  IDLE: "IDLE",
  RUNNING: "RUNNING",
  PAUSED: "PAUSED",
  COMPLETED: "COMPLETED",
  ERROR: "ERROR",
  CANCELLED: "CANCELLED",
};

export function useBattleQueue(callbacks) {
  const queueStateRef = useRef({ 
    events: [], 
    currentIndex: 0, 
    progressionUpdates: null,
  });

  const [queueState, setQueueState] = useState(QUEUE_STATES.IDLE);
  const [pauseReason, setPauseReason] = useState(null);
  const [pauseData, setPauseData] = useState(null);

  const startQueue = async (events, progressionUpdates) => {
    queueStateRef.current = {
      events,
      currentIndex: 0,
      progressionUpdates,
    };
    setQueueState(QUEUE_STATES.RUNNING);
    await processQueue();
  };

  const resumeQueue = async () => {
    if (queueState !== QUEUE_STATES.PAUSED) return;
    
    setQueueState(QUEUE_STATES.RUNNING);
    setPauseReason(null);
    setPauseData(null);
    await processQueue();
  };

  const processQueue = async () => {
    const state = queueStateRef.current;

    while (state.currentIndex < state.events.length) {
      const event = state.events[state.currentIndex];
      
      // 1. Validate the event shape before processing
      try {
        assertEventShape(event);
      } catch (err) {
        console.error(err.message);
        setQueueState(QUEUE_STATES.ERROR);
        return; // Halt queue on malformed event
      }

      const handler = EVENT_HANDLERS[event.type];

      if (!handler) {
        console.warn(`[BattleQueue] No handler found for event type: ${event.type}`);
        state.currentIndex++;
        continue;
      }

      // Execute semantic event -> pure handler -> presentation commands
      const outcome = await handler(event.payload, state.currentIndex + 1);

      // Execute presentation commands via Adapter
      if (outcome.commands && outcome.commands.length > 0) {
        await executeCommands(outcome.commands, callbacks);
      }

      if (outcome.status === "paused") {
        state.currentIndex = outcome.nextIndex;
        
        setQueueState(QUEUE_STATES.PAUSED);
        setPauseReason(outcome.reason);
        setPauseData(outcome.data);
        return; // Pause execution
      }

      if (outcome.status === "error") {
        console.error(`[BattleQueue] Error processing event:`, event, outcome.reason);
        setQueueState(QUEUE_STATES.ERROR);
        return; // Halt on error
      }

      // Proceed to next event
      state.currentIndex++;
    }

    setQueueState(QUEUE_STATES.COMPLETED);

    // Trigger completion lifecycle
    if (callbacks.onQueueComplete) {
      callbacks.onQueueComplete(state.events, state.progressionUpdates);
    }
  };

  // Helper to safely and immutably update the queued progression updates (e.g., during move replacement pause)
  const mutateProgressionUpdates = (mutatorFunc) => {
    if (queueStateRef.current.progressionUpdates) {
      const currentProgression = queueStateRef.current.progressionUpdates;
      const updatedProgression = mutatorFunc(currentProgression);

      queueStateRef.current = {
        ...queueStateRef.current,
        progressionUpdates: updatedProgression
      };
    }
  };

  return {
    startQueue,
    resumeQueue,
    queueState,
    queuePaused: queueState === QUEUE_STATES.PAUSED,
    pauseReason,
    pauseData,
    mutateProgressionUpdates,
  };
}
