import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-store'
import { useTournamentsStore } from '@/stores/tournaments-store'
import { useCoursesStore } from '@/stores/courses-store'
import { usePlayersStore } from '@/stores/players-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, MapPin, Users, LogOut } from 'lucide-react'
import { useEffect } from 'react'

export default function Dashboard() {
  const navigate = useNavigate()
  const { userProfile, logout } = useAuthStore()
  const { tournaments, fetchTournaments } = useTournamentsStore()
  const { courses, fetchCourses } = useCoursesStore()
  const { players, fetchPlayers } = usePlayersStore()

  useEffect(() => {
    fetchTournaments()
    fetchCourses()
    fetchPlayers()
  }, [fetchTournaments, fetchCourses, fetchPlayers])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      console.error('Failed to logout:', err)
    }
  }

  const stats = [
    {
      title: 'Tournaments',
      value: tournaments.length,
      description: 'Total tournaments',
      icon: Trophy,
      color: 'from-blue-500 to-purple-600',
      action: () => navigate('/tournaments')
    },
    {
      title: 'Courses',
      value: courses.length,
      description: 'Golf courses',
      icon: MapPin,
      color: 'from-emerald-500 to-green-600',
      action: () => navigate('/courses')
    },
    {
      title: 'Players',
      value: players.length,
      description: 'Registered players',
      icon: Users,
      color: 'from-orange-500 to-red-600',
      action: () => navigate('/players')
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">ScoreWRX</h1>
                <p className="text-sm text-slate-600">{userProfile?.affiliation}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome back, {userProfile?.firstName || 'Admin'}!
          </h2>
          <p className="text-slate-600">
            Here's an overview of your golf tournament management system
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, idx) => (
            <Card 
              key={idx} 
              className="hover:shadow-lg transition-shadow duration-200 cursor-pointer"
              onClick={stat.action}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {stat.title}
                </CardTitle>
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
                <p className="text-xs text-slate-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to get you started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col space-y-2"
                onClick={() => navigate('/tournaments')}
              >
                <Trophy className="w-8 h-8 text-blue-600" />
                <span className="font-semibold">Create Tournament</span>
                <span className="text-xs text-slate-500">Start a new tournament</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col space-y-2"
                onClick={() => navigate('/courses')}
              >
                <MapPin className="w-8 h-8 text-green-600" />
                <span className="font-semibold">Add Course</span>
                <span className="text-xs text-slate-500">Add a golf course</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col space-y-2"
                onClick={() => navigate('/players')}
              >
                <Users className="w-8 h-8 text-orange-600" />
                <span className="font-semibold">Add Players</span>
                <span className="text-xs text-slate-500">Manage player database</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        {tournaments.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Recent Tournaments</CardTitle>
              <CardDescription>Your latest tournament activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tournaments.slice(0, 5).map((tournament) => (
                  <div 
                    key={tournament.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => navigate('/tournaments')}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{tournament.name}</p>
                        <p className="text-sm text-slate-500">
                          {new Date(tournament.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      tournament.state === 'Active' ? 'bg-green-100 text-green-700' :
                      tournament.state === 'Open' ? 'bg-blue-100 text-blue-700' :
                      tournament.state === 'Archived' ? 'bg-gray-100 text-gray-600' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {tournament.state}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

