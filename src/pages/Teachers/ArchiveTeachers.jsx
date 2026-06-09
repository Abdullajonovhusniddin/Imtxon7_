import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Teachers.module.scss";
import { api, getFileUrl } from '../../api/api';

// ui librariries
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import KeyboardArrowLeftRoundedIcon from '@mui/icons-material/KeyboardArrowLeftRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import RestoreOutlinedIcon from '@mui/icons-material/RestoreOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ConfirmDialog from "../../components/UI/ConfirmDialog/ConfirmDialog";
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import TeacherModal from "../../components/UI/TeacherModal/TeacherModal";

export default function ArchiveTeachers() {
    const navigate = useNavigate();
    const [teacherData, setTeacherData] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [restoreConfirm, setRestoreConfirm] = useState({ isOpen: false, teacherId: null });
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, teacherId: null });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbar({ ...snackbar, open: false });
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    };

    const fetchArchivedTeachers = () => {
        setIsLoading(true);
        // Предполагаем, что архивные учителя приходят по этому или похожему эндпоинту
        // Если API отличается, эндпоинт можно будет легко поменять
        api.get('/teachers/archive').then(
            res => {
                setTeacherData(res.data.data || []);
            }
        ).catch(
            err => {
                console.log(err.message);
            }
        ).finally(() => {
            setIsLoading(false);
        });
    };

    useEffect(() => {
        fetchArchivedTeachers();
    }, []);

    const openTeacherModal = (teacher = null) => {
        setSelectedTeacher(teacher);
        setIsModalOpen(true);
    };

    const closeTeacherModal = () => {
        setSelectedTeacher(null);
        setIsModalOpen(false);
    };

    const openTeacherEditModal = (teacherOrId) => {
        if (teacherOrId && typeof teacherOrId === 'object') {
            openTeacherModal(teacherOrId);
            return;
        }

        const teacher = teacherData.find((item) => item.id === teacherOrId);
        if (teacher) {
            openTeacherModal(teacher);
        } else {
            console.warn('Teacher not found for edit:', teacherOrId);
        }
    };

    const handleTeacherSubmit = (payload, teacherToEdit) => {
        setIsLoading(true);

        const request = teacherToEdit?.id
            ? api.patch(`/teachers/${teacherToEdit.id}`, payload)
            : api.post('/teachers', payload);

        request.then((res) => {
            const successMsg = teacherToEdit?.id ? "O'qituvchi muvaffaqiyatli tahrirlandi!" : "O'qituvchi muvaffaqiyatli qo'shildi!";
            setSnackbar({ open: true, message: successMsg, severity: 'success' });
            fetchArchivedTeachers();
            closeTeacherModal();
        }).catch((err) => {
            const responseData = err.response?.data;
            let errorMsg = err.message;
            if (responseData?.message) {
                errorMsg = responseData.message;
            }
            setSnackbar({ open: true, message: "Xatolik yuz berdi: " + errorMsg, severity: 'error' });
        }).finally(() => setIsLoading(false));
    };

    function restoreTeacher(id) {
        setRestoreConfirm({ isOpen: true, teacherId: id });
    }

    function actualRestoreTeacher(id) {
        setIsLoading(true);
        // Пример эндпоинта восстановления
        api.post(`/teachers/${id}/restore`)
            .then((res) => {
                setTeacherData(prev => prev.filter(item => item.id !== id));
                setSnackbar({ open: true, message: "O'qituvchi muvaffaqiyatli tiklandi!", severity: 'success' });
            })
            .catch((err) => {
                const responseData = err.response?.data;
                let errorMsg = err.message;
                if (responseData?.message) {
                    errorMsg = responseData.message;
                }
                setSnackbar({ open: true, message: "Xatolik yuz berdi: " + errorMsg, severity: 'error' });
            })
            .finally(() => setIsLoading(false));
    }

    function deleteTeachersForever(id) {
        setDeleteConfirm({ isOpen: true, teacherId: id });
    }

    function actualDeleteTeacherForever(id) {
        setIsLoading(true);
        // Пример эндпоинта для полного удаления
        api.delete(`/teachers/${id}/force`)
            .then((res) => {
                setTeacherData(prev => prev.filter(item => item.id !== id));
                setSnackbar({ open: true, message: "O'qituvchi muvaffaqiyatli butunlay o'chirildi!", severity: 'success' });
            })
            .catch((err) => {
                const responseData = err.response?.data;
                let errorMsg = err.message;
                if (responseData?.message) {
                    errorMsg = responseData.message;
                }
                setSnackbar({ open: true, message: "Xatolik yuz berdi: " + errorMsg, severity: 'error' });
            })
            .finally(() => setIsLoading(false));
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerTop}>
                    <h1 className={styles.title}>O'qituvchilar (Arxiv)</h1>
                </div>
                <p className={styles.subtitle}>
                    Ushbu sahifada siz o'chirilgan (arxivlangan) o'qituvchilar ro'yxatini topasiz.
                    Ularni qayta tiklashingiz yoki butunlay o'chirishingiz mumkin.
                </p>
            </div>

            <div className={styles.tableCard}>
                <div className={styles.tableHeader}>
                    <div className={styles.tableActions}>

                        <button
                            className={styles.backIconBtn}
                            onClick={() => navigate('/dashboard/teachers')}
                            title="O'qituvchilarga qaytish"
                        >
                            <KeyboardArrowLeftRoundedIcon fontSize="small" />
                        </button>

                        <button className={styles.filterBtn}
                        >
                            <FilterListRoundedIcon fontSize="small" />
                            Filters
                        </button>

                    </div>
                    <div className={styles.searchWrapper}>
                        <input 
                            type="text" 
                            placeholder="Search" 
                            className={styles.searchInput}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)} 
                        />
                    </div>
                </div>

                <div className={styles.tableWrapper} style={{ position: 'relative', opacity: isLoading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
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
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>
                                    <input type="checkbox" />
                                </th>
                                <th>Nomi ↓</th>
                                <th>Guruh</th>
                                <th>Telefon raqamlari</th>
                                <th>Email</th>
                                <th>Manzil</th>
                                <th>Yaratilgan sana</th>
                                <th style={{ textAlign: 'right' }}>Amallar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teacherData.filter(teacher => {
                                if (!searchQuery) return true;
                                const q = searchQuery.toLowerCase();
                                return (
                                    teacher.full_name?.toLowerCase().includes(q) ||
                                    teacher.phone?.toLowerCase().includes(q) ||
                                    teacher.email?.toLowerCase().includes(q)
                                );
                            }).map((teacher, index) => (
                                <tr className={styles.tdata} key={teacher.id ?? teacher.email ?? index}>
                                    <td>
                                        <input type="checkbox" />
                                    </td>
                                    <td>
                                        <div className={styles.userInfo}>
                                            {teacher.photo ? (
                                                <img
                                                    src={getFileUrl(teacher.photo)}
                                                    alt={teacher.full_name}
                                                    className={styles.avatar}
                                                />
                                            ) : (
                                                <div className={styles.initialAvatar}>
                                                    {teacher.full_name ? teacher.full_name.charAt(0).toUpperCase() : 'T'}
                                                </div>
                                            )}
                                            <span className={styles.userName}>{teacher.full_name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className={styles.groups}>
                                            {teacher.groups && teacher.groups.map((group, index) => {
                                                const key = group?.id ?? `${group?.name ?? String(group)}-${index}`;
                                                const label = group?.name ?? group?.title ?? String(group);
                                                return (
                                                    <span key={key} className={styles.groupTag}>{label}</span>
                                                );
                                            })}
                                        </div>
                                    </td>
                                    <td>{teacher.phone}</td>
                                    <td style={{ paddingLeft: '15px' }}>{teacher.email}</td>
                                    <td style={{ paddingLeft: '17px', textAlign: 'left' }}>{teacher.address}</td>
                                    <td style={{ paddingLeft: '20px' }}>{formatDate(teacher.created_at)}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className={styles.actions}>
                                            <button className={`${styles.actionBtn} ${styles.viewBtn}`}>
                                                <VisibilityOutlinedIcon fontSize="small" />
                                            </button>
                                            <button onClick={() => restoreTeacher(teacher.id)} className={`${styles.actionBtn}`}>
                                                <RestoreOutlinedIcon fontSize="small" style={{ color: '#16a34b' }} />
                                            </button>
                                            <button onClick={() => openTeacherEditModal(teacher)} className={`${styles.actionBtn}`}>
                                                <EditOutlinedIcon fontSize="small" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {teacherData.length === 0 && !isLoading && (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '30px' }}>
                                        Arxivlangan o'qituvchilar yo'q
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className={styles.pagination}>
                    <button className={`${styles.pageArrow} ${styles.disabled}`} disabled>← Previous</button>
                    <div className={styles.pageNumbers}>
                        <button className={`${styles.pageBtn} ${styles.active}`}>1</button>
                    </div>
                    <button className={`${styles.pageArrow} ${styles.disabled}`} disabled>Next →</button>
                </div>
            </div>

            <ConfirmDialog
                isOpen={restoreConfirm.isOpen}
                onClose={() => setRestoreConfirm({ isOpen: false, teacherId: null })}
                onConfirm={() => {
                    const id = restoreConfirm.teacherId;
                    setRestoreConfirm({ isOpen: false, teacherId: null });
                    if (id) actualRestoreTeacher(id);
                }}
                title="O'qituvchini tiklash"
                message="Ushbu o'qituvchini arxivdan tiklashni xohlaysizmi?"
                confirmText="Tiklash"
                cancelText="Bekor qilish"
            />

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, teacherId: null })}
                onConfirm={() => {
                    const id = deleteConfirm.teacherId;
                    setDeleteConfirm({ isOpen: false, teacherId: null });
                    if (id) actualDeleteTeacherForever(id);
                }}
                title="O'qituvchini butunlay o'chirish"
                message="Rostdan ham bu o'qituvchini butunlay o'chirishni xohlaysizmi? Bu amalni ortga qaytarib bo'lmaydi."
            />

            <TeacherModal
                isOpen={isModalOpen}
                onClose={closeTeacherModal}
                onSubmit={(payload) => handleTeacherSubmit(payload, selectedTeacher)}
                teacherToEdit={selectedTeacher}
            />

            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={6000} 
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                sx={{ 
                    top: '20px !important', 
                    right: '20px !important',
                    width: 'calc(25vw - 40px)',
                    maxWidth: '400px'
                }}
            >
                <MuiAlert 
                    onClose={handleCloseSnackbar} 
                    severity={snackbar.severity} 
                    elevation={6} 
                    variant="filled"
                    sx={{ 
                        width: '100%', 
                        position: 'relative', 
                        overflow: 'hidden', 
                        padding: '6px 12px',
                        paddingBottom: '10px',
                        fontSize: '13px',
                        alignItems: 'center',
                        '& .MuiAlert-icon': {
                            fontSize: '18px',
                            marginRight: '8px'
                        },
                        '& .MuiAlert-message': {
                            padding: '4px 0',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '100%'
                        },
                        '& .MuiAlert-action': {
                            padding: '0 0 0 8px',
                            marginRight: '-4px'
                        }
                    }}
                >
                    {snackbar.message}
                    <Box 
                        sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            height: '3px',
                            backgroundColor: 'rgba(255,255,255,0.5)',
                            animation: snackbar.open ? 'shrink 6s linear forwards' : 'none',
                            '@keyframes shrink': {
                                '0%': { width: '100%' },
                                '100%': { width: '0%' }
                            }
                        }} 
                    />
                </MuiAlert>
            </Snackbar>
        </div>
    );
}
