import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'

interface GroupManagerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tournamentId: string
}

export function GroupManagerDialog({ open, onOpenChange, tournamentId }: GroupManagerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Manage Groups</DialogTitle>
          <DialogDescription>
            Tournament ID: {tournamentId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">Group Manager - Migration In Progress</p>
                <p className="text-sm">
                  This feature is being migrated from the Vue application. The Group Manager allows you to:
                </p>
                <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                  <li>Create and manage tournament groups</li>
                  <li>Assign players to groups</li>
                  <li>Set tee times and starting tees</li>
                  <li>Import/export groups via CSV</li>
                  <li>Reorder groups</li>
                </ul>
                <p className="text-sm mt-3">
                  <strong>Temporary Workaround:</strong> Use the original Vue app at{' '}
                  <code className="bg-slate-100 px-1 py-0.5 rounded">scorewrx</code> to manage groups 
                  for tournament: <code className="bg-slate-100 px-1 py-0.5 rounded">{tournamentId}</code>
                </p>
              </div>
            </AlertDescription>
          </Alert>

          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Implementation Notes:</h3>
            <ul className="text-sm space-y-1 text-slate-600">
              <li>• Location: <code>/Users/coosthuizen/Development/scorewrx/src/components/tournaments/GroupManager/</code></li>
              <li>• Main Component: <code>GroupManagerDialog.vue</code></li>
              <li>• Sub-components: GroupList, PlayerSelectionDialog, TeeTimeIntervalInput</li>
              <li>• Features: CSV import/export, drag-and-drop reordering, player assignment</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

