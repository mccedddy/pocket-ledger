import { useState } from 'react'
import { useAuth } from '../auth/authContext'
import type { ThemeValue } from '../../data/database.types'
import type { Profile } from '../../data/profileRepository'
import {
  SUPPORTED_CURRENCIES,
  formatCurrency,
  isCurrencyCode,
  normalizeCurrencyCode,
  type CurrencyCode,
} from '../../domain/currency'
import { normalizeNickname, validateNickname } from '../../domain/validation'
import { useTheme } from '../../app/themeContext'
import { Button } from '../../shared/Button'
import { Card } from '../../shared/Card'
import { Field } from '../../shared/Field'
import { FullPageState } from '../../shared/FullPageState'
import { Input } from '../../shared/Input'
import { PageHeader } from '../../shared/PageHeader'
import { Select } from '../../shared/Select'
import { useProfile, useUpdateProfile } from './useProfile'

export function SettingsPage() {
  const { session } = useAuth()
  const profileQuery = useProfile(session!.user)

  if (profileQuery.isLoading) {
    return <FullPageState>Loading settings…</FullPageState>
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <Card>
        <p role="alert" className="text-sm text-expense">
          Could not load your profile. Please try again.
        </p>
        <Button className="mt-4" onClick={() => void profileQuery.refetch()}>
          Retry
        </Button>
      </Card>
    )
  }

  const profile = profileQuery.data
  return (
    <SettingsForm
      key={`${profile.id}:${profile.currency_code}`}
      profile={profile}
    />
  )
}

function SettingsForm({ profile }: { profile: Profile }) {
  const updateProfile = useUpdateProfile(profile.id)
  const { theme, setTheme } = useTheme()

  const profileNickname = normalizeNickname(profile.nickname)
  const [nickname, setNickname] = useState(profileNickname)
  const [nicknameError, setNicknameError] = useState<string | null>(null)
  const [nicknameSaved, setNicknameSaved] = useState(false)

  const [currency, setCurrency] = useState<CurrencyCode>(() =>
    normalizeCurrencyCode(profile.currency_code),
  )
  const [actionError, setActionError] = useState<string | null>(null)
  const [currencySaved, setCurrencySaved] = useState(false)

  const isNicknameDirty = normalizeNickname(nickname) !== profileNickname
  const isDirty = currency !== normalizeCurrencyCode(profile.currency_code)

  const handleNicknameChange = (value: string) => {
    setNickname(value)
    setNicknameError(null)
    setNicknameSaved(false)
    setActionError(null)
  }

  const handleNicknameSave = async () => {
    const validationError = validateNickname(nickname)
    if (validationError) {
      setNicknameError(validationError)
      return
    }

    const nextNickname = normalizeNickname(nickname)
    setNickname(nextNickname)
    setNicknameError(null)
    setNicknameSaved(false)
    setActionError(null)
    try {
      await updateProfile.mutateAsync({ nickname: nextNickname })
      setNicknameSaved(true)
    } catch {
      setActionError('Could not save the nickname. Please try again.')
    }
  }

  const handleCurrencyChange = (value: string) => {
    if (!isCurrencyCode(value)) return
    setCurrency(value)
    setCurrencySaved(false)
    setActionError(null)
  }

  const handleCurrencySave = async () => {
    setActionError(null)
    setCurrencySaved(false)
    try {
      await updateProfile.mutateAsync({ currency_code: currency })
      setCurrencySaved(true)
    } catch {
      setActionError('Could not save the currency. Please try again.')
    }
  }

  const handleThemeChange = async (next: ThemeValue) => {
    if (next === theme || updateProfile.isPending) return
    const previous = theme
    setActionError(null)
    setTheme(next)
    try {
      await updateProfile.mutateAsync({ theme: next })
    } catch {
      setTheme(previous)
      setActionError('Could not save the theme. Please try again.')
    }
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your profile and choose how Pocket Ledger displays your money and interface."
      />

      <div className="flex flex-col gap-6">
        <Card>
          <h2 className="text-base font-semibold text-text">Profile</h2>
          <p className="mt-1 text-sm text-muted">
            Your nickname is required and cannot be blank.
          </p>

          <div className="mt-4 pb-5 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className={nicknameError ? 'pb-5 sm:w-64 sm:pb-0' : 'sm:w-64'}>
              <div className="relative">
                <Field label="Nickname" htmlFor="nickname">
                  <Input
                    id="nickname"
                    type="text"
                    aria-label="Nickname"
                    aria-describedby={nicknameError ? 'nickname-error' : undefined}
                    autoComplete="nickname"
                    value={nickname}
                    invalid={Boolean(nicknameError)}
                    onChange={(event) => handleNicknameChange(event.target.value)}
                    placeholder="Your nickname"
                  />
                </Field>
                {nicknameError && (
                  <p
                    id="nickname-error"
                    role="alert"
                    className="absolute left-0 top-full mt-1.5 text-xs text-expense"
                  >
                    {nicknameError}
                  </p>
                )}
              </div>
            </div>
            <Button
              onClick={handleNicknameSave}
              disabled={!isNicknameDirty}
              isLoading={updateProfile.isPending}
            >
              Save nickname
            </Button>
          </div>

          {nicknameSaved && (
            <p role="status" className="mt-2 text-sm text-income">
              Nickname saved.
            </p>
          )}
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-text">Currency</h2>
          <p className="mt-1 text-sm text-muted">
            One currency for your whole ledger. Changing it only changes display formatting.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="sm:w-64">
              <Field label="Display currency" htmlFor="currency">
                <Select
                  id="currency"
                  value={currency}
                  onChange={(event) => handleCurrencyChange(event.target.value)}
                >
                  {SUPPORTED_CURRENCIES.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Button
              onClick={handleCurrencySave}
              disabled={!isDirty}
              isLoading={updateProfile.isPending}
            >
              Save currency
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted">
            Preview: <span className="font-medium text-text">{formatCurrency(1234.5, currency)}</span>
            {' · '}No conversion is applied to stored amounts.
          </p>
          {currencySaved && (
            <p role="status" className="mt-2 text-sm text-income">
              Currency saved.
            </p>
          )}
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-text">Appearance</h2>
          <p className="mt-1 text-sm text-muted">Choose a light or dark interface.</p>

          <div
            role="group"
            aria-label="Theme"
            className="mt-4 inline-flex rounded-control border border-border bg-surface-subtle p-1"
          >
            {(['light', 'dark'] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={theme === option}
                disabled={updateProfile.isPending}
                onClick={() => void handleThemeChange(option)}
                className={`min-h-8 rounded-[calc(var(--radius-control)-2px)] px-4 text-sm font-medium capitalize transition-colors disabled:opacity-50 ${
                  theme === option
                    ? 'bg-primary-soft text-primary'
                    : 'text-muted hover:text-text'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </Card>

        {actionError && (
          <p role="alert" className="text-sm text-expense">
            {actionError}
          </p>
        )}
      </div>
    </>
  )
}
