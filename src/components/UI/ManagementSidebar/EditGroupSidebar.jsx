import React, { useEffect, useState } from "react";
import styles from "./EditGroupSidebar.module.scss";
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import { createPortal } from "react-dom";
import AddStudentModal from "../GroupModal/AddStudentModal/AddStudentModal";
import AddTeacherModal from "../GroupModal/AddTeacherModal/AddTeacherModal";
import { api } from "../../../api/api";

const DAYS = [
    { id: 'mon', label: 'Dushanba' },
    { id: 'tue', label: 'Seshanba' },
    { id: 'wed', label: 'Chorshanba' },
    { id: 'thu', label: 'Payshanba' },
    { id: 'fri', label: 'Juma' },
    { id: 'sat', label: 'Shanba' },
    { id: 'sun', label: 'Yakshanba' }
];

const dayMapReverse = {
    'MONDAY': 'mon',
    'TUESDAY': 'tue',
    'WEDNESDAY': 'wed',
    'THURSDAY': 'thu',
    'FRIDAY': 'fri',
    'SATURDAY': 'sat',
    'SUNDAY': 'sun'
};

const dayMapForward = {
    'mon': 'MONDAY',
    'tue': 'TUESDAY',
    'wed': 'WEDNESDAY',
    'thu': 'THURSDAY',
    'fri': 'FRIDAY',
    'sat': 'SATURDAY',
    'sun': 'SUNDAY'
};

export default function EditGroupSidebar({ isOpen, onClose, groupData, onSave }) {
    const [shouldRender, setShouldRender] = useState(isOpen);
    const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
    const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState(false);
    const [teachersOptions, setTeachersOptions] = useState([]);
    const [studentsOptions, setStudentsOptions] = useState([]);

    const [courses, setCourses] = useState([]);
    const [rooms, setRooms] = useState([]);

    const [form, setForm] = useState({
        name: "",
        description: "",
        courseId: "",
        roomId: "",
        startDate: "",
        startTime: "09:00",
        maxStudent: 15,
        weekDays: [],
        teachers: [],
        students: []
    });

    const toggleAddStudentModal = () => {
        if (!isAddStudentModalOpen) {
            if (studentsOptions.length === 0 || studentsOptions.length === (groupData?.students?.length || 0)) {
                api.get('/students').then(res => {
                    const list = res.data?.data || res.data || [];
                    setStudentsOptions(list);
                    setIsAddStudentModalOpen(true);
                }).catch(err => {
                    console.error('Error fetching students for modal:', err);
                    setIsAddStudentModalOpen(true);
                });
            } else {
                setIsAddStudentModalOpen(true);
            }
        } else {
            setIsAddStudentModalOpen(false);
        }
    };

    const toggleAddTeacherModal = () => {
        if (!isAddTeacherModalOpen) {
            if (teachersOptions.length === 0 || teachersOptions.length === (groupData?.teachers?.length || 0)) {
                api.get('/teachers').then(res => {
                    const list = res.data?.data || res.data || [];
                    setTeachersOptions(list);
                    setIsAddTeacherModalOpen(true);
                }).catch(err => {
                    console.error('Error fetching teachers for modal:', err);
                    setIsAddTeacherModalOpen(true);
                });
            } else {
                setIsAddTeacherModalOpen(true);
            }
        } else {
            setIsAddTeacherModalOpen(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDayCheckboxChange = (dayId) => {
        setForm(prev => {
            const exists = prev.weekDays.includes(dayId);
            return {
                ...prev,
                weekDays: exists
                    ? prev.weekDays.filter(d => d !== dayId)
                    : [...prev.weekDays, dayId]
            };
        });
    };

    // Helper to format any date into YYYY-MM-DD
    const formatDateForInput = (dateValue) => {
        if (!dateValue) return "";

        // Standard ISO format
        const isoMatch = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (isoMatch) return isoMatch[0];

        // dd/mm/yyyy or dd.mm.yyyy format
        const ddmmyyyyMatch = dateValue.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
        if (ddmmyyyyMatch) {
            const day = ddmmyyyyMatch[1].padStart(2, '0');
            const month = ddmmyyyyMatch[2].padStart(2, '0');
            const year = ddmmyyyyMatch[3];
            return `${year}-${month}-${day}`;
        }

        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return "";
        return date.toISOString().split("T")[0];
    };

    // Fetch courses and rooms once when sidebar opens
    useEffect(() => {
        if (isOpen) {
            api.get('/courses')
                .then(res => {
                    setCourses(res.data?.data || res.data || []);
                })
                .catch(err => console.error("Error fetching courses:", err));

            api.get('/rooms')
                .then(res => {
                    setRooms(res.data?.data || res.data || []);
                })
                .catch(err => console.error("Error fetching rooms:", err));

            // Fetch ALL teachers to detect deleted ones
            api.get('/teachers')
                .then(res => setTeachersOptions(res.data?.data || res.data || []))
                .catch(err => console.error("Error fetching teachers:", err));

            // Fetch ALL students to detect deleted ones
            api.get('/students')
                .then(res => setStudentsOptions(res.data?.data || res.data || []))
                .catch(err => console.error("Error fetching students:", err));
        }
    }, [isOpen]);


    // Prepopulate form fields when groupData, courses, or rooms are available
    useEffect(() => {
        if (groupData) {
            let matchedCourseId = "";
            if (groupData.course) {
                if (typeof groupData.course === 'object') {
                    matchedCourseId = groupData.course.id || groupData.course_id;
                    if (!matchedCourseId && courses.length > 0) {
                        const matched = courses.find(c => c.name === groupData.course.name);
                        if (matched) matchedCourseId = matched.id;
                    }
                } else if (courses.length > 0) {
                    const matched = courses.find(c => c.name === groupData.course || String(c.id) === String(groupData.course));
                    if (matched) matchedCourseId = matched.id;
                }
            }
            if (!matchedCourseId && groupData.course_id) {
                matchedCourseId = groupData.course_id;
            }

            let matchedRoomId = "";
            if (groupData.room) {
                if (typeof groupData.room === 'object') {
                    matchedRoomId = groupData.room.id || groupData.room_id;
                    if (!matchedRoomId && rooms.length > 0) {
                        const matched = rooms.find(r => r.name === groupData.room.name);
                        if (matched) matchedRoomId = matched.id;
                    }
                } else if (rooms.length > 0) {
                    const matched = rooms.find(r => r.name === groupData.room || String(r.id) === String(groupData.room));
                    if (matched) matchedRoomId = matched.id;
                }
            }
            if (!matchedRoomId && groupData.room_id) {
                matchedRoomId = groupData.room_id;
            }

            // Map weekDays from API (e.g. ["MONDAY", "WEDNESDAY"]) to internal checkboxes (["mon", "wed"])
            const mappedDays = (groupData.week_day || []).map(day => {
                const upper = day.toUpperCase();
                return dayMapReverse[upper] || day.toLowerCase();
            });

            // Map teachers and students to arrays of IDs
            const mappedTeachers = (groupData.teachers || []).map(t => typeof t === 'object' ? t.id : Number(t));
            const mappedStudents = (groupData.students || []).map(s => typeof s === 'object' ? s.id : Number(s));

            // Format date for date input
            const formattedDate = formatDateForInput(groupData.start_date);

            // Format start time to HH:MM
            const formattedTime = groupData.start_time ? groupData.start_time.slice(0, 5) : "09:00";

            setForm({
                name: groupData.name || "",
                description: groupData.description || "",
                courseId: matchedCourseId || "",
                roomId: matchedRoomId || "",
                startDate: formattedDate,
                startTime: formattedTime,
                maxStudent: groupData.max_student || 15,
                weekDays: mappedDays,
                teachers: mappedTeachers,
                students: mappedStudents
            });
        }
    }, [groupData, courses, rooms]);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => {
                setShouldRender(false);
                document.body.style.overflow = 'unset';
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleSubmit = (e) => {
        if (e) e.preventDefault();

        const { name, description, courseId, roomId, startDate, startTime, maxStudent, weekDays, teachers, students } = form;

        if (!name || !courseId || !roomId || !startDate || !startTime || !maxStudent || weekDays.length === 0) {
            alert("Iltimos, barcha majburiy maydonlarni to'ldiring!");
            return;
        }

        if (teachers.length === 0) {
            alert("Iltimos, kamida bitta o'qituvchi qo'shing!");
            return;
        }

        if (students.length === 0) {
            alert("Iltimos, kamida bitta talaba qo'shing!");
            return;
        }

        const hasDeletedTeacher = form.teachers.some(teacherId => {
            return teachersOptions.length > 0 && !teachersOptions.find(t => t.id === Number(teacherId));
        });

        const hasDeletedStudent = form.students.some(studentId => {
            return studentsOptions.length > 0 && !studentsOptions.find(s => s.id === Number(studentId));
        });

        if (hasDeletedTeacher || hasDeletedStudent) {
            alert("Iltimos, o'chirilgan (qizil chiziq bilan belgilangan) o'qituvchi yoki talabalarni ro'yxatdan olib tashlang!");
            return;
        }

        // Map week days to API standard
        const weekDaysMapped = weekDays.map(day => dayMapForward[day] || day);

        let formattedDate = startDate;
        // Parse and convert dd/mm/yyyy or dd.mm.yyyy to YYYY-MM-DD ISO format automatically
        const ddmmyyyyRegex = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/;
        const match = startDate.match(ddmmyyyyRegex);
        if (match) {
            const day = match[1].padStart(2, '0');
            const month = match[2].padStart(2, '0');
            const year = match[3];
            formattedDate = `${year}-${month}-${day}`;
        }

        const payload = {
            name,
            description,
            course_id: Number(courseId),
            room_id: Number(roomId),
            start_date: formattedDate,
            start_time: startTime,
            max_student: Number(maxStudent),
            week_day: weekDaysMapped,
            teachers: teachers.map(Number),
            students: students.map(Number)
        };

        api.patch(`/groups/${groupData.id}`, payload).then(
            res => {
                console.log("Group updated successfully:", res.status);
                if (onSave) {
                    const selectedCourse = courses.find(c => String(c.id) === String(courseId));
                    const selectedRoom = rooms.find(r => String(r.id) === String(roomId));
                    const selectedTeachersObjects = form.teachers.map(id => teachersOptions.find(t => String(t.id) === String(id))).filter(Boolean);
                    const selectedStudentsObjects = form.students.map(id => studentsOptions.find(s => String(s.id) === String(id))).filter(Boolean);

                    const optimisticUpdatedData = {
                        name: name,
                        course: selectedCourse || groupData.course,
                        start_time: startTime,
                        week_day: weekDaysMapped,
                        room: selectedRoom ? selectedRoom.name : groupData.room,
                        teachers: selectedTeachersObjects,
                        students: selectedStudentsObjects
                    };
                    onSave(optimisticUpdatedData);
                }
                onClose();
            }
        ).catch(
            err => {
                const responseData = err.response?.data;
                console.error("Error updating group:", responseData);

                let errorMsg = err.message;
                if (responseData) {
                    if (responseData.errors && typeof responseData.errors === 'object') {
                        const messages = [];
                        for (const key in responseData.errors) {
                            if (Array.isArray(responseData.errors[key])) {
                                messages.push(`${key}: ${responseData.errors[key].join(", ")}`);
                            } else {
                                messages.push(`${key}: ${responseData.errors[key]}`);
                            }
                        }
                        errorMsg = messages.join(" | ");
                    } else if (Array.isArray(responseData.message)) {
                        errorMsg = responseData.message.join(", ");
                    } else if (responseData.message) {
                        errorMsg = responseData.message;
                    } else if (responseData.error) {
                        errorMsg = responseData.error;
                    } else {
                        errorMsg = JSON.stringify(responseData);
                    }
                }
                alert("Xatolik yuz berdi: " + errorMsg);
            }
        );
    };

    if (!shouldRender) return null;

    return createPortal(
        <div
            className={`${styles.overlay} ${!isOpen ? styles.fadeOut : ""}`}
            onClick={onClose}
        >
            <form
                className={`${styles.modal} ${!isOpen ? styles.slideOut : ""}`}
                onClick={(e) => e.stopPropagation()}
                onSubmit={handleSubmit}
            >
                <div className={styles.header}>
                    <div className={styles.headerTop}>
                        <h2 className={styles.title}>Guruhni tahrirlash</h2>
                        <button type="button" className={styles.closeBtn} onClick={onClose}>
                            <CloseRoundedIcon />
                        </button>
                    </div>
                    <p className={styles.subtitle}>Guruh ma'lumotlarini o'zgartirish uchun quyidagi formani to'ldiring.</p>
                </div>

                <div className={styles.body}>
                    <div className={styles.formGroup}>
                        <label>Guruh nomi <span>*</span></label>
                        <input
                            type="text"
                            name="name"
                            placeholder="Frontend 2024"
                            value={form.name}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Kurs <span>*</span></label>
                        <select
                            name="courseId"
                            value={form.courseId}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="" disabled>Tanlang</option>
                            {courses.map(course => (
                                <option key={course.id} value={course.id}>
                                    {course.name}
                                </option>
                            ))}
                        </select>
                        {form.courseId && (
                            <div className={styles.durationInfo} style={{ marginTop: '6px', fontSize: '13px', color: '#6c35de', fontWeight: '500' }}>
                                Kurs davomiyligi: {courses.find(c => String(c.id) === String(form.courseId))?.duration_month || 0} oy
                            </div>
                        )}
                    </div>

                    <div className={styles.formGroup}>
                        <label>Xona <span>*</span></label>
                        <select
                            name="roomId"
                            value={form.roomId}
                            onChange={handleInputChange}
                            required
                        >
                            <option value="" disabled>Tanlang</option>
                            {rooms.map(room => (
                                <option key={room.id} value={room.id}>
                                    {room.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Dars kunlari <span>*</span></label>
                        <div className={styles.daysGrid}>
                            {DAYS.map(day => (
                                <label key={day.id} className={styles.dayItem}>
                                    <input
                                        type="checkbox"
                                        checked={form.weekDays.includes(day.id)}
                                        onChange={() => handleDayCheckboxChange(day.id)}
                                    />
                                    <span>{day.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Dars vaqti <span>*</span></label>
                        <input
                            type="time"
                            name="startTime"
                            value={form.startTime}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Boshlanish sanasi <span>*</span></label>
                        <div className={styles.dateInputWrapper}>
                            <input
                                type="text"
                                name="startDate"
                                placeholder="dd/mm/yyyy"
                                value={form.startDate}
                                onChange={handleInputChange}
                                onFocus={(e) => e.target.type = 'date'}
                                onBlur={(e) => {
                                    if (!e.target.value) e.target.type = 'text';
                                }}
                                required
                            />
                            <CalendarTodayRoundedIcon className={styles.calendarIcon} />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Maksimal o'quvchilar soni <span>*</span></label>
                        <input
                            type="number"
                            name="maxStudent"
                            value={form.maxStudent}
                            onChange={handleInputChange}
                            min="1"
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Tavsif</label>
                        <textarea
                            name="description"
                            placeholder="Guruh haqida qo'shimcha ma'lumot (ixtiyoriy)"
                            value={form.description}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>O'qituvchilar</label>
                        <div className={styles.groupsInputContainer}>
                            {form.teachers.length > 0 && (
                                <div className={styles.groupTags}>
                                    {form.teachers.map((teacherId) => {
                                        const teacher = teachersOptions.find(t => t.id === Number(teacherId));
                                        const label = teacher ? teacher.full_name : `Teacher #${teacherId}`;
                                        const isDeleted = teachersOptions.length > 0 && !teacher;
                                        return (
                                            <span
                                                key={teacherId}
                                                className={`${styles.groupTag} ${isDeleted ? styles.groupTagDeleted : ''}`}
                                                title={isDeleted ? "Bu o'qituvchi o'chirilgan" : undefined}
                                            >
                                                <span style={isDeleted ? { textDecoration: 'line-through', opacity: 0.7 } : {}}>
                                                    {label}
                                                </span>
                                                <button
                                                    type="button"
                                                    className={styles.removeGroupBtn}
                                                    onClick={() => setForm(prev => ({
                                                        ...prev,
                                                        teachers: prev.teachers.filter(id => id !== teacherId)
                                                    }))}
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                            <button type="button" className={styles.addGroupBtnInline} onClick={toggleAddTeacherModal}>
                                <AddRoundedIcon fontSize="small" />
                                <span>Qo'shish</span>
                            </button>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Talabalar</label>
                        <div className={styles.groupsInputContainer}>
                            {form.students.length > 0 && (
                                <div className={styles.groupTags}>
                                    {form.students.map((studentId) => {
                                        const student = studentsOptions.find(s => s.id === Number(studentId));
                                        const label = student ? student.full_name : `Student #${studentId}`;
                                        const isDeleted = studentsOptions.length > 0 && !student;
                                        return (
                                            <span
                                                key={studentId}
                                                className={`${styles.groupTag} ${isDeleted ? styles.groupTagDeleted : ''}`}
                                                title={isDeleted ? "Bu talaba o'chirilgan" : undefined}
                                            >
                                                <span style={isDeleted ? { textDecoration: 'line-through', opacity: 0.7 } : {}}>
                                                    {label}
                                                </span>
                                                <button
                                                    type="button"
                                                    className={styles.removeGroupBtn}
                                                    onClick={() => setForm(prev => ({
                                                        ...prev,
                                                        students: prev.students.filter(id => id !== studentId)
                                                    }))}
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                            <button type="button" className={styles.addGroupBtnInline} onClick={toggleAddStudentModal}>
                                <AddRoundedIcon fontSize="small" />
                                <span>Qo'shish</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className={styles.footer}>
                    <div className={styles.footerButtons}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose}>Bekor qilish</button>
                        <button type="submit" className={styles.saveBtn}>Saqlash</button>
                    </div>
                    <div className={styles.logoWrapper}>
                        <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M50 20L80 35V65L50 80L20 65V35L50 20Z" stroke="#6c35de" strokeOpacity="0.1" strokeWidth="1" />
                            <path d="M50 30L70 40V60L50 70L30 60V40L50 30Z" stroke="#6c35de" strokeOpacity="0.1" strokeWidth="1" />
                        </svg>
                    </div>
                </div>

                <AddTeacherModal
                    isOpen={isAddTeacherModalOpen}
                    onClose={toggleAddTeacherModal}
                    items={teachersOptions}
                    initialSelected={form.teachers}
                    onAdd={(selected) => {
                        setForm(prev => ({
                            ...prev,
                            teachers: selected
                        }));
                        toggleAddTeacherModal();
                    }}
                />

                <AddStudentModal
                    isOpen={isAddStudentModalOpen}
                    onClose={toggleAddStudentModal}
                    items={studentsOptions}
                    initialSelected={form.students}
                    onAdd={(selected) => {
                        setForm(prev => ({
                            ...prev,
                            students: selected
                        }));
                        toggleAddStudentModal();
                    }}
                />

            </form>
        </div>,
        document.body
    );
}
