import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as hospitalService from "../services/hospital";
import { CreateAmbulanceInput } from "../../../../shared/validation/ambulance.schema";

export function useAmbulances() {
  return useQuery({ queryKey: ["hospital", "ambulances"], queryFn: hospitalService.listAmbulances });
}

export function useCreateAmbulance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAmbulanceInput) => hospitalService.createAmbulance(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospital", "ambulances"] });
    },
  });
}
