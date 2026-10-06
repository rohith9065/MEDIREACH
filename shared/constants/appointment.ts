export const APPOINTMENT_STATUSES = ["BOOKED", "CANCELLED", "COMPLETED"] as const;
export const QUEUE_STATUSES = ["WAITING", "CALLED", "IN_CONSULTATION", "COMPLETED", "SKIPPED", "CANCELLED"] as const;

export const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
] as const;

export const SLOT_INTERVAL_MINUTES = 20;
