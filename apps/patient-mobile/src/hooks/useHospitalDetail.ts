import { useQuery } from "@tanstack/react-query";
import * as hospitalsService from "../services/hospitals";

export function useHospitalDetail(id: string) {
  return useQuery({
    queryKey: ["hospitals", "detail", id],
    queryFn: () => hospitalsService.getHospitalDetail(id),
    enabled: !!id,
  });
}
