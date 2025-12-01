import { useEffect, useState } from 'react'
import { Player } from '@/types'
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

interface PlayerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  player?: Player | null
  onSave: (playerData: Partial<Player>) => Promise<void>
}

interface PlayerFormData {
  firstName: string
  lastName: string
  email: string
  affiliation: string
  handicapIndex: number | null
  shortName: string
}

export function PlayerDialog({ open, onOpenChange, player, onSave }: PlayerDialogProps) {
  const [formData, setFormData] = useState<PlayerFormData>({
    firstName: '',
    lastName: '',
    email: '',
    affiliation: '',
    handicapIndex: null,
    shortName: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Auto-generate short name when first name or last name changes
  useEffect(() => {
    if (formData.firstName || formData.lastName) {
      const lastInitial = formData.lastName ? formData.lastName.charAt(0) : ''
      const shortName = `${formData.firstName} ${lastInitial}`.trim()
      setFormData((prev) => ({ ...prev, shortName }))
    }
  }, [formData.firstName, formData.lastName])

  // Populate form when player prop changes (for editing)
  useEffect(() => {
    if (player) {
      setFormData({
        firstName: player.firstName,
        lastName: player.lastName,
        email: player.email || '',
        affiliation: player.affiliation || '',
        handicapIndex: player.handicapIndex,
        shortName: player.shortName || `${player.firstName} ${player.lastName.charAt(0)}`.trim(),
      })
    } else {
      // Reset form for new player
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        affiliation: '',
        handicapIndex: null,
        shortName: '',
      })
    }
    setErrors({})
  }, [player, open])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    if (!formData.shortName.trim()) {
      newErrors.shortName = 'Short name is required'
    }

    if (formData.email && !/^[^@]+@[^@]+\.[^@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (
      formData.handicapIndex !== null &&
      (formData.handicapIndex < -10 || formData.handicapIndex > 54)
    ) {
      newErrors.handicapIndex = 'Handicap must be between -10 and 54'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      await onSave(formData)
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving player:', error)
      // Error handling is done in parent component
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{player ? 'Edit Player' : 'Add Player'}</DialogTitle>
          <DialogDescription>
            {player
              ? 'Update the player information below.'
              : 'Enter the player information below.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* First Name */}
          <div className="grid gap-2">
            <Label htmlFor="firstName">
              First Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="John"
              autoComplete="given-name"
            />
            {errors.firstName && (
              <p className="text-sm text-red-500">{errors.firstName}</p>
            )}
          </div>

          {/* Last Name */}
          <div className="grid gap-2">
            <Label htmlFor="lastName">
              Last Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="Doe"
              autoComplete="family-name"
            />
            {errors.lastName && (
              <p className="text-sm text-red-500">{errors.lastName}</p>
            )}
          </div>

          {/* Email */}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john.doe@example.com"
              autoComplete="email"
            />
            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
          </div>

          {/* Affiliation */}
          <div className="grid gap-2">
            <Label htmlFor="affiliation">Affiliation</Label>
            <Input
              id="affiliation"
              value={formData.affiliation}
              onChange={(e) => setFormData({ ...formData, affiliation: e.target.value })}
              placeholder="Golf Club Name"
              autoComplete="organization"
            />
          </div>

          {/* Handicap Index */}
          <div className="grid gap-2">
            <Label htmlFor="handicapIndex">Handicap Index</Label>
            <Input
              id="handicapIndex"
              type="number"
              step="0.1"
              value={formData.handicapIndex ?? ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  handicapIndex: e.target.value ? parseFloat(e.target.value) : null,
                })
              }
              placeholder="12.4"
              autoComplete="off"
            />
            {errors.handicapIndex && (
              <p className="text-sm text-red-500">{errors.handicapIndex}</p>
            )}
          </div>

          {/* Short Name (read-only) */}
          <div className="grid gap-2">
            <Label htmlFor="shortName">
              Short Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="shortName"
              value={formData.shortName}
              readOnly
              disabled
              className="bg-slate-50"
            />
            {errors.shortName && (
              <p className="text-sm text-red-500">{errors.shortName}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

