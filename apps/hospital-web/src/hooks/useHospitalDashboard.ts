import { useQuery } from "@tanstack/react-query";
import * as hospitalService from "../services/hospital";

export function useHospitalDashboard() {
  return useQuery({ queryKey: ["hospital", "dashboard"], queryFn: hospitalService.getDashboard });
}
