import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as hospitalService from "../services/hospital";
import { UpdateBedInput } from "../../../../shared/validation/hospital.schema";
import { BedType } from "../../../../shared/types/hospital";
import { ApiError } from "../services/apiClient";

export function useBeds() {
  return useQuery({ queryKey: ["hospital", "beds"], queryFn: hospitalService.listBeds });
}

export function useUpdateBed() {
  const queryClient = useQueryClient();
  return useMutation<unknown, ApiError, { bedType: BedType; input: UpdateBedInput }>({
    mutationFn: ({ bedType, input }) => hospitalService.updateBed(bedType, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospital", "beds"] });
      queryClient.invalidateQueries({ queryKey: ["hospital", "dashboard"] });
    },
  });
}
