import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as hospitalService from "../services/hospital";
import { CreateDoctorInput, UpdateDoctorInput } from "../../../../shared/validation/hospital.schema";
import { DoctorStatus } from "../../../../shared/types/hospital";

export function useDoctors() {
  return useQuery({ queryKey: ["hospital", "doctors"], queryFn: hospitalService.listDoctors });
}

export function useCreateDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDoctorInput) => hospitalService.createDoctor(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospital", "doctors"] });
      queryClient.invalidateQueries({ queryKey: ["hospital", "dashboard"] });
    },
  });
}

export function useUpdateDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDoctorInput }) => hospitalService.updateDoctor(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospital", "doctors"] });
    },
  });
}

export function useUpdateDoctorStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: DoctorStatus }) =>
      hospitalService.updateDoctorStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospital", "doctors"] });
    },
  });
}
