import { useEffect, useState, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Students.module.scss";
import { api, getFileUrl } from '../../api/api';

import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import StudentModal from "../../components/UI/StudentModal/StudentModal";
import ConfirmDialog from "../../components/UI/ConfirmDialog/ConfirmDialog";
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

export default function Students() {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [studentData, setStudentData] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isPending, startTransition] = useTransition();
    const [isLoading, setIsLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, studentId: null });

    const openAddStudentModal = () => {
        setSelectedStudent(null);
        setIsModalOpen(true);
    };

    const openEditStudentModal = (student) => {
        setSelectedStudent(student);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedStudent(null);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "-";
        return date.toLocaleDateString("ru-RU");
    };

    const fetchStudents = (targetPage) => {
        setIsLoading(true);
        return api(`/students?page=${targetPage}&limit=4`).then(
            res => {
                const data = res.data.data || [];

                if (data.length > 0 || targetPage === 1) {
                    setStudentData(data);
                    setPage(targetPage);
                }

                if (res.data.meta && res.data.meta.last_page) {
                    setTotalPages(res.data.meta.last_page);
                } else if (res.data.totalPages) {
                    setTotalPages(res.data.totalPages);
                } else if (data.length < 4) {
                    // Agar ma'lumotlar kam kelsa (yoki bo'sh), demak bu oxirgi sahifa
                    setTotalPages(targetPage);
                } else {
                    // Agar to'liq 4 ta ma'lumot kelsa va API dan jami sahifalar soni kelmasa, yana bitta sahifa bor deb faraz qilamiz
                    setTotalPages(Math.max(totalPages, targetPage + 1));
                }
                setIsLoading(false);
            }
        ).catch(
            err => {
                console.log(err.message);
                setIsLoading(false);
            }
        );
    };

    function increment() {
        if (page < totalPages) {
            startTransition(async () => {
                await fetchStudents(page + 1);
            });
        }
    }

    function decrement() {
        if (page > 1) {
            startTransition(async () => {
                await fetchStudents(page - 1);
            });
        }
    }

    useEffect(() => {
        startTransition(async () => {
            await fetchStudents(1);
        });
    }, []);

    const getPaginationGroup = () => {
        let pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (page <= 4) {
                pages = [1, 2, 3, 4, 5, '...', totalPages];
            } else if (page >= totalPages - 3) {
                pages = [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
            } else {
                pages = [1, '...', page - 1, page, page + 1, '...', totalPages];
            }
        }
        return pages;
    };


    function deleteStudent(id) {
        setDeleteConfirm({ isOpen: true, studentId: id });
    }

    function actualDeleteStudent(id) {
        setIsLoading(true);
        api.delete(`/students/${id}`)
            .then(res => {
                if (res.status === 200 || res.status === 204) {
                    setStudentData(prev => prev.filter(s => s.id !== id));
                } else {
                    console.warn('Unexpected delete response', res);
                }
            })
            .catch(err => console.error(err.message))
            .finally(() => setIsLoading(false));
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerTop}>
                    <h1 className={styles.title}>Talabalar</h1>
                    <button className={styles.addBtn} onClick={openAddStudentModal}>
                        <AddRoundedIcon fontSize="small" />
                        Talaba qo'shish
                    </button>
                </div>
                <p className={styles.subtitle}>
                    Ushbu sahifada siz Talabalar ro'yxatini va ularning ma'lumotlarini topasiz.
                    Har bir Talaba ismi, fanlari va aloqa ma'lumotlari keltirilgan.
                </p>
            </div>

            <div className={styles.tableCard}>
                <div className={styles.tableHeader}>
                    <div className={styles.searchWrapper}>
                        <SearchRoundedIcon className={styles.searchIcon} fontSize="small" />
                        <input
                            type="text"
                            placeholder="Search"
                            className={styles.searchInput}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className={styles.tableActions}>
                        <button className={styles.filterBtn}>
                            <FilterListRoundedIcon fontSize="small" />
                            Filters
                        </button>
                        <button className={styles.archiveBtn} onClick={() => navigate('/dashboard/students/archive')}>
                            <ArchiveOutlinedIcon fontSize="small" />
                            Arxiv
                        </button>
                    </div>
                </div>

                <div className={styles.tableWrapper} style={{ position: 'relative', opacity: (isPending || isLoading) ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                    {(isPending || isLoading) && (
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
                                <th>Nomi ↓</th>
                                <th>Guruh</th>
                                <th>Telefon raqamlari</th>
                                <th>Email</th>
                                <th>Tug'ilgan sanasi</th>
                                <th>Manzil</th>
                                <th>Yaratilgan sana</th>
                                <th>Amallar</th>
                            </tr>
                        </thead>
                        <tbody className={styles.tbody}>
                            {studentData.filter(student => {
                                if (!searchQuery) return true;
                                const q = searchQuery.toLowerCase();
                                return (
                                    student.full_name?.toLowerCase().includes(q) ||
                                    student.phone?.toLowerCase().includes(q) ||
                                    student.email?.toLowerCase().includes(q)
                                );
                            }).map((student) => (
                                <tr key={student.id}>
                                    <td>
                                        <input type="checkbox" />
                                    </td>
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
                                    <td>
                                        <div className={styles.groups}>
                                            {student.groups.map((group, index) => (
                                                <span key={index} className={styles.groupTag}>{group.name}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td>{student.phone}</td>
                                    <td style={{ paddingLeft: '16px' }}>{student.email}</td>
                                    <td style={{ paddingLeft: '20px' }}>{formatDate(student.birth_date)}</td>
                                    <td style={{ paddingLeft: '18px' }}>{student.address}</td>
                                    <td style={{ paddingLeft: '20px' }}>{formatDate(student.created_at)}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className={styles.actions}>
                                            <button className={styles.actionBtn}><VisibilityOutlinedIcon fontSize="small" /></button>
                                            <button onClick={() => deleteStudent(student.id)} className={styles.actionBtn}><DeleteOutlineRoundedIcon fontSize="small" /></button>
                                            <button onClick={() => openEditStudentModal(student)} className={styles.actionBtn}><EditOutlinedIcon fontSize="small" /></button>

                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {studentData.length > 0 && totalPages > 1 && (
                    <div className={styles.pagination}>
                        <button
                            onClick={decrement}
                            className={`${styles.pageArrow} ${(page === 1 || isPending || isLoading) ? styles.disabled : ''}`}
                            disabled={page === 1 || isPending || isLoading}
                        >
                            ← Previous
                        </button>
                        <div className={styles.pageNumbers}>
                            {getPaginationGroup().map((item, index) => {
                                if (item === '...') {
                                    return <span key={`dots-${index}`} className={styles.dots}>...</span>;
                                }
                                return (
                                    <button
                                        key={index}
                                        className={`${styles.pageBtn} ${page === item ? styles.active : ''}`}
                                        onClick={() => {
                                            if (page !== item) {
                                                startTransition(async () => {
                                                    await fetchStudents(item);
                                                });
                                            }
                                        }}
                                        disabled={isPending || isLoading}
                                    >
                                        {item}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={increment}
                            className={`${styles.pageArrow} ${(page >= totalPages || isPending || isLoading) ? styles.disabled : ''}`}
                            disabled={page >= totalPages || isPending || isLoading}
                        >
                            Next →
                        </button>
                    </div>
                )}
            </div>

            <StudentModal
                isOpen={isModalOpen}
                onClose={closeModal}
                onSave={() => {
                    fetchStudents(page);
                }}
                studentToEdit={selectedStudent}
            />

            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, studentId: null })}
                onConfirm={() => {
                    const id = deleteConfirm.studentId;
                    setDeleteConfirm({ isOpen: false, studentId: null });
                    if (id) actualDeleteStudent(id);
                }}
                title="Talabani o'chirish"
                message="Rostdan ham o'chirishni hohlaysizmi?"
            />
        </div>
    );
}
