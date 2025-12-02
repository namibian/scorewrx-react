import { useEffect, useState } from 'react'
import { useCoursesStore } from '@/stores/courses-store'
import { useAuthStore } from '@/stores/auth-store'
import { Course } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Plus, Loader2, Edit, Trash2, FileDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { toast } from 'sonner'

export default function CoursesPage() {
  const { userProfile } = useAuthStore()
  const { courses, loading, error, fetchCourses, deleteCourse } = useCoursesStore()
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; course: Course | null }>({ 
    open: false, 
    course: null 
  })

  // Fetch data when userProfile becomes available (has affiliation)
  useEffect(() => {
    if (userProfile?.affiliation) {
      fetchCourses()
    }
  }, [userProfile?.affiliation, fetchCourses])

  const handleEdit = (course: Course) => {
    console.log('Edit course:', course)
    // TODO: Open edit dialog
  }

  const handleExport = (course: Course) => {
    console.log('Export course:', course)
    // TODO: Export teeboxes
  }

  const handleDelete = async (course: Course) => {
    setDeleteConfirm({ open: true, course })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.course) return
    
    try {
      await deleteCourse(deleteConfirm.course.id)
      toast.success('Course deleted successfully')
    } catch (err) {
      console.error('Failed to delete course:', err)
      toast.error('Failed to delete course')
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">No Courses Yet</h2>
          <p className="text-slate-600 mb-6">Add your first golf course to get started</p>
          <Button 
            size="lg"
            onClick={() => toast.info('Create course dialog coming soon')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Course
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Delete Course Confirmation */}
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

      <div className="space-y-8">
        {/* Page Header */}
      <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Golf Courses</h1>
              <p className="text-slate-600 mt-1">Manage your golf course library</p>
            </div>
          <Button 
            onClick={() => toast.info('Create course dialog coming soon')}
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
                  {course.location && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>{course.location}</span>
                    </div>
                  )}
                  {course.description && (
                    <p className="text-sm text-slate-500 mt-2">{course.description}</p>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex justify-between border-t pt-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleEdit(course)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleExport(course)}
                  >
                    <FileDown className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDelete(course)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
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

