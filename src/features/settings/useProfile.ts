import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { User } from '@supabase/supabase-js'
import {
  ensureProfile,
  fetchProfile,
  profileQueryKey,
  updateProfile,
  type ProfileUpdate,
} from '../../data/profileRepository'

export function useProfile(user: User) {
  return useQuery({
    queryKey: profileQueryKey(user.id),
    queryFn: async () => {
      await ensureProfile(user)
      return fetchProfile(user.id)
    },
    staleTime: 5 * 60_000,
  })
}

export function useUpdateProfile(userId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (patch: ProfileUpdate) => updateProfile(userId, patch),
    onSuccess: (profile) => {
      queryClient.setQueryData(profileQueryKey(userId), profile)
    },
  })
}
