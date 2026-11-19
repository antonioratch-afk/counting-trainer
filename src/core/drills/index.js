import * as values from './values.js';
import * as runningStop from './running-stop.js';
import * as runningTimed from './running-timed.js';
import * as strategy from './strategy.js';

export const DRILLS = {
  [values.drillId]: values,
  [runningStop.drillId]: runningStop,
  [runningTimed.drillId]: runningTimed,
  [strategy.drillId]: strategy,
};

/** The drill used for a step in learn, test and review modes. */
export function drillFor(stageId) {
  return { values, running: runningStop, strategy }[stageId];
}
