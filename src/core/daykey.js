// Thailand calendar day. Thailand has no daylight saving, so a fixed offset is
// used and the phone's time zone setting is ignored.
export function dayKey(tsUtcMs, offsetHours = 7) {
  return new Date(tsUtcMs + offsetHours * 3600000).toISOString().slice(0, 10);
}
