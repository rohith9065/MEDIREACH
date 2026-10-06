import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as appointmentsService from "../services/appointments";

export function useMyAppointments() {
  return useQuery({
    queryKey: ["appointments", "my"],
    queryFn: appointmentsService.getMyAppointments,
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: appointmentsService.cancelAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments", "my"] });
    },
  });
}
