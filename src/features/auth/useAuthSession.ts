import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabaseClient } from '../../data/supabase'

export function useAuthSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    const supabase = getSupabaseClient()
    let active = true

    void supabase.auth.getSession().then(({ data }) => {
      if (active) setSession(data.session)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) setSession(nextSession)
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await getSupabaseClient().auth.signOut()
    if (error) throw error
  }, [])

  return useMemo(
    () => ({
      session: session ?? null,
      isLoading: session === undefined,
      signOut,
    }),
    [session, signOut],
  )
}
