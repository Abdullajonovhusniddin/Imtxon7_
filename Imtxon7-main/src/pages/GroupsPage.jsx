import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from '../api';
import styles from "./GroupsPage.module.scss";
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import Switch from '@mui/material/Switch';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

const WEEK_DAY_MAP = {
    Dushanba: 'MONDAY', Seshanba: 'TUESDAY', Chorshanba: 'WEDNESDAY',
    Payshanba: 'THURSDAY', Juma: 'FRIDAY', Shanba: 'SATURDAY', Yakshanba: 'SUNDAY'
};

const DAY_LABELS = {
    MONDAY: 'Du', TUESDAY: 'Se', WEDNESDAY: 'Ch',
    THURSDAY: 'Pa', FRIDAY: 'Ju', SATURDAY: 'Sha', SUNDAY: 'Yak'
};

export default function GroupsPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("groups");
    const [groups, setGroups] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [activeGroup, setActiveGroup] = useState(null);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const [courses, setCourses] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [formData, setFormData] = useState({
        name: '', course: '', room: '', days: {
            Dushanba: false, Seshanba: false, Chorshanba: false,
            Payshanba: false, Juma: false, Shanba: false, Yakshanba: false
        },
        time: '09:00', startDate: '', maxStudent: '0'
    });
    const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);

    // Confirm delete
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, group: null });

    const fetchGroups = () => {
        setIsLoading(true);
        const endpoint = activeTab === 'archive' ? '/groups/archive' : '/groups/all';
        api.get(endpoint)
            .then(res => {
                setGroups(res.data?.data || res.data || []);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err.message);
                setIsLoading(false);
            });
    };

    useEffect(() => { fetchGroups(); }, [activeTab]);

    const loadFormData = async () => {
        try {
            const [cRes, rRes, tRes] = await Promise.allSettled([
                api.get('/courses'), api.get('/rooms'), api.get('/teachers')
            ]);
            if (cRes.status === 'fulfilled') setCourses(cRes.value.data?.data || cRes.value.data || []);
            if (rRes.status === 'fulfilled') setRooms(rRes.value.data?.data || rRes.value.data || []);
            if (tRes.status === 'fulfilled') setTeachers(tRes.value.data?.data || tRes.value.data || []);
        } catch (e) { console.error(e); }
    };

    const openCreateModal = async () => {
        await loadFormData();
        setEditingGroup(null);
        setSelectedTeacherIds([]);
        setFormData({
            name: '', course: '', room: '', days: {
                Dushanba: false, Seshanba: false, Chorshanba: false,
                Payshanba: false, Juma: false, Shanba: false, Yakshanba: false
            },
            time: '09:00', startDate: '', maxStudent: '0'
        });
        setIsModalOpen(true);
    };

    const openEditModal = async (group) => {
        await loadFormData();
        setEditingGroup(group);
        const teacherIds = (group.teachers || []).map(t => String(t?.id || t));
        setSelectedTeacherIds(teacherIds);
        const activeDays = {};
        Object.keys(WEEK_DAY_MAP).forEach(key => {
            const val = WEEK_DAY_MAP[key];
            activeDays[key] = (group.week_day || []).includes(val) || (group.week_day || []).includes(key);
        });
        setFormData({
            name: group.name || '',
            course: String(group.course?.id || group.course_id || ''),
            room: String(group.room?.id || group.room_id || group.room || ''),
            days: activeDays,
            time: group.start_time || '09:00',
            startDate: group.start_date || '',
            maxStudent: String(group.max_student || '0')
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const weekDays = Object.keys(formData.days)
            .filter(d => formData.days[d])
            .map(d => WEEK_DAY_MAP[d]);
        if (!weekDays.length) { alert("Kamida 1 kun tanlang!"); return; }

        const payload = {
            name: formData.name,
            course_id: Number(formData.course),
            room_id: Number(formData.room),
            teacher_ids: selectedTeacherIds.map(Number),
            days: weekDays,
            start_time: formData.time,
            max_student: Number(formData.maxStudent) || 0,
        };

        try {
            if (editingGroup) {
                await api.patch(`/groups/${editingGroup.id}`, payload);
            } else {
                await api.post('/groups', payload);
            }
            setIsModalOpen(false);
            fetchGroups();
        } catch (err) {
            alert(err.response?.data?.message || err.message || 'Xatolik yuz berdi');
        }
    };

    const handleDelete = async (group) => {
        setDeleteConfirm({ isOpen: false, group: null });
        try {
            await api.delete(`/groups/${group.id}`);
            fetchGroups();
        } catch (err) {
            alert(err.response?.data?.message || err.message || "O'chirishda xatolik");
        }
    };

    const handleMenuOpen = (e, group) => {
        e.stopPropagation();
        setAnchorEl(e.currentTarget);
        setActiveGroup(group);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setActiveGroup(null);
    };

    const translateDays = (days) => {
        if (!days || !Array.isArray(days)) return '-';
        return days.map(d => DAY_LABELS[d] || d.toLowerCase().slice(0, 3)).join(',');
    };

    const totalTeachers = new Set(
        groups.flatMap(g => (g.teachers || []).map(t => String(t?.id || t)))
    ).size;
    const totalStudents = groups.reduce((s, g) => s + (g.students?.length || g.student_count || 0), 0);

    return (
        <div className={styles.container}>
            {/* HEADER */}
            <div className={styles.header}>
                <div className={styles.headerTop}>
                    <h1 className={styles.title}>Guruhlar</h1>
                    <button className={styles.addBtn} onClick={openCreateModal}>
                        <AddRoundedIcon fontSize="small" />
                        <span>Guruh qo'shish</span>
                    </button>
                </div>
                <p className={styles.subtitle}>
                    Ushbu sahifada siz guruhlar ro'yxatini va ularning ma'lumotlarini topasiz.
                    Har bir guruhning nomi, kursi va dars vaqti ma'lumotlari keltirilgan.
                </p>
            </div>

            {/* TABS */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === "groups" ? styles.activeTab : ""}`}
                    onClick={() => setActiveTab("groups")}
                >
                    <GroupsRoundedIcon fontSize="small" />
                    Guruhlar
                </button>
                <button
                    className={`${styles.tab} ${activeTab === "archive" ? styles.activeTab : ""}`}
                    onClick={() => setActiveTab("archive")}
                >
                    <ArchiveOutlinedIcon fontSize="small" />
                    Arxiv
                </button>
            </div>

            {/* STATS GRID */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <div className={`${styles.statIconWrapper} ${styles.statIconGroups}`}>
                            <GroupsRoundedIcon />
                        </div>
                        <MoreVertRoundedIcon className={styles.moreIcon} />
                    </div>
                    <div className={styles.statInfo}>
                        <p className={styles.statLabel}>Jami guruhlar</p>
                        <h2 className={styles.statValue}>{groups.length}</h2>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <div className={`${styles.statIconWrapper} ${styles.statIconTeachers}`}>
                            <PersonRoundedIcon />
                        </div>
                        <MoreVertRoundedIcon className={styles.moreIcon} />
                    </div>
                    <div className={styles.statInfo}>
                        <p className={styles.statLabel}>O'qituvchilar</p>
                        <h2 className={styles.statValue}>{totalTeachers}</h2>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statHeader}>
                        <div className={`${styles.statIconWrapper} ${styles.statIconStudents}`}>
                            <SchoolRoundedIcon />
                        </div>
                        <MoreVertRoundedIcon className={styles.moreIcon} />
                    </div>
                    <div className={styles.statInfo}>
                        <p className={styles.statLabel}>O'quvchilar</p>
                        <h2 className={styles.statValue}>{totalStudents}</h2>
                    </div>
                    <div className={styles.studentAvatars}>
                        <div className={styles.smallAvatar} style={{ backgroundColor: '#1e293b' }}>I</div>
                        <div className={styles.smallAvatar} style={{ backgroundColor: '#ea580c' }}>M</div>
                        <div className={styles.smallAvatar} style={{ backgroundColor: '#ec4899' }}>S</div>
                    </div>
                </div>
            </div>

            {/* TABLE CARD */}
            <div className={styles.tableCard}>
                <div className={styles.tableWrapper} style={{ position: 'relative', opacity: isLoading ? 0.6 : 1, transition: 'opacity 0.2s', minHeight: '150px' }}>
                    {isLoading && (
                        <Box sx={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            backgroundColor: 'var(--bg)', opacity: 0.7, zIndex: 10
                        }}>
                            <CircularProgress sx={{ color: '#6c35de' }} />
                        </Box>
                    )}
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Status</th>
                                <th>Guruh nomi</th>
                                <th>Kurs</th>
                                <th>Davomiyligi</th>
                                <th>Dars vaqti</th>
                                <th>Xona</th>
                                <th>O'qituvchi</th>
                                <th>Talabalar</th>
                                <th style={{ textAlign: 'right' }}>
                                    <RefreshRoundedIcon
                                        className={styles.refreshIcon}
                                        fontSize="small"
                                        onClick={fetchGroups}
                                    />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {groups.map((group) => (
                                <tr
                                    key={group.id}
                                    onClick={() => navigate(`/groups/${group.id}`)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <td>
                                        <div className={styles.statusCell}>
                                            <Switch
                                                checked={true}
                                                size="small"
                                                onClick={(e) => e.stopPropagation()}
                                                sx={{
                                                    width: 44, height: 24, padding: 0,
                                                    '& .MuiSwitch-switchBase': {
                                                        padding: '2px',
                                                        '&.Mui-checked': {
                                                            transform: 'translateX(20px)', color: '#fff',
                                                            '& + .MuiSwitch-track': { backgroundColor: '#22c55e', opacity: 1 },
                                                        },
                                                    },
                                                    '& .MuiSwitch-thumb': { width: 20, height: 20, boxShadow: '0 2px 4px rgba(0,0,0,0.15)' },
                                                    '& .MuiSwitch-track': { borderRadius: 12, backgroundColor: 'var(--border)', opacity: 1 },
                                                }}
                                            />
                                            <span className={`${styles.statusLabel} ${styles.labelActive}`}>FAOL</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={styles.groupName}>{group.name}</span>
                                    </td>
                                    <td>
                                        <span className={styles.courseTag}>
                                            {group.course?.name || group.course || '-'}
                                        </span>
                                    </td>
                                    <td style={{ color: '#475569', fontWeight: 500 }}>
                                        {group.course?.duration_month || '-'} oy
                                    </td>
                                    <td>
                                        <div className={styles.timeInfo}>
                                            <span className={styles.time}>{group.start_time || '-'}</span>
                                            <span className={styles.days}>
                                                {translateDays(group.week_day)}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ color: '#475569', fontWeight: 500 }}>
                                        {group.room || '-'}
                                    </td>
                                    <td>
                                        <div className={styles.teachersList}>
                                            {(group.teachers || []).map(t => (
                                                <span key={t?.id || t} className={styles.teacherTag}>
                                                    {t?.full_name || t?.name || t}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={styles.studentCount}>
                                            {group.students?.length ?? group.student_count ?? 0}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <MoreVertRoundedIcon
                                            className={styles.rowMoreIcon || ''}
                                            onClick={(e) => handleMenuOpen(e, group)}
                                            style={{ cursor: 'pointer', color: 'var(--muted)' }}
                                        />
                                    </td>
                                </tr>
                            ))}
                            {!isLoading && groups.length === 0 && (
                                <tr className={styles.emptyRow}>
                                    <td colSpan="9">Guruhlar topilmadi</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Context Menu */}
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    onClick={(e) => e.stopPropagation()}
                    PaperProps={{
                        sx: {
                            boxShadow: 'var(--card-shadow)', border: '1px solid var(--border)',
                            backgroundColor: 'var(--surface)', borderRadius: '8px', padding: '4px', minWidth: '120px',
                        }
                    }}
                >
                    <MenuItem
                        onClick={() => { openEditModal(activeGroup); handleMenuClose(); }}
                        sx={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', color: 'var(--text)', fontWeight: 600, fontSize: '14px', borderRadius: '6px', '&:hover': { backgroundColor: 'var(--surface-strong)' } }}
                    >
                        <EditRoundedIcon fontSize="small" />
                        <span>Tahrirlash</span>
                    </MenuItem>
                    <MenuItem
                        onClick={() => { setDeleteConfirm({ isOpen: true, group: activeGroup }); handleMenuClose(); }}
                        sx={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', color: '#ef4444', fontWeight: 600, fontSize: '14px', borderRadius: '6px', '&:hover': { backgroundColor: '#fef2f2' } }}
                    >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                        <span>O'chirish</span>
                    </MenuItem>
                </Menu>
            </div>

            {/* CREATE/EDIT MODAL (Slide-over) */}
            {isModalOpen && (
                <div className={styles.overlay} onClick={() => setIsModalOpen(false)}>
                    <div className={styles.slideover} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.slideoverHeader}>
                            <div>
                                <h2>{editingGroup ? "Guruhni tahrirlash" : "Yangi guruh"}</h2>
                                <p>{editingGroup ? "Guruh ma'lumotlarini yangilang" : "Yangi guruh yarating"}</p>
                            </div>
                            <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                                <CloseRoundedIcon fontSize="small" />
                            </button>
                        </div>

                        <form className={styles.form} onSubmit={handleSubmit}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Guruh nomi <span className={styles.required}>*</span></label>
                                <input
                                    className={styles.formInput}
                                    placeholder="Masalan: Frontend-G1"
                                    value={formData.name}
                                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Kurs <span className={styles.required}>*</span></label>
                                <select
                                    className={styles.formSelect}
                                    value={formData.course}
                                    onChange={(e) => setFormData(p => ({ ...p, course: e.target.value }))}
                                    required
                                >
                                    <option value="">Kursni tanlang</option>
                                    {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Xona</label>
                                <select
                                    className={styles.formSelect}
                                    value={formData.room}
                                    onChange={(e) => setFormData(p => ({ ...p, room: e.target.value }))}
                                >
                                    <option value="">Xona tanlang</option>
                                    {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>O'qituvchilar</label>
                                <div className={styles.tagList}>
                                    {selectedTeacherIds.map(tid => {
                                        const t = teachers.find(t => String(t.id) === String(tid));
                                        return (
                                            <span key={tid} className={styles.tag}>
                                                {t?.full_name || t?.name || tid}
                                                <button type="button" onClick={() => setSelectedTeacherIds(prev => prev.filter(id => id !== tid))}>×</button>
                                            </span>
                                        );
                                    })}
                                </div>
                                <select
                                    className={styles.formSelect}
                                    value=""
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val && !selectedTeacherIds.includes(val)) {
                                            setSelectedTeacherIds(prev => [...prev, val]);
                                        }
                                    }}
                                >
                                    <option value="">O'qituvchi qo'shish</option>
                                    {teachers.filter(t => !selectedTeacherIds.includes(String(t.id))).map(t => (
                                        <option key={t.id} value={t.id}>{t.full_name || t.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Dars kunlari</label>
                                <div className={styles.daysGrid}>
                                    {Object.keys(WEEK_DAY_MAP).map(day => (
                                        <label key={day} className={styles.dayLabel}>
                                            <input
                                                type="checkbox"
                                                checked={formData.days[day] || false}
                                                onChange={() => setFormData(p => ({ ...p, days: { ...p.days, [day]: !p.days[day] } }))}
                                            />
                                            {day}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Dars vaqti</label>
                                <input
                                    type="time"
                                    className={styles.formInput}
                                    value={formData.time}
                                    onChange={(e) => setFormData(p => ({ ...p, time: e.target.value }))}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Max talabalar</label>
                                <input
                                    type="number"
                                    className={styles.formInput}
                                    placeholder="0"
                                    value={formData.maxStudent}
                                    onChange={(e) => setFormData(p => ({ ...p, maxStudent: e.target.value }))}
                                />
                            </div>

                            <div className={styles.formActions}>
                                <button type="button" className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>
                                    Bekor
                                </button>
                                <button type="submit" className={styles.saveBtn}>
                                    {editingGroup ? "Saqlash" : "Yaratish"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRM */}
            {deleteConfirm.isOpen && (
                <div className={styles.modal} onClick={() => setDeleteConfirm({ isOpen: false, group: null })}>
                    <div className={styles.modalContent || ''} onClick={e => e.stopPropagation()}
                        style={{
                            background: 'var(--surface)', borderRadius: 16, padding: 28,
                            maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
                        }}
                    >
                        <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
                            Guruhni o'chirish
                        </h2>
                        <p style={{ color: 'var(--muted)', marginBottom: 24, fontSize: 14 }}>
                            "<strong>{deleteConfirm.group?.name}</strong>" guruhini o'chirishni tasdiqlaysizmi?
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button className={styles.cancelBtn}
                                onClick={() => setDeleteConfirm({ isOpen: false, group: null })}>
                                Bekor
                            </button>
                            <button style={{
                                padding: '10px 24px', borderRadius: 10, border: 'none',
                                background: '#ef4444', color: '#fff', fontSize: 14,
                                fontWeight: 600, cursor: 'pointer'
                            }} onClick={() => handleDelete(deleteConfirm.group)}>
                                O'chirish
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
