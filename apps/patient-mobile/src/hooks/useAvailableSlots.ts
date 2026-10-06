import { useQuery } from "@tanstack/react-query";
import * as appointmentsService from "../services/appointments";

export function useAvailableSlots(hospitalId: string, doctorId: string, date: string) {
  return useQuery({
    queryKey: ["appointments", "slots", hospitalId, doctorId, date],
    queryFn: () => appointmentsService.getAvailableSlots(hospitalId, doctorId, date),
    enabled: !!hospitalId && !!doctorId && !!date,
  });
}
