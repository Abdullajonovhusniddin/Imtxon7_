import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Courses.module.scss";
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import CourseModal from "../../../components/UI/CourseModal/CourseModal";
import ConfirmDialog from "../../../components/UI/ConfirmDialog/ConfirmDialog";
import { api } from "../../../api/api";
import { lightGreen } from "@mui/material/colors";
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

export default function Courses() {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [courses, setCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, courseId: null });
    const defaultCourseData = {
        name: "",
        description: "",
        duration_hours: "",
        duration_month: "",
        price: "",
    };
    const [courseData, setCourseData] = useState(defaultCourseData);

    const fetchCourses = () => {
        setIsLoading(true);
        api.get('/courses').then(
            res => {
                setCourses(res.data.data);
                setIsLoading(false);
            }
        ).catch(
            err => {
                console.log(err.message);
                setIsLoading(false);
            }
        )
    };

    function dataSubmit(e) {
        e.preventDefault();

        const request = selectedCourse?.id
            ? api.patch(`/courses/${selectedCourse.id}`, courseData)
            : api.post('/courses', courseData);

        request.then(
            res => {
                console.log(res.status);
                
                if (selectedCourse?.id) {
                    // Update locally instead of fetching all again
                    setCourses(prev => prev.map(course => 
                        course.id === selectedCourse.id ? { ...course, ...courseData } : course
                    ));
                } else {
                    const newCourse = res.data?.data?.id ? res.data.data : (res.data?.id ? res.data : { ...courseData, id: Date.now() });
                    setCourses(prev => [...prev, newCourse]);
                }

                closeModal();
            }
        ).catch(
            err => console.log(err.message)
        )
    }

    const openAddCourseModal = () => {
        setSelectedCourse(null);
        setCourseData(defaultCourseData);
        setIsModalOpen(true);
    };

    const openEditCourseModal = (course) => {
        setSelectedCourse(course);
        setCourseData({
            name: course.name || "",
            description: course.description || "",
            duration_hours: course.duration_hours || "",
            duration_month: course.duration_month || "",
            price: course.price || "",
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedCourse(null);
        setCourseData(defaultCourseData);
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    return (
        <div className={styles.coursesContainer}>
            <div className={styles.header}>
                <h2 className={styles.title}>Kurslar</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className={styles.archiveBtn} onClick={() => navigate('/management/courses/archive')}>
                        <ArchiveOutlinedIcon fontSize="small" />
                        Arxiv
                    </button>
                    <button className={styles.addBtn} onClick={openAddCourseModal}>
                        <AddRoundedIcon fontSize="small" />
                        Kurslar qo'shish
                    </button>
                </div>
            </div>

            <div className={styles.grid} style={{ position: 'relative', opacity: isLoading ? 0.6 : 1, transition: 'opacity 0.2s', minHeight: '150px' }}>
                {isLoading && (
                    <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.4)',
                        zIndex: 10
                    }}>
                        <CircularProgress sx={{ color: '#6c35de' }} />
                    </Box>
                )}
                {courses.map((course) => (
                    <div
                        key={course.id}
                        className={styles.card}
                        style={{ backgroundColor: course.color }}
                    >
                        <div className={styles.cardHeader}>
                            <h3 className={styles.courseName}>{course.name}</h3>
                            <div className={styles.actions}>
                                <button onClick={() => setDeleteConfirm({ isOpen: true, courseId: course.id })} className={styles.actionBtn}>
                                    <DeleteOutlineRoundedIcon />
                                </button>
                                <button onClick={() => openEditCourseModal(course)} className={styles.actionBtn}><EditOutlinedIcon /></button>
                            </div>
                        </div>
                        <p className={styles.description}>{course.description}</p>

                        <div className={styles.details}>
                            <span className={styles.tag}>{course.duration_hours} min</span>
                            <span className={styles.tag}>{course.duration_month} oy</span>
                            <span className={styles.tag}>{course.price} so'm</span>
                        </div>
                    </div>
                ))}
            </div>

            <CourseModal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={selectedCourse ? "Kursni tahrirlash" : "Kurs qo'shish"}
                subtitle={selectedCourse ? "Kurs ma'lumotlarini yangilang." : "Bu yerda siz yangi kurs qo'shishingiz mumkin."}
                footer={
                    <>
                        <button type="button" className={styles.cancelBtn} onClick={closeModal}>Bekor qilish</button>
                        <button type="submit" form="courseForm" className={styles.saveBtn}>{selectedCourse ? "Saqlash" : "Saqlash"}</button>
                    </>
                }
            >
                <form id="courseForm" onSubmit={dataSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label>Nomi</label>
                        <input
                            name="name"
                            value={courseData.name}
                            onChange={(e) => setCourseData((prev) => ({ ...prev, [e.target.name]: e.target.value }))}
                            type="text"
                            placeholder="HR Manager..."
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Dars davomiyligi</label>
                        <select
                            name="duration_hours"
                            value={courseData.duration_hours}
                            onChange={(e) => setCourseData(prev => ({ ...prev, [e.target.name]: e.target.value }))}
                        >
                            <option value="" disabled>Tanlang</option>
                            <option value="60">60 min</option>
                            <option value="120">120 min</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Kurs davomiyligi (oylarda)</label>
                        <select
                            name="duration_month"
                            value={courseData.duration_month}
                            onChange={(e) => setCourseData(prev => ({ ...prev, [e.target.name]: e.target.value }))}
                        >
                            <option value="" disabled>Tanlang</option>
                            <option value="1">1 oy</option>
                            <option value="3">3 oy</option>
                            <option value="6">6 oy</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Narx</label>
                        <input
                            name="price"
                            value={courseData.price}
                            onChange={(e) => setCourseData(prev => ({ ...prev, [e.target.name]: e.target.value }))}
                            type="text"
                            placeholder="Narxini kiriting"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Description</label>
                        <textarea
                            name="description"
                            value={courseData.description}
                            onChange={(e) => setCourseData(prev => ({ ...prev, [e.target.name]: e.target.value }))}
                            placeholder="A little about the company and the team that you'll be working with."
                        ></textarea>
                        <p className={styles.hint}>This is a hint text to help user.</p>
                    </div>
                </form>
            </CourseModal>

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, courseId: null })}
                onConfirm={() => {
                    const id = deleteConfirm.courseId;
                    setDeleteConfirm({ isOpen: false, courseId: null });
                    if (id) {
                        api.delete(`/courses/${id}`).then(
                            () => {
                                setCourses(prev => prev.filter(
                                    item => item.id !== id
                                ));
                            }
                        ).catch(
                            err => console.log(err.message)
                        );
                    }
                }}
                title="Kursni o'chirish"
                message="Rostdan ham o'chirishni hohlaysizmi?"
            />
        </div>
    );
}
