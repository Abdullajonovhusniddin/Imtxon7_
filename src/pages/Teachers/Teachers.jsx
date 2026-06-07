import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Teachers.module.scss";
import { api, getFileUrl } from '../../api/api';

// ui librariries
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import TeacherModal from "../../components/UI/TeacherModal/TeacherModal";
import ConfirmDialog from "../../components/UI/ConfirmDialog/ConfirmDialog";
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

export default function Teachers() {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [teacherData, setTeacherData] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, teacherId: null });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbar({ ...snackbar, open: false });
    };

    const openTeacherModal = (teacher = null) => {
        setSelectedTeacher(teacher);
        setIsModalOpen(true);
    };

    const closeTeacherModal = () => {
        setSelectedTeacher(null);
        setIsModalOpen(false);
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

    const fetchTeachers = () => {
        setIsLoading(true);
        api.get('/teachers').then(
            res => {
                setTeacherData(res.data.data);
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
        fetchTeachers();
    }, []);

    const handleTeacherSubmit = (payload, teacherToEdit, localData) => {
        setIsLoading(true);

        const request = teacherToEdit?.id
            ? api.patch(`/teachers/${teacherToEdit.id}`, payload)
            : api.post('/teachers', payload);

        request.then((res) => {
            const successMsg = teacherToEdit?.id ? "O'qituvchi muvaffaqiyatli tahrirlandi!" : "O'qituvchi muvaffaqiyatli qo'shildi!";
            setSnackbar({ open: true, message: successMsg, severity: 'success' });

            // As requested, call fetchTeachers to get updated data from API after PATCH
            if (teacherToEdit?.id) {
                fetchTeachers();
            } else {
                // Optimistic update for POST
                if (res.data?.data) {
                    setTeacherData(prev => [res.data.data, ...prev]);
                } else {
                    fetchTeachers(); // fallback if no data returned
                }
            }

            closeTeacherModal();
        }).catch((err) => {
            if (err.response && err.response.status === 304) {
                console.log("Hech qanday o'zgarish qilinmadi (304 Not Modified)");
                fetchTeachers();
                closeTeacherModal();
                return;
            }

            const responseData = err.response?.data;
            console.log('Error response from server:', responseData);

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
            setSnackbar({ open: true, message: "Xatolik yuz berdi: " + errorMsg, severity: 'error' });
        }).finally(() => setIsLoading(false));
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

    function deleteTeachers(id) {
        setDeleteConfirm({ isOpen: true, teacherId: id });
    }

    function actualDeleteTeacher(id) {
        setIsLoading(true);
        api.delete(`/teachers/${id}`)
            .then((res) => {
                if (res.status === 200 || res.status === 204) {
                    setTeacherData(prev => prev.filter(item => item.id !== id));
                    setSnackbar({ open: true, message: "O'qituvchi muvaffaqiyatli o'chirildi!", severity: 'success' });
                } else {
                    console.warn('Unexpected delete response', res);
                }
            })
            .catch((err) => {
                const responseData = err.response?.data;
                console.error('Error deleting teacher:', responseData || err.message);
                let errorMsg = err.message;
                if (responseData?.message) {
                    errorMsg = responseData.message;
                } else if (responseData?.error) {
                    errorMsg = responseData.error;
                }
                setSnackbar({ open: true, message: "Xatolik yuz berdi: " + errorMsg, severity: 'error' });
            })
            .finally(() => setIsLoading(false));
    }



    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerTop}>
                    <h1 className={styles.title}>O'qituvchilar</h1>
                    <button className={styles.addBtn} onClick={() => openTeacherModal()}>
                        <AddRoundedIcon fontSize="small" />
                        <span className={styles.addBtnText}>O'qituvchi qo'shish</span>
                    </button>
                </div>
                <p className={styles.subtitle}>
                    Ushbu sahifada siz o'qituvchilar ro'yxatini va ularning ma'lumotlarini topasiz.
                    Har bir o'qituvchining ismi, fanlari va aloqa ma'lumotlari keltirilgan.
                </p>
            </div>

            <div className={styles.tableCard}>
                <div className={styles.tableHeader}>
                    <div className={styles.tableActions}>
                        <button className={styles.filterBtn}>
                            <FilterListRoundedIcon fontSize="small" />
                            Filters
                        </button>
                        <button className={styles.archiveBtn} onClick={() => navigate('/dashboard/teachers/archive')}>
                            <ArchiveOutlinedIcon fontSize="small" />
                            Arxiv
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
                                            <button onClick={() => deleteTeachers(teacher.id)} className={`${styles.actionBtn}`}>
                                                <DeleteOutlineRoundedIcon fontSize="small" />
                                            </button>
                                            <button onClick={() => openTeacherEditModal(teacher)} className={`${styles.actionBtn}`}>
                                                <EditOutlinedIcon fontSize="small" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {teacherData.length > 0 && (
                    <div className={styles.pagination}>
                        <button className={`${styles.pageArrow} ${styles.disabled}`} disabled>← Previous</button>
                        <div className={styles.pageNumbers}>
                            <button className={`${styles.pageBtn} ${styles.active}`}>1</button>
                        </div>
                        <button className={`${styles.pageArrow} ${styles.disabled}`} disabled>Next →</button>
                    </div>
                )}
            </div>

            <TeacherModal
                isOpen={isModalOpen}
                onClose={closeTeacherModal}
                onSubmit={handleTeacherSubmit}
                teacherToEdit={selectedTeacher}
            />

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, teacherId: null })}
                onConfirm={() => {
                    const id = deleteConfirm.teacherId;
                    setDeleteConfirm({ isOpen: false, teacherId: null });
                    if (id) actualDeleteTeacher(id);
                }}
                title="O'qituvchini o'chirish"
                message="Rostdan ham o'chirishni hohlaysizmi?"
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
