import { Tournament } from '@/types'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
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
  UsersRound,
  Target,
  CheckCircle,
  Send,
  Link,
  ClipboardList,
  UserPlus
} from 'lucide-react'
import { format } from 'date-fns'
import { canExportTournament } from '@/lib/export-utils'

interface TournamentCardProps {
  tournament: Tournament
  onEdit: (tournament: Tournament) => void
  onManageGroups: (tournament: Tournament) => void
  onShowCode: (tournament: Tournament) => void
  onExport: (tournament: Tournament) => void
  onDelete: (tournament: Tournament) => void
  onScoringPage?: (tournament: Tournament) => void
  onFinalize?: (tournament: Tournament) => void
  onOpenRegistration?: (tournament: Tournament) => void
  onCopyLink?: (tournament: Tournament) => void
  onViewRegistrations?: (tournament: Tournament) => void
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
  onDelete,
  onScoringPage,
  onFinalize,
  onOpenRegistration,
  onCopyLink,
  onViewRegistrations
}: TournamentCardProps) {
  const hasGroups = tournament.groups && tournament.groups.length > 0
  const exportEnabled = canExportTournament(tournament)
  const isPastTournament = tournament.state === 'Archived'
  const isActive = tournament.state === 'Active'
  const isCreated = tournament.state === 'Created'
  const isOpen = tournament.state === 'Open'
  const hasOnlineRegistration = tournament.useOnlineRegistration

  const registrationStats = tournament.registeredPlayers 
    ? {
        accepted: tournament.registeredPlayers.filter(p => p.status === 'accepted').length,
        total: tournament.registeredPlayers.length
      }
    : null

  // Check if any registration menu items should be shown
  const showRegistrationSubmenu = hasOnlineRegistration && (
    isCreated || isOpen || isActive || (registrationStats && registrationStats.total > 0)
  )

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
          {!isPastTournament && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => onEdit(tournament)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Tournament
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => onManageGroups(tournament)}
                  disabled={hasOnlineRegistration && !isActive}
                >
                  <UsersRound className="w-4 h-4 mr-2" />
                  Manage Groups
                  {hasOnlineRegistration && !isActive && (
                    <span className="ml-auto text-xs text-slate-400">Close reg first</span>
                  )}
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                {/* Registration Submenu */}
                {showRegistrationSubmenu && (
                  <>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Registration
                        {registrationStats && registrationStats.accepted > 0 && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {registrationStats.accepted}
                          </Badge>
                        )}
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        {isCreated && (
                          <DropdownMenuItem 
                            onClick={() => onOpenRegistration?.(tournament)}
                            className="text-green-600 focus:text-green-600 focus:bg-green-50"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Open Registration
                          </DropdownMenuItem>
                        )}
                        
                        {isOpen && (
                          <DropdownMenuItem onClick={() => onCopyLink?.(tournament)}>
                            <Link className="w-4 h-4 mr-2" />
                            Copy Registration Link
                          </DropdownMenuItem>
                        )}
                        
                        {(isOpen || isActive || (registrationStats && registrationStats.total > 0)) && (
                          <DropdownMenuItem onClick={() => onViewRegistrations?.(tournament)}>
                            <ClipboardList className="w-4 h-4 mr-2" />
                            View Registrations
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                  </>
                )}
                
                <DropdownMenuItem 
                  onClick={() => onScoringPage?.(tournament)}
                  disabled={!hasGroups}
                >
                  <Target className="w-4 h-4 mr-2" />
                  Scoring Page
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => onShowCode(tournament)}
                  disabled={!tournament.code}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Show Code & Link
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => onExport(tournament)}
                  disabled={!exportEnabled}
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Export Data
                </DropdownMenuItem>
                
                {isActive && (
                  <DropdownMenuItem 
                    onClick={() => onFinalize?.(tournament)}
                    className="text-green-600 focus:text-green-600 focus:bg-green-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Finalize Tournament
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={() => onDelete(tournament)}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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

      <CardFooter className="flex gap-2 pt-3 border-t">
        {isPastTournament ? (
          // Past tournaments - Export and Delete only
          <>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onExport(tournament)}
              className="flex-1"
            >
              <FileDown className="w-4 h-4 mr-1" />
              Export
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onDelete(tournament)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </>
        ) : (
          // Upcoming tournaments - Consistent buttons: Edit, Groups, Code, Delete
          <>
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
              disabled={hasOnlineRegistration && !isActive}
              className="flex-1"
              title={hasOnlineRegistration && !isActive ? 'Close registration before managing groups' : undefined}
            >
              <UsersRound className="w-4 h-4 mr-1" />
              Groups
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onShowCode(tournament)}
              disabled={!tournament.code}
              className="flex-1"
            >
              <QrCode className="w-4 h-4 mr-1" />
              Code
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onDelete(tournament)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
