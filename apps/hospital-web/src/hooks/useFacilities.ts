import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as hospitalService from "../services/hospital";
import { UpdateFacilityInput } from "../../../../shared/validation/hospital.schema";

export function useFacilities() {
  return useQuery({ queryKey: ["hospital", "facilities"], queryFn: hospitalService.listFacilities });
}

export function useUpdateFacility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ facilityName, input }: { facilityName: string; input: UpdateFacilityInput }) =>
      hospitalService.updateFacility(facilityName, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospital", "facilities"] });
      queryClient.invalidateQueries({ queryKey: ["hospital", "dashboard"] });
    },
  });
}
