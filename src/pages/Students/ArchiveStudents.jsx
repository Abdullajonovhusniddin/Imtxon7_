import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Students.module.scss";
import { api, getFileUrl } from '../../api/api';

// UI libraries
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import KeyboardArrowLeftRoundedIcon from '@mui/icons-material/KeyboardArrowLeftRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import RestoreOutlinedIcon from '@mui/icons-material/RestoreOutlined';
import ConfirmDialog from "../../components/UI/ConfirmDialog/ConfirmDialog";
import CircularProgress from '@mui/material/CircularProgress';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Box from '@mui/material/Box';
import StudentModal from "../../components/UI/StudentModal/StudentModal";

export default function ArchiveStudents() {
    const navigate = useNavigate();
    const [studentData, setStudentData] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [restoreConfirm, setRestoreConfirm] = useState({ isOpen: false, studentId: null });
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, studentId: null });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);

    const openEditStudentModal = (student) => {
        setSelectedStudent(student);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedStudent(null);
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

    const fetchArchivedStudents = () => {
        setIsLoading(true);
        api.get('/students/archive')
            .then(res => setStudentData(res.data.data || []))
            .catch(err => console.error('Failed to load archived students', err))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        fetchArchivedStudents();
    }, []);

    const restoreStudent = (id) => {
        setRestoreConfirm({ isOpen: true, studentId: id });
    };

    const actualRestoreStudent = (id) => {
        setIsLoading(true);
        api.post(`/students/${id}/restore`)
            .then(() => setStudentData(prev => prev.filter(item => item.id !== id)))
            .catch(err => console.error('Restore error', err))
            .finally(() => setIsLoading(false));
    };

    const deleteStudentForever = (id) => {
        setDeleteConfirm({ isOpen: true, studentId: id });
    };

    const actualDeleteStudentForever = (id) => {
        setIsLoading(true);
        api.delete(`/students/${id}/force`)
            .then(() => setStudentData(prev => prev.filter(item => item.id !== id)))
            .catch(err => console.error('Delete error', err))
            .finally(() => setIsLoading(false));
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerTop}>
                    <h1 className={styles.title}>Talabalar (Arxiv)</h1>
                </div>
                <p className={styles.subtitle}>
                    Ushbu sahifada arxivlangan talabalar ro'yxati ko'rsatiladi. Qayta tiklash yoki butunlay o'chirish mumkin.
                </p>
            </div>

            <div className={styles.tableCard}>
                <div className={styles.tableHeader}>
                    <div className={styles.searchWrapper}>
                        <input 
                            type="text" 
                            placeholder="Search" 
                            className={styles.searchInput}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)} 
                        />
                    </div>
                    <div className={styles.tableActions}>
                        {/* Filters button placed next to back */}
                        <button className={styles.filterBtn}>
                            <FilterListRoundedIcon fontSize="small" />
                            Filters
                        </button>

                        {/* Back button – static rotated icon, no text */}
                        <button
                            className={styles.backIconBtn ? styles.backIconBtn : ''}
                            onClick={() => navigate('/dashboard/students')}
                            title="Talabalarga qaytish"
                        >
                            <KeyboardArrowLeftRoundedIcon fontSize="small" />
                        </button>
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
                                <th><input type="checkbox" /></th>
                                <th>Ismi ↓</th>
                                <th>Guruh</th>
                                <th>Telefon</th>
                                <th>Email</th>
                                <th>Manzil</th>
                                <th>Yaratilgan sana</th>
                                <th style={{ textAlign: 'right' }}>Amallar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {studentData.filter(student => {
                                if (!searchQuery) return true;
                                const q = searchQuery.toLowerCase();
                                return (
                                    student.full_name?.toLowerCase().includes(q) ||
                                    student.phone?.toLowerCase().includes(q) ||
                                    student.email?.toLowerCase().includes(q)
                                );
                            }).map((student, idx) => (
                                <tr className={styles.tdata} key={student.id ?? student.email ?? idx}>
                                    <td><input type="checkbox" /></td>
                                    <td>
                                        <div className={styles.userInfo}>
                                            {student.photo ? (
                                                <img
                                                    src={getFileUrl(student.photo)}
                                                    alt={student.full_name}
                                                    className={styles.avatar}
                                                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', marginRight: '10px' }}
                                                />
                                            ) : (
                                                <div 
                                                    className={styles.initialAvatar}
                                                    style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f0f0f0', color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginRight: '10px' }}
                                                >
                                                    {student.full_name ? student.full_name.charAt(0).toUpperCase() : 'S'}
                                                </div>
                                            )}
                                            <span className={styles.userName}>{student.full_name}</span>
                                        </div>
                                    </td>
                                    <td>{student.groups?.map((group) => group.name).join(", ")}</td>
                                    <td>{student.phone}</td>
                                    <td>{student.email}</td>
                                    <td>{student.address}</td>
                                    <td>{formatDate(student.created_at)}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className={styles.actions}>
                                            <button className={styles.actionBtn} title="Ko'rish">
                                                <VisibilityOutlinedIcon fontSize="small" />
                                            </button>
                                            <button onClick={() => restoreStudent(student.id)} className={styles.actionBtn} title="Tiklash">
                                                <RestoreOutlinedIcon fontSize="small" style={{ color: '#16a34a' }} />
                                            </button>
                                            <button onClick={() => openEditStudentModal(student)} className={styles.actionBtn}><EditOutlinedIcon fontSize="small" /></button>

                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {studentData.length === 0 && !isLoading && (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '30px' }}>
                                        Arxivlangan talabalar yo'q
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination (placeholder, mirrors teachers) */}
                <div className={styles.pagination}>
                    <button className={`${styles.pageArrow} ${styles.disabled}`} disabled>← Previous</button>
                    <div className={styles.pageNumbers}>
                        <button className={`${styles.pageBtn} ${styles.active}`}>1</button>
                    </div>
                    <button className={`${styles.pageArrow} ${styles.disabled}`} disabled>Next →</button>
                </div>
            </div>

            {/* Restore confirmation dialog */}
            <ConfirmDialog
                isOpen={restoreConfirm.isOpen}
                onClose={() => setRestoreConfirm({ isOpen: false, studentId: null })}
                onConfirm={() => {
                    const id = restoreConfirm.studentId;
                    setRestoreConfirm({ isOpen: false, studentId: null });
                    if (id) actualRestoreStudent(id);
                }}
                title="Talabani tiklash"
                message="Bu talabani arxivdan tiklamoqchimisiz?"
                confirmText="Tiklash"
                cancelText="Bekor qilish"
            />

            <StudentModal
                isOpen={isModalOpen}
                onClose={closeModal}
                onSave={() => {
                    fetchArchivedStudents();
                    closeModal();
                }}
                studentToEdit={selectedStudent}
            />

        </div>
    );
}
