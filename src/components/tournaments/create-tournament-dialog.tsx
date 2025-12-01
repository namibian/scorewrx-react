import { useState, useMemo, useEffect } from 'react'
import { useTournamentsStore } from '@/stores/tournaments-store'
import { useCoursesStore } from '@/stores/courses-store'
import { useAuthStore } from '@/stores/auth-store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle } from 'lucide-react'
import type { Competitions, Tournament } from '@/types'

interface CreateTournamentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingTournament?: Tournament | null
}

interface TournamentFormData {
  // Step 1: Basic Information
  name: string
  date: string
  course: string
  useOnlineRegistration: boolean
  maxRegistrations: number | null
  
  // Step 2: Configuration
  playType: 'Stroke Play' | 'Match Play'
  scoringFormat: 'Individual' | 'Team'
  handicapFormat: 'Custom' | 'Standard'
  shotgunStart: boolean
  shotgunStartTime: string
  defaultStartingTee: 1 | 10
  
  // Step 3: Competitions
  competitions: {
    closestToPin: {
      enabled: boolean
      holes: number[]
      buyIn: number
    }
    longDrive: {
      enabled: boolean
      holes: number[]
      buyIn: number
    }
    skins: {
      enabled: boolean
      handicap: boolean
      handicapCalculation: string
      handicapBuyIn: number
      useHalfStrokeOnPar3: boolean
      scratch: boolean
      scratchBuyIn: number
    }
  }
}

const initialFormData: TournamentFormData = {
  name: '',
  date: '',
  course: '',
  useOnlineRegistration: false,
  maxRegistrations: null,
  playType: 'Stroke Play',
  scoringFormat: 'Individual',
  handicapFormat: 'Custom',
  shotgunStart: false,
  shotgunStartTime: '08:00',
  defaultStartingTee: 1,
  competitions: {
    closestToPin: {
      enabled: false,
      holes: [],
      buyIn: 0
    },
    longDrive: {
      enabled: false,
      holes: [],
      buyIn: 0
    },
    skins: {
      enabled: true,
      handicap: true,
      handicapCalculation: '1 Stroke maximum per hole',
      handicapBuyIn: 5.00,
      useHalfStrokeOnPar3: true,
      scratch: true,
      scratchBuyIn: 5.00
    }
  }
}

export function CreateTournamentDialog({ open, onOpenChange, editingTournament }: CreateTournamentDialogProps) {
  const { createTournament, updateTournament, loading } = useTournamentsStore()
  const { courses, loading: coursesLoading } = useCoursesStore()
  const { user, userProfile } = useAuthStore()

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<TournamentFormData>(initialFormData)
  const [error, setError] = useState('')

  // Load tournament data when editing
  useEffect(() => {
    if (open && editingTournament) {
      // Parse shotgun start
      const shotgunStartObj = typeof editingTournament.shotgunStart === 'object'
        ? editingTournament.shotgunStart
        : { enabled: editingTournament.shotgunStart || false, startTime: editingTournament.shotgunStartTime || '08:00' }

      setFormData({
        name: editingTournament.name,
        date: typeof editingTournament.date === 'string' 
          ? editingTournament.date 
          : editingTournament.date.toISOString().split('T')[0],
        course: editingTournament.course || editingTournament.courseId || '',
        useOnlineRegistration: editingTournament.useOnlineRegistration || false,
        maxRegistrations: editingTournament.maxRegistrations || null,
        playType: editingTournament.playType || 'Stroke Play',
        scoringFormat: editingTournament.scoringFormat || 'Individual',
        handicapFormat: editingTournament.handicapFormat || 'Custom',
        shotgunStart: shotgunStartObj.enabled,
        shotgunStartTime: shotgunStartObj.startTime,
        defaultStartingTee: editingTournament.defaultStartingTee || 1,
        competitions: {
          closestToPin: {
            enabled: editingTournament.competitions?.closestToPin?.enabled || false,
            holes: editingTournament.competitions?.closestToPin?.holes || [],
            buyIn: editingTournament.competitions?.closestToPin?.buyIn || 0
          },
          longDrive: {
            enabled: editingTournament.competitions?.longDrive?.enabled || false,
            holes: editingTournament.competitions?.longDrive?.holes || [],
            buyIn: editingTournament.competitions?.longDrive?.buyIn || 0
          },
          skins: {
            enabled: editingTournament.competitions?.skins?.enabled || false,
            handicap: true,
            handicapCalculation: '1 Stroke maximum per hole',
            handicapBuyIn: editingTournament.competitions?.skins?.handicapBuyIn || 5.00,
            useHalfStrokeOnPar3: editingTournament.competitions?.skins?.useHalfStrokeOnPar3 ?? true,
            scratch: true,
            scratchBuyIn: editingTournament.competitions?.skins?.scratchBuyIn || 5.00
          }
        }
      })
    } else if (open && !editingTournament) {
      // Reset to initial state when creating new
      setFormData(initialFormData)
    }
  }, [open, editingTournament])

  // Get par 3 holes from selected course
  const parThreeHoles = useMemo(() => {
    if (!formData.course) return []
    const course = courses.find(c => c.id === formData.course)
    if (!course?.teeboxes?.[0]?.holes) return []
    
    return course.teeboxes[0].holes
      .map((hole, index) => ({ hole: index + 1, par: hole.par, yardage: hole.yardage }))
      .filter(h => h.par === 3)
  }, [formData.course, courses])

  // Get long drive holes (par 4 and 5)
  const longDriveHoles = useMemo(() => {
    if (!formData.course) return []
    const course = courses.find(c => c.id === formData.course)
    if (!course?.teeboxes?.[0]?.holes) return []
    
    return course.teeboxes[0].holes
      .map((hole, index) => ({ hole: index + 1, par: hole.par, yardage: hole.yardage }))
      .filter(h => h.par > 3)
  }, [formData.course, courses])

  const updateFormData = (updates: Partial<TournamentFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const updateCompetition = (competition: 'closestToPin' | 'longDrive' | 'skins', updates: any) => {
    setFormData(prev => ({
      ...prev,
      competitions: {
        ...prev.competitions,
        [competition]: {
          ...prev.competitions[competition],
          ...updates
        }
      }
    }))
  }

  const validateStep = (stepNumber: number): boolean => {
    setError('')
    
    if (stepNumber === 1) {
      if (!formData.name) {
        setError('Tournament name is required')
        return false
      }
      if (!formData.date) {
        setError('Tournament date is required')
        return false
      }
      if (!formData.course) {
        setError('Course selection is required')
        return false
      }
      if (courses.length === 0) {
        setError('No courses available. Please add a course first.')
        return false
      }
    }
    
    if (stepNumber === 2) {
      if (formData.shotgunStart && !formData.shotgunStartTime) {
        setError('Start time is required when shotgun start is enabled')
        return false
      }
    }
    
    return true
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 3))
    }
  }

  const handleBack = () => {
    setError('')
    setStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(3)) return
    
    if (!user || !userProfile) {
      setError('You must be logged in to create a tournament')
      return
    }

    try {
      // Build competitions object - only include enabled competitions
      const competitions: Competitions = {}
      
      if (formData.competitions.closestToPin.enabled) {
        competitions.closestToPin = {
          enabled: true,
          holes: formData.competitions.closestToPin.holes,
          buyIn: formData.competitions.closestToPin.buyIn
        }
      }
      
      if (formData.competitions.longDrive.enabled) {
        competitions.longDrive = {
          enabled: true,
          holes: formData.competitions.longDrive.holes,
          buyIn: formData.competitions.longDrive.buyIn
        }
      }
      
      if (formData.competitions.skins.enabled) {
        competitions.skins = {
          enabled: true,
          scratchBuyIn: formData.competitions.skins.scratchBuyIn,
          handicapBuyIn: formData.competitions.skins.handicapBuyIn,
          useHalfStrokeOnPar3: formData.competitions.skins.useHalfStrokeOnPar3
        }
      }

      const tournamentData = {
        name: formData.name,
        date: formData.date,
        courseId: formData.course,
        course: formData.course,
        affiliation: userProfile.affiliation,
        shotgunStart: formData.shotgunStart,
        shotgunStartTime: formData.shotgunStart ? formData.shotgunStartTime : undefined,
        playType: formData.playType,
        scoringFormat: formData.scoringFormat,
        handicapFormat: formData.handicapFormat,
        defaultStartingTee: formData.shotgunStart ? undefined : formData.defaultStartingTee,
        useOnlineRegistration: formData.useOnlineRegistration,
        maxRegistrations: formData.maxRegistrations,
        competitions: Object.keys(competitions).length > 0 ? competitions : undefined,
        lastUpdated: new Date()
      }

      if (editingTournament) {
        // Update existing tournament
        await updateTournament(editingTournament.id, tournamentData)
      } else {
        // Create new tournament
        await createTournament({
          ...tournamentData,
          state: 'Created',
          code: '',
          createdBy: user.uid,
          createdAt: new Date()
        })
      }
      
      // Reset form
      setFormData(initialFormData)
      setStep(1)
      setError('')
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || `Failed to ${editingTournament ? 'update' : 'create'} tournament`)
    }
  }

  const handleCancel = () => {
    setFormData(initialFormData)
    setStep(1)
    setError('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {editingTournament ? 'Edit Tournament' : 'Create Tournament'}
          </DialogTitle>
          <DialogDescription>
            {step === 1 ? 'Tournament Information' : step === 2 ? 'Tournament Configuration' : 'Competitions'} - Step {step} of 3
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Step 1: Tournament Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold">
                  Tournament Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Enter tournament name"
                  value={formData.name}
                  onChange={(e) => updateFormData({ name: e.target.value })}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-semibold">
                  Tournament Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => updateFormData({ date: e.target.value })}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="course" className="text-sm font-semibold">
                  Select Course <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.course} onValueChange={(value) => updateFormData({ course: value })}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={coursesLoading ? "Loading courses..." : "Select a course"} />
                  </SelectTrigger>
                  <SelectContent>
                    {coursesLoading ? (
                      <div className="p-2 text-sm text-slate-500">
                        Loading courses...
                      </div>
                    ) : courses.length === 0 ? (
                      <div className="p-2 text-sm text-slate-500">
                        No courses available. Create a course first.
                      </div>
                    ) : (
                      courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {!coursesLoading && courses.length > 0 && (
                  <p className="text-xs text-slate-500">
                    {courses.length} course{courses.length !== 1 ? 's' : ''} available
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <Label htmlFor="useOnlineRegistration" className="text-sm font-semibold cursor-pointer">
                  Use online registration
                </Label>
                <Checkbox
                  id="useOnlineRegistration"
                  checked={formData.useOnlineRegistration}
                  onCheckedChange={(checked) => updateFormData({ useOnlineRegistration: checked as boolean })}
                />
              </div>

              {formData.useOnlineRegistration && (
                <div className="space-y-2">
                  <Label htmlFor="maxRegistrations" className="text-sm font-semibold">
                    Maximum Registrations (Optional)
                  </Label>
                  <Input
                    id="maxRegistrations"
                    type="number"
                    min="1"
                    placeholder="Leave empty for unlimited"
                    value={formData.maxRegistrations || ''}
                    onChange={(e) => updateFormData({ 
                      maxRegistrations: e.target.value ? parseInt(e.target.value) : null 
                    })}
                    className="h-11"
                  />
                  <p className="text-sm text-slate-500">Leave empty for unlimited registrations</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Tournament Configuration */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="playType" className="text-sm font-semibold">
                  Tournament Play Type <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.playType} 
                  onValueChange={(value) => updateFormData({ playType: value as 'Stroke Play' | 'Match Play' })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Stroke Play">Stroke Play</SelectItem>
                    <SelectItem value="Match Play">Match Play</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scoringFormat" className="text-sm font-semibold">
                  Tournament Scoring Format <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.scoringFormat} 
                  onValueChange={(value) => updateFormData({ scoringFormat: value as 'Individual' | 'Team' })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Individual">Individual</SelectItem>
                    <SelectItem value="Team">Team</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="handicapFormat" className="text-sm font-semibold">
                  Handicap Format <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.handicapFormat} 
                  onValueChange={(value) => updateFormData({ handicapFormat: value as 'Custom' | 'Standard' })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Custom">Custom</SelectItem>
                    <SelectItem value="Standard">Standard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <Label htmlFor="shotgunStart" className="text-sm font-semibold cursor-pointer">
                  Shotgun Start
                </Label>
                <Checkbox
                  id="shotgunStart"
                  checked={formData.shotgunStart}
                  onCheckedChange={(checked) => updateFormData({ shotgunStart: checked as boolean })}
                />
              </div>

              {formData.shotgunStart && (
                <div className="space-y-2">
                  <Label htmlFor="shotgunStartTime" className="text-sm font-semibold">
                    Start Time <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="shotgunStartTime"
                    type="time"
                    value={formData.shotgunStartTime}
                    onChange={(e) => updateFormData({ shotgunStartTime: e.target.value })}
                    className="h-11"
                  />
                </div>
              )}

              {!formData.shotgunStart && (
                <div className="space-y-2">
                  <Label htmlFor="defaultStartingTee" className="text-sm font-semibold">
                    Starting Tee
                  </Label>
                  <Select 
                    value={formData.defaultStartingTee.toString()} 
                    onValueChange={(value) => updateFormData({ defaultStartingTee: parseInt(value) as 1 | 10 })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1st Tee</SelectItem>
                      <SelectItem value="10">10th Tee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Competitions */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Closest to Pin */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Closest to Pin</Label>
                  <Checkbox
                    checked={formData.competitions.closestToPin.enabled}
                    onCheckedChange={(checked) => updateCompetition('closestToPin', { enabled: checked })}
                  />
                </div>
                {formData.competitions.closestToPin.enabled && (
                  <div className="space-y-3 pl-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Select Holes (Par 3s)</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {parThreeHoles.map(({ hole }) => (
                          <div key={hole} className="flex items-center space-x-2">
                            <Checkbox
                              id={`ctp-${hole}`}
                              checked={formData.competitions.closestToPin.holes.includes(hole)}
                              onCheckedChange={(checked) => {
                                const holes = checked
                                  ? [...formData.competitions.closestToPin.holes, hole]
                                  : formData.competitions.closestToPin.holes.filter(h => h !== hole)
                                updateCompetition('closestToPin', { holes })
                              }}
                            />
                            <Label htmlFor={`ctp-${hole}`} className="text-sm cursor-pointer">
                              Hole {hole}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Player Buy-in Amount ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.competitions.closestToPin.buyIn}
                        onChange={(e) => updateCompetition('closestToPin', { buyIn: parseFloat(e.target.value) || 0 })}
                        className="h-10"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Long Drive */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Long Drive</Label>
                  <Checkbox
                    checked={formData.competitions.longDrive.enabled}
                    onCheckedChange={(checked) => updateCompetition('longDrive', { enabled: checked })}
                  />
                </div>
                {formData.competitions.longDrive.enabled && (
                  <div className="space-y-3 pl-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Select Holes (Par 4s and 5s)</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {longDriveHoles.map(({ hole }) => (
                          <div key={hole} className="flex items-center space-x-2">
                            <Checkbox
                              id={`ld-${hole}`}
                              checked={formData.competitions.longDrive.holes.includes(hole)}
                              onCheckedChange={(checked) => {
                                const holes = checked
                                  ? [...formData.competitions.longDrive.holes, hole]
                                  : formData.competitions.longDrive.holes.filter(h => h !== hole)
                                updateCompetition('longDrive', { holes })
                              }}
                            />
                            <Label htmlFor={`ld-${hole}`} className="text-sm cursor-pointer">
                              Hole {hole}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Player Buy-in Amount ($)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.competitions.longDrive.buyIn}
                        onChange={(e) => updateCompetition('longDrive', { buyIn: parseFloat(e.target.value) || 0 })}
                        className="h-10"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Skins */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Skins</Label>
                  <Checkbox
                    checked={formData.competitions.skins.enabled}
                    onCheckedChange={(checked) => updateCompetition('skins', { enabled: checked })}
                  />
                </div>
                {formData.competitions.skins.enabled && (
                  <div className="space-y-3 pl-4">
                    {/* Handicap Skins */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="handicap-skins"
                          checked={formData.competitions.skins.handicap}
                          onCheckedChange={(checked) => updateCompetition('skins', { handicap: checked })}
                        />
                        <Label htmlFor="handicap-skins" className="text-sm font-medium cursor-pointer">
                          Handicap Skins
                        </Label>
                      </div>
                      {formData.competitions.skins.handicap && (
                        <div className="pl-6 space-y-3">
                          <div className="space-y-2">
                            <Label className="text-sm">Handicap Buy-in ($)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={formData.competitions.skins.handicapBuyIn}
                              onChange={(e) => updateCompetition('skins', { handicapBuyIn: parseFloat(e.target.value) || 0 })}
                              className="h-10"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="half-stroke-par3"
                              checked={formData.competitions.skins.useHalfStrokeOnPar3}
                              onCheckedChange={(checked) => updateCompetition('skins', { useHalfStrokeOnPar3: checked })}
                            />
                            <Label htmlFor="half-stroke-par3" className="text-sm cursor-pointer">
                              Use Half Stroke on Par 3s
                            </Label>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Scratch Skins */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="scratch-skins"
                          checked={formData.competitions.skins.scratch}
                          onCheckedChange={(checked) => updateCompetition('skins', { scratch: checked })}
                        />
                        <Label htmlFor="scratch-skins" className="text-sm font-medium cursor-pointer">
                          Scratch Skins
                        </Label>
                      </div>
                      {formData.competitions.skins.scratch && (
                        <div className="pl-6 space-y-2">
                          <Label className="text-sm">Scratch Buy-in ($)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.competitions.skins.scratchBuyIn}
                            onChange={(e) => updateCompetition('skins', { scratchBuyIn: parseFloat(e.target.value) || 0 })}
                            className="h-10"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={loading}
            >
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
            >
              Next
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
              >
                {loading ? (editingTournament ? 'Updating...' : 'Creating...') : (editingTournament ? 'Update Tournament' : 'Create Tournament')}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

