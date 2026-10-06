import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as hospitalService from "../services/hospital";
import { CreateDepartmentInput, UpdateDepartmentInput } from "../../../../shared/validation/hospital.schema";

export function useDepartments() {
  return useQuery({ queryKey: ["hospital", "departments"], queryFn: hospitalService.listDepartments });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDepartmentInput) => hospitalService.createDepartment(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospital", "departments"] });
      queryClient.invalidateQueries({ queryKey: ["hospital", "dashboard"] });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateDepartmentInput }) =>
      hospitalService.updateDepartment(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospital", "departments"] });
    },
  });
}
