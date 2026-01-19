import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPins, createPin } from "../api/pinsApi";

export const usePins = () => {
  return useQuery({
    queryKey: ["pins"],
    queryFn: fetchPins,
    select: (data) =>
      data.map((pin) => ({
        id: pin.id,
        latitude: pin.latitude,
        longitude: pin.longitude,
        message: pin.message,
      })),
  });
};

export const useCreatePin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pins"] });
    },
  });
};
