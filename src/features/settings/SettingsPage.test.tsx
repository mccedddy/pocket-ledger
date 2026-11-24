import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SettingsPage } from './SettingsPage'

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useProfile: vi.fn(),
  useUpdateProfile: vi.fn(),
  useTheme: vi.fn(),
  mutateAsync: vi.fn(),
}))

vi.mock('../auth/authContext', () => ({
  useAuth: mocks.useAuth,
}))

vi.mock('./useProfile', () => ({
  useProfile: mocks.useProfile,
  useUpdateProfile: mocks.useUpdateProfile,
}))

vi.mock('../../app/themeContext', () => ({
  useTheme: mocks.useTheme,
}))

const profile = {
  id: 'user-1',
  nickname: 'Alex',
  currency_code: 'USD',
  theme: 'light' as const,
  created_at: '2026-11-24T00:00:00.000Z',
  updated_at: '2026-11-24T00:00:00.000Z',
}

beforeEach(() => {
  mocks.useAuth.mockReturnValue({
    session: { user: { id: profile.id } },
    isLoading: false,
    signOut: vi.fn(),
  })
  mocks.useProfile.mockReturnValue({
    isLoading: false,
    isError: false,
    data: profile,
    refetch: vi.fn(),
  })
  mocks.mutateAsync.mockReset()
  mocks.mutateAsync.mockResolvedValue(profile)
  mocks.useUpdateProfile.mockReturnValue({
    mutateAsync: mocks.mutateAsync,
    isPending: false,
  })
  mocks.useTheme.mockReturnValue({ theme: 'light', setTheme: vi.fn() })
})

describe('SettingsPage nickname', () => {
  it('offers PHP and rejects a blank nickname', async () => {
    render(<SettingsPage />)

    expect(screen.getByRole('option', { name: 'PHP' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Nickname'), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save nickname' }))

    expect(await screen.findByText('Enter a nickname.')).toBeInTheDocument()
    expect(mocks.mutateAsync).not.toHaveBeenCalled()
  })

  it('saves a normalized nickname', async () => {
    render(<SettingsPage />)

    fireEvent.change(screen.getByLabelText('Nickname'), {
      target: { value: '  Alex   Morgan  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save nickname' }))

    await waitFor(() => {
      expect(mocks.mutateAsync).toHaveBeenCalledWith({ nickname: 'Alex Morgan' })
    })
    expect(await screen.findByText('Nickname saved.')).toBeInTheDocument()
  })
})
