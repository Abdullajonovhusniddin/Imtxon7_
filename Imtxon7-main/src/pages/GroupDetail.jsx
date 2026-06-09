import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { API_BASE, deleteJson, getJson, getUserRole, postJson } from '../api'
import {
  ArrowLeft,
  BarChart3,
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
import s from './GroupDetail.module.scss'

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
          try { window.opener.location.reload() } catch (err) { }
          try { window.close() } catch (err) { }
        }
      } catch (err) {
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
    <div className={s.loading}>
      <div className={s.spinner} />
      <span>Yuklanmoqda...</span>
    </div>
  )

  if (!group) return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 80, gap: 16 }}>
      <div style={{ padding: 20, backgroundColor: '#fef2f2', borderRadius: 16, color: '#ef4444' }}>
        <XCircle size={32} />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Guruh topilmadi</h3>
      <p style={{ fontSize: 13, color: 'var(--muted)', maxWidth: 300, textAlign: 'center' }}>Qidirilayotgan guruh bazadan topilmadi yoki o'chirilgan bo'lishi mumkin.</p>
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
    <div className={s.container}>
      {/* HEADER */}
      <header className={s.header}>
        <div className={s.headerLeft}>
          <button className={s.backBtn} onClick={() => navigate('/groups')} aria-label="Orqaga">
            <ArrowLeft size={20} />
          </button>
          <h1 className={s.groupTitle}>{getGroupName()}</h1>
          <span className={s.statusBadge}>
            {group.status || 'Aktiv'}
          </span>
        </div>
        <div className={s.headerRight}>
          <button className={s.statsBtn}>
            <BarChart3 size={18} />
            Statistika
          </button>
          <button className={s.deleteBtn} title="Guruhni o'chirish" onClick={deleteGroup}>
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      {/* TABS */}
      <nav className={s.tabs}>
        <button 
          className={`${s.tab} ${mainTab === 'info' ? s.activeTab : ''}`} 
          onClick={() => handleMainTabChange('info')}
        >
          Ma'lumotlar
        </button>
        <button 
          className={`${s.tab} ${mainTab === 'lessons' ? s.activeTab : ''}`} 
          onClick={() => handleMainTabChange('lessons')}
        >
          Guruh darsliklari
        </button>
        <button 
          className={`${s.tab} ${mainTab === 'attendance' ? s.activeTab : ''}`} 
          onClick={() => handleMainTabChange('attendance')}
        >
          Akademik davomati
        </button>
      </nav>

      {/* INFO TAB */}
      {mainTab === 'info' && (
        <section className={s.infoGrid}>
          <article className={s.card}>
            <div className={`${s.cardHeader} ${s.purpleHeader}`}>
              <h3>Guruh mentorlari</h3>
            </div>
            <div className={`${s.cardBodyWrapper} ${s.open}`}>
              <div className={s.cardBody}>
                <div className={s.mentorsList}>
                  {Array.isArray(group.teachers) && group.teachers.length > 0 ? group.teachers.map(teacher => {
                    const teacherName = teacher.name || teacher.full_name || "Noma'lum"
                    return (
                      <div key={teacher.id || teacherName} className={s.mentorItem}>
                        <div className={s.mentorAvatar}>{getInitials(teacherName)}</div>
                        <div className={s.mentorRole}>Teacher</div>
                        <span className={s.mentorName}>{teacherName}</span>
                      </div>
                    )
                  }) : (
                    <div style={{ color: 'var(--muted)', textAlign: 'center', width: '100%' }}>Mentorlar yo'q</div>
                  )}
                </div>
              </div>
            </div>
          </article>

          <article className={s.card}>
            <div className={s.cardHeader}>
              <h3>Parametrlar</h3>
            </div>
            <div className={`${s.cardBodyWrapper} ${s.open}`}>
              <div className={s.cardBody}>
                <div className={s.paramRow}>
                  <span>Kurs:</span>
                  <strong>{getCourseName(group)}</strong>
                </div>
                <div className={s.paramRow}>
                  <span>O'rtacha yosh:</span>
                  <strong>{group.avg_age || '-'}</strong>
                </div>
                <div className={s.paramRow}>
                  <span>O'quvchilar sig'imi:</span>
                  <strong>{group.student_limit || '-'}</strong>
                </div>
                <div className={s.paramRow}>
                  <span>Mavjud o'quvchilar:</span>
                  <strong>{students.length || group.students_count || 0}</strong>
                </div>
                <div className={s.paramRow}>
                  <span>Ochilgan sana:</span>
                  <strong>{getOpenedDate(group)}</strong>
                </div>
                <div className={s.paramRow}>
                  <span>Dars jadvali:</span>
                  <strong>{getScheduleSummary()}</strong>
                </div>
              </div>
            </div>
          </article>

          <article className={s.scheduleCard} style={{ gridColumn: 'span 2' }}>
            <h2>Dars jadvali</h2>
            <div className={s.scheduleList}>
              {(schedules.length > 0 ? schedules : [{ id: 'fallback', teacher: 'Teacher', day: group.week_day || group.days, startTime: group.start_time || group.time, endTime: group.end_time, room: group.room_name || '-' }]).map(item => (
                <div key={item.id} className={s.scheduleRow}>
                  <strong className={s.schedTeacher}>{item.teacher}</strong>
                  <span className={s.schedDays}>{formatScheduleDay(item.day)}</span>
                  <span className={s.schedTime}>{item.startTime || '-'} dan {item.endTime || '-'} gacha</span>
                  <span className={s.schedPeriod}>{[item.startDate && formatDate(item.startDate), item.endDate && formatDate(item.endDate)].filter(Boolean).join(' - ') || '-'}</span>
                  <span className={s.schedRoom}>{item.room}</span>
                </div>
              ))}
            </div>
            <div className={s.calendarRow}>
              {lessonDays.map((day, index) => (
                <button 
                  key={`${day.value}-${index}`} 
                  className={`${s.calChip} ${index === selectedMonth ? s.chipActive : day.completed ? s.chipDone : ''}`} 
                  onClick={() => handleLessonDaySelect(day, index, true)}
                >
                  <span>{day.month}</span>
                  <strong>{day.day}</strong>
                </button>
              ))}
            </div>
          </article>
        </section>
      )}

      {/* LESSONS TAB */}
      {mainTab === 'lessons' && (
        <section className={s.lessonsSection}>
          <div className={s.lessonsHeader}>
            <div className={s.lessonsHeaderLeft}>
              <h2>Guruh darsliklari</h2>
              <div className={s.subTabs}>
                {lessonTabs.map(tab => (
                  <button 
                    key={tab.id} 
                    className={`${s.subTab} ${lessonTab === tab.id ? s.activeSubTab : ''}`} 
                    onClick={() => handleLessonTabChange(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            
            {lessonTab === 'videos' && canManageHomework && (
              <button className={s.addBtn} onClick={openVideoModal}>
                <Upload size={14} />
                Fayl yuklash
              </button>
            )}
            {lessonTab === 'homework' && canManageHomework && (
              <button className={s.addBtn} onClick={openHomeworkInNewWindow}>
                <Plus size={14} />
                Yangi uy vazifa
              </button>
            )}
            {lessonTab === 'exams' && (
              <button className={s.addBtn}>
                Yangi imtihon
              </button>
            )}
          </div>

          {/* HOMEWORK SUB-TAB */}
          {lessonTab === 'homework' && (
            <div className={s.hwGrid}>
              <div className={s.hwPanel}>
                <div className={s.panelTitle}>
                  <span>{getGroupName()}</span> 
                  <span style={{ opacity: 0.5 }}>/</span> 
                  <span>Uyga vazifa</span>
                </div>
                
                <div className={s.hwFilterRow}>
                  <select 
                    className={s.select}
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
                    className={s.select}
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
                  
                  <button className={s.filterBtn} onClick={() => loadHomeworkResults()}>
                    <Eye size={14} />
                    Natijalar
                  </button>
                </div>

                <div className={s.statsRow}>
                  <div className={s.miniStat}>
                    <span>Topshirgan</span>
                    <strong>{submittedCount}</strong>
                  </div>
                  <div className={s.miniStat}>
                    <span>Topshirmagan</span>
                    <strong>{notSubmittedRows.length}</strong>
                  </div>
                  <div className={s.miniStat}>
                    <span>Kutmoqda</span>
                    <strong>{pendingCount}</strong>
                  </div>
                </div>

                {loadingHomework ? (
                  <div style={{ textAlign: 'center', color: 'var(--muted)' }}>Uy vazifalar yuklanmoqda...</div>
                ) : homeworks.length > 0 ? (
                  <div className={s.hwList}>
                    {homeworks.map(item => (
                      <article key={item.id || item.title} className={s.hwItem}>
                        <h3 className={s.hwItemTitle}>{item.title}</h3>
                        <p className={s.hwItemDesc}>{item.description || "Tavsif yo'q"}</p>
                        <div className={s.hwItemMeta}>
                          <span>Muddat: {formatDate(item.deadline)}</span>
                          {item.fileUrl && (
                            <a href={item.fileUrl} target="_blank" rel="noreferrer" className={s.viewBtn}>
                              <Download size={14} />
                              Fayl
                            </a>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--muted)' }}>Bu guruh uchun uy vazifa topilmadi.</div>
                )}

                {ownHomework && (
                  <div className={s.miniStat} style={{ alignItems: 'flex-start', padding: 12 }}>
                    <span style={{ color: '#7c3aed' }}>Talaba uchun dars bo'yicha vazifa:</span>
                    <strong style={{ fontSize: 14, marginTop: 4 }}>{ownHomework.title || ownHomework.name || 'Uyga vazifa'}</strong>
                    {(ownHomework.fileUrl || ownHomework.file_url || ownHomework.url) && (
                      <a href={ownHomework.fileUrl || ownHomework.file_url || ownHomework.url} target="_blank" rel="noreferrer" className={s.viewBtn} style={{ marginTop: 8 }}>
                        <Download size={14} />
                        Yuklab olish
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* CREATE HOMEWORK FORM */}
              {canManageHomework && (
                <form className={s.hwPanel} onSubmit={handleHomeworkSubmit}>
                  <div className={s.panelTitle}>
                    <Plus size={16} /> 
                    <span>Yangi uy vazifa</span>
                  </div>
                  <label className={s.formGroup}>
                    <span className={s.label}>Nomi <span className={s.req}>*</span></span>
                    <input 
                      className={s.input}
                      value={homeworkForm.title} 
                      onChange={e => setHomeworkForm(prev => ({ ...prev, title: e.target.value }))} 
                      placeholder="Masalan: React props mashqi" 
                      required 
                    />
                  </label>
                  <label className={s.formGroup}>
                    <span className={s.label}>Dars</span>
                    <select 
                      className={s.formSelect}
                      value={homeworkForm.lessonId} 
                      onChange={e => setHomeworkForm(prev => ({ ...prev, lessonId: e.target.value }))}
                    >
                      <option value="">Darsni tanlang</option>
                      {allLessons.map((lesson, index) => (
                        <option key={lesson.id || index} value={lesson.id || index}>{lesson.topic}</option>
                      ))}
                    </select>
                  </label>
                  <label className={s.formGroup}>
                    <span className={s.label}>Muddat</span>
                    <input 
                      type="date" 
                      className={s.input}
                      value={homeworkForm.deadline} 
                      onChange={e => setHomeworkForm(prev => ({ ...prev, deadline: e.target.value }))} 
                    />
                  </label>
                  <label className={s.formGroup}>
                    <span className={s.label}>Tavsif</span>
                    <textarea 
                      className={s.textarea}
                      value={homeworkForm.description} 
                      onChange={e => setHomeworkForm(prev => ({ ...prev, description: e.target.value }))} 
                      placeholder="Vazifa matni..." 
                    />
                  </label>
                  <button 
                    className={s.submitBtn}
                    type="submit" 
                    disabled={savingHomework || !homeworkForm.title.trim()}
                  >
                    {savingHomework ? 'Saqlanmoqda...' : "Qo'shish"}
                  </button>
                </form>
              )}

              {/* SUBMISSIONS TABLE */}
              <div className={`${s.tableWrap} ${s.hwGrid}`} style={{ gridColumn: 'span 3' }}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>O'quvchi</th>
                      <th>Status</th>
                      <th>Baho</th>
                      <th>Topshirgan vaqti</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleHomeworkRows.length > 0 ? visibleHomeworkRows.map((row, index) => (
                      <tr key={row.id || index}>
                        <td>{index + 1}</td>
                        <td style={{ fontWeight: 600 }}>{row.studentName}</td>
                        <td>
                          <span className={`${s.badge} ${normalizeResultStatus(row.status) === 'NOT_SUBMITTED' || normalizeResultStatus(row.status) === 'REJECTED' ? s.red : s.green}`}>
                            {getHomeworkStatusLabel(row.status)}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700 }}>{row.grade}</td>
                        <td>{formatDate(row.submittedAt)}</td>
                        <td>
                          <button 
                            className={s.viewBtn}
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
                        <td colSpan="6" className={s.tableEmpty}>Natijalar topilmadi.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* GRADING FORM */}
              {canManageHomework && selectedResult && (
                <form className={s.gradingForm} style={{ gridColumn: 'span 3' }} onSubmit={handleHomeworkCheck}>
                  <div className={s.panelTitle}>
                    <button type="button" className={s.viewBtn} onClick={() => setSelectedResult(null)}>Kutayotganlar</button>
                    <span style={{ opacity: 0.5 }}>/</span>
                    <strong style={{ color: 'var(--text)' }}>Uyga vazifa</strong>
                  </div>

                  <div className={s.gradingGrid}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <section className={s.miniStat} style={{ alignItems: 'flex-start', padding: 16 }}>
                        <h2 className={s.label}>Uy vazifasi tavsifi</h2>
                        <p style={{ fontSize: 13, marginTop: 6 }}>{selectedHomework?.description || "Izoh yo'q"}</p>
                      </section>

                      <section className={s.miniStat} style={{ alignItems: 'flex-start', padding: 16 }}>
                        <h2 className={s.label}>{selectedResult.studentName || "O'quvchi"}</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, marginTop: 8 }}>
                          <div>Vaqti: <strong>{formatDate(selectedResult.submittedAt)}</strong></div>
                          <div>Fayllar soni: <strong>{selectedResultFiles.length || (selectedResult.fileUrl ? 1 : 0)}</strong></div>
                          <div>Status: 
                            <span className={`${s.badge} ${s.yellow}`} style={{ marginLeft: 8 }}>
                              {getHomeworkStatusLabel(selectedResult.status)}
                            </span>
                          </div>
                        </div>
                        
                        <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12, width: '100%' }}>
                          <strong className={s.label}>Topshirilgan fayl:</strong>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                            {(selectedResultFiles.length > 0 ? selectedResultFiles : [selectedResult.fileUrl].filter(Boolean)).map((file, index) => (
                              <a key={`${file}-${index}`} href={file} target="_blank" rel="noreferrer" className={s.cancelBtn} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <Download size={14} />
                                Fayl {index + 1}
                              </a>
                            ))}
                          </div>
                          {selectedResult.homeworkComment && (
                            <div className={s.infoBox} style={{ marginTop: 12 }}>
                              <span>O'quvchi izohi:</span>
                              <p style={{ fontWeight: 600, marginTop: 4 }}>{selectedResult.homeworkComment}</p>
                            </div>
                          )}
                        </div>
                      </section>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <section className={s.miniStat} style={{ alignItems: 'flex-start', padding: 16 }}>
                        <div className={s.infoBox}>
                          <Info size={16} style={{ flexShrink: 0 }} />
                          <span>60-100 oralig'ida ball qo'yilgan vazifa 'Qabul qilingan', 0-59 oralig'ida ball qo'yilgan vazifa 'Qaytarilgan' hisoblanadi.</span>
                        </div>
                        
                        <label className={s.formGroup} style={{ width: '100%', marginTop: 12 }}>
                          <span className={s.label}>Ball</span>
                          <div className={s.rangeRow}>
                            <input type="range" min="0" max="100" value={selectedGrade} onChange={e => handleGradeChange(e.target.value)} />
                            <input type="number" min="0" max="100" value={checkForm.grade} onChange={e => handleGradeChange(e.target.value)} placeholder="60" />
                          </div>
                          <small style={{ color: 'var(--muted)', fontSize: 10 }}>O'tish bali: 60</small>
                        </label>
                        
                        <label className={s.formGroup} style={{ width: '100%' }}>
                          <span className={s.label}>Status</span>
                          <select className={s.formSelect} value={checkForm.status} onChange={e => setCheckForm(prev => ({ ...prev, status: e.target.value }))}>
                            <option value="ACCEPTED">Qabul qilingan</option>
                            <option value="REJECTED">Qaytarilgan</option>
                            <option value="PENDING">Kutmoqda</option>
                          </select>
                        </label>
                        
                        <label className={s.formGroup} style={{ width: '100%' }}>
                          <span className={s.label}>Izoh</span>
                          <textarea className={s.textarea} value={checkForm.comment} onChange={e => setCheckForm(prev => ({ ...prev, comment: e.target.value }))} placeholder="Izohingiz" />
                        </label>
                        
                        <div className={s.gradingActions} style={{ width: '100%' }}>
                          <button type="button" className={s.cancelBtn} onClick={() => setSelectedResult(null)}>Bekor qilish</button>
                          <button className={s.primaryBtn} type="submit" disabled={checkingHomework || !selectedHomeworkId || !checkForm.studentId}>
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
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Fayl nomi</th>
                    <th>Dars nomi</th>
                    <th>Turi</th>
                    <th>Hajmi</th>
                    <th>Yuklangan vaqti</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {loadingFiles ? (
                    <tr>
                      <td colSpan="7" className={s.tableEmpty}>Fayllar yuklanmoqda...</td>
                    </tr>
                  ) : videoRows.length > 0 ? videoRows.map((row, index) => (
                    <tr key={row.id || index}>
                      <td>{index + 1}</td>
                      <td>
                        {row.url ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {isVideoFile(row) && (
                              <button className={s.viewBtn} type="button" onClick={() => setPreviewVideo(row)}>
                                <PlayCircle size={15} />
                                Ko'rish
                              </button>
                            )}
                            <a className={s.viewBtn} style={{ color: 'var(--text)' }} href={row.url} target="_blank" rel="noreferrer">
                              <Download size={14} />
                              {row.name || 'Fayl'}
                            </a>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 6 }}><PlayCircle size={15} /> {row.name || row.topic || 'Fayl'}</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 600 }}>{row.lessonName || row.topic || '-'}</td>
                      <td>
                        <span className={`${s.badge} ${s.gray}`}>
                          {row.type || '-'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{formatFileSize(row.size)}</td>
                      <td>{formatDate(row.createdAt || row.date)}</td>
                      <td style={{ textAlign: 'right' }}><MoreVertical size={16} style={{ color: 'var(--muted)' }} /></td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="7" className={s.tableEmpty}>Bu guruh uchun fayllar topilmadi.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* EXAMS SUB-TAB */}
          {lessonTab === 'exams' && (
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Mavzu</th>
                    <th>O'quvchilar</th>
                    <th>Yiqildi</th>
                    <th>Status</th>
                    <th>Dars vaqti</th>
                    <th>Berilgan vaqt</th>
                    <th>E'lon qilingan vaqti</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {examRows.map((row, index) => (
                    <tr key={row.id || index}>
                      <td>{row.id || index + 1}</td>
                      <td>
                        <button className={s.viewBtn} style={{ color: 'var(--text)', fontWeight: 750 }}>{row.topic || 'Examination'}</button>
                      </td>
                      <td style={{ fontWeight: 700 }}>{row.attendanceCount || students.length || 0}</td>
                      <td style={{ fontWeight: 700, color: '#ef4444' }}>0</td>
                      <td>
                        <span className={`${s.badge} ${row.status === 'Faol' ? s.green : s.gray}`}>
                          {row.status || 'Tugagan'}
                        </span>
                      </td>
                      <td>{formatDate(row.date)}<br /><span style={{ color: 'var(--muted)', fontSize: 11 }}>09:30</span></td>
                      <td>{formatDate(row.date)}<br /><span style={{ color: 'var(--muted)', fontSize: 11 }}>09:28</span></td>
                      <td style={{ color: 'var(--muted)' }}>{row.status === 'Faol' ? '-' : formatDate(row.date)}</td>
                      <td style={{ textAlign: 'right' }}><MoreVertical size={16} style={{ color: 'var(--muted)' }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* JOURNAL SUB-TAB */}
          {lessonTab === 'journal' && (
            <div className={s.journalSection}>
              <div className={s.calendarRow}>
                {lessonDays.map((day, index) => (
                  <button 
                    key={`${day.value}-${index}`} 
                    className={`${s.calChip} ${index === selectedMonth ? s.chipActive : day.completed ? s.chipDone : ''}`} 
                    onClick={() => handleLessonDaySelect(day, index)}
                  >
                    <span>{day.month}</span>
                    <strong>{day.day}</strong>
                  </button>
                ))}
              </div>

              <form className={s.journalForm} onSubmit={handleLessonSubmit}>
                <div className={s.journalFormHeader}>Yo'qlama va mavzu kiritish</div>
                
                <div className={s.journalFormGrid}>
                  <label className={s.formGroup}>
                    <span className={s.label}>Sana <span className={s.req}>*</span></span>
                    <input type="date" className={s.input} value={lessonForm.date} onChange={e => setLessonForm(prev => ({ ...prev, date: e.target.value }))} required />
                  </label>
                  
                  <div className={s.formGroup}>
                    <span className={s.label}>Mavzu manbasi</span>
                    <div style={{ display: 'flex', gap: 20, padding: 12, backgroundColor: 'var(--surface-strong)', border: '1px solid var(--border)', borderRadius: 10, width: 'fit-content' }}>
                      <label className={s.dayLabel}>
                        <input
                          type="radio"
                          name="lesson-source"
                          checked={lessonSource === 'plan'}
                          onChange={() => setLessonSource('plan')}
                        />
                        O'quv reja bo'yicha
                      </label>
                      <label className={s.dayLabel}>
                        <input
                          type="radio"
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
                  <label className={s.formGroup}>
                    <span className={s.label}>Mavzu <span className={s.req}>*</span></span>
                    <select className={s.formSelect} value={selectedPlanId} onChange={e => setSelectedPlanId(e.target.value)} required>
                      <option value="">O'quv reja API ulanmagan</option>
                      {lessonPlans.map(plan => (
                        <option key={plan.id} value={plan.id}>{plan.title || plan.topic || plan.name}</option>
                      ))}
                    </select>
                    <small style={{ color: 'var(--muted)', fontSize: 10 }}>Backenddan o'quv reja endpointini bersangiz, shu select real mavzular bilan to'ladi.</small>
                  </label>
                ) : (
                  <label className={s.formGroup}>
                    <span className={s.label}>Mavzu <span className={s.req}>*</span></span>
                    <input className={s.input} value={lessonForm.topic} onChange={e => setLessonForm(prev => ({ ...prev, topic: e.target.value }))} placeholder="Mavzuni kiriting..." required />
                  </label>
                )}

                <label className={s.formGroup}>
                  <span className={s.label}>Tavsif (ixtiyoriy)</span>
                  <textarea className={s.textarea} value={lessonForm.description} onChange={e => setLessonForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Dars haqida qo'shimcha ma'lumot..." />
                </label>

                <div className={`${s.attStatus} ${attendanceWindow.open ? s.attOpen : s.attClosed}`}>
                  {attendanceWindow.message}
                </div>

                <div className={s.attTable}>
                  <div className={s.attHeader}>
                    <span>#</span>
                    <span>O'quvchi ismi</span>
                    <span>Davomat</span>
                  </div>
                  {students.length > 0 ? students.map((student, index) => (
                    <div key={student.id || student.name} className={s.attRow}>
                      <span className={s.attNum}>{index + 1}</span>
                      <span className={s.attStudent}>
                        <span className={s.attInitials}>{student.initials}</span>
                        {student.name}
                      </span>
                      <div className={s.attBtns}>
                        <button
                          type="button"
                          disabled={!canEditAttendance}
                          className={`${s.attBtn} ${lessonForm.attendance[student.id] === true ? s.presentActive : ''}`}
                          onClick={() => toggleAttendance(student.id, true)}
                        >
                          Keldi
                        </button>
                        <button
                          type="button"
                          disabled={!canEditAttendance}
                          className={`${s.attBtn} ${lessonForm.attendance[student.id] === false ? s.absentActive : ''}`}
                          onClick={() => toggleAttendance(student.id, false)}
                        >
                          Kelmadi
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div style={{ textAlign: 'center', padding: 20, color: 'var(--muted)' }}>Bu guruhda o'quvchilar topilmadi.</div>
                  )}
                </div>

                <div className={s.journalActions}>
                  <button type="button" className={s.cancelBtn} onClick={() => {
                    setLessonForm(prev => ({ ...prev, topic: '', description: '', attendance: {} }))
                    setSelectedPlanId('')
                  }}>Bekor qilish</button>
                  
                  <button type="submit" className={s.primaryBtn} disabled={savingLesson || !canEditAttendance}>
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
        <section className={s.attendanceSection}>
          <div className={s.attStatsGrid}>
            <div className={s.attStatCard}>
              <span>Umumiy yozuvlar</span>
              <strong>{attendanceRecords.length}</strong>
            </div>
            <div className={`${s.attStatCard} ${s.attPresent}`}>
              <span>Kelgan</span>
              <strong>{attendancePresentCount}</strong>
            </div>
            <div className={`${s.attStatCard} ${s.attAbsent}`}>
              <span>Kelmagan</span>
              <strong>{attendanceAbsentCount}</strong>
            </div>
          </div>

          {[1, 2, 3, 4, 5].map((month, monthIndex) => (
            <div key={month} className={s.monthBlock}>
              <h2 className={s.monthBlockTitle}>
                {month}-o'quv oyi 
                {monthIndex === 0 && (
                  <span className={s.currentBadge}>Joriy oy</span>
                )}
              </h2>
              <div className={s.calendarRow}>
                {lessonDays.map((day, index) => (
                  <button key={`${month}-${day.value}-${index}`} className={s.calChip} style={{ cursor: 'default' }}>
                    <span>{monthIndex === 0 ? 'Jan' : day.month}</span>
                    <strong>{monthIndex === 0 ? [2, 5, 7, 9, 12, 14, 16, 19, 21, 23, 26, 28, 30][index] : day.day}</strong>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* VIDEO PREVIEW MODAL */}
      {previewVideo && (
        <div className={s.modalOverlay} onClick={() => setPreviewVideo(null)}>
          <div className={s.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: 680 }}>
            <div className={s.modalHeader}>
              <h2>{previewVideo.name || 'Video'}</h2>
              <button className={s.modalCloseBtn} onClick={() => setPreviewVideo(null)} aria-label="Yopish">
                <X size={20} />
              </button>
            </div>
            <div className={s.modalBody} style={{ backgroundColor: '#000', padding: 0 }}>
              <video src={previewVideo.url} controls autoPlay style={{ width: '100%', aspectRatio: '16/9' }} />
            </div>
          </div>
        </div>
      )}

      {/* FILE UPLOAD MODAL */}
      {isVideoModalOpen && (
        <div className={s.modalOverlay} onClick={closeVideoModal}>
          <div className={s.modal} onClick={e => e.stopPropagation()}>
            <div className={s.modalHeader}>
              <h2>Fayl yuklash</h2>
              <button className={s.modalCloseBtn} onClick={closeVideoModal} aria-label="Yopish">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleVideoUpload} className={s.modalBody}>
              <label
                className={s.uploadBox}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault()
                  handleVideoFile(e.dataTransfer.files?.[0])
                }}
              >
                <input
                  type="file"
                  accept="*/*"
                  style={{ display: 'none' }}
                  onChange={e => handleVideoFile(e.target.files?.[0])}
                />
                <div className={s.uploadIcon}>
                  <Upload size={24} />
                </div>
                <p>Faylni yuklash uchun ushbu hudud ustiga bosing yoki faylni shu yerga olib keling</p>
                <small>Darslik, rasm, video yoki qo'shimcha material fayllarini yuklash mumkin</small>
              </label>

              {videoFile && (
                <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                  <table className={s.videoTable}>
                    <thead>
                      <tr>
                        <th>Fayl formati</th>
                        <th>Dars</th>
                        <th>Fayl nomi</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{videoFile.name}</td>
                        <td>
                          <select className={s.formSelect} style={{ padding: '4px 8px' }} value={videoLessonId} onChange={e => setVideoLessonId(e.target.value)} required>
                            <option value="">Darsni tanlang</option>
                            {allLessons.map((lesson, index) => (
                              <option key={lesson.id || index} value={lesson.id || index}>{lesson.topic || `Dars ${index + 1}`}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input className={s.input} style={{ padding: '4px 8px' }} value={videoName} onChange={e => setVideoName(e.target.value)} required />
                        </td>
                        <td>
                          <button
                            type="button"
                            className={s.deleteBtn}
                            style={{ width: 28, height: 28 }}
                            onClick={() => {
                              setVideoFile(null)
                              setVideoName('')
                              setVideoLessonId('')
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              <div className={s.modalActions}>
                <button type="button" className={s.cancelBtn} onClick={closeVideoModal}>Bekor qilish</button>
                {videoFile && (
                  <button type="submit" className={s.primaryBtn} disabled={uploadingFile || !videoLessonId || !videoName.trim()}>
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
