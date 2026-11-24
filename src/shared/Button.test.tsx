import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('renders its label and handles clicks', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Save currency</Button>)

    const button = screen.getByRole('button', { name: 'Save currency' })
    button.click()
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('disables itself while loading', () => {
    render(<Button isLoading>Saving</Button>)
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()
  })
})
