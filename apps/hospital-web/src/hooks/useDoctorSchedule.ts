import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as appointmentsService from "../services/appointments";
import { SetDoctorScheduleInput } from "../../../../shared/validation/appointment.schema";

export function useDoctorSchedule(doctorId: string | null) {
  return useQuery({
    queryKey: ["hospital", "doctorSchedule", doctorId],
    queryFn: () => appointmentsService.getDoctorSchedule(doctorId as string),
    enabled: !!doctorId,
  });
}

export function useSetDoctorSchedule(doctorId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SetDoctorScheduleInput) => appointmentsService.setDoctorSchedule(doctorId as string, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospital", "doctorSchedule", doctorId] });
    },
  });
}
