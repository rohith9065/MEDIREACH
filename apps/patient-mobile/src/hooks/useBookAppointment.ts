import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as appointmentsService from "../services/appointments";

export function useBookAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: appointmentsService.bookAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments", "my"] });
    },
  });
}
