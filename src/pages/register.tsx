import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Mail, Lock, Eye, EyeOff, User, Building2, Trophy, Smartphone, BarChart } from 'lucide-react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { Logo } from '@/components/common/logo'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { signup, loading } = useAuthStore()
  
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [affiliation, setAffiliation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const benefits = [
    {
      icon: Trophy,
      title: 'Tournament Tools',
      description: 'Comprehensive tournament management with real-time scoring'
    },
    {
      icon: Smartphone,
      title: 'Mobile Ready',
      description: 'Score on the go with our mobile-optimized platform'
    },
    {
      icon: BarChart,
      title: 'Advanced Analytics',
      description: 'Track performance and generate detailed reports'
    }
  ]

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!firstName || !lastName || !email || !password || !affiliation) {
      setError('Please fill in all fields')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    try {
      await signup(email, password)
      
      // Get the current user from auth store
      const currentUser = useAuthStore.getState().user
      if (!currentUser) {
        throw new Error('User not found after signup')
      }

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', currentUser.uid), {
        firstName,
        lastName,
        email,
        affiliation,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      navigate('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-6xl flex rounded-3xl overflow-hidden shadow-2xl bg-white">
        {/* Left Side - Form */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
          <Card className="w-full max-w-lg border-0 shadow-none">
            <CardHeader className="space-y-2 text-center pb-8">
              <CardTitle className="text-3xl font-bold text-slate-900">Create Account</CardTitle>
              <CardDescription className="text-base text-slate-600">
                Get started with ScoreWRX today
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-semibold text-slate-700">
                      First Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="Enter first name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="pl-10 h-11"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-semibold text-slate-700">
                      Last Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Enter last name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="pl-10 h-11"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-11"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">Must be at least 6 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="affiliation" className="text-sm font-semibold text-slate-700">
                    Organization / Affiliation
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="affiliation"
                      type="text"
                      placeholder="Enter your organization"
                      value={affiliation}
                      onChange={(e) => setAffiliation(e.target.value)}
                      className="pl-10 h-11"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transition-all duration-200 mt-6"
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4 pt-6">
                <p className="text-sm text-slate-600 text-center">
                  Already have an account?{' '}
                  <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                    Sign in instead
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Right Side - Branding */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-green-600 to-emerald-600 p-12 flex-col justify-center relative overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-xl animate-blob" />
            <div className="absolute top-0 -right-4 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000" />
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000" />
          </div>

          <div className="relative z-10">
            <div className="mb-8">
              <Logo size={100} className="drop-shadow-xl" />
            </div>
            
            <h2 className="text-5xl font-bold text-white mb-4 leading-tight">
              Join <span className="text-emerald-300">ScoreWRX</span>
            </h2>
            
            <p className="text-xl text-white/90 mb-12">
              Start managing your golf tournaments like a pro
            </p>

            <div className="space-y-8">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-lg rounded-xl flex items-center justify-center">
                      <benefit.icon className="w-7 h-7 text-white" />
                    </div>
                    <h4 className="text-xl font-bold text-white">{benefit.title}</h4>
                  </div>
                  <p className="text-base text-white/90 ml-17">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

