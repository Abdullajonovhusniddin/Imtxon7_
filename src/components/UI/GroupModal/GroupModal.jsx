import React, { useEffect, useState } from "react";
import styles from "./GroupModal.module.scss";
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import { createPortal } from "react-dom";
import AddStudentModal from "./AddStudentModal/AddStudentModal";
import AddTeacherModal from "./AddTeacherModal/AddTeacherModal";
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

export default function GroupModal({ isOpen, onClose, onSave }) {
    const [shouldRender, setShouldRender] = useState(isOpen);
    const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
    const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState(false);
    const [teachersOptions, setTeachersOptions] = useState([]);
    const [studentsOptions, setStudentsOptions] = useState([]);

    const [courses, setCourses] = useState([]);
    const [rooms, setRooms] = useState([]);

    const [groupData, setGroupData] = useState({
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
            if (studentsOptions.length === 0) {
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
            if (teachersOptions.length === 0) {
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
        setGroupData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDayCheckboxChange = (dayId) => {
        setGroupData(prev => {
            const exists = prev.weekDays.includes(dayId);
            return {
                ...prev,
                weekDays: exists
                    ? prev.weekDays.filter(d => d !== dayId)
                    : [...prev.weekDays, dayId]
            };
        });
    };

    const resetForm = () => {
        setGroupData({
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
    };

    const fetchCourses = () => {
        if (courses.length > 0) return;
        api.get('/courses')
            .then(res => {
                const coursesList = res.data?.data || res.data || [];
                setCourses(coursesList);
            })
            .catch(err => {
                console.error("Error fetching courses for select:", err);
            });
    };

    const fetchRooms = () => {
        if (rooms.length > 0) return;
        api.get('/rooms')
            .then(res => {
                const roomsList = res.data?.data || res.data || [];
                setRooms(roomsList);
            })
            .catch(err => {
                console.error("Error fetching rooms for select:", err);
            });
    };

    const fetchTeachers = () => {
        if (teachersOptions.length > 0) return;
        api.get('/teachers')
            .then(res => setTeachersOptions(res.data?.data || res.data || []))
            .catch(err => console.error("Error fetching teachers:", err));
    };

    const fetchStudents = () => {
        if (studentsOptions.length > 0) return;
        api.get('/students')
            .then(res => setStudentsOptions(res.data?.data || res.data || []))
            .catch(err => console.error("Error fetching students:", err));
    };

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            document.body.style.overflow = 'hidden';

            // Pre-fetch options to detect deleted ones
            fetchCourses();
            fetchRooms();
            fetchTeachers();
            fetchStudents();
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

        const { name, description, courseId, roomId, startDate, startTime, maxStudent, weekDays, teachers, students } = groupData;

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

        const hasDeletedTeacher = groupData.teachers.some(teacherId => {
            return teachersOptions.length > 0 && !teachersOptions.find(t => t.id === Number(teacherId));
        });

        const hasDeletedStudent = groupData.students.some(studentId => {
            return studentsOptions.length > 0 && !studentsOptions.find(s => s.id === Number(studentId));
        });

        if (hasDeletedTeacher || hasDeletedStudent) {
            alert("Iltimos, o'chirilgan (qizil chiziq bilan belgilangan) o'qituvchi yoki talabalarni ro'yxatdan olib tashlang!");
            return;
        }

        // Map week days to standard MONDAY, TUESDAY format
        const dayMap = {
            'mon': 'MONDAY',
            'tue': 'TUESDAY',
            'wed': 'WEDNESDAY',
            'thu': 'THURSDAY',
            'fri': 'FRIDAY',
            'sat': 'SATURDAY',
            'sun': 'SUNDAY'
        };
        const weekDaysMapped = weekDays.map(day => dayMap[day]);

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

        api.post('/groups', payload).then(
            res => {
                console.log("Group created successfully:", res.status);
                if (onSave) {
                    onSave();
                }
                resetForm();
                onClose();
            }
        ).catch(
            err => {
                const responseData = err.response?.data;
                console.error("Error creating group:", responseData);

                // Extract detailed error messages
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
                        <h2 className={styles.title}>Guruh qo'shish</h2>
                        <button type="button" className={styles.closeBtn} onClick={onClose}>
                            <CloseRoundedIcon />
                        </button>
                    </div>
                    <p className={styles.subtitle}>Yangi guruh yaratish uchun quyidagi ma'lumotlarni kiriting.</p>
                </div>

                <div className={styles.body}>
                    <div className={styles.formGroup}>
                        <label>Guruh nomi <span>*</span></label>
                        <input
                            type="text"
                            name="name"
                            placeholder="Frontend 2024"
                            value={groupData.name}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Kurs <span>*</span></label>
                        <select
                            name="courseId"
                            value={groupData.courseId}
                            onChange={handleInputChange}
                            onFocus={fetchCourses}
                            required
                        >
                            <option value="" disabled>Tanlang</option>
                            {courses.length === 0 ? (
                                <option disabled>Ma'lumot yuklanmoqda yoki topilmadi</option>
                            ) : (
                                courses.map(course => (
                                    <option key={course.id} value={course.id}>
                                        {course.name}
                                    </option>
                                ))
                            )}
                        </select>
                        {groupData.courseId && (
                            <div className={styles.durationInfo} style={{ marginTop: '6px', fontSize: '13px', color: '#6c35de', fontWeight: '500' }}>
                                Kurs davomiyligi: {courses.find(c => String(c.id) === String(groupData.courseId))?.duration_month || 0} oy
                            </div>
                        )}
                    </div>

                    <div className={styles.formGroup}>
                        <label>Xona <span>*</span></label>
                        <select
                            name="roomId"
                            value={groupData.roomId}
                            onChange={handleInputChange}
                            onFocus={fetchRooms}
                            required
                        >
                            <option value="" disabled>Tanlang</option>
                            {rooms.length === 0 ? (
                                <option disabled>Ma'lumot yuklanmoqda yoki topilmadi</option>
                            ) : (
                                rooms.map(room => (
                                    <option key={room.id} value={room.id}>
                                        {room.name}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Dars kunlari <span>*</span></label>
                        <div className={styles.daysGrid}>
                            {DAYS.map(day => (
                                <label key={day.id} className={styles.dayItem}>
                                    <input
                                        type="checkbox"
                                        checked={groupData.weekDays.includes(day.id)}
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
                            value={groupData.startTime}
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
                                value={groupData.startDate}
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
                        <label>Tavsif</label>
                        <textarea
                            name="description"
                            placeholder="Guruh haqida qo'shimcha ma'lumot (ixtiyoriy)"
                            value={groupData.description}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>O'qituvchilar</label>
                        <div className={styles.groupsInputContainer}>
                            {groupData.teachers.length > 0 && (
                                <div className={styles.groupTags}>
                                    {groupData.teachers.map((teacherId) => {
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
                                                    onClick={() => setGroupData(prev => ({
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
                            {groupData.students.length > 0 && (
                                <div className={styles.groupTags}>
                                    {groupData.students.map((studentId) => {
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
                                                    onClick={() => setGroupData(prev => ({
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
                    initialSelected={groupData.teachers}
                    onAdd={(selected) => {
                        setGroupData(prev => ({
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
                    initialSelected={groupData.students}
                    onAdd={(selected) => {
                        setGroupData(prev => ({
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
