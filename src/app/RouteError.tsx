import { isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { FullPageState } from '../shared/FullPageState'

export function RouteError() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : 'An unexpected error occurred.'

  return (
    <FullPageState>
      <h1 className="mb-2 text-lg font-semibold text-text">Something went wrong</h1>
      <p>{message}</p>
    </FullPageState>
  )
}
