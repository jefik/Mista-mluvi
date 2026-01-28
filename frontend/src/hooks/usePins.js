import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPins, createPin, updatePinLike } from "../api/pinsApi";

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
        created_at: pin.created_at,
        likes_count: pin.likes_count || 0,
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

export const useUpdateLike = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePinLike,
  });
};
