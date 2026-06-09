import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { API_BASE, deleteJson, getJson, getUserRole, postJson } from '../api'
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Download,
  Eye,
  Info,
  MoreVertical,
  Plus,
  PlayCircle,
  Trash2,
  Upload,
  UserRound,
  X,
  XCircle
} from 'lucide-react'

const GROUP_STUDENTS_API = '/groups/one/students'
const GROUP_ONE_API = '/groups/one'
const GROUPS_API = '/groups'
const LESSONS_API = '/lessons'
const LESSONS_BY_GROUP_API = '/lessons/my/group'
const ATTENDANCE_API = '/attendance'
const ATTENDANCE_ALL_API = '/attendance/all'
const HOMEWORK_API = '/homework'
const FILES_API = '/files'

const getTodayDate = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const WEEK_DAY_LABELS = {
  MONDAY: 'Du',
  TUESDAY: 'Se',
  WEDNESDAY: 'Chor',
  THURSDAY: 'Pay',
  FRIDAY: 'Ju',
  SATURDAY: 'Shan',
  SUNDAY: 'Ya',
  Dushanba: 'Du',
  Seshanba: 'Se',
  Chorshanba: 'Chor',
  Payshanba: 'Pay',
  Juma: 'Ju',
  Shanba: 'Shan',
  Yakshanba: 'Ya'
}

const lessonTabs = [
  { id: 'homework', label: 'Uyga vazifa' },
  { id: 'videos', label: 'Videolar' },
  { id: 'exams', label: 'Imtihonlar' },
  { id: 'journal', label: 'Jurnal' }
]

export default function GroupDetail({ groupId }) {
  const navigate = useNavigate()
  const [group, setGroup] = useState(null)
  const [students, setStudents] = useState([])
  const [schedules, setSchedules] = useState([])
  const [allLessons, setAllLessons] = useState([])
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()
  const [savingLesson, setSavingLesson] = useState(false)
  const [lessonsLoaded, setLessonsLoaded] = useState(false)
  const [attendanceLoaded, setAttendanceLoaded] = useState(false)
  const [homeworkLoaded, setHomeworkLoaded] = useState(false)
  const [filesLoaded, setFilesLoaded] = useState(false)
  const [mainTab, setMainTab] = useState('info')
  const [lessonTab, setLessonTab] = useState('exams')
  const [selectedMonth, setSelectedMonth] = useState(0)
  const [lessonSource, setLessonSource] = useState('custom')
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [lessonPlans] = useState([])
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  const [previewVideo, setPreviewVideo] = useState(null)
  const [videoFile, setVideoFile] = useState(null)
  const [videoLessonId, setVideoLessonId] = useState('')
  const [videoName, setVideoName] = useState('')
  const [groupFiles, setGroupFiles] = useState([])
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [homeworks, setHomeworks] = useState([])
  const [ownHomework, setOwnHomework] = useState(null)
  const [homeworkResults, setHomeworkResults] = useState([])
  const [selectedHomeworkId, setSelectedHomeworkId] = useState('')
  const [selectedResult, setSelectedResult] = useState(null)
  const [homeworkStatus, setHomeworkStatus] = useState('')
  const [loadingHomework, setLoadingHomework] = useState(false)
  const [savingHomework, setSavingHomework] = useState(false)
  const [checkingHomework, setCheckingHomework] = useState(false)
  const [homeworkForm, setHomeworkForm] = useState({
    title: '',
    description: '',
    lessonId: '',
    deadline: ''
  })
  const [checkForm, setCheckForm] = useState({
    studentId: '',
    grade: '',
    status: 'ACCEPTED',
    comment: ''
  })
  const [lessonForm, setLessonForm] = useState({
    date: getTodayDate(),
    topic: '',
    description: '',
    attendance: {}
  })

  const getInitials = (name = '') => {
    const initials = String(name)
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('')

    return initials || 'O'
  }

  const normalizeStudents = (response) => {
    const data = response?.data || response
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.students)
        ? data.students
        : Array.isArray(data?.data)
          ? data.data
          : []

    return list.map(item => {
      const student = item?.student || item?.Student || item
      const name = student?.full_name || student?.name || student?.fullName || "Noma'lum"

      return {
        id: student?.id || item?.student_id || item?.id,
        name,
        phone: student?.phone || student?.phone_number || '-',
        email: student?.email || '-',
        birthDate: student?.birth_date || student?.birthDate || '-',
        initials: getInitials(name),
      }
    })
  }

  const getApiItems = (response) => {
    const data = response?.data || response
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.data)) return data.data
    if (Array.isArray(data?.data?.schedules)) return data.data.schedules
    if (Array.isArray(data?.data?.lessons)) return data.data.lessons
    if (Array.isArray(data?.schedules)) return data.schedules
    if (Array.isArray(data?.lessons)) return data.lessons
    if (Array.isArray(data?.homeworks)) return data.homeworks
    if (Array.isArray(data?.homework)) return data.homework
    if (Array.isArray(data?.homeworkResults)) return data.homeworkResults
    if (Array.isArray(data?.submissions)) return data.submissions
    if (Array.isArray(data?.files)) return data.files
    if (Array.isArray(data?.data?.files)) return data.data.files
    if (Array.isArray(data?.items)) return data.items
    if (Array.isArray(data?.results)) return data.results
    if (Array.isArray(data?.rows)) return data.rows
    return []
  }

  const normalizeHomeworks = (response) => {
    return getApiItems(response).map(item => ({
      id: item.id || item.homework_id || item.homeworkId,
      groupId: item.group_id || item.groupId || item.group?.id || item.Group?.id,
      lessonId: item.lesson_id || item.lessonId || item.lesson?.id || item.Lesson?.id,
      title: item.title || item.name || item.topic || item.lesson?.topic || item.Lesson?.topic || 'Uyga vazifa',
      description: item.description || item.text || item.body || item.comment || '',
      fileUrl: item.file_url || item.fileUrl || item.url || item.attachment || item.file,
      deadline: item.deadline || item.due_date || item.dueDate || item.end_date || item.endDate || '',
      createdAt: item.created_at || item.createdAt || item.date || ''
    }))
  }

  const normalizeHomeworkResults = (response) => {
    return getApiItems(response).map(item => {
      const student = item.student || item.Student || item.user || item.User || {}
      const studentName = student.full_name || student.name || item.student_name || item.full_name || "Noma'lum"

      return {
        id: item.id || item.result_id || item.resultId || `${item.student_id || student.id}-${item.homework_id || item.homeworkId}`,
        studentId: item.student_id || item.studentId || student.id || item.user_id || item.userId,
        studentName,
        status: item.status || item.result_status || item.state || '-',
        grade: item.grade ?? item.score ?? item.mark ?? '-',
        comment: item.comment || item.feedback || item.teacher_comment || '',
        submittedAt: item.submitted_at || item.submittedAt || item.created_at || item.createdAt || '',
        fileUrl: item.file_url || item.fileUrl || item.url || item.attachment || item.file
          || (Array.isArray(item.files) ? item.files[0]?.url || item.files[0]?.file_url : ''),
        files: Array.isArray(item.files)
          ? item.files.map(file => buildFileUrl(file.url || file.file_url || file.path || file.location)).filter(Boolean)
          : Array.isArray(item.Files)
            ? item.Files.map(file => buildFileUrl(file.url || file.file_url || file.path || file.location)).filter(Boolean)
            : [item.file_url || item.fileUrl || item.url || item.attachment || item.file].filter(Boolean).map(buildFileUrl),
        homeworkComment: item.homework_comment || item.homeworkComment || item.answer || item.answer_text || item.text || ''
      }
    })
  }

  const normalizeResultStatus = (status) => String(status || '').toUpperCase()

  const buildFileUrl = (url) => {
    if (!url || typeof url !== 'string') return ''
    if (url.startsWith('http://') || url.startsWith('https://')) return url

    try {
      const origin = new URL(API_BASE).origin
      const normalized = url.startsWith('/') ? url : `/${url}`
      return `${origin}${normalized}`
    } catch {
      return url
    }
  }

  const getHomeworkStatusLabel = (status) => {
    const labels = {
      ACCEPTED: 'Qabul qilingan',
      REJECTED: 'Rad etilgan',
      PENDING: 'Kutmoqda',
      SUBMITTED: 'Topshirgan',
      NOT_SUBMITTED: 'Topshirmagan'
    }

    return labels[normalizeResultStatus(status)] || status || '-'
  }

  const normalizeFiles = (response) => {
    return getApiItems(response).map(item => ({
      id: item.id || item.file_id || item.fileId || item.name || item.original_name,
      lessonId: item.lesson_id || item.lessonId || item.lesson?.id || item.Lesson?.id,
      name: item.name || item.file_name || item.fileName || item.original_name || item.originalName || item.title || 'Fayl',
      lessonName: item.lesson?.topic || item.Lesson?.topic || item.lesson_name || item.lessonName || item.topic || '-',
      url: buildFileUrl(item.url || item.file_url || item.fileUrl || item.path || item.location),
      type: item.type || item.mime_type || item.mimeType || item.mimetype || '-',
      size: item.size || item.file_size || item.fileSize || '',
      createdAt: item.created_at || item.createdAt || item.uploaded_at || item.uploadedAt || item.date || ''
    }))
  }

  const normalizeSchedules = (response) => {
    return getApiItems(response).map(item => {
      const day = item.week_day || item.weekDay || item.day || item.days || item.weekday
      const startTime = item.start_time || item.startTime || item.time || item.lesson_time || ''
      const endTime = item.end_time || item.endTime || ''

      return {
        id: item.id || `${day}-${startTime}-${endTime}`,
        teacher: item.teacher_name || item.teacher || item.Teacher?.full_name || item.Teacher?.name || 'Teacher',
        room: item.room_name || item.room || item.Room?.name || '-',
        day,
        startTime,
        endTime,
        startDate: item.start_date || item.startDate || '',
        endDate: item.end_date || item.endDate || ''
      }
    })
  }

  const normalizeLessons = (response) => {
    return getApiItems(response).map(item => ({
      id: item.id || `${item.date || item.lesson_date}-${item.topic || item.title}`,
      groupId: item.group_id || item.groupId || item.group?.id || item.Group?.id,
      date: item.date || item.lesson_date || item.created_at || item.createdAt || '',
      topic: item.topic || item.title || item.theme || item.name || '-',
      description: item.description || item.comment || item.note || '',
      attendanceCount: Array.isArray(item.attendance)
        ? item.attendance.length
        : Array.isArray(item.Attendance)
          ? item.Attendance.length
          : item.attendance_count || item.attendanceCount || 0
    }))
  }

  const normalizeAttendance = (response) => {
    return getApiItems(response).map(item => ({
      id: item.id || `${item.group_id || item.groupId}-${item.student_id || item.studentId}`,
      groupId: item.group_id || item.groupId || item.group?.id || item.Group?.id,
      studentId: item.student_id || item.studentId || item.student?.id || item.Student?.id,
      isPresent: item.isPresent ?? item.is_present ?? item.present ?? false,
      createdAt: item.created_at || item.createdAt || item.date || ''
    }))
  }

  const filterGroupLessons = (items = []) => {
    return items.filter(lesson => !lesson.groupId || String(lesson.groupId) === String(groupId))
  }

  const filterGroupAttendance = (items = []) => {
    return items.filter(record => !record.groupId || String(record.groupId) === String(groupId))
  }

  const formatDate = (value) => {
    if (!value) return '-'
    const date = new Date(value)
    if (!isNaN(date)) return date.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric' })
    return String(value)
  }

  const formatFileSize = (value) => {
    const size = Number(value)
    if (!size) return '-'
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(2)} MB`
  }

  const formatScheduleDay = (value) => {
    if (!value) return '-'
    if (Array.isArray(value)) return value.map(day => WEEK_DAY_LABELS[day] || day).join('/')
    return WEEK_DAY_LABELS[value] || value
  }

  const getCourseName = (groupData) => {
    const course = groupData?.course || groupData?.Course || groupData?.course_name || groupData?.direction || groupData?.subject
    if (!course) return '-'
    if (typeof course === 'object') return course.name || course.title || course.course_name || '-'
    return course
  }

  const getGroupName = () => group?.name || group?.group_name || 'Guruh'

  const getOpenedDate = (groupData) => {
    return formatDate(
      groupData?.opened_at ||
      groupData?.open_date ||
      groupData?.start_date ||
      groupData?.created_at ||
      groupData?.createdAt
    )
  }

  const getScheduleSummary = () => {
    const scheduleItems = schedules.length > 0
      ? schedules
      : [{
        day: group?.week_day || group?.days,
        startTime: group?.start_time || group?.time || '',
        endTime: group?.end_time || ''
      }]

    const labels = scheduleItems
      .map(item => {
        const day = formatScheduleDay(item.day)
        const time = item.endTime ? `${item.startTime} - ${item.endTime}` : item.startTime
        return [day, time].filter(Boolean).join(' ')
      })
      .filter(label => label && label !== '-')

    return labels.length > 0 ? labels.join(', ') : '-'
  }

  const buildLessonDays = () => {
    const today = getTodayDate()
    const fallback = Array.from({ length: 13 }, (_, index) => {
      const date = new Date(`${today}T00:00:00`)
      date.setDate(date.getDate() + index)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    })
    const base = allLessons.length > 0
      ? Array.from(new Set([today, ...allLessons.map(lesson => lesson.date?.slice(0, 10)).filter(Boolean)]))
      : fallback

    return base.slice(0, 13).map(value => {
      const date = new Date(`${String(value).slice(0, 10)}T00:00:00`)
      return {
        value: String(value).slice(0, 10),
        month: !isNaN(date) ? date.toLocaleDateString('en-US', { month: 'short' }) : 'May',
        day: !isNaN(date) ? date.getDate() : value,
        completed: allLessons.some(lesson => lesson.date?.slice(0, 10) === String(value).slice(0, 10))
      }
    })
  }

  const handleLessonDaySelect = (day, index, openJournal = false) => {
    const selectedDate = String(day.value).slice(0, 10)
    setSelectedMonth(index)
    setLessonForm(prev => ({ ...prev, date: selectedDate }))
    if (openJournal) {
      setMainTab('lessons')
      setLessonTab('journal')
    }
  }

  const fetchGroupLessons = async () => {
    try {
      const response = await getJson(LESSONS_API)
      return filterGroupLessons(normalizeLessons(response))
    } catch {
      const response = await getJson(`${LESSONS_BY_GROUP_API}/${groupId}`)
      return normalizeLessons(response)
    }
  }

  const loadHomeworks = async (force = false) => {
    if (homeworkLoaded && !force) return homeworks
    setLoadingHomework(true)
    try {
      let normalized = []
      try {
        normalized = normalizeHomeworks(await getJson(`${HOMEWORK_API}/${groupId}`))
      } catch {
        normalized = normalizeHomeworks(await getJson(`${HOMEWORK_API}/all`))
          .filter(item => !item.groupId || String(item.groupId) === String(groupId))
      }

      setHomeworks(normalized)
      setHomeworkLoaded(true)
      const firstHomeworkId = normalized[0]?.id || ''
      setSelectedHomeworkId(prev => prev || firstHomeworkId)
      if (firstHomeworkId) await loadHomeworkResults(firstHomeworkId, homeworkStatus)
      return normalized
    } catch (err) {
      console.error('Homework load error', err)
      setHomeworks([])
      setHomeworkLoaded(true)
      return []
    } finally {
      setLoadingHomework(false)
    }
  }

  const loadOwnHomework = async (lessonId) => {
    if (!lessonId) return
    try {
      const response = await getJson(`${HOMEWORK_API}/own/${lessonId}`)
      setOwnHomework(normalizeHomeworks(response)[0] || response?.data || response)
    } catch (err) {
      console.error('Own homework load error', err)
      setOwnHomework(null)
    }
  }

  const loadHomeworkResults = async (homeworkId = selectedHomeworkId, status = homeworkStatus) => {
    if (!homeworkId) {
      setHomeworkResults([])
      return
    }

    const serverStatus = ['ACCEPTED', 'REJECTED', 'PENDING'].includes(status) ? status : ''
    const query = serverStatus ? `?status=${encodeURIComponent(serverStatus)}` : ''
    try {
      const response = await getJson(`/group/${groupId}/homework/${homeworkId}/results${query}`)
      setHomeworkResults(normalizeHomeworkResults(response))
    } catch (err) {
      console.error('Homework results load error', err)
      setHomeworkResults([])
    }
  }

  const loadStudentHomeworkResult = async (homeworkId, studentId) => {
    if (!homeworkId || !studentId) return
    try {
      const response = await getJson(`/group/${groupId}/homework/${homeworkId}/result/${studentId}`)
      const normalized = normalizeHomeworkResults(response)
      const result = normalized[0] || response?.data || response
      setSelectedResult(result)
      setCheckForm(prev => ({
        ...prev,
        studentId: result?.studentId || studentId || '',
        grade: result?.grade && result.grade !== '-' ? String(result.grade) : '',
        status: ['ACCEPTED', 'REJECTED', 'PENDING'].includes(normalizeResultStatus(result?.status)) ? normalizeResultStatus(result.status) : prev.status,
        comment: result?.comment || ''
      }))
    } catch (err) {
      console.error('Student homework result load error', err)
      setSelectedResult(null)
    }
  }

  const loadFiles = async (force = false) => {
    if (filesLoaded && !force) return groupFiles
    setLoadingFiles(true)
    try {
      const response = await getJson(`${FILES_API}/${groupId}`)
      const normalized = normalizeFiles(response)
      setGroupFiles(normalized)
      setFilesLoaded(true)
      return normalized
    } catch (err) {
      console.error('Group files load error', err)
      setGroupFiles([])
      setFilesLoaded(true)
      return []
    } finally {
      setLoadingFiles(false)
    }
  }

  const loadAttendance = async (force = false) => {
    if (attendanceLoaded && !force) return attendanceRecords
    try {
      const response = await getJson(ATTENDANCE_ALL_API)
      const normalized = filterGroupAttendance(normalizeAttendance(response))
      setAttendanceRecords(normalized)
      setAttendanceLoaded(true)
      return normalized
    } catch (err) {
      console.error('Attendance load error', err)
      setAttendanceRecords([])
      setAttendanceLoaded(true)
      return []
    }
  }

  const loadLessons = async (force = false) => {
    if (lessonsLoaded && !force) return allLessons
    try {
      const normalized = await fetchGroupLessons()
      setAllLessons(normalized)
      setLessonsLoaded(true)
      return normalized
    } catch (err) {
      console.error('Group lessons load error', err)
      setAllLessons([])
      setLessonsLoaded(true)
      return []
    }
  }

  const toggleAttendance = (studentId, isPresent) => {
    if (!canFillAttendance()) return
    setLessonForm(prev => ({
      ...prev,
      attendance: {
        ...prev.attendance,
        [studentId]: isPresent
      }
    }))
  }

  const getLessonStartTime = () => {
    return group?.start_time || group?.startTime || group?.time || schedules[0]?.startTime || '09:00'
  }

  const getLessonStartDate = () => {
    const [hour = '09', minute = '00'] = String(getLessonStartTime()).split(':')
    return new Date(`${lessonForm.date}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`)
  }

  const isAttendanceTaken = () => {
    return attendanceRecords.some(record => String(record.createdAt || '').slice(0, 10) === lessonForm.date)
  }

  const getAttendanceWindowStatus = () => {
    const start = getLessonStartDate()
    if (!lessonForm.date || isNaN(start)) return { open: false, message: 'Dars sanasi yoki vaqti topilmadi.' }
    if (isAttendanceTaken()) return { open: false, message: 'Bu dars uchun davomat allaqachon qilingan.' }

    const now = new Date()
    const end = new Date(start.getTime() + 45 * 60 * 1000)

    if (now < start) return { open: false, message: `Davomat ${getLessonStartTime()} dan keyin ochiladi.` }
    if (now > end) return { open: false, message: 'Davomat vaqti tugagan. Dars boshlanganidan keyin 45 minut ichida qilish mumkin.' }
    return { open: true, message: 'Davomat ochiq.' }
  }

  const canFillAttendance = () => {
    const hasTopic = lessonSource === 'plan' ? Boolean(selectedPlanId) : Boolean(lessonForm.topic.trim())
    return hasTopic && getAttendanceWindowStatus().open
  }

  const isVideoFile = (row = {}) => {
    const value = `${row.type || ''} ${row.name || ''} ${row.url || ''}`.toLowerCase()
    return value.includes('video') || /\.(mp4|webm|ogg|mov|m4v)(\?|$)/.test(value)
  }

  const handleLessonSubmit = async (e) => {
    e.preventDefault()
    const selectedPlan = lessonPlans.find(plan => String(plan.id) === String(selectedPlanId))
    const topic = lessonSource === 'plan' ? selectedPlan?.title || selectedPlan?.topic || '' : lessonForm.topic.trim()
    if (savingLesson || !topic) return
    if (!canFillAttendance()) {
      alert(getAttendanceWindowStatus().message)
      return
    }

    setSavingLesson(true)
    try {
      await postJson(LESSONS_API, {
        group_id: Number(groupId) || groupId,
        date: lessonForm.date,
        lesson_date: lessonForm.date,
        topic,
        description: lessonForm.description
      })

      if (students.length > 0) {
        await Promise.all(students
          .filter(student => student.id)
          .map(student => postJson(ATTENDANCE_API, {
            group_id: Number(groupId) || groupId,
            student_id: Number(student.id) || student.id,
            date: lessonForm.date,
            isPresent: lessonForm.attendance[student.id] === true
          }))
        )
      }

      await loadLessons(true)
      if (attendanceLoaded) await loadAttendance(true)
      setLessonForm({
        date: lessonForm.date || getTodayDate(),
        topic: '',
        description: '',
        attendance: {}
      })
      setSelectedPlanId('')
    } catch (err) {
      console.error('Group lesson save error', err)
      alert(err.message || 'Dars jurnalini saqlashda xatolik yuz berdi.')
    } finally {
      setSavingLesson(false)
    }
  }

  const openVideoModal = () => {
    setVideoFile(null)
    setVideoLessonId(allLessons[0]?.id ? String(allLessons[0].id) : '')
    setVideoName('')
    setIsVideoModalOpen(true)
  }

  const closeVideoModal = () => {
    setIsVideoModalOpen(false)
    setVideoFile(null)
    setVideoLessonId('')
    setVideoName('')
  }

  const handleVideoFile = (file) => {
    if (!file) return
    setVideoFile(file)
    setVideoName(file.name)
  }

  const handleVideoUpload = async (e) => {
    e.preventDefault()
    if (!videoFile || !videoLessonId || !videoName.trim()) return
    setUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append('file', videoFile)
      formData.append('name', videoName.trim())

      await postJson(`${FILES_API}/group/${groupId}/upload?lessonId=${encodeURIComponent(videoLessonId)}`, formData)
      closeVideoModal()
      await loadFiles(true)
    } catch (err) {
      console.error('Group file upload error', err)
      alert(err.message || 'Fayl yuklashda xatolik yuz berdi.')
    } finally {
      setUploadingFile(false)
    }
  }

  const handleHomeworkSubmit = async (e) => {
    e.preventDefault()
    if (savingHomework || !homeworkForm.title.trim()) return

    setSavingHomework(true)
    try {
      await postJson(HOMEWORK_API, {
        title: homeworkForm.title.trim(),
        description: homeworkForm.description,
        group_id: Number(groupId) || groupId,
        lesson_id: Number(homeworkForm.lessonId) || homeworkForm.lessonId || undefined,
        deadline: homeworkForm.deadline || undefined
      })
      setHomeworkForm({ title: '', description: '', lessonId: '', deadline: '' })
      await loadHomeworks(true)
      try {
        if (window && window.opener && !window.opener.closed) {
          try { window.opener.location.reload() } catch (e) { }
          try { window.close() } catch (e) { }
        }
      } catch (e) {
        // ignore
      }
    } catch (err) {
      console.error('Homework save error', err)
      alert(err.message || "Uy vazifa qo'shishda xatolik yuz berdi.")
    } finally {
      setSavingHomework(false)
    }
  }

  const handleHomeworkCheck = async (e) => {
    e.preventDefault()
    if (checkingHomework || !selectedHomeworkId || !checkForm.studentId) return

    setCheckingHomework(true)
    try {
      await postJson(`/group/${groupId}/homework/${selectedHomeworkId}/check`, {
        student_id: Number(checkForm.studentId) || checkForm.studentId,
        grade: checkForm.grade === '' ? undefined : Number(checkForm.grade) || checkForm.grade,
        status: checkForm.status,
        comment: checkForm.comment
      })
      setCheckForm({ studentId: '', grade: '', status: 'ACCEPTED', comment: '' })
      setSelectedResult(null)
      await loadHomeworkResults(selectedHomeworkId, homeworkStatus)
    } catch (err) {
      console.error('Homework check error', err)
      alert(err.message || 'Uy vazifani tekshirishda xatolik yuz berdi.')
    } finally {
      setCheckingHomework(false)
    }
  }

  const handleGradeChange = (value) => {
    const normalized = Math.max(0, Math.min(100, Number(value) || 0))
    setCheckForm(prev => ({
      ...prev,
      grade: String(normalized),
      status: normalized >= 60 ? 'ACCEPTED' : 'REJECTED'
    }))
  }

  const deleteGroup = async () => {
    if (!window.confirm("Haqiqatan ham bu guruhni o'chirmoqchimisiz?")) return

    try {
      await deleteJson(`${GROUPS_API}/${groupId}`)
      navigate('/groups')
    } catch (err) {
      console.error('Group delete error', err)
      alert(err.message || "Guruhni o'chirishda xatolik yuz berdi.")
    }
  }

  useEffect(() => {
    if (searchParams.get('newHomework') === '1') {
      setMainTab('lessons')
      setLessonTab('homework')
    }

    const load = async () => {
      setLoading(true)
      setAllLessons([])
      setAttendanceRecords([])
      setHomeworks([])
      setHomeworkResults([])
      setOwnHomework(null)
      setSelectedHomeworkId('')
      setSelectedResult(null)
      setGroupFiles([])
      setLessonsLoaded(false)
      setAttendanceLoaded(false)
      setHomeworkLoaded(false)
      setFilesLoaded(false)

      try {
        const [groupRes, studentsRes, schedulesRes] = await Promise.allSettled([
          getJson(`${GROUPS_API}/${groupId}`),
          getJson(`${GROUP_STUDENTS_API}/${groupId}`),
          getJson(`${GROUPS_API}/${groupId}/schedules`),
        ])

        if (groupRes.status === 'fulfilled') {
          setGroup(groupRes.value?.data || groupRes.value)
        } else {
          try {
            const fallbackGroup = await getJson(`${GROUP_ONE_API}/${groupId}`)
            setGroup(fallbackGroup?.data || fallbackGroup)
          } catch (err) {
            setGroup(null)
            console.error('Group detail load error', groupRes.reason || err)
          }
        }

        if (studentsRes.status === 'fulfilled') {
          setStudents(normalizeStudents(studentsRes.value))
        } else {
          setStudents([])
          console.error('Group students load error', studentsRes.reason)
        }

        if (schedulesRes.status === 'fulfilled') {
          setSchedules(normalizeSchedules(schedulesRes.value))
        } else {
          setSchedules([])
          console.error('Group schedules load error', schedulesRes.reason)
        }

      } catch (err) {
        console.error('Group detail load error', err)
      }

      setLoading(false)
    }

    load()
  }, [groupId])

  const handleMainTabChange = async (tab) => {
    setMainTab(tab)
    if (tab === 'lessons') {
      await loadLessons()
    }
    if (tab === 'attendance') {
      await loadAttendance()
    }
  }

  const openHomeworkInNewWindow = () => {
    const url = `${window.location.pathname}?newHomework=1`
    window.open(url, '_blank')
  }

  const handleLessonTabChange = async (tab) => {
    setLessonTab(tab)

    if (tab === 'homework') {
      const loadedLessons = await loadLessons()
      const firstLessonId = loadedLessons[0]?.id
      if (firstLessonId) {
        setHomeworkForm(prev => ({ ...prev, lessonId: prev.lessonId || String(firstLessonId) }))
        await loadOwnHomework(firstLessonId)
      }
      await loadHomeworks()
    }

    if (tab === 'videos') {
      await loadLessons()
      await loadFiles()
    }

    if (tab === 'journal') {
      await loadAttendance()
    }
  }

  if (loading) return (
    <div className="flex flex-col justify-center items-center py-24 gap-3 select-none">
      <div className="w-10 h-10 border-4 border-violet-100 dark:border-violet-955 border-t-violet-600 rounded-full animate-spin" />
      <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">Yuklanmoqda...</span>
    </div>
  )
  if (!group) return (
    <div className="flex flex-col justify-center items-center py-20 text-center gap-4 select-none">
      <div className="w-14 h-14 bg-rose-50 dark:bg-rose-955/20 text-rose-500 rounded-2xl flex items-center justify-center border border-rose-100 dark:border-rose-900/30">
        <XCircle size={28} />
      </div>
      <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">Guruh topilmadi</h3>
      <p className="text-sm text-slate-400 dark:text-slate-500 max-w-[340px]">Qidirilayotgan guruh bazadan topilmadi yoki o'chirilgan bo'lishi mumkin.</p>
    </div>
  )

  const lessonDays = buildLessonDays()
  const canEditAttendance = canFillAttendance()
  const attendanceWindow = getAttendanceWindowStatus()
  const userRole = getUserRole()
  const canManageHomework = userRole
    ? ['superadmin', 'admin', 'teacher', 'oqituvchi'].includes(userRole)
    : true
  const attendancePresentCount = attendanceRecords.filter(record => record.isPresent).length
  const attendanceAbsentCount = attendanceRecords.length - attendancePresentCount
  const examRows = allLessons.length > 0 ? allLessons : [
    { id: 7, topic: 'Examination', date: '2026-05-22', attendanceCount: 12, status: 'Faol' },
    { id: 6, topic: 'Examination', date: '2026-04-24', attendanceCount: 12, status: 'Tugagan' },
    { id: 5, topic: 'Examination', date: '2026-03-26', attendanceCount: 14, status: 'Tugagan' }
  ]
  const videoRows = groupFiles
  const submittedStudentIds = new Set(homeworkResults.map(row => String(row.studentId)).filter(Boolean))
  const notSubmittedRows = students
    .filter(student => student.id && !submittedStudentIds.has(String(student.id)))
    .map(student => ({
      id: `not-submitted-${student.id}`,
      studentId: student.id,
      studentName: student.name,
      status: 'NOT_SUBMITTED',
      grade: '-',
      submittedAt: ''
    }))
  const visibleHomeworkRows = homeworkStatus === 'NOT_SUBMITTED'
    ? notSubmittedRows
    : homeworkStatus === 'SUBMITTED'
      ? homeworkResults
      : homeworkStatus
        ? homeworkResults.filter(row => normalizeResultStatus(row.status) === homeworkStatus)
        : [...homeworkResults, ...notSubmittedRows]
  const submittedCount = homeworkResults.length
  const pendingCount = homeworkResults.filter(row => normalizeResultStatus(row.status) === 'PENDING').length
  const selectedHomework = homeworks.find(item => String(item.id) === String(selectedHomeworkId))
  const selectedResultFiles = selectedResult?.files || []
  const selectedGrade = Number(checkForm.grade || 0)

  return (
    <div className="py-6 px-0 flex flex-col gap-6 flex-1 min-h-0 overflow-y-auto select-none">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 dark:border-slate-800 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <button
            className="p-2 rounded-xl text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-105 dark:hover:bg-slate-800 transition-all cursor-pointer"
            onClick={() => navigate('/groups')}
            aria-label="Orqaga"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{getGroupName()}</h1>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-105 dark:border-emerald-900/20 uppercase tracking-wide">
            {group.status || 'Aktiv'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all cursor-pointer shadow-sm">
            <BarChart3 size={18} />
            Statistika
          </button>
          <button
            className="p-2 rounded-xl text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
            title="Guruhni o'chirish"
            onClick={deleteGroup}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      {/* TABS */}
      <nav className="flex gap-1.5 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl w-fit border border-slate-200/50 dark:border-slate-805/50">
        <button
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${mainTab === 'info' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-705/50' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-850'}`}
          onClick={() => handleMainTabChange('info')}
        >
          Ma'lumotlar
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${mainTab === 'lessons' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-705/50' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-850'}`}
          onClick={() => handleMainTabChange('lessons')}
        >
          Guruh darsliklari
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${mainTab === 'attendance' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-705/50' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-850'}`}
          onClick={() => handleMainTabChange('attendance')}
        >
          Akademik davomati
        </button>
      </nav>

      {/* INFO TAB */}
      {mainTab === 'info' && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <article className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
            <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-50 dark:border-slate-850 pb-2">Guruh mentorlari</div>
            <div className="flex flex-col gap-3.5">
              {Array.isArray(group.teachers) && group.teachers.length > 0 ? group.teachers.map(teacher => {
                const teacherName = teacher.name || teacher.full_name || "Noma'lum"
                return (
                  <div key={teacher.id || teacherName} className="flex items-center gap-3.5 p-3.5 bg-slate-50/50 dark:bg-slate-950/10 border border-slate-100/50 dark:border-slate-800/40 rounded-xl">
                    <div className="w-11 h-11 rounded-full bg-violet-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">{getInitials(teacherName)}</div>
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Teacher</div>
                      <strong className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">{teacherName}</strong>
                    </div>
                  </div>
                )
              }) : (
                <div className="text-sm text-slate-400 dark:text-slate-505 font-medium py-3 text-center">Mentorlar yo'q</div>
              )}
            </div>
          </article>

          <article className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
            <div className="text-xs font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider border-b border-slate-50 dark:border-slate-850 pb-2">Parametrlar</div>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between items-center border-b border-slate-100/50 dark:border-slate-800/40 pb-2 last:border-0 last:pb-0">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Kurs:</span>
                <strong className="text-slate-800 dark:text-slate-200 font-bold">{getCourseName(group)}</strong>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100/50 dark:border-slate-800/40 pb-2 last:border-0 last:pb-0">
                <span className="text-slate-500 dark:text-slate-400 font-medium">O'rtacha yosh:</span>
                <strong className="text-slate-800 dark:text-slate-200 font-bold">{group.avg_age || '-'}</strong>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100/50 dark:border-slate-800/40 pb-2 last:border-0 last:pb-0">
                <span className="text-slate-500 dark:text-slate-400 font-medium">O'quvchilar sig'imi:</span>
                <strong className="text-slate-800 dark:text-slate-200 font-bold">{group.student_limit || '-'}</strong>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100/50 dark:border-slate-800/40 pb-2 last:border-0 last:pb-0">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Mavjud o'quvchilar:</span>
                <strong className="text-slate-800 dark:text-slate-200 font-bold">{students.length || group.students_count || 0}</strong>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100/50 dark:border-slate-800/40 pb-2 last:border-0 last:pb-0">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Ochilgan sana:</span>
                <strong className="text-slate-800 dark:text-slate-200 font-bold">{getOpenedDate(group)}</strong>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100/50 dark:border-slate-800/40 pb-2 last:border-0 last:pb-0">
                <span className="text-slate-500 dark:text-slate-400 font-medium flex-shrink-0">Dars jadvali:</span>
                <strong className="text-slate-800 dark:text-slate-200 font-bold text-right ml-4">{getScheduleSummary()}</strong>
              </div>
            </div>
          </article>

          <article className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 rounded-2xl p-5 shadow-sm flex flex-col gap-4 col-span-1 lg:col-span-3">
            <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-50 dark:border-slate-850 pb-2">Dars jadvali</div>
            <div className="flex flex-col gap-2.5">
              {(schedules.length > 0 ? schedules : [{ id: 'fallback', teacher: 'Teacher', day: group.week_day || group.days, startTime: group.start_time || group.time, endTime: group.end_time, room: group.room_name || '-' }]).map(item => (
                <div key={item.id} className="grid grid-cols-1 sm:grid-cols-5 gap-3 p-4 bg-slate-50/50 dark:bg-slate-955/10 border border-slate-100/50 dark:border-slate-800/40 rounded-xl text-sm text-slate-650 dark:text-slate-350 items-center">
                  <strong className="text-slate-900 dark:text-white font-bold">{item.teacher}</strong>
                  <span className="font-semibold text-violet-650 dark:text-violet-400">{formatScheduleDay(item.day)}</span>
                  <span className="font-medium">{item.startTime || '-'} dan {item.endTime || '-'} gacha</span>
                  <span>{[item.startDate && formatDate(item.startDate), item.endDate && formatDate(item.endDate)].filter(Boolean).join(' - ') || '-'}</span>
                  <span className="font-semibold">{item.room}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 mt-4 scrollbar-none">
              {lessonDays.map((day, index) => (
                <button
                  key={`${day.value}-${index}`}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border min-w-[56px] transition-all cursor-pointer ${index === selectedMonth ? 'bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-600/10' : day.completed ? 'bg-slate-55/60 dark:bg-slate-800/40 border-slate-150 dark:border-slate-800 text-slate-400 dark:text-slate-500' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  onClick={() => handleLessonDaySelect(day, index, true)}
                >
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">{day.month}</span>
                  <strong className="text-base font-extrabold mt-0.5">{day.day}</strong>
                </button>
              ))}
            </div>
          </article>
        </section>
      )}

      {/* LESSONS TAB */}
      {mainTab === 'lessons' && (
        <section className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-4 border-b border-slate-105 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Guruh darsliklari</h2>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex gap-1 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl w-fit border border-slate-205/50 dark:border-slate-800/50">
                {lessonTabs.map(tab => (
                  <button
                    key={tab.id}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${lessonTab === tab.id ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/50 dark:border-slate-700/50' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-205/50 dark:hover:bg-slate-850'}`}
                    onClick={() => handleLessonTabChange(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {lessonTab === 'videos' && canManageHomework && (
                <button
                  className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-700 text-white gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-250 shadow-md shadow-violet-600/10 cursor-pointer"
                  onClick={openVideoModal}
                >
                  <Upload size={14} />
                  Fayl yuklash
                </button>
              )}
              {lessonTab === 'homework' && canManageHomework && (
                <button
                  className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-700 text-white gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-250 shadow-md shadow-violet-600/10 cursor-pointer"
                  onClick={openHomeworkInNewWindow}
                >
                  <Plus size={14} />
                  Yangi uy vazifa
                </button>
              )}
              {lessonTab === 'exams' && (
                <button className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-700 text-white gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-250 shadow-md shadow-violet-600/10 cursor-pointer">
                  Yangi imtihon
                </button>
              )}
            </div>
          </div>

          {/* HOMEWORK SUB-TAB */}
          {lessonTab === 'homework' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="col-span-1 lg:col-span-2 flex flex-col gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 rounded-2xl p-5 shadow-sm">
                <div className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-850 pb-2">
                  <span>{getGroupName()}</span>
                  <span className="opacity-50">/</span>
                  <span>Uyga vazifa</span>
                </div>

                <div className="flex flex-wrap gap-2.5 items-center">
                  <select
                    className="rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold focus:border-violet-500 focus:outline-none dark:text-white cursor-pointer"
                    value={selectedHomeworkId}
                    onChange={e => {
                      const nextHomeworkId = e.target.value
                      setSelectedHomeworkId(nextHomeworkId)
                      setSelectedResult(null)
                      loadHomeworkResults(nextHomeworkId, homeworkStatus)
                    }}
                  >
                    <option value="">Vazifani tanlang</option>
                    {homeworks.map(item => (
                      <option key={item.id} value={item.id}>{item.title}</option>
                    ))}
                  </select>

                  <select
                    className="rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold focus:border-violet-500 focus:outline-none dark:text-white cursor-pointer"
                    value={homeworkStatus}
                    onChange={e => {
                      const nextStatus = e.target.value
                      setHomeworkStatus(nextStatus)
                      loadHomeworkResults(selectedHomeworkId, nextStatus)
                    }}
                  >
                    <option value="">Barchasi</option>
                    <option value="SUBMITTED">Topshirganlar</option>
                    <option value="NOT_SUBMITTED">Topshirmaganlar</option>
                    <option value="PENDING">Kutayotganlar</option>
                    <option value="ACCEPTED">Qabul qilingan</option>
                    <option value="REJECTED">Rad etilgan</option>
                  </select>

                  <button className="inline-flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all cursor-pointer" onClick={() => loadHomeworkResults()}>
                    <Eye size={14} />
                    Natijalar
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 my-1">
                  <div className="flex flex-col gap-0.5 p-3 bg-slate-50/50 dark:bg-slate-950/15 border border-slate-100/50 dark:border-slate-800/40 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">Topshirgan</span>
                    <strong className="text-lg font-extrabold text-slate-850 dark:text-white">{submittedCount}</strong>
                  </div>
                  <div className="flex flex-col gap-0.5 p-3 bg-slate-50/50 dark:bg-slate-955/15 border border-slate-100/50 dark:border-slate-800/40 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider">Topshirmagan</span>
                    <strong className="text-lg font-extrabold text-slate-850 dark:text-white">{notSubmittedRows.length}</strong>
                  </div>
                  <div className="flex flex-col gap-0.5 p-3 bg-slate-50/50 dark:bg-slate-955/15 border border-slate-100/50 dark:border-slate-800/40 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider">Kutmoqda</span>
                    <strong className="text-lg font-extrabold text-slate-850 dark:text-white">{pendingCount}</strong>
                  </div>
                </div>

                {loadingHomework ? (
                  <div className="text-center py-8 text-sm text-slate-400 dark:text-slate-500 font-medium">Uy vazifalar yuklanmoqda...</div>
                ) : homeworks.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {homeworks.map(item => (
                      <article key={item.id || item.title} className="p-4 bg-slate-50/50 dark:bg-slate-955/10 border border-slate-100 dark:border-slate-800/60 rounded-xl flex flex-col gap-2.5">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-slate-900 dark:text-white text-sm">{item.title}</h3>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            Lesson #{item.lessonId || '-'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed">{item.description || "Tavsif yo'q"}</p>
                        <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-850/80 pt-3 mt-1.5 text-xs text-slate-450 dark:text-slate-500 font-medium">
                          <span>Muddat: {formatDate(item.deadline)}</span>
                          {item.fileUrl && (
                            <a href={item.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 font-semibold cursor-pointer">
                              <Download size={14} />
                              Fayl
                            </a>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-sm text-slate-400 dark:text-slate-500 font-medium">Bu guruh uchun uy vazifa topilmadi.</div>
                )}

                {ownHomework && (
                  <div className="p-4 bg-violet-50/30 dark:bg-violet-955/10 border border-violet-100 dark:border-violet-900/30 rounded-xl flex flex-col gap-2.5">
                    <strong className="text-xs font-bold text-violet-750 dark:text-violet-300">Talaba uchun dars bo'yicha vazifa:</strong>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{ownHomework.title || ownHomework.name || 'Uyga vazifa'}</span>
                    {(ownHomework.fileUrl || ownHomework.file_url || ownHomework.url) && (
                      <a href={ownHomework.fileUrl || ownHomework.file_url || ownHomework.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-700 w-fit cursor-pointer">
                        <Download size={14} />
                        Yuklab olish
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* CREATE HOMEWORK FORM */}
              {canManageHomework && (
                <form className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 rounded-2xl p-5 shadow-sm flex flex-col gap-4 h-fit" onSubmit={handleHomeworkSubmit}>
                  <div className="text-xs font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-850 pb-2">
                    <Plus size={16} />
                    <span>Yangi uy vazifa</span>
                  </div>
                  <label className="flex flex-col gap-1.5 w-full">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nomi <span className="text-rose-500">*</span></span>
                    <input
                      className="w-full rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none dark:text-white transition-all"
                      value={homeworkForm.title}
                      onChange={e => setHomeworkForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Masalan: React props mashqi"
                      required
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 w-full">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dars</span>
                    <select
                      className="w-full rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none dark:text-white transition-all cursor-pointer"
                      value={homeworkForm.lessonId}
                      onChange={e => setHomeworkForm(prev => ({ ...prev, lessonId: e.target.value }))}
                    >
                      <option value="">Darsni tanlang</option>
                      {allLessons.map((lesson, index) => (
                        <option key={lesson.id || index} value={lesson.id || index}>{lesson.topic}</option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5 w-full">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Muddat</span>
                    <input
                      type="date"
                      className="w-full rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none dark:text-white transition-all cursor-pointer"
                      value={homeworkForm.deadline}
                      onChange={e => setHomeworkForm(prev => ({ ...prev, deadline: e.target.value }))}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 w-full">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tavsif</span>
                    <textarea
                      className="w-full rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none dark:text-white transition-all h-20"
                      value={homeworkForm.description}
                      onChange={e => setHomeworkForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Vazifa matni..."
                    />
                  </label>
                  <button
                    className="inline-flex items-center justify-center bg-violet-600 hover:bg-violet-700 text-white gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 shadow-md shadow-violet-600/10 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    type="submit"
                    disabled={savingHomework || !homeworkForm.title.trim()}
                  >
                    {savingHomework ? 'Saqlanmoqda...' : "Qo'shish"}
                  </button>
                </form>
              )}

              {/* SUBMISSIONS TABLE */}
              <div className="col-span-1 lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 rounded-2xl shadow-sm overflow-x-auto w-full">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <th className="px-5 py-4 font-semibold text-xs tracking-wider">#</th>
                      <th className="px-5 py-4 font-semibold text-xs tracking-wider">O'quvchi</th>
                      <th className="px-5 py-4 font-semibold text-xs tracking-wider">Status</th>
                      <th className="px-5 py-4 font-semibold text-xs tracking-wider">Baho</th>
                      <th className="px-5 py-4 font-semibold text-xs tracking-wider">Topshirgan vaqti</th>
                      <th className="px-5 py-4 font-semibold text-xs tracking-wider"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleHomeworkRows.length > 0 ? visibleHomeworkRows.map((row, index) => (
                      <tr key={row.id || index} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 border-b border-slate-100 dark:border-slate-850/60 transition-colors">
                        <td className="px-5 py-4 text-xs font-bold text-slate-400">{index + 1}</td>
                        <td className="px-5 py-4 font-semibold text-slate-800 dark:text-slate-200">{row.studentName}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${normalizeResultStatus(row.status) === 'NOT_SUBMITTED' || normalizeResultStatus(row.status) === 'REJECTED' ? 'bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-400' : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'}`}>
                            {getHomeworkStatusLabel(row.status)}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-800 dark:text-slate-205">{row.grade}</td>
                        <td className="px-5 py-4 text-xs font-medium text-slate-500 dark:text-slate-400">{formatDate(row.submittedAt)}</td>
                        <td className="px-5 py-4 text-right">
                          <button
                            className="inline-flex items-center gap-1 text-violet-650 hover:text-violet-750 dark:text-violet-400 dark:hover:text-violet-300 font-bold cursor-pointer text-xs"
                            onClick={() => {
                              setCheckForm(prev => ({ ...prev, studentId: row.studentId || '' }))
                              if (normalizeResultStatus(row.status) === 'NOT_SUBMITTED') {
                                setSelectedResult(row)
                                setCheckForm(prev => ({ ...prev, studentId: row.studentId || '', grade: '', status: 'PENDING', comment: '' }))
                              } else {
                                loadStudentHomeworkResult(selectedHomeworkId, row.studentId)
                              }
                            }}
                          >
                            <Eye size={14} />
                            {canManageHomework ? 'Baholash' : "Ko'rish"}
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="6" className="text-center py-8 text-sm text-slate-450 dark:text-slate-500 font-medium">Natijalar topilmadi.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* GRADING FORM */}
              {canManageHomework && selectedResult && (
                <form className="col-span-1 lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 rounded-2xl p-5 shadow-sm flex flex-col gap-5" onSubmit={handleHomeworkCheck}>
                  <div className="text-sm font-semibold text-slate-500 dark:text-slate-450 flex items-center gap-1.5 border-b border-slate-150 dark:border-slate-800 pb-3">
                    <button type="button" className="hover:text-violet-600 transition-colors cursor-pointer" onClick={() => setSelectedResult(null)}>Kutayotganlar</button>
                    <span className="opacity-50">/</span>
                    <strong className="text-slate-900 dark:text-white">Uyga vazifa</strong>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-4">
                      <section className="flex flex-col gap-2.5 bg-slate-50/50 dark:bg-slate-955/10 border border-slate-100/50 dark:border-slate-800/40 p-4 rounded-2xl">
                        <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Uy vazifasi tavsifi</h2>
                        <div className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-medium">
                          <p>{selectedHomework?.description || "Izoh yo'q"}</p>
                        </div>
                      </section>

                      <section className="flex flex-col gap-3.5 bg-slate-50/50 dark:bg-slate-955/10 border border-slate-100/50 dark:border-slate-800/40 p-4 rounded-2xl">
                        <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">{selectedResult.studentName || "O'quvchi"}</h2>
                        <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-550 dark:text-slate-400">
                          <div>Vaqti: <strong className="text-slate-800 dark:text-slate-200 ml-1">{formatDate(selectedResult.submittedAt)}</strong></div>
                          <div>Fayllar soni: <strong className="text-slate-800 dark:text-slate-200 ml-1">{selectedResultFiles.length || (selectedResult.fileUrl ? 1 : 0)}</strong></div>
                          <div className="col-span-2 mt-1">Status:
                            <strong className="inline-flex items-center px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/20 uppercase tracking-wide text-[10px] ml-2">
                              {getHomeworkStatusLabel(selectedResult.status)}
                            </strong>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 mt-2 border-t border-slate-100 dark:border-slate-850 pt-3">
                          <strong className="text-xs text-slate-450 dark:text-slate-500 uppercase tracking-wider font-semibold">Topshirilgan fayl:</strong>
                          <div className="flex flex-wrap gap-2">
                            {(selectedResultFiles.length > 0 ? selectedResultFiles : [selectedResult.fileUrl].filter(Boolean)).map((file, index) => (
                              <a key={`${file}-${index}`} href={file} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all cursor-pointer">
                                <Download size={14} />
                                Fayl {index + 1}
                              </a>
                            ))}
                          </div>
                          {selectedResult.homeworkComment && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 bg-slate-100 dark:bg-slate-850 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800/30 leading-relaxed font-medium">
                              <span>O'quvchi izohi:</span>
                              <p className="mt-1 text-slate-700 dark:text-slate-300 font-semibold">{selectedResult.homeworkComment}</p>
                            </div>
                          )}
                        </div>
                      </section>
                    </div>

                    <div className="flex flex-col gap-4">
                      <section className="flex flex-col gap-4 bg-slate-50/50 dark:bg-slate-955/10 border border-slate-100/50 dark:border-slate-800/40 p-4 rounded-2xl">
                        <div className="flex items-start gap-2.5 p-3.5 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-semibold leading-relaxed border border-blue-100/30">
                          <Info size={16} className="mt-0.5 flex-shrink-0" />
                          <span>60-100 oralig'ida ball qo'yilgan vazifa 'Qabul qilingan', 0-59 oralig'ida ball qo'yilgan vazifa 'Qaytarilgan' hisoblanadi.</span>
                        </div>

                        <label className="flex flex-col gap-1.5 w-full">
                          <span className="text-xs font-bold text-slate-505 dark:text-slate-400 uppercase tracking-wider">Ball</span>
                          <div className="flex items-center gap-4">
                            <input type="range" min="0" max="100" className="w-full accent-violet-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none" value={selectedGrade} onChange={e => handleGradeChange(e.target.value)} />
                            <input type="number" min="0" max="100" className="w-20 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-center focus:border-violet-500 focus:outline-none dark:text-white font-bold" value={checkForm.grade} onChange={e => handleGradeChange(e.target.value)} placeholder="60" />
                          </div>
                          <small className="text-[10px] text-slate-400 font-medium">O'tish bali: 60</small>
                        </label>

                        <label className="flex flex-col gap-1.5 w-full">
                          <span className="text-xs font-bold text-slate-505 dark:text-slate-400 uppercase tracking-wider">Status</span>
                          <select className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none dark:text-white cursor-pointer" value={checkForm.status} onChange={e => setCheckForm(prev => ({ ...prev, status: e.target.value }))}>
                            <option value="ACCEPTED">Qabul qilingan</option>
                            <option value="REJECTED">Qaytarilgan</option>
                            <option value="PENDING">Kutmoqda</option>
                          </select>
                        </label>

                        <label className="flex flex-col gap-1.5 w-full">
                          <span className="text-xs font-bold text-slate-505 dark:text-slate-400 uppercase tracking-wider">Izoh</span>
                          <textarea className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none dark:text-white transition-all h-20" value={checkForm.comment} onChange={e => setCheckForm(prev => ({ ...prev, comment: e.target.value }))} placeholder="Izohingiz" />
                        </label>

                        <div className="flex gap-3 justify-end border-t border-slate-100 dark:border-slate-850 pt-4 mt-2">
                          <button type="button" className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-705 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer" onClick={() => setSelectedResult(null)}>Bekor qilish</button>
                          <button className="px-5 py-2 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-600/10 cursor-pointer" type="submit" disabled={checkingHomework || !selectedHomeworkId || !checkForm.studentId}>
                            {checkingHomework ? 'Yuborilmoqda...' : 'Yuborish'}
                          </button>
                        </div>
                      </section>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* VIDEOS SUB-TAB */}
          {lessonTab === 'videos' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 rounded-2xl shadow-sm overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-105 dark:border-slate-800">
                    <th className="px-5 py-4 font-semibold text-xs tracking-wider">#</th>
                    <th className="px-5 py-4 font-semibold text-xs tracking-wider">Fayl nomi</th>
                    <th className="px-5 py-4 font-semibold text-xs tracking-wider">Dars nomi</th>
                    <th className="px-5 py-4 font-semibold text-xs tracking-wider">Turi</th>
                    <th className="px-5 py-4 font-semibold text-xs tracking-wider">Hajmi</th>
                    <th className="px-5 py-4 font-semibold text-xs tracking-wider">Yuklangan vaqti</th>
                    <th className="px-5 py-4 font-semibold text-xs tracking-wider"></th>
                  </tr>
                </thead>
                <tbody>
                  {loadingFiles ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-sm text-slate-400 dark:text-slate-500 font-medium">Fayllar yuklanmoqda...</td>
                    </tr>
                  ) : videoRows.length > 0 ? videoRows.map((row, index) => (
                    <tr key={row.id || index} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 border-b border-slate-100 dark:border-slate-850/60 transition-colors">
                      <td className="px-5 py-4 text-xs font-bold text-slate-400">{index + 1}</td>
                      <td className="px-5 py-4">
                        {row.url ? (
                          <div className="flex items-center gap-3">
                            {isVideoFile(row) && (
                              <button className="inline-flex items-center gap-1.5 text-violet-650 hover:text-violet-750 dark:text-violet-400 dark:hover:text-violet-350 font-bold cursor-pointer text-xs" type="button" onClick={() => setPreviewVideo(row)}>
                                <PlayCircle size={15} />
                                Ko'rish
                              </button>
                            )}
                            <a className="inline-flex items-center gap-1.5 text-slate-700 hover:text-violet-600 dark:text-slate-300 dark:hover:text-violet-400 font-semibold cursor-pointer text-xs" href={row.url} target="_blank" rel="noreferrer">
                              <Download size={14} />
                              {row.name || 'Fayl'}
                            </a>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-slate-500 text-xs font-medium"><PlayCircle size={15} /> {row.name || row.topic || 'Fayl'}</span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-800 dark:text-slate-205">{row.lessonName || row.topic || '-'}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {row.type || '-'}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-650 dark:text-slate-400">{formatFileSize(row.size)}</td>
                      <td className="px-5 py-4 text-xs font-medium text-slate-550 dark:text-slate-450">{formatDate(row.createdAt || row.date)}</td>
                      <td className="px-5 py-4 text-right"><MoreVertical size={16} className="inline text-slate-400" /></td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-sm text-slate-450 dark:text-slate-500 font-medium">Bu guruh uchun fayllar topilmadi.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* EXAMS SUB-TAB */}
          {lessonTab === 'exams' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 rounded-2xl shadow-sm overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-105 dark:border-slate-800">
                    <th className="px-5 py-4 font-semibold text-xs tracking-wider">#</th>
                    <th className="px-5 py-4 font-semibold text-xs tracking-wider">Mavzu</th>
                    <th className="px-5 py-4 font-semibold text-xs tracking-wider"><UserRound size={16} className="inline-block" /></th>
                    <th className="px-5 py-4 font-semibold text-xs tracking-wider"><XCircle size={16} className="inline-block text-rose-500" /></th>
                    <th className="px-5 py-4 font-semibold text-xs tracking-wider">Status</th>
                    <th className="px-5 py-4 font-semibold text-xs tracking-wider">Dars vaqti</th>
                    <th className="px-5 py-4 font-semibold text-xs tracking-wider">Berilgan vaqt</th>
                    <th className="px-5 py-4 font-semibold text-xs tracking-wider">E'lon qilingan vaqti</th>
                    <th className="px-5 py-4 font-semibold text-xs tracking-wider"></th>
                  </tr>
                </thead>
                <tbody>
                  {examRows.map((row, index) => (
                    <tr key={row.id || index} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 border-b border-slate-100 dark:border-slate-850/60 transition-colors">
                      <td className="px-5 py-4 text-xs font-bold text-slate-400">{row.id || index + 1}</td>
                      <td className="px-5 py-4">
                        <button className="text-slate-900 dark:text-white font-bold text-left hover:text-violet-600 dark:hover:text-violet-405 transition-colors cursor-pointer">{row.topic || 'Examination'}</button>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-700 dark:text-slate-300">{row.attendanceCount || students.length || 0}</td>
                      <td className="px-5 py-4 font-bold text-rose-500">0</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${row.status === 'Faol' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                          {row.status || 'Tugagan'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-slate-800 dark:text-slate-200 leading-normal">{formatDate(row.date)}<br /><span className="text-slate-400 font-medium">09:30</span></td>
                      <td className="px-5 py-4 text-xs font-semibold text-slate-800 dark:text-slate-200 leading-normal">{formatDate(row.date)}<br /><span className="text-slate-400 font-medium">09:28</span></td>
                      <td className="px-5 py-4 text-xs font-medium text-slate-500 dark:text-slate-450">{row.status === 'Faol' ? '-' : formatDate(row.date)}</td>
                      <td className="px-5 py-4 text-right"><MoreVertical size={16} className="inline text-slate-400" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* JOURNAL SUB-TAB */}
          {lessonTab === 'journal' && (
            <div className="flex flex-col gap-5">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {lessonDays.map((day, index) => (
                  <button
                    key={`${day.value}-${index}`}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border min-w-[56px] transition-all cursor-pointer ${index === selectedMonth ? 'bg-violet-600 border-violet-600 text-white shadow-md shadow-violet-600/10' : day.completed ? 'bg-slate-55/60 dark:bg-slate-800/40 border-slate-150 dark:border-slate-800 text-slate-400 dark:text-slate-500' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    onClick={() => handleLessonDaySelect(day, index)}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">{day.month}</span>
                    <strong className="text-base font-extrabold mt-0.5">{day.day}</strong>
                  </button>
                ))}
              </div>

              <form className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 rounded-2xl p-5 shadow-sm flex flex-col gap-4" onSubmit={handleLessonSubmit}>
                <div className="text-xs font-bold text-slate-400 dark:text-slate-505 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-850 pb-2">Yo'qlama va mavzu kiritish</div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex flex-col gap-1.5 w-full">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sana <span className="text-rose-500">*</span></span>
                    <input type="date" className="w-full rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none dark:text-white transition-all cursor-pointer" value={lessonForm.date} onChange={e => setLessonForm(prev => ({ ...prev, date: e.target.value }))} required />
                  </label>

                  <div className="flex flex-col gap-1.5 w-full">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mavzu manbasi</span>
                    <div className="flex gap-5 bg-slate-50 dark:bg-slate-950/15 border border-slate-100/50 dark:border-slate-800/40 p-3 rounded-xl text-sm w-fit">
                      <label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          className="rounded-full text-violet-600 focus:ring-violet-500 h-4.5 w-4.5 accent-violet-600 cursor-pointer"
                          name="lesson-source"
                          checked={lessonSource === 'plan'}
                          onChange={() => setLessonSource('plan')}
                        />
                        O'quv reja bo'yicha
                      </label>
                      <label className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          className="rounded-full text-violet-600 focus:ring-violet-500 h-4.5 w-4.5 accent-violet-600 cursor-pointer"
                          name="lesson-source"
                          checked={lessonSource === 'custom'}
                          onChange={() => setLessonSource('custom')}
                        />
                        Boshqa
                      </label>
                    </div>
                  </div>
                </div>

                {lessonSource === 'plan' ? (
                  <label className="flex flex-col gap-1.5 w-full">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mavzu <span className="text-rose-500">*</span></span>
                    <select className="w-full rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none dark:text-white transition-all cursor-pointer" value={selectedPlanId} onChange={e => setSelectedPlanId(e.target.value)} required>
                      <option value="">O'quv reja API ulanmagan</option>
                      {lessonPlans.map(plan => (
                        <option key={plan.id} value={plan.id}>{plan.title || plan.topic || plan.name}</option>
                      ))}
                    </select>
                    <small className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Backenddan o'quv reja endpointini bersangiz, shu select real mavzular bilan to'ladi.</small>
                  </label>
                ) : (
                  <label className="flex flex-col gap-1.5 w-full">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mavzu <span className="text-rose-500">*</span></span>
                    <input className="w-full rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none dark:text-white transition-all" value={lessonForm.topic} onChange={e => setLessonForm(prev => ({ ...prev, topic: e.target.value }))} placeholder="Mavzuni kiriting..." required />
                  </label>
                )}

                <label className="flex flex-col gap-1.5 w-full">
                  <span className="text-xs font-bold text-slate-505 dark:text-slate-400 uppercase tracking-wider">Tavsif (ixtiyoriy)</span>
                  <textarea className="w-full rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none dark:text-white transition-all h-20" value={lessonForm.description} onChange={e => setLessonForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Dars haqida qo'shimcha ma'lumot..." />
                </label>

                <div className={`text-xs font-bold p-3.5 rounded-xl border transition-all ${attendanceWindow.open ? 'bg-emerald-50/50 dark:bg-emerald-950/10 text-emerald-600 dark:text-emerald-400 border-emerald-100/30' : 'bg-rose-50/50 dark:bg-rose-955/10 text-rose-600 dark:text-rose-450 border-rose-100/30'}`}>
                  {attendanceWindow.message}
                </div>

                <div className="flex flex-col border border-slate-100 dark:border-slate-800/80 rounded-2xl overflow-hidden bg-slate-50/30 dark:bg-slate-955/10 mt-2">
                  <div className="grid grid-cols-[60px_1fr_220px] gap-4 px-5 py-3.5 bg-slate-100 dark:bg-slate-800/50 border-b border-slate-200/50 dark:border-slate-700/50 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <span>#</span>
                    <span>O'quvchi ismi</span>
                    <span>Davomat</span>
                  </div>
                  {students.length > 0 ? students.map((student, index) => (
                    <div key={student.id || student.name} className="grid grid-cols-[60px_1fr_220px] gap-4 px-5 py-3.5 items-center border-b border-slate-100 dark:border-slate-850 last:border-0 hover:bg-slate-100/30 dark:hover:bg-slate-800/20 transition-colors">
                      <span className="text-xs font-bold text-slate-400">{index + 1}</span>
                      <span className="flex items-center gap-3 font-semibold text-slate-800 dark:text-slate-200 text-sm">
                        <span className="w-7 h-7 rounded-full bg-slate-105 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold text-[10px] border border-slate-200 dark:border-slate-700">{student.initials}</span>
                        {student.name}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={!canEditAttendance}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${lessonForm.attendance[student.id] === true ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/10' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed'}`}
                          onClick={() => toggleAttendance(student.id, true)}
                        >
                          Keldi
                        </button>
                        <button
                          type="button"
                          disabled={!canEditAttendance}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${lessonForm.attendance[student.id] === false ? 'bg-rose-500 border-rose-500 text-white shadow-sm shadow-rose-500/10' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed'}`}
                          onClick={() => toggleAttendance(student.id, false)}
                        >
                          Kelmadi
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-sm text-slate-450 dark:text-slate-500 font-medium">Bu guruhda o'quvchilar topilmadi.</div>
                  )}
                </div>

                <div className="flex gap-3 justify-end mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button type="button" className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer" onClick={() => {
                    setLessonForm(prev => ({ ...prev, topic: '', description: '', attendance: {} }))
                    setSelectedPlanId('')
                  }}>Bekor qilish</button>

                  <button type="submit" className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-all shadow-md shadow-violet-600/10 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed" disabled={savingLesson || !canEditAttendance}>
                    {savingLesson ? 'Saqlanmoqda...' : 'Saqlash'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>
      )}

      {/* ATTENDANCE TAB */}
      {mainTab === 'attendance' && (
        <section className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="flex flex-col gap-0.5 p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 rounded-2xl shadow-sm text-center">
              <span className="text-xs font-semibold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Umumiy yozuvlar</span>
              <strong className="text-2xl font-bold text-slate-850 dark:text-white mt-1">{attendanceRecords.length}</strong>
            </div>
            <div className="flex flex-col gap-0.5 p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 rounded-2xl shadow-sm text-center">
              <span className="text-xs font-semibold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Kelgan</span>
              <strong className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{attendancePresentCount}</strong>
            </div>
            <div className="flex flex-col gap-0.5 p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 rounded-2xl shadow-sm text-center">
              <span className="text-xs font-semibold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Kelmagan</span>
              <strong className="text-2xl font-bold text-rose-600 dark:text-rose-450 mt-1">{attendanceAbsentCount}</strong>
            </div>
          </div>

          {[1, 2, 3, 4, 5].map((month, monthIndex) => (
            <div key={month} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 rounded-2xl p-5 shadow-sm flex flex-col gap-3.5">
              <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                {month}-o'quv oyi
                {monthIndex === 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-violet-50 dark:bg-violet-955/35 text-violet-650 dark:text-violet-400 uppercase tracking-wider border border-violet-100 dark:border-violet-900/30">Joriy oy</span>
                )}
              </h2>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {lessonDays.map((day, index) => (
                  <button key={`${month}-${day.value}-${index}`} className={`flex flex-col items-center justify-center p-2.5 rounded-xl border min-w-[56px] transition-all cursor-default ${monthIndex === 0 && index < 7 ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-150 dark:border-slate-800 text-slate-400 dark:text-slate-500' : 'bg-white dark:bg-slate-905 border-slate-205 dark:border-slate-705 text-slate-700 dark:text-slate-300'}`}>
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">{monthIndex === 0 ? 'Jan' : day.month}</span>
                    <strong className="text-base font-extrabold mt-0.5">{monthIndex === 0 ? [2, 5, 7, 9, 12, 14, 16, 19, 21, 23, 26, 28, 30][index] : day.day}</strong>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* VIDEO PREVIEW MODAL */}
      {previewVideo && (
        <div className="fixed inset-0 z-[150] flex justify-center items-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={() => setPreviewVideo(null)}>
          <div className="w-full max-w-[680px] bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl flex flex-col gap-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{previewVideo.name || 'Video'}</h2>
              <button className="p-1 text-slate-400 hover:text-slate-655 cursor-pointer" onClick={() => setPreviewVideo(null)} aria-label="Yopish">
                <X size={20} />
              </button>
            </div>
            <div className="rounded-xl overflow-hidden bg-black aspect-video flex justify-center items-center">
              <video src={previewVideo.url} controls autoPlay className="w-full h-full" />
            </div>
          </div>
        </div>
      )}

      {/* FILE UPLOAD MODAL */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-[150] flex justify-center items-center bg-slate-900/40 backdrop-blur-sm p-4" onClick={closeVideoModal}>
          <div className="w-full max-w-[620px] bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl flex flex-col gap-5 overflow-y-auto max-h-[95vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-905 dark:text-white">Fayl yuklash</h2>
              <button className="p-1 text-slate-400 hover:text-slate-650 cursor-pointer" onClick={closeVideoModal} aria-label="Yopish">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleVideoUpload} className="flex flex-col gap-4">
              <label
                className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-violet-500 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-55/30 dark:bg-slate-950/10"
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault()
                  handleVideoFile(e.dataTransfer.files?.[0])
                }}
              >
                <input
                  type="file"
                  accept="*/*"
                  className="hidden"
                  onChange={e => handleVideoFile(e.target.files?.[0])}
                />
                <div className="w-14 h-14 bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 rounded-2xl flex items-center justify-center mb-3">
                  <Upload size={24} />
                </div>
                <strong className="font-bold text-sm text-slate-800 dark:text-slate-200">Faylni yuklash uchun ushbu hudud ustiga bosing yoki faylni shu yerga olib keling</strong>
                <small className="text-xs text-slate-450 dark:text-slate-500 mt-1">Darslik, rasm, video yoki qo'shimcha material fayllarini yuklash mumkin</small>
              </label>

              {videoFile && (
                <div className="flex flex-col border border-slate-150 dark:border-slate-800 rounded-xl overflow-hidden mt-4">
                  <div className="grid grid-cols-[1.5fr_1fr_1.5fr_50px] gap-3 px-4 py-2.5 bg-slate-100 dark:bg-slate-800/50 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <span>Fayl formati</span>
                    <span><b>*</b> Dars</span>
                    <span><b>*</b> Fayl nomi</span>
                    <span></span>
                  </div>
                  <div className="grid grid-cols-[1.5fr_1fr_1.5fr_50px] gap-3 px-4 py-3 items-center border-t border-slate-150 dark:border-slate-800/60 text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{videoFile.name}</span>
                    <select className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs focus:border-violet-500 focus:outline-none dark:text-white cursor-pointer" value={videoLessonId} onChange={e => setVideoLessonId(e.target.value)} required>
                      <option value="">Darsni tanlang</option>
                      {allLessons.map((lesson, index) => (
                        <option key={lesson.id || index} value={lesson.id || index}>{lesson.topic || `Dars ${index + 1}`}</option>
                      ))}
                    </select>
                    <input className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs focus:border-violet-500 focus:outline-none dark:text-white" value={videoName} onChange={e => setVideoName(e.target.value)} required />
                    <button
                      type="button"
                      className="p-1 text-slate-400 hover:text-rose-650 transition-colors cursor-pointer justify-self-center"
                      onClick={() => {
                        setVideoFile(null)
                        setVideoName('')
                        setVideoLessonId('')
                      }}
                      aria-label="Faylni olib tashlash"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end border-t border-slate-100 dark:border-slate-850 pt-4 mt-2">
                <button type="button" className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-755 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer" onClick={closeVideoModal}>Bekor qilish</button>
                {videoFile && (
                  <button type="submit" className="px-5 py-2 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-705 text-white shadow-md shadow-violet-600/10 cursor-pointer disabled:opacity-40" disabled={uploadingFile || !videoLessonId || !videoName.trim()}>
                    {uploadingFile ? 'Yuklanmoqda...' : 'Faylni yuklash'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
