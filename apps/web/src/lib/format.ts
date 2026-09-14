export function formatDataAsOfTime(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
