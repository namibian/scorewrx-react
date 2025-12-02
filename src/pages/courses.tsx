import { useEffect, useState } from 'react'
import { useCoursesStore } from '@/stores/courses-store'
import { useTournamentsStore } from '@/stores/tournaments-store'
import { useAuthStore } from '@/stores/auth-store'
import { Course } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Plus, Loader2, Edit, Trash2, FileDown, Phone, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { CourseDialog } from '@/components/courses/course-dialog'
import { exportCourseTeeboxes } from '@/lib/course-utils'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function CoursesPage() {
  const { userProfile } = useAuthStore()
  const { courses, loading, error, fetchCourses, createCourse, updateCourse, deleteCourse } = useCoursesStore()
  const { tournaments, fetchTournaments } = useTournamentsStore()
  
  // Dialog states
  const [courseDialogOpen, setCourseDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  
  // Delete confirmation states
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; course: Course | null }>({ 
    open: false, 
    course: null 
  })
  const [tournamentWarning, setTournamentWarning] = useState<{ 
    open: boolean; 
    course: Course | null; 
    tournamentCount: number 
  }>({ 
    open: false, 
    course: null, 
    tournamentCount: 0 
  })

  // Fetch data when userProfile becomes available (has affiliation)
  useEffect(() => {
    if (userProfile?.affiliation) {
      fetchCourses()
      fetchTournaments()
    }
  }, [userProfile?.affiliation, fetchCourses, fetchTournaments])

  // Get existing course names for validation
  const existingCourseNames = courses.map(c => c.name)

  // Handle create course
  const handleCreateCourse = () => {
    setEditingCourse(null)
    setCourseDialogOpen(true)
  }

  // Handle edit course
  const handleEditCourse = (course: Course) => {
    setEditingCourse(course)
    setCourseDialogOpen(true)
  }

  // Handle export teeboxes
  const handleExportTeeboxes = (course: Course) => {
    if (!course.teeboxes || course.teeboxes.length === 0) {
      toast.error('No teeboxes to export')
      return
    }
    
    try {
      exportCourseTeeboxes(course.name, course.teeboxes)
      toast.success('Teeboxes exported successfully')
    } catch (err) {
      console.error('Failed to export teeboxes:', err)
      toast.error('Failed to export teeboxes')
    }
  }

  // Handle delete - check for tournament associations first
  const handleDeleteCourse = (course: Course) => {
    // Check if course is used in any tournaments
    const associatedTournaments = tournaments.filter(t => 
      t.course === course.name || t.course === course.id || t.courseId === course.id
    )

    if (associatedTournaments.length > 0) {
      // Show warning dialog
      setTournamentWarning({
        open: true,
        course,
        tournamentCount: associatedTournaments.length
      })
    } else {
      // Show regular delete confirmation
      setDeleteConfirm({ open: true, course })
    }
  }

  // Confirm delete (regular)
  const confirmDelete = async () => {
    if (!deleteConfirm.course) return
    
    try {
      await deleteCourse(deleteConfirm.course.id)
      toast.success('Course deleted successfully')
      setDeleteConfirm({ open: false, course: null })
    } catch (err) {
      console.error('Failed to delete course:', err)
      toast.error('Failed to delete course')
    }
  }

  // Confirm delete (with tournament warning)
  const confirmDeleteWithWarning = async () => {
    if (!tournamentWarning.course) return
    
    try {
      await deleteCourse(tournamentWarning.course.id)
      toast.success('Course deleted successfully')
      setTournamentWarning({ open: false, course: null, tournamentCount: 0 })
    } catch (err) {
      console.error('Failed to delete course:', err)
      toast.error('Failed to delete course')
    }
  }

  // Handle save course (create or update)
  const handleSaveCourse = async (courseData: Partial<Course>) => {
    try {
      if (editingCourse) {
        await updateCourse(editingCourse.id, courseData)
        toast.success('Course updated successfully')
      } else {
        await createCourse(courseData)
        toast.success('Course created successfully')
      }
    } catch (err) {
      console.error('Failed to save course:', err)
      toast.error(`Failed to ${editingCourse ? 'update' : 'create'} course`)
      throw err // Re-throw to prevent dialog from closing
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading courses...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <MapPin className="w-12 h-12 mx-auto mb-2" />
            <p className="text-lg font-semibold">Error loading courses</p>
            <p className="text-sm">{error}</p>
          </div>
          <Button onClick={() => fetchCourses()}>Try Again</Button>
        </div>
      </div>
    )
  }

  const hasCourses = courses.length > 0

  // Empty state
  if (!hasCourses) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No Courses Yet</h2>
            <p className="text-slate-600 mb-6">Add your first golf course to get started</p>
            <Button 
              size="lg"
              onClick={handleCreateCourse}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Course
            </Button>
          </div>
        </div>

        {/* Course Dialog */}
        <CourseDialog
          open={courseDialogOpen}
          onOpenChange={setCourseDialogOpen}
          course={editingCourse}
          existingCourseNames={existingCourseNames}
          onSave={handleSaveCourse}
        />
      </>
    )
  }

  return (
    <>
      {/* Delete Course Confirmation (Regular) */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, course: null })}
        title="Delete Course"
        description={`Are you sure you want to delete "${deleteConfirm.course?.name}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />

      {/* Delete Course Warning (Tournament Association) */}
      <AlertDialog 
        open={tournamentWarning.open} 
        onOpenChange={(open) => setTournamentWarning({ open, course: null, tournamentCount: 0 })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Warning: Course In Use
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                The course "{tournamentWarning.course?.name}" is currently used in{' '}
                <strong>{tournamentWarning.tournamentCount}</strong> tournament
                {tournamentWarning.tournamentCount !== 1 ? 's' : ''}.
              </p>
              <p className="text-amber-600">
                Deleting this course will affect those tournaments. Are you sure you want to proceed?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteWithWarning}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Course Dialog */}
      <CourseDialog
        open={courseDialogOpen}
        onOpenChange={setCourseDialogOpen}
        course={editingCourse}
        existingCourseNames={existingCourseNames}
        onSave={handleSaveCourse}
      />

      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Golf Courses</h1>
              <p className="text-slate-600 mt-1">Manage your golf course library</p>
            </div>
            <Button 
              onClick={handleCreateCourse}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Course
            </Button>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <span>{course.teeboxes?.length || 0} teeboxes</span>
                  </Badge>
                </div>
                <CardTitle className="text-lg mt-3">{course.name}</CardTitle>
              </CardHeader>

              <CardContent>
                <div className="space-y-2 text-sm text-slate-600">
                  {(course.address || course.location) && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{course.address || course.location}</span>
                    </div>
                  )}
                  {course.telephone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span>{course.telephone}</span>
                    </div>
                  )}
                  {course.description && (
                    <p className="text-sm text-slate-500 mt-2 line-clamp-2">{course.description}</p>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex justify-between border-t pt-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleEditCourse(course)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleExportTeeboxes(course)}
                    disabled={!course.teeboxes || course.teeboxes.length === 0}
                    title="Export Teeboxes"
                  >
                    <FileDown className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteCourse(course)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Delete Course"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </>
  )
}
