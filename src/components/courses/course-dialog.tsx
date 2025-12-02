import { useEffect, useState, useRef } from 'react'
import { Course, Teebox } from '@/types'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Download,
  MapPin,
  Phone,
  FileText
} from 'lucide-react'
import { TeeboxDialog } from './teebox-dialog'
import { parseTeeboxCSV, generateTeeboxCSV, downloadCSVTemplate } from '@/lib/course-utils'
import { toast } from 'sonner'

interface CourseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  course?: Course | null
  existingCourseNames: string[]
  onSave: (courseData: Partial<Course>) => Promise<void>
}

interface CourseFormData {
  name: string
  address: string
  telephone: string
  teeboxes: Teebox[]
}

const initialFormData: CourseFormData = {
  name: '',
  address: '',
  telephone: '',
  teeboxes: []
}

export function CourseDialog({ 
  open, 
  onOpenChange, 
  course, 
  existingCourseNames,
  onSave 
}: CourseDialogProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<CourseFormData>(initialFormData)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Teebox dialog state
  const [teeboxDialogOpen, setTeeboxDialogOpen] = useState(false)
  const [editingTeebox, setEditingTeebox] = useState<{ teebox: Teebox; index: number } | null>(null)
  
  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset form when dialog opens/closes or course changes
  useEffect(() => {
    if (open) {
      if (course) {
        setFormData({
          name: course.name,
          address: course.address || course.location || '',
          telephone: course.telephone || '',
          teeboxes: course.teeboxes ? [...course.teeboxes] : []
        })
      } else {
        setFormData(initialFormData)
      }
      setStep(1)
      setErrors({})
    }
  }, [open, course])

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Course name is required'
    } else {
      // Check for unique name (excluding current course if editing)
      const isDuplicate = existingCourseNames.some(
        name => name.toLowerCase() === formData.name.trim().toLowerCase() && 
                (!course || course.name.toLowerCase() !== formData.name.trim().toLowerCase())
      )
      if (isDuplicate) {
        newErrors.name = 'A course with this name already exists'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    }
  }

  const handleBack = () => {
    if (step === 2) {
      setStep(1)
    }
  }

  const handleSave = async () => {
    if (formData.teeboxes.length === 0) {
      toast.error('Please add at least one teebox')
      return
    }

    setLoading(true)
    try {
      await onSave({
        name: formData.name.trim(),
        address: formData.address.trim(),
        telephone: formData.telephone.trim(),
        teeboxes: formData.teeboxes
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving course:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  // Teebox management
  const handleAddTeebox = () => {
    setEditingTeebox(null)
    setTeeboxDialogOpen(true)
  }

  const handleEditTeebox = (teebox: Teebox, index: number) => {
    setEditingTeebox({ teebox, index })
    setTeeboxDialogOpen(true)
  }

  const handleDeleteTeebox = (index: number) => {
    setFormData(prev => ({
      ...prev,
      teeboxes: prev.teeboxes.filter((_, i) => i !== index)
    }))
    toast.success('Teebox deleted')
  }

  const handleSaveTeebox = (teebox: Teebox) => {
    if (editingTeebox !== null) {
      // Update existing teebox
      setFormData(prev => ({
        ...prev,
        teeboxes: prev.teeboxes.map((t, i) => 
          i === editingTeebox.index ? teebox : t
        )
      }))
      toast.success('Teebox updated')
    } else {
      // Check for duplicate name
      const isDuplicate = formData.teeboxes.some(
        t => t.name.toLowerCase() === teebox.name.toLowerCase()
      )
      if (isDuplicate) {
        toast.error('A teebox with this name already exists')
        return
      }
      // Add new teebox
      setFormData(prev => ({
        ...prev,
        teeboxes: [...prev.teeboxes, teebox]
      }))
      toast.success('Teebox added')
    }
    setTeeboxDialogOpen(false)
  }

  // CSV Import
  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const teeboxes = await parseTeeboxCSV(file)
      setFormData(prev => ({
        ...prev,
        teeboxes
      }))
      toast.success(`Successfully imported ${teeboxes.length} teebox${teeboxes.length !== 1 ? 'es' : ''}`)
    } catch (error) {
      console.error('Error importing CSV:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to import CSV')
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // CSV Export
  const handleExportTeeboxes = () => {
    if (formData.teeboxes.length === 0) {
      toast.error('No teeboxes to export')
      return
    }

    const csvContent = generateTeeboxCSV(formData.teeboxes)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', `${formData.name || 'course'}_teeboxes.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Teeboxes exported successfully')
  }

  // Download Template
  const handleDownloadTemplate = () => {
    downloadCSVTemplate()
    toast.success('Template downloaded')
  }

  // Format telephone for display
  const formatTelephone = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  }

  const handleTelephoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatTelephone(e.target.value)
    setFormData(prev => ({ ...prev, telephone: formatted }))
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{course ? 'Edit Course' : 'Add Course'}</DialogTitle>
            <DialogDescription>
              {step === 1 
                ? 'Enter the course information below.' 
                : 'Manage teeboxes for this course.'}
            </DialogDescription>
          </DialogHeader>

          {/* Step Indicator */}
          <div className="flex items-center justify-center space-x-4 py-4">
            <div className={`flex items-center space-x-2 ${step === 1 ? 'text-blue-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 1 ? 'bg-blue-600 text-white' : step > 1 ? 'bg-green-500 text-white' : 'bg-slate-200'
              }`}>
                {step > 1 ? '✓' : '1'}
              </div>
              <span className="font-medium">Course Info</span>
            </div>
            <div className="w-12 h-0.5 bg-slate-200" />
            <div className={`flex items-center space-x-2 ${step === 2 ? 'text-blue-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 2 ? 'bg-blue-600 text-white' : 'bg-slate-200'
              }`}>
                2
              </div>
              <span className="font-medium">Teeboxes</span>
            </div>
          </div>

          {/* Step 1: Course Information */}
          {step === 1 && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Course Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Pine Valley Golf Club"
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Address
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="123 Golf Course Road, City, State"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="telephone">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Telephone
                </Label>
                <Input
                  id="telephone"
                  value={formData.telephone}
                  onChange={handleTelephoneChange}
                  placeholder="(555) 123-4567"
                  maxLength={14}
                />
              </div>
            </div>
          )}

          {/* Step 2: Teeboxes */}
          {step === 2 && (
            <div className="space-y-4 py-4">
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleAddTeebox} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Manually
                </Button>
                <Button onClick={handleImportClick} variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-1" />
                  Import CSV
                </Button>
                <Button onClick={handleDownloadTemplate} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  Download Template
                </Button>
                {formData.teeboxes.length > 0 && (
                  <Button onClick={handleExportTeeboxes} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    Export Teeboxes
                  </Button>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Teeboxes Table */}
              {formData.teeboxes.length === 0 ? (
                <div className="text-center py-8 text-slate-500 border rounded-lg bg-slate-50">
                  <p className="mb-2">No teeboxes added yet</p>
                  <p className="text-sm">Add teeboxes manually or import from a CSV file</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-center">Slope</TableHead>
                        <TableHead className="text-center">Rating</TableHead>
                        <TableHead className="text-center">Holes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.teeboxes.map((teebox, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{teebox.name}</TableCell>
                          <TableCell className="text-center">{teebox.slope || '-'}</TableCell>
                          <TableCell className="text-center">{teebox.rating || '-'}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">
                              {teebox.holes?.length || 0} holes
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTeebox(teebox, index)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTeebox(index)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {formData.teeboxes.length === 0 && (
                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                  ⚠️ At least one teebox is required to save the course.
                </p>
              )}
            </div>
          )}

          <DialogFooter className="flex justify-between">
            <div>
              {step === 2 && (
                <Button variant="outline" onClick={handleBack}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel} disabled={loading}>
                Cancel
              </Button>
              {step === 1 ? (
                <Button onClick={handleNext}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleSave} disabled={loading || formData.teeboxes.length === 0}>
                  {loading ? 'Saving...' : 'Save Course'}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Teebox Dialog */}
      <TeeboxDialog
        open={teeboxDialogOpen}
        onOpenChange={setTeeboxDialogOpen}
        teebox={editingTeebox?.teebox}
        onSave={handleSaveTeebox}
      />
    </>
  )
}

