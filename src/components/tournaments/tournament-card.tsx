import { Tournament } from '@/types'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Trophy, 
  Calendar, 
  Tag, 
  Users, 
  MoreVertical,
  Edit,
  Trash2,
  QrCode,
  FileDown,
  CheckCircle
} from 'lucide-react'
import { format } from 'date-fns'

interface TournamentCardProps {
  tournament: Tournament
  onEdit: (tournament: Tournament) => void
  onManageGroups: (tournament: Tournament) => void
  onShowCode: (tournament: Tournament) => void
  onExport: (tournament: Tournament) => void
  onFinalize: (tournament: Tournament) => void
  onDelete: (tournament: Tournament) => void
}

const getStateColor = (state: string) => {
  switch (state) {
    case 'Created': return 'bg-slate-100 text-slate-700'
    case 'Open': return 'bg-blue-100 text-blue-700'
    case 'Active': return 'bg-green-100 text-green-700'
    case 'Archived': return 'bg-gray-100 text-gray-600'
    default: return 'bg-slate-100 text-slate-700'
  }
}

const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, 'MMM d, yyyy')
}

export function TournamentCard({
  tournament,
  onEdit,
  onManageGroups,
  onShowCode,
  onExport,
  onFinalize,
  onDelete
}: TournamentCardProps) {
  const hasGroups = tournament.groups && tournament.groups.length > 0
  const canExport = hasGroups && tournament.state === 'Archived'

  const registrationStats = tournament.registeredPlayers 
    ? {
        accepted: tournament.registeredPlayers.filter(p => p.status === 'accepted').length,
        total: tournament.registeredPlayers.length
      }
    : null

  return (
    <Card className="tournament-card hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 leading-tight">
                {tournament.name}
              </h3>
              <Badge className={`mt-1 ${getStateColor(tournament.state)}`}>
                {tournament.state}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(tournament.date)}</span>
          </div>
          {tournament.code && (
            <div className="flex items-center space-x-2">
              <Tag className="w-4 h-4" />
              <span className="font-mono font-semibold">{tournament.code}</span>
            </div>
          )}
          {tournament.useOnlineRegistration && registrationStats && registrationStats.total > 0 && (
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>
                {registrationStats.accepted}/{tournament.maxRegistrations || '∞'} registered
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 pt-3 border-t">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onEdit(tournament)}
          className="flex-1"
        >
          <Edit className="w-4 h-4 mr-1" />
          Edit
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onManageGroups(tournament)}
          disabled={tournament.useOnlineRegistration && tournament.state !== 'Active'}
          className="flex-1"
        >
          <Users className="w-4 h-4 mr-1" />
          Groups
        </Button>
        
        {hasGroups && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onShowCode(tournament)}
            className="flex-1"
          >
            <QrCode className="w-4 h-4 mr-1" />
            Code
          </Button>
        )}
        
        {canExport && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onExport(tournament)}
            className="flex-1"
          >
            <FileDown className="w-4 h-4 mr-1" />
            Export
          </Button>
        )}

        {tournament.state === 'Active' && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onFinalize(tournament)}
            className="flex-1 text-green-600 hover:text-green-700"
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Finalize
          </Button>
        )}

        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onDelete(tournament)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}

