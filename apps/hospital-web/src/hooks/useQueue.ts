import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as appointmentsService from "../services/appointments";

export function useQueue(doctorId: string | null, date: string) {
  return useQuery({
    queryKey: ["hospital", "queue", doctorId, date],
    queryFn: () => appointmentsService.getQueue(doctorId as string, date),
    enabled: !!doctorId,
  });
}

export function useQueueActions(doctorId: string | null, date: string) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["hospital", "queue", doctorId, date] });

  const call = useMutation({ mutationFn: appointmentsService.callQueueToken, onSuccess: invalidate });
  const skip = useMutation({ mutationFn: appointmentsService.skipQueueToken, onSuccess: invalidate });
  const complete = useMutation({ mutationFn: appointmentsService.completeQueueToken, onSuccess: invalidate });

  return { call, skip, complete };
}
