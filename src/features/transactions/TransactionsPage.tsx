import { Card } from '../../shared/Card'
import { PageHeader } from '../../shared/PageHeader'

/**
 * Phase 1 placeholder only. F-005 (transaction history) is built in Phase 2.
 */
export function TransactionsPage() {
  return (
    <>
      <PageHeader
        title="Transactions"
        description="Your ledger history will appear here."
      />
      <Card>
        <p className="text-sm text-muted">
          The foundation is ready. Accounts, categories, records, and history are part of Phase 2 and
          are not implemented yet.
        </p>
      </Card>
    </>
  )
}
