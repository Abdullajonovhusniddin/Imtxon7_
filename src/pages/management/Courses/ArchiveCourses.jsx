import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Courses.module.scss";
import RestoreOutlinedIcon from '@mui/icons-material/RestoreOutlined';
import DeleteForeverOutlinedIcon from '@mui/icons-material/DeleteForeverOutlined';
import KeyboardArrowLeftRoundedIcon from '@mui/icons-material/KeyboardArrowLeftRounded';
import { api } from "../../../api/api";
import ConfirmDialog from "../../../components/UI/ConfirmDialog/ConfirmDialog";
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

export default function ArchiveCourses() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [restoreConfirm, setRestoreConfirm] = useState({ isOpen: false, courseId: null });
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, courseId: null });

    const fetchArchivedCourses = () => {
        setIsLoading(true);
        api.get('/courses/archive').then(
            res => {
                setCourses(res.data.data || []);
                setIsLoading(false);
            }
        ).catch(
            err => {
                console.log(err.message);
                setIsLoading(false);
            }
        );
    };

    useEffect(() => {
        fetchArchivedCourses();
    }, []);

    function actualRestoreCourse(id) {
        setIsLoading(true);
        api.post(`/courses/${id}/restore`)
            .then(() => {
                setCourses(prev => prev.filter(item => item.id !== id));
            })
            .catch(err => {
                const responseData = err.response?.data;
                let errorMsg = err.message;
                if (responseData?.message) errorMsg = responseData.message;
                alert("Xatolik yuz berdi: " + errorMsg);
            })
            .finally(() => setIsLoading(false));
    }

    function actualDeleteCourseForever(id) {
        setIsLoading(true);
        api.delete(`/courses/${id}/force`)
            .then(() => {
                setCourses(prev => prev.filter(item => item.id !== id));
            })
            .catch(err => {
                const responseData = err.response?.data;
                let errorMsg = err.message;
                if (responseData?.message) errorMsg = responseData.message;
                alert("Xatolik yuz berdi: " + errorMsg);
            })
            .finally(() => setIsLoading(false));
    }

    return (
        <div className={styles.coursesContainer}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <button
                        className={styles.backIconBtn}
                        onClick={() => navigate('/management/courses')}
                        title="Kurslarga qaytish"
                    >
                        <KeyboardArrowLeftRoundedIcon fontSize="small" />
                    </button>
                    <h2 className={styles.title}>Kurslar (Arxiv)</h2>
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

                {!isLoading && courses.length === 0 && (
                    <div className={styles.emptyState}>
                        Arxivlangan kurslar yo'q
                    </div>
                )}

                {courses.map((course) => (
                    <div
                        key={course.id}
                        className={`${styles.card} ${styles.archivedCard}`}
                        style={{ backgroundColor: course.color }}
                    >
                        <div className={styles.cardHeader}>
                            <h3 className={styles.courseName}>{course.name}</h3>
                            <div className={styles.actions}>
                                <button
                                    onClick={() => setRestoreConfirm({ isOpen: true, courseId: course.id })}
                                    className={styles.actionBtn}
                                    title="Tiklash"
                                >
                                    <RestoreOutlinedIcon style={{ color: '#16a34a' }} />
                                </button>
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

            <ConfirmDialog
                isOpen={restoreConfirm.isOpen}
                onClose={() => setRestoreConfirm({ isOpen: false, courseId: null })}
                onConfirm={() => {
                    const id = restoreConfirm.courseId;
                    setRestoreConfirm({ isOpen: false, courseId: null });
                    if (id) actualRestoreCourse(id);
                }}
                title="Kursni tiklash"
                message="Ushbu kursni arxivdan tiklashni xohlaysizmi?"
                confirmText="Tiklash"
                cancelText="Bekor qilish"
            />

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, courseId: null })}
                onConfirm={() => {
                    const id = deleteConfirm.courseId;
                    setDeleteConfirm({ isOpen: false, courseId: null });
                    if (id) actualDeleteCourseForever(id);
                }}
                title="Kursni butunlay o'chirish"
                message="Rostdan ham bu kursni butunlay o'chirishni xohlaysizmi? Bu amalni ortga qaytarib bo'lmaydi."
            />
        </div>
    );
}
