import { useEffect, useState } from 'react'
import { Teebox } from '@/types'
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
import { toast } from 'sonner'

interface TeeboxDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teebox?: Teebox | null
  onSave: (teebox: Teebox) => void
}

interface HoleData {
  par: number | null
  yardage: number | null
  handicap: number | null
}

interface TeeboxFormData {
  name: string
  slope: number | null
  rating: number | null
  holes: HoleData[]
}

const createEmptyHoles = (): HoleData[] => {
  return Array(18).fill(null).map(() => ({
    par: null,
    yardage: null,
    handicap: null
  }))
}

const initialFormData: TeeboxFormData = {
  name: '',
  slope: null,
  rating: null,
  holes: createEmptyHoles()
}

export function TeeboxDialog({ open, onOpenChange, teebox, onSave }: TeeboxDialogProps) {
  const [formData, setFormData] = useState<TeeboxFormData>(initialFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when dialog opens/closes or teebox changes
  useEffect(() => {
    if (open) {
      if (teebox) {
        setFormData({
          name: teebox.name,
          slope: teebox.slope ?? null,
          rating: teebox.rating ?? null,
          holes: teebox.holes?.map(h => ({
            par: h.par ?? null,
            yardage: h.yardage ?? null,
            handicap: h.handicap ?? null
          })) || createEmptyHoles()
        })
      } else {
        setFormData({
          ...initialFormData,
          holes: createEmptyHoles()
        })
      }
      setErrors({})
    }
  }, [open, teebox])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Teebox name is required'
    }

    if (!formData.slope || formData.slope < 55 || formData.slope > 155) {
      newErrors.slope = 'Slope must be between 55 and 155'
    }

    if (!formData.rating || formData.rating < 60 || formData.rating > 80) {
      newErrors.rating = 'Rating must be between 60 and 80'
    }

    // Validate holes
    const usedHandicaps = new Set<number>()
    let hasHoleErrors = false

    formData.holes.forEach((hole) => {
      if (!hole.par || ![3, 4, 5].includes(hole.par)) {
        hasHoleErrors = true
      }
      if (!hole.yardage || hole.yardage <= 0) {
        hasHoleErrors = true
      }
      if (!hole.handicap || hole.handicap < 1 || hole.handicap > 18) {
        hasHoleErrors = true
      } else {
        if (usedHandicaps.has(hole.handicap)) {
          hasHoleErrors = true
          newErrors.holes = `Duplicate handicap value: ${hole.handicap}`
        }
        usedHandicaps.add(hole.handicap)
      }
    })

    if (hasHoleErrors && !newErrors.holes) {
      newErrors.holes = 'All holes must have valid par (3-5), yardage, and unique handicap (1-18)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before saving')
      return
    }

    const teeboxData: Teebox = {
      name: formData.name.trim(),
      slope: formData.slope!,
      rating: formData.rating!,
      holes: formData.holes.map(h => ({
        par: h.par as 3 | 4 | 5,
        yardage: h.yardage!,
        handicap: h.handicap!
      }))
    }

    onSave(teeboxData)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  const updateHole = (index: number, field: keyof HoleData, value: string) => {
    const numValue = value === '' ? null : parseInt(value, 10)
    setFormData(prev => ({
      ...prev,
      holes: prev.holes.map((hole, i) => 
        i === index ? { ...hole, [field]: numValue } : hole
      )
    }))
  }

  // Calculate totals
  const frontNinePar = formData.holes.slice(0, 9).reduce((sum, h) => sum + (h.par || 0), 0)
  const backNinePar = formData.holes.slice(9, 18).reduce((sum, h) => sum + (h.par || 0), 0)
  const totalPar = frontNinePar + backNinePar
  const frontNineYardage = formData.holes.slice(0, 9).reduce((sum, h) => sum + (h.yardage || 0), 0)
  const backNineYardage = formData.holes.slice(9, 18).reduce((sum, h) => sum + (h.yardage || 0), 0)
  const totalYardage = frontNineYardage + backNineYardage

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{teebox ? 'Edit Teebox' : 'Add Teebox'}</DialogTitle>
          <DialogDescription>
            Enter the teebox details and hole information below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="teebox-name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="teebox-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Blue"
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="slope">
                Slope <span className="text-red-500">*</span>
              </Label>
              <Input
                id="slope"
                type="number"
                value={formData.slope ?? ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  slope: e.target.value ? parseInt(e.target.value, 10) : null 
                }))}
                placeholder="132"
                min={55}
                max={155}
              />
              {errors.slope && (
                <p className="text-xs text-red-500">{errors.slope}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="rating">
                Rating <span className="text-red-500">*</span>
              </Label>
              <Input
                id="rating"
                type="number"
                step="0.1"
                value={formData.rating ?? ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  rating: e.target.value ? parseFloat(e.target.value) : null 
                }))}
                placeholder="71.2"
                min={60}
                max={80}
              />
              {errors.rating && (
                <p className="text-xs text-red-500">{errors.rating}</p>
              )}
            </div>
          </div>

          {/* Hole Information */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              Hole Information <span className="text-red-500">*</span>
            </Label>
            {errors.holes && (
              <p className="text-sm text-red-500 mb-3">{errors.holes}</p>
            )}

            {/* Front Nine */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-slate-700 mb-2">Front Nine</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border px-2 py-1 text-left w-16">Hole</th>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                        <th key={n} className="border px-2 py-1 text-center w-16">{n}</th>
                      ))}
                      <th className="border px-2 py-1 text-center w-16 bg-slate-200">Out</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border px-2 py-1 font-medium">Par</td>
                      {formData.holes.slice(0, 9).map((hole, i) => (
                        <td key={i} className="border p-0">
                          <Input
                            type="number"
                            value={hole.par ?? ''}
                            onChange={(e) => updateHole(i, 'par', e.target.value)}
                            className="h-8 text-center border-0 rounded-none text-sm"
                            min={3}
                            max={5}
                          />
                        </td>
                      ))}
                      <td className="border px-2 py-1 text-center font-medium bg-slate-50">
                        {frontNinePar || '-'}
                      </td>
                    </tr>
                    <tr>
                      <td className="border px-2 py-1 font-medium">Yards</td>
                      {formData.holes.slice(0, 9).map((hole, i) => (
                        <td key={i} className="border p-0">
                          <Input
                            type="number"
                            value={hole.yardage ?? ''}
                            onChange={(e) => updateHole(i, 'yardage', e.target.value)}
                            className="h-8 text-center border-0 rounded-none text-sm"
                            min={50}
                            max={700}
                          />
                        </td>
                      ))}
                      <td className="border px-2 py-1 text-center font-medium bg-slate-50">
                        {frontNineYardage || '-'}
                      </td>
                    </tr>
                    <tr>
                      <td className="border px-2 py-1 font-medium">Hdcp</td>
                      {formData.holes.slice(0, 9).map((hole, i) => (
                        <td key={i} className="border p-0">
                          <Input
                            type="number"
                            value={hole.handicap ?? ''}
                            onChange={(e) => updateHole(i, 'handicap', e.target.value)}
                            className="h-8 text-center border-0 rounded-none text-sm"
                            min={1}
                            max={18}
                          />
                        </td>
                      ))}
                      <td className="border px-2 py-1 text-center bg-slate-50">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Back Nine */}
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-2">Back Nine</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border px-2 py-1 text-left w-16">Hole</th>
                      {[10, 11, 12, 13, 14, 15, 16, 17, 18].map(n => (
                        <th key={n} className="border px-2 py-1 text-center w-16">{n}</th>
                      ))}
                      <th className="border px-2 py-1 text-center w-16 bg-slate-200">In</th>
                      <th className="border px-2 py-1 text-center w-16 bg-slate-300">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border px-2 py-1 font-medium">Par</td>
                      {formData.holes.slice(9, 18).map((hole, i) => (
                        <td key={i} className="border p-0">
                          <Input
                            type="number"
                            value={hole.par ?? ''}
                            onChange={(e) => updateHole(i + 9, 'par', e.target.value)}
                            className="h-8 text-center border-0 rounded-none text-sm"
                            min={3}
                            max={5}
                          />
                        </td>
                      ))}
                      <td className="border px-2 py-1 text-center font-medium bg-slate-50">
                        {backNinePar || '-'}
                      </td>
                      <td className="border px-2 py-1 text-center font-bold bg-slate-100">
                        {totalPar || '-'}
                      </td>
                    </tr>
                    <tr>
                      <td className="border px-2 py-1 font-medium">Yards</td>
                      {formData.holes.slice(9, 18).map((hole, i) => (
                        <td key={i} className="border p-0">
                          <Input
                            type="number"
                            value={hole.yardage ?? ''}
                            onChange={(e) => updateHole(i + 9, 'yardage', e.target.value)}
                            className="h-8 text-center border-0 rounded-none text-sm"
                            min={50}
                            max={700}
                          />
                        </td>
                      ))}
                      <td className="border px-2 py-1 text-center font-medium bg-slate-50">
                        {backNineYardage || '-'}
                      </td>
                      <td className="border px-2 py-1 text-center font-bold bg-slate-100">
                        {totalYardage || '-'}
                      </td>
                    </tr>
                    <tr>
                      <td className="border px-2 py-1 font-medium">Hdcp</td>
                      {formData.holes.slice(9, 18).map((hole, i) => (
                        <td key={i} className="border p-0">
                          <Input
                            type="number"
                            value={hole.handicap ?? ''}
                            onChange={(e) => updateHole(i + 9, 'handicap', e.target.value)}
                            className="h-8 text-center border-0 rounded-none text-sm"
                            min={1}
                            max={18}
                          />
                        </td>
                      ))}
                      <td className="border px-2 py-1 text-center bg-slate-50">-</td>
                      <td className="border px-2 py-1 text-center bg-slate-100">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {teebox ? 'Update Teebox' : 'Add Teebox'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

