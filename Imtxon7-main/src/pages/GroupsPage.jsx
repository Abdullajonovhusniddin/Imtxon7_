import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Plus, 
  Trash2, 
  Pencil,
  ChevronDown,
  X,
  Users,
  Clock,
  UserPlus,
  GraduationCap,
  RefreshCw
} from 'lucide-react'
import { deleteJson, getJson, getUserRole, patchJson, postJson } from '../api'
import { createTranslator } from '../i18n'
import ConfirmModal from '../components/ConfirmModal'

const COURSES_API = '/courses'
const GROUPS_API = '/groups'
const GROUPS_ARCHIVE_API = '/groups/archive'
const STUDENT_MY_GROUPS_API = '/students/my/groups'

const getViewportRowsLimit = () => {
  return 5
}

const WEEK_DAY_MAP = {
  Dushanba: 'MONDAY',
  Seshanba: 'TUESDAY',
  Chorshanba: 'WEDNESDAY',
  Payshanba: 'THURSDAY',
  Juma: 'FRIDAY',
  Shanba: 'SATURDAY',
  Yakshanba: 'SUNDAY'
}

function GroupsPage({ language = 'uz' }) {
  const t = createTranslator(language)
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('guruhlar') // 'guruhlar' or 'arxiv'
  const [page, setPage] = useState(1)
  const [pageLimit, setPageLimit] = useState(getViewportRowsLimit)
  const loadRequestRef = useRef(0)
  const navigate = useNavigate()
  const isStudentUser = ['student', 'talaba'].includes(getUserRole())
  
  // Dynamic datasets for dropdowns and mapping
  const [courses, setCourses] = useState([])
  const [rooms, setRooms] = useState([])
  const [teachers, setTeachers] = useState([])
  const [students, setStudents] = useState([])
  const [formDataLoaded, setFormDataLoaded] = useState(false)
  
  // Selection states for group creation
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([])
  const [selectedStudentIds, setSelectedStudentIds] = useState([])
  const [tempTeacherIds, setTempTeacherIds] = useState([])
  const [tempStudentIds, setTempStudentIds] = useState([])
  const [isTeacherSelectOpen, setIsTeacherSelectOpen] = useState(false)
  const [isStudentSelectOpen, setIsStudentSelectOpen] = useState(false)
  const [teacherSearchText, setTeacherSearchText] = useState('')
  const [studentSearchText, setStudentSearchText] = useState('')

  // Modal states for creating/editing a group
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    course: '',
    room: '',
    teacherId: '',
    days: {
      Dushanba: false, Seshanba: false, Chorshanba: false, Payshanba: false,
      Juma: false, Shanba: false, Yakshanba: false
    },
    time: '09:00',
    startDate: '',
    maxStudent: '0',
    description: ''
  })

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
  })

  const openConfirmModal = ({ title, message, onConfirm }) => {
    setConfirmModal({ open: true, title, message, onConfirm })
  }

  const closeConfirmModal = () => {
    setConfirmModal({ open: false, title: '', message: '', onConfirm: null })
  }

  const handleConfirm = async () => {
    if (typeof confirmModal.onConfirm === 'function') {
      await confirmModal.onConfirm()
    }
    closeConfirmModal()
  }

  // Modal states for adding students to a group
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false)
  const [availableStudents, setAvailableStudents] = useState([])
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudents, setSelectedStudents] = useState([])
  const [activeGroupId, setActiveGroupId] = useState(null)

  // Modal/Dropdownlarni tashqi tomonga bosilganda yopish
  useEffect(() => {
    const handleGlobalClick = () => setExpandedStudentsGroupId(null)
    document.addEventListener('click', handleGlobalClick)
    return () => document.removeEventListener('click', handleGlobalClick)
  }, [])

  // Student list dropdown state
  const [expandedStudentsGroupId, setExpandedStudentsGroupId] = useState(null)
  const [studentsInGroup, setStudentsInGroup] = useState([])
  const [loadingGroupStudents, setLoadingGroupStudents] = useState(false)

  const toggleStudentsDropdown = async (e, group) => {
    e.stopPropagation()
    const groupId = group.id
    if (expandedStudentsGroupId === groupId) {
      setExpandedStudentsGroupId(null)
      return
    }
    setExpandedStudentsGroupId(groupId)
    setLoadingGroupStudents(true)
    try {
      const response = await getJson(`/groups/one/students/${groupId}`)
      setStudentsInGroup(getApiItems(response))
    } catch (err) {
      console.error('Error fetching students:', err)
    } finally {
      setLoadingGroupStudents(false)
    }
  }

  // Helper function to extract items from response
  const getApiItems = (response) => {
    const data = response?.data || response
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.data)) return data.data
    if (Array.isArray(data?.items)) return data.items
    if (Array.isArray(data?.results)) return data.results
    if (Array.isArray(data?.rows)) return data.rows
    return []
  }

  const getGroupStudentsCount = (group = {}) => {
    if (Array.isArray(group.students)) return group.students.length
    if (Array.isArray(group.Students)) return group.Students.length
    if (Array.isArray(group.StudentGroup)) return group.StudentGroup.length
    if (Array.isArray(group.group_students)) return group.group_students.length

    const count = group.studentsCount ?? group.students_count ?? group.student_count ?? group.current_students
    const parsed = Number(count)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const getGroupTeachersCount = (group = {}) => {
    if (Array.isArray(group.teachers)) return group.teachers.length
    if (Array.isArray(group.Teachers)) return group.Teachers.length
    if (Array.isArray(group.GroupTeacher)) return group.GroupTeacher.length
    if (Array.isArray(group.group_teachers)) return group.group_teachers.length
    if (Array.isArray(group.teacher_ids)) return group.teacher_ids.length
    if (group.teacher || group.teacher_id || group.teacher_name) return 1

    const count = group.teachersCount ?? group.teachers_count ?? group.teacher_count
    const parsed = Number(count)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const getGroupTeacherIds = (group = {}) => {
    const teacherItems = [
      ...(Array.isArray(group.teachers) ? group.teachers : []),
      ...(Array.isArray(group.Teachers) ? group.Teachers : []),
      ...(Array.isArray(group.GroupTeacher) ? group.GroupTeacher.map(item => item?.Teacher || item?.teacher || item) : []),
      ...(Array.isArray(group.group_teachers) ? group.group_teachers : []),
      ...(Array.isArray(group.teacher_ids) ? group.teacher_ids : [])
    ]

    const ids = teacherItems
      .map(item => item?.id ?? item?.teacher_id ?? item?.teacherId ?? item)
      .filter(id => id !== undefined && id !== null && id !== '')

    if (ids.length > 0) return ids.map(String)
    const singleId = group.teacher_id ?? group.teacherId ?? group.teacher?.id
    return singleId ? [String(singleId)] : []
  }

  const normalizeMyGroup = (g) => {
    const groupData = g.group || g.Group || g
    return {
      ...groupData,
      name: groupData.name || g.group_name || 'My Group',
      status: 'FAOL'
    }
  }

  const loadAllData = async (tab = activeTab) => {
    const requestId = ++loadRequestRef.current
    setLoading(true)
    setGroups([])

    try {
      if (isStudentUser) {
        const groupsRes = await getJson(STUDENT_MY_GROUPS_API)
        if (requestId !== loadRequestRef.current) return

        setGroups(getApiItems(groupsRes).map(normalizeMyGroup))
        setCourses([])
        setRooms([])
        setTeachers([])
        setStudents([])
        return
      }

      const [groupsRes] = await Promise.allSettled([
        getJson(tab === 'arxiv' ? GROUPS_ARCHIVE_API : '/groups/all'),
      ])

      if (requestId !== loadRequestRef.current) return

      if (groupsRes.status === 'fulfilled') {
        const data = getApiItems(groupsRes.value)
        const enriched = data.map(group => ({
          ...group,
          studentsCount: getGroupStudentsCount(group),
          teachersCount: getGroupTeachersCount(group),
          status: tab === 'arxiv' ? 'Arxiv' : (group.status || group.activity || 'FAOL')
        }))
        setGroups(enriched)
      } else {
        setGroups([])
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      if (requestId === loadRequestRef.current) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    queueMicrotask(() => loadAllData())
  }, [])

  useEffect(() => {
    const handleResize = () => {
      const nextLimit = getViewportRowsLimit()
      setPageLimit(prev => {
        if (prev === nextLimit) return prev
        setPage(1)
        return nextLimit
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setPage(1)
    loadAllData(tab)
  }

  const loadFormDataOnce = async () => {
    if (formDataLoaded || isStudentUser) return
    try {
      const [coursesRes, roomsRes, teachersRes, studentsRes] = await Promise.allSettled([
        getJson(COURSES_API),
        getJson('/rooms'),
        getJson('/teachers'),
        getJson('/students')
      ])

      if (coursesRes.status === 'fulfilled') setCourses(getApiItems(coursesRes.value))
      if (roomsRes.status === 'fulfilled') setRooms(getApiItems(roomsRes.value))
      if (teachersRes.status === 'fulfilled') setTeachers(getApiItems(teachersRes.value))
      if (studentsRes.status === 'fulfilled') setStudents(getApiItems(studentsRes.value))

      setFormDataLoaded(true)
    } catch (err) {
      console.error('Error loading form options:', err)
    }
  }

  const openModal = async (group = null) => {
    await loadFormDataOnce()
    if (group) {
      setEditingGroup(group)
      
      const teacherIds = getGroupTeacherIds(group)
      setSelectedTeacherIds(teacherIds)
      
      let stIds = []
      if (Array.isArray(group.students)) {
        stIds = group.students.map(s => String(s?.id || s))
      } else if (Array.isArray(group.Students)) {
        stIds = group.Students.map(s => String(s?.id || s))
      }
      setSelectedStudentIds(stIds)

      const activeDays = {}
      const daysList = group.week_day || group.days || []
      const listToCheck = Array.isArray(daysList) ? daysList : []
      
      Object.keys(WEEK_DAY_MAP).forEach(dKey => {
        const standardVal = WEEK_DAY_MAP[dKey]
        activeDays[dKey] = listToCheck.includes(dKey) || listToCheck.includes(standardVal)
      })

      setFormData({
        name: group.name || '',
        course: String(group.course_id || group.course?.id || ''),
        room: String(group.room_id || group.room?.id || ''),
        teacherId: teacherIds[0] || '',
        days: activeDays,
        time: group.start_time || group.time || '09:00',
        startDate: group.start_date || '',
        maxStudent: String(group.max_student || '0'),
        description: group.description || ''
      })
    } else {
      setEditingGroup(null)
      setSelectedTeacherIds([])
      setSelectedStudentIds([])
      setFormData({
        name: '',
        course: '',
        room: '',
        teacherId: '',
        days: {
          Dushanba: false, Seshanba: false, Chorshanba: false, Payshanba: false,
          Juma: false, Shanba: false, Yakshanba: false
        },
        time: '09:00',
        startDate: '',
        maxStudent: '0',
        description: ''
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingGroup(null)
  }

  const openStudentModal = async (group) => {
    setActiveGroupId(group.id)
    setIsStudentModalOpen(true)
    setSelectedStudents([])
    setStudentSearch('')

    try {
      const [allStudentsRes, groupStudentsRes] = await Promise.all([
        getJson('/students'),
        getJson(`/groups/one/students/${group.id}`)
      ])
      
      const all = getApiItems(allStudentsRes)
      const current = getApiItems(groupStudentsRes).map(item => item?.student?.id || item?.id)
      
      const available = all.filter(s => !current.includes(s.id))
      setAvailableStudents(available)
    } catch (err) {
      console.error('Error fetching students for group assignment:', err)
    }
  }

  const closeStudentModal = () => {
    setIsStudentModalOpen(false)
    setActiveGroupId(null)
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()

    const selectedDays = Object.keys(formData.days).filter(day => formData.days[day])
    const weekDays = selectedDays.map(day => WEEK_DAY_MAP[day]).filter(Boolean)

    if (weekDays.length === 0) {
      alert("Iltimos, kamida bitta haftalik kunni tanlang.")
      return
    }

    const payload = {
      name: formData.name,
      course_id: Number(formData.course),
      room_id: Number(formData.room),
      teacher_ids: selectedTeacherIds.map(Number),
      student_ids: selectedStudentIds.map(Number),
      days: weekDays,
      start_time: formData.time,
      max_student: Number(formData.maxStudent) || 0,
      description: formData.description
    }

    try {
      const selectedCourse = courses.find(c => String(c.id) === String(formData.course))
      const selectedRoom = rooms.find(r => String(r.id) === String(formData.room))

      if (editingGroup) {
        await patchJson(`${GROUPS_API}/${editingGroup.id}`, payload)
        
        setGroups(prev => prev.map(group => 
          group.id === editingGroup.id 
            ? {
                ...group,
                ...payload,
                course: selectedCourse || group.course,
                room: selectedRoom || group.room,
                teachers: selectedTeacherIds,
                students: selectedStudentIds,
                teachersCount: selectedTeacherIds.length,
                studentsCount: selectedStudentIds.length,
              }
            : group
        ))
        closeModal()
        return
      }

      const created = await postJson(GROUPS_API, payload)
      const createdGroup = created?.data || created
      
      const newGroup = {
        ...createdGroup,
        id: createdGroup?.id || Date.now(),
        name: formData.name,
        course: createdGroup?.course || selectedCourse || selectedCourse?.name,
        course_id: Number(formData.course),
        room: createdGroup?.room || selectedRoom || selectedRoom?.name,
        room_id: Number(formData.room),
        time: formData.time,
        start_time: formData.time,
        days: selectedDays,
        week_day: weekDays,
        max_student: Number(formData.maxStudent) || 0,
        teachers: selectedTeacherIds,
        students: selectedStudentIds,
        teachersCount: selectedTeacherIds.length,
        studentsCount: selectedStudentIds.length,
        status: 'FAOL'
      }
      setGroups(prev => [newGroup, ...prev])
      closeModal()
    } catch (err) {
      console.error('Group save error:', err)
      alert(err.message || 'Guruh saqlashda xatolik yuz berdi.')
    }
  }

  const handleStudentSubmit = async (e) => {
    e.preventDefault()
    if (!activeGroupId) {
      alert("Guruh tanlanmadi. Iltimos yana urinib ko'ring.")
      return
    }

    try {
      await Promise.all(selectedStudents.map(studentId =>
        postJson('/student-group', {
          group_id: activeGroupId,
          student_id: studentId
        })
      ))
      closeStudentModal()
      alert('Talabalar guruhga muvaffaqiyatli biriktirildi.')
      loadAllData()
    } catch (err) {
      console.error('Student group assignment error:', err)
      alert(err.message || 'Talabani guruhga biriktirishda xatolik yuz berdi.')
    }
  }

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      days: { ...prev.days, [day]: !prev.days[day] }
    }))
  }

  const toggleStudent = (id) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    )
  }

  const toggleGroupStatus = (id) => {
    setGroups(prev => prev.map(g => {
      if (g.id !== id) return g
      const newStatus = (g.status === 'FAOL' || g.status === 'Aktiv' || !g.status) ? 'Arxiv' : 'FAOL'
      return { ...g, status: newStatus }
    }))
  }

  const performDeleteGroup = async (id) => {
    try {
      await deleteJson(`${GROUPS_API}/${id}`)
      setGroups(prev => prev.filter(group => group.id !== id))
    } catch (err) {
      console.error('Group delete error:', err)
      alert(err.message || "Guruhni o'chirishda xatolik yuz berdi.")
    }
  }

  const deleteGroup = (id) => {
    openConfirmModal({
      title: "Guruhni o'chirish",
      message: "Haqiqatan ham bu guruhni o'chirmoqchimisiz?",
      onConfirm: () => performDeleteGroup(id),
    })
  }

  const formatDays = (daysArray) => {
    if (!daysArray || !Array.isArray(daysArray)) return '-'
    const mapping = {
      'Dushanba': 'Du',
      'Seshanba': 'Se',
      'Chorshanba': 'Chor',
      'Payshanba': 'Pay',
      'Juma': 'Ju',
      'Shanba': 'Shan',
      'Yakshanba': 'Ya',
      'MONDAY': 'Du',
      'TUESDAY': 'Se',
      'WEDNESDAY': 'Chor',
      'THURSDAY': 'Pay',
      'FRIDAY': 'Ju',
      'SATURDAY': 'Shan',
      'SUNDAY': 'Ya'
    }
    return daysArray.map(d => mapping[d] || d).join(', ')
  }

  const getTeacherName = (group) => {
    if (group.teacher_name) return group.teacher_name
    if (group.teacher) {
      if (typeof group.teacher === 'object') {
        return group.teacher.full_name || group.teacher.name || '-'
      }
      return group.teacher
    }
    if (group.teachers && group.teachers.length > 0) {
      const firstT = group.teachers[0]
      if (firstT && typeof firstT === 'object') {
        return firstT.full_name || firstT.name || '-'
      }
      if (firstT) {
        const tObj = teachers.find(t => t.id === firstT)
        return tObj ? (tObj.full_name || tObj.name) : '-'
      }
    }
    return '-'
  }

  const getCourseName = (group) => {
    if (group.course) {
      if (typeof group.course === 'object') {
        return group.course.name || group.course.title || '-'
      }
      return group.course
    }
    if (group.course_name) {
      if (typeof group.course_name === 'object') {
        return group.course_name.name || group.course_name.title || '-'
      }
      return group.course_name
    }
    return '-'
  }

  const getRoomName = (group) => {
    if (group.room) {
      if (typeof group.room === 'object') {
        return group.room.name || group.room.title || '-'
      }
      return group.room
    }
    if (group.room_name) {
      if (typeof group.room_name === 'object') {
        return group.room_name.name || group.room_name.title || '-'
      }
      return group.room_name
    }
    return '-'
  }

  // Filters based on active tab and search query
  const filteredGroups = groups.filter(g => {
    return (g.name || g.group_name || '').toLowerCase().includes(search.toLowerCase())
  })
  
  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / pageLimit))
  const currentPage = Math.min(page, totalPages)
  const paginatedGroups = filteredGroups.slice((currentPage - 1) * pageLimit, currentPage * pageLimit)
  
  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages) return
    setPage(nextPage)
  }

  const totalGroupsCount = groups.length
  const groupTeacherIds = groups.flatMap(group => getGroupTeacherIds(group))
  const totalTeachersCount = groupTeacherIds.length > 0
    ? new Set(groupTeacherIds).size
    : groups.reduce((sum, group) => sum + getGroupTeachersCount(group), 0)
  const totalStudentsCount = groups.reduce((sum, group) => sum + getGroupStudentsCount(group), 0)

  return (
    <div className="p-6 pt-0 flex flex-col gap-6 flex-1 min-h-0 overflow-hidden select-none bg-slate-50 dark:bg-slate-950">
      {/* HEADER */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center w-full">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              {isStudentUser ? t('pages.myGroups') : t('pages.groups')}
            </h1>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed max-w-2xl">
              {isStudentUser
                ? 'Sizning guruhlaringiz va dars maʼlumotlarini shu yerda koʻring.'
                : 'Ushbu sahifada siz guruhlar ro\'yxatini va ularning ma\'lumotlarini topasiz. Har bir guruhning nomi, kursi va dars vaqti ma\'lumotlari keltirilgan.'}
            </p>
          </div>
          {!isStudentUser && (
            <button className="flex items-center justify-center bg-violet-650 hover:bg-violet-700 text-white gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-md shadow-violet-600/10 transition-all duration-200 cursor-pointer active:scale-95" onClick={() => openModal()}>
              <Plus size={16} />
              Guruh qo'shish
            </button>
          )}
        </div>
      </div>

      {/* TABS */}
      {!isStudentUser && (
        <div className="flex gap-1.5 p-1 bg-transparent rounded-xl w-fit">
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${activeTab === 'guruhlar' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850'}`}
            onClick={() => handleTabChange('guruhlar')}
          >
            <Users size={16} />
            Guruhlar
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${activeTab === 'arxiv' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850'}`}
            onClick={() => handleTabChange('arxiv')}
          >
            <Clock size={16} />
            Arxiv
          </button>
        </div>
      )}

      {/* STATS GRID */}
      <div className="grid grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm relative transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              <Users size={20} />
            </div>
            <button className="text-slate-400 hover:text-slate-600 transition-colors" type="button">⋮</button>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium text-slate-400 dark:text-slate-500">Jami guruhlar</p>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{totalGroupsCount}</h2>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm relative transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650">
              <Users size={20} />
            </div>
            <button className="text-slate-400 hover:text-slate-600 transition-colors" type="button">⋮</button>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium text-slate-400 dark:text-slate-500">O'qituvchilar</p>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              {groupTeacherIds.length > 0 ? new Set(groupTeacherIds).size : totalTeachersCount}
            </h2>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm relative transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-955/20 text-blue-650">
              <GraduationCap size={20} />
            </div>
            <button className="text-slate-400 hover:text-slate-600 transition-colors" type="button">⋮</button>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-medium text-slate-400 dark:text-slate-500">O'quvchilar</p>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{totalStudentsCount}</h2>
          </div>
          <div className="absolute right-5 bottom-5 flex items-center">
            <span className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-white bg-slate-800 -ml-2 shadow-sm first:ml-0">I</span>
            <span className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-white bg-orange-600 -ml-2 shadow-sm">M</span>
            <span className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-white bg-pink-500 -ml-2 shadow-sm">S</span>
          </div>
        </div>
      </div>

      {/* TABLE CARD */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-sm pb-5 flex flex-col gap-5 flex-1 min-h-0">
        <div className="overflow-x-auto flex flex-col flex-1 min-h-0 relative">
          {loading && (
            <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-[1px] flex justify-center items-center z-10">
              <div className="w-9 h-9 border-3 border-violet-100 dark:border-violet-950 border-t-violet-600 rounded-full animate-spin" />
            </div>
          )}

          <table className="w-full border-collapse min-w-[900px] table-fixed">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-850/80 border-b border-slate-100 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider text-center">
                <th className="px-5 py-4 w-[11%] text-left pl-5">Status</th>
                <th className="px-4 py-4 w-[12%] text-center">Guruh nomi</th>
                <th className="px-4 py-4 w-[16%] text-center">Kurs</th>
                <th className="px-4 py-4 w-[10%] text-center">Davomiyligi</th>
                <th className="px-4 py-4 w-[18%] text-center">Dars vaqti</th>
                <th className="px-4 py-4 w-[10%] text-center">Xona</th>
                <th className="px-4 py-4 w-[20%] text-center">O'qituvchi</th>
                <th className="px-4 py-4 w-[10%] text-center">Talabalar</th>
                <th className="px-5 py-4 w-[6%] text-right pr-5">
                  <RefreshCw size={14} className="inline text-slate-400 hover:text-violet-600 transition-transform duration-200 hover:rotate-185 cursor-pointer" onClick={() => loadAllData(activeTab)} />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                [1, 2].map((item) => (
                  <tr key={item} className="animate-pulse text-center">
                    <td className="px-5 py-4 text-left pl-5"><div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg inline-block" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded inline-block" /></td>
                    <td className="px-4 py-4"><div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-full inline-block" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-10 bg-slate-200 dark:bg-slate-800 rounded inline-block" /></td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1.5 items-center">
                        <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
                        <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                      </div>
                    </td>
                    <td className="px-4 py-4"><div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded inline-block" /></td>
                    <td className="px-4 py-4"><div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded-md inline-block" /></td>
                    <td className="px-4 py-4"><div className="h-4 w-8 bg-slate-200 dark:bg-slate-800 rounded inline-block" /></td>
                    <td className="px-5 py-4 text-right pr-5"><div className="h-4 w-4 bg-slate-200 dark:bg-slate-800 rounded inline-block" /></td>
                  </tr>
                ))
              ) : filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-slate-400 dark:text-slate-500 font-medium">
                    {t('empty.groups')}
                  </td>
                </tr>
              ) : paginatedGroups.map(group => {
                const isFaol = group.status === 'FAOL' || group.status === 'Aktiv' || !group.status
                return (
                  <tr key={group.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors cursor-pointer text-center" onClick={() => navigate(`/groups/${group.id}`)}>
                    <td className="px-5 py-4 text-left pl-5">
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        {!isStudentUser && (
                          <button
                            className={`relative inline-flex items-center h-5 w-9 rounded-full transition-colors duration-200 focus:outline-none ${isFaol ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleGroupStatus(group.id)
                            }}
                            title={isFaol ? 'Arxivlash' : 'Faollashtirish'}
                            type="button"
                          >
                            <span className={`inline-block w-3.5 h-3.5 transform bg-white rounded-full transition-transform duration-200 ${isFaol ? 'translate-x-4.5' : 'translate-x-1'}`} />
                          </button>
                        )}
                        <span className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                          FAOL
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 truncate">
                      <span className="font-bold text-slate-800 dark:text-white">
                        {group.name || group.group_name || 'Nomsiz Guruh'}
                      </span>
                    </td>
                    <td className="px-4 py-4 truncate">
                      <span className="bg-pink-50 dark:bg-pink-955/20 text-purple-650 dark:text-purple-400 px-3 py-1 rounded-full text-xs font-semibold border border-pink-100 dark:border-pink-900/30">
                        {getCourseName(group)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-400 font-medium">
                      <span>{group.course?.duration_month || '0'} oy</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-0.5 items-center">
                        <span className="font-bold text-slate-800 dark:text-slate-205 text-sm">{group.start_time || group.time || '09:00'}</span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium capitalize">{formatDays(group.week_day || group.days)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-400 font-medium truncate">
                      <span>{getRoomName(group)}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-nowrap gap-1 overflow-x-auto justify-center scrollbar-none max-w-full">
                        {Array.isArray(group.teachers)
                          ? group.teachers.map((teacher, index) => (
                              <span key={`${group.id}-teacher-${index}`} className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded text-[11px] font-medium flex-shrink-0">
                                {teacher?.full_name || teacher?.name || teacher}
                              </span>
                            ))
                          : <span className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded text-[11px] font-medium flex-shrink-0">{getTeacherName(group)}</span>
                        }
                      </div>
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-800 dark:text-slate-200">
                      <span>{getGroupStudentsCount(group)}</span>
                    </td>
                    <td className="px-5 py-4 text-right pr-5">
                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        {!isStudentUser && (
                          <>
                            <button
                              type="button"
                              className="p-1 text-slate-400 hover:text-violet-600 transition-all active:scale-95 cursor-pointer"
                              title="Tahrirlash"
                              onClick={() => openModal(group)}
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              className="p-1 text-slate-400 hover:text-rose-600 transition-all active:scale-95 cursor-pointer"
                              title="O'chirish"
                              onClick={() => deleteGroup(group.id)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex justify-between items-center px-5 py-4 border-t border-slate-100 dark:border-slate-800/80">
          <button 
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Orqaga
          </button>
          <div className="px-3 py-1 bg-violet-50 dark:bg-violet-955/25 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-900/30 rounded-lg text-xs font-bold">
            {currentPage} / {totalPages}
          </div>
          <button 
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Oldinga
          </button>
        </div>
      </div>

      {/* CREATE/EDIT SLIDEOVER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-100 bg-slate-900/40 backdrop-blur-[3px] flex justify-end" onClick={closeModal}>
          <aside className="w-full max-w-[480px] h-full bg-white dark:bg-slate-900 p-6 shadow-2xl flex flex-col gap-5 overflow-y-auto animate-slide-in" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{editingGroup ? 'Guruhni tahrirlash' : 'Yangi guruh yaratish'}</h2>
                <p className="text-xs text-slate-400 mt-1">Guruh tafsilotlarini va vaqtlarini kiriting</p>
              </div>
              <button className="p-1 rounded-lg text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Guruh nomi <span className="text-rose-500">*</span></span>
                <input 
                  type="text" 
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none dark:text-white transition-all"
                  required 
                  placeholder="Masalan: Web Fronted N1" 
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Kurs tanlang <span className="text-rose-500">*</span></span>
                <select 
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none dark:text-white cursor-pointer"
                  required
                  value={formData.course}
                  onChange={e => setFormData(prev => ({ ...prev, course: e.target.value }))}
                >
                  <option value="">Kursni tanlang</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Xona <span className="text-rose-500">*</span></span>
                <select 
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none dark:text-white cursor-pointer"
                  required
                  value={formData.room}
                  onChange={e => setFormData(prev => ({ ...prev, room: e.target.value }))}
                >
                  <option value="">Xonani tanlang</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </label>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">O'qituvchi <span className="text-rose-500">*</span></span>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {selectedTeacherIds.map(tId => {
                    const tObj = teachers.find(teach => String(teach.id) === String(tId))
                    return (
                      <span key={tId} className="inline-flex items-center gap-1.5 bg-violet-50 dark:bg-violet-955/20 text-purple-650 dark:text-purple-400 border border-violet-100 dark:border-violet-900/30 rounded-lg px-2.5 py-1 text-xs font-semibold">
                        {tObj?.full_name || tObj?.name || `Teacher #${tId}`}
                        <button 
                          type="button" 
                          className="hover:text-rose-500 font-bold"
                          onClick={() => setSelectedTeacherIds(prev => prev.filter(id => id !== tId))}
                        >
                          ×
                        </button>
                      </span>
                    )
                  })}
                  <button 
                    type="button" 
                    className="inline-flex items-center gap-1 text-violet-650 dark:text-purple-400 text-xs font-semibold hover:opacity-80 cursor-pointer"
                    onClick={() => {
                      setTempTeacherIds([...selectedTeacherIds])
                      setTeacherSearchText('')
                      setIsTeacherSelectOpen(true)
                    }}
                  >
                    <Plus size={14} />
                    Biriktirish
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Guruh kunlari <span className="text-rose-500">*</span></span>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  {Object.keys(formData.days).map(day => (
                    <label key={day} className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="rounded text-violet-600 focus:ring-violet-500 h-4 w-4 accent-violet-600 cursor-pointer"
                        checked={formData.days[day]}
                        onChange={() => toggleDay(day)}
                      />
                      <span>{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Dars boshlanish vaqti <span className="text-rose-500">*</span></span>
                <input 
                  type="time" 
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none dark:text-white transition-all cursor-pointer"
                  required 
                  value={formData.time}
                  onChange={e => setFormData(prev => ({ ...prev, time: e.target.value }))}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">O'quvchilar soni cheklovi</span>
                <input 
                  type="number" 
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none dark:text-white transition-all"
                  placeholder="Masalan: 15" 
                  value={formData.maxStudent}
                  onChange={e => setFormData(prev => ({ ...prev, maxStudent: e.target.value }))}
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tavsif / Qo'shimcha ma'lumotlar</span>
                <textarea 
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none dark:text-white transition-all h-20 resize-vertical"
                  placeholder="Guruh haqida batafsil..." 
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </label>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Guruh talabalari</span>
                <div className="flex flex-wrap gap-1.5 items-center">
                  {selectedStudentIds.map(stId => {
                    const stObj = students.find(st => String(st.id) === String(stId))
                    return (
                      <span key={stId} className="inline-flex items-center gap-1.5 bg-violet-50 dark:bg-violet-955/20 text-purple-650 dark:text-purple-400 border border-violet-100 dark:border-violet-900/30 rounded-lg px-2.5 py-1 text-xs font-semibold">
                        {stObj?.full_name || stObj?.name || `Student #${stId}`}
                        <button 
                          type="button" 
                          className="hover:text-rose-500 font-bold"
                          onClick={() => setSelectedStudentIds(prev => prev.filter(id => id !== stId))}
                        >
                          ×
                        </button>
                      </span>
                    )
                  })}
                  <button 
                    type="button" 
                    className="inline-flex items-center gap-1 text-violet-650 dark:text-purple-400 text-xs font-semibold hover:opacity-80 cursor-pointer"
                    onClick={() => {
                      setTempStudentIds([...selectedStudentIds])
                      setStudentSearchText('')
                      setIsStudentSelectOpen(true)
                    }}
                  >
                    <Plus size={14} />
                    Talaba qo'shish
                  </button>
                </div>
              </div>

              <div className="flex gap-3 justify-end border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                <button type="button" className="px-5 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-350 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer" onClick={closeModal}>{t('actions.cancel')}</button>
                <button type="submit" className="px-5 py-2.5 bg-violet-650 hover:bg-violet-750 text-white rounded-xl text-sm font-semibold shadow-md shadow-violet-600/10 cursor-pointer">{t('actions.save')}</button>
              </div>
            </form>
          </aside>
        </div>
      )}

      {/* TEACHER SELECT MODAL FOR GROUP CREATION */}
      {isTeacherSelectOpen && (
        <div className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-[3px] flex items-center justify-center p-4" onClick={() => setIsTeacherSelectOpen(false)}>
          <div className="w-full max-w-[460px] bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl flex flex-col gap-5 overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start border-b border-slate-105 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">O'qituvchi tanlash</h2>
                <p className="text-xs text-slate-400 mt-1">Bitta yoki bir nechta o'qituvchini tanlang. Tanlangan: {tempTeacherIds.length}</p>
              </div>
              <button className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" onClick={() => setIsTeacherSelectOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <input 
                  type="text" 
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none dark:text-white transition-all" 
                  placeholder="O'qituvchi qidirish..." 
                  value={teacherSearchText}
                  onChange={e => setTeacherSearchText(e.target.value)}
                />
              </div>

              <div className="flex flex-col border border-slate-100 dark:border-slate-800/80 rounded-xl overflow-hidden max-h-[260px] overflow-y-auto bg-slate-50/50 dark:bg-slate-950/20">
                {teachers.filter(tItem => (tItem.full_name || tItem.name || '').toLowerCase().includes(teacherSearchText.toLowerCase())).map((teacher) => {
                  const isChecked = tempTeacherIds.includes(String(teacher.id))
                  return (
                    <label key={teacher.id} className="flex items-center gap-3 p-3.5 cursor-pointer border-b border-slate-100 dark:border-slate-850/60 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors">
                      <input 
                        type="checkbox" 
                        className="rounded text-violet-600 focus:ring-violet-500 h-4.5 w-4.5 accent-violet-600 cursor-pointer"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setTempTeacherIds(prev => prev.filter(tId => tId !== String(teacher.id)))
                          } else {
                            setTempTeacherIds(prev => [...prev, String(teacher.id)])
                          }
                        }}
                      />
                      <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{teacher.full_name || teacher.name}</span>
                    </label>
                  )
                })}
              </div>

              <div className="flex gap-3 justify-end border-t border-slate-150 dark:border-slate-800 pt-4">
                <button type="button" className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-250 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer" onClick={() => setIsTeacherSelectOpen(false)}>{t('actions.cancel')}</button>
                <button 
                  type="button" 
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-violet-650 hover:bg-violet-750 text-white shadow-md shadow-violet-600/10 cursor-pointer"
                  onClick={() => {
                    setSelectedTeacherIds(tempTeacherIds)
                    setIsTeacherSelectOpen(false)
                  }}
                >
                  {t('actions.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT SELECT MODAL FOR GROUP CREATION */}
      {isStudentSelectOpen && (
        <div className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-[3px] flex items-center justify-center p-4" onClick={() => setIsStudentSelectOpen(false)}>
          <div className="w-full max-w-[460px] bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl flex flex-col gap-5 overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start border-b border-slate-105 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-905 dark:text-white">Talaba qo'shish</h2>
                <p className="text-xs text-slate-400 mt-1">Bitta yoki bir nechta talabani tanlang. Tanlangan: {tempStudentIds.length}</p>
              </div>
              <button className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" onClick={() => setIsStudentSelectOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <input 
                  type="text" 
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none dark:text-white transition-all" 
                  placeholder="Talaba qidirish..." 
                  value={studentSearchText}
                  onChange={e => setStudentSearchText(e.target.value)}
                />
              </div>

              <div className="flex flex-col border border-slate-100 dark:border-slate-800/80 rounded-xl overflow-hidden max-h-[260px] overflow-y-auto bg-slate-50/50 dark:bg-slate-950/20">
                {students.filter(sItem => (sItem.full_name || sItem.name || '').toLowerCase().includes(studentSearchText.toLowerCase())).map((student) => {
                  const isChecked = tempStudentIds.includes(String(student.id))
                  return (
                    <label key={student.id} className="flex items-center gap-3 p-3.5 cursor-pointer border-b border-slate-100 dark:border-slate-850/60 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 transition-colors">
                      <input 
                        type="checkbox" 
                        className="rounded text-violet-600 focus:ring-violet-500 h-4.5 w-4.5 accent-violet-600 cursor-pointer"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setTempStudentIds(prev => prev.filter(sId => sId !== String(student.id)))
                          } else {
                            setTempStudentIds(prev => [...prev, String(student.id)])
                          }
                        }}
                      />
                      <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{student.full_name || student.name}</span>
                    </label>
                  )
                })}
              </div>

              <div className="flex gap-3 justify-end border-t border-slate-150 dark:border-slate-800 pt-4">
                <button type="button" className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-250 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer" onClick={() => setIsStudentSelectOpen(false)}>{t('actions.cancel')}</button>
                <button 
                  type="button" 
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-violet-650 hover:bg-violet-750 text-white shadow-md shadow-violet-600/10 cursor-pointer"
                  onClick={() => {
                    setSelectedStudentIds(tempStudentIds)
                    setIsStudentSelectOpen(false)
                  }}
                >
                  {t('actions.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={handleConfirm}
        onCancel={closeConfirmModal}
      />
    </div>
  )
}

export default GroupsPage
