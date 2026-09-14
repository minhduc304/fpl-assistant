export function formatDataAsOfTime(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const POSITION_LABELS: Record<string, string> = {
  GKP: "Goalkeeper",
  DEF: "Defender",
  MID: "Midfielder",
  FWD: "Forward",
};

export function formatPosition(position: string | undefined): string {
  if (!position) return "—";
  return POSITION_LABELS[position] ?? position;
}
