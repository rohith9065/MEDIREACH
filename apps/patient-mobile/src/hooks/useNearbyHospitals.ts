import { useQuery } from "@tanstack/react-query";
import * as hospitalsService from "../services/hospitals";

export function useNearbyHospitals(
  lat: number,
  lng: number,
  q?: string,
  specialization?: string,
  facility?: string,
  emergencyMode?: boolean,
) {
  return useQuery({
    queryKey: ["hospitals", "nearby", lat, lng, q ?? "", specialization ?? "", facility ?? "", emergencyMode ?? false],
    queryFn: () => hospitalsService.getNearbyHospitals({ lat, lng, q, specialization, facility, emergencyMode }),
    enabled: Number.isFinite(lat) && Number.isFinite(lng),
  });
}
