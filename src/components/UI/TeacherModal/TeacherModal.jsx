import React, { useEffect, useState } from "react";
import styles from "./TeacherModal.module.scss";
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import { createPortal } from "react-dom";
import AddGroupModal from "./AddGroupModal/AddGroupModal";
import { api } from "../../../api/api";
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import Box from '@mui/material/Box';

export default function TeacherModal({
    isOpen,
    onClose,
    onSubmit,
    teacherToEdit
}) {
    const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
    const [shouldRender, setShouldRender] = useState(isOpen);
    const [allGroups, setAllGroups] = useState([]);

    const defaultTeacherData = {
        phone: "+998",
        email: "",
        fullName: "",
        address: "",
        password: "",
        photo: null,
        groups: []
    };

    const [teacherData, setTeacherData] = useState(defaultTeacherData);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbar({ ...snackbar, open: false });
    };

    const toggleAddGroupModal = () => setIsAddGroupModalOpen(!isAddGroupModalOpen);

    const resetForm = () => {
        setTeacherData(defaultTeacherData);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setTeacherData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            document.body.style.overflow = 'hidden';
            
            if (teacherToEdit) {
                setTeacherData({
                    phone: teacherToEdit.phone || "+998",
                    email: teacherToEdit.email || "",
                    fullName: teacherToEdit.full_name || teacherToEdit.fullName || "",
                    address: teacherToEdit.address || "",
                    password: "",
                    photo: null,
                    groups: teacherToEdit.groups || []
                });
            } else {
                resetForm();
            }

            // Fetch all groups to check which ones are deleted
            api.get('/groups/all')
                .then(res => setAllGroups(res.data.data || []))
                .catch(err => console.log('groups/all error:', err.message));
        } else {
            const timer = setTimeout(() => {
                setShouldRender(false);
                document.body.style.overflow = 'unset';
                resetForm();
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen, teacherToEdit]);

    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        const { fullName, email, password, phone, address, photo, groups } = teacherData;
        const isEditing = Boolean(teacherToEdit?.id);

        if (!fullName || !email || !phone || !address || groups.length === 0) {
            setSnackbar({ open: true, message: "Iltimos, barcha majburiy maydonlarni (shu jumladan guruh va manzilni ham) to'ldiring!", severity: 'error' });
            return;
        }

        const hasDeletedGroups = groups.some(group => {
            const label = group?.name ?? group?.title ?? String(group);
            const rawId = group?.id ?? group?.group_id;
            const groupId = rawId != null && !isNaN(Number(rawId)) ? Number(rawId) : null;
            
            if (allGroups.length > 0) {
                if (groupId !== null) {
                    return !allGroups.some(g => Number(g.id) === groupId);
                } else {
                    return !allGroups.some(g => g.name === label || g.title === label);
                }
            }
            return false;
        });

        if (hasDeletedGroups) {
            setSnackbar({ open: true, message: "O'chirilgan guruhlarni (qizil) ro'yxatdan olib tashlang!", severity: 'error' });
            return;
        }

        if (!isEditing && !password) {
            setSnackbar({ open: true, message: "Iltimos, parolni kiriting!", severity: 'error' });
            return;
        }

        let cleanPhone = String(phone || "").replace(/[^\d+]/g, "").trim();
        if (!cleanPhone.startsWith("+")) {
            cleanPhone = "+" + cleanPhone;
        }

        setIsSaving(true);

        let finalGroups = [...groups];
        const needsMapping = finalGroups.some(g => !g || typeof g !== 'object' || (!g.id && !g.group_id) || isNaN(Number(g.id || g.group_id)));
        
        if (needsMapping && finalGroups.length > 0) {
            try {
                const res = await api.get('/groups/all');
                const allGroups = res.data.data;
                finalGroups = finalGroups.map(g => {
                    const nameToMatch = typeof g === 'object' ? (g.name || g.title) : String(g);
                    const matched = allGroups.find(ag => ag.name === nameToMatch || ag.title === nameToMatch);
                    return matched ? { id: matched.id, name: matched.name } : g;
                });
            } catch (err) {
                console.error("Failed to map groups on submit", err);
            }
        }

        const formData = new FormData();
        formData.append("full_name", fullName);
        formData.append("email", email);
        formData.append("phone", cleanPhone);
        formData.append("address", address || "");

        if (password) {
            formData.append("password", password);
        }

        if (photo) {
            formData.append("photo", photo);
        }

        finalGroups.forEach(group => {
            const id = group?.id || group?.group_id;
            if (id) {
                formData.append("groups", Number(id));
            }
        });

        setIsSaving(false);

        if (onSubmit) {
            onSubmit(formData, teacherToEdit, { ...teacherData, groups: finalGroups });
        }
    };

    if (!shouldRender) return null;

    return createPortal(
        <div
            className={`${styles.overlay} ${!isOpen ? styles.fadeOut : ""}`}
            onClick={onClose}
        >
            <form className={`${styles.modal} ${!isOpen ? styles.slideOut : ""}`} onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.headerTop}>
                        <div>
                            <h2 className={styles.title}>{teacherToEdit ? "O'qituvchini tahrirlash" : "O'qituvchi qo'shish"}</h2>
                            <p className={styles.subtitle}>{teacherToEdit ? "Bu yerda o'qituvchini yangilashingiz mumkin." : "Bu yerda siz yangi o'qituvchi qo'shishingiz mumkin."}</p>
                        </div>
                        <button type="button" className={styles.closeBtn} onClick={onClose}>
                            <CloseRoundedIcon />
                        </button>
                    </div>
                </div>

                <div className={styles.body}>
                    <div className={styles.formGroup}>
                        <label>O'qituvchi FIO</label>
                        <input
                            type="text"
                            name="fullName"
                            placeholder="O'qituvchi FIO ni kiriting"
                            value={teacherData.fullName}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Mail</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="Elektron pochtani kiriting"
                            value={teacherData.email}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Telefon raqam</label>
                        <input
                            type="text"
                            name="phone"
                            placeholder="Telefon raqamini kiriting"
                            value={teacherData.phone}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Manzil</label>
                        <input
                            type="text"
                            name="address"
                            placeholder="Manzilni kiriting"
                            value={teacherData.address}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Parol</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="Parolni kiriting"
                            value={teacherData.password}
                            onChange={handleInputChange}
                            required={!teacherToEdit}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Guruh</label>
                        <div className={styles.groupsInputContainer}>
                            {teacherData.groups.length > 0 && (
                                <div className={styles.groupTags}>
                                    {teacherData.groups.map((group, index) => {
                                        const key = group?.id ?? `${group?.name ?? group}-${index}`;
                                        const label = group?.name ?? group?.title ?? String(group);
                                        const rawId = group?.id ?? group?.group_id;
                                        const groupId = rawId != null && !isNaN(Number(rawId)) ? Number(rawId) : null;
                                        
                                        let isDeleted = false;
                                        if (allGroups.length > 0) {
                                            if (groupId !== null) {
                                                isDeleted = !allGroups.some(g => Number(g.id) === groupId);
                                            } else {
                                                isDeleted = !allGroups.some(g => g.name === label || g.title === label);
                                            }
                                        }
                                        return (
                                            <span
                                                key={key}
                                                className={`${styles.groupTag} ${isDeleted ? styles.groupTagDeleted : ''}`}
                                                title={isDeleted ? "Bu guruh o'chirilgan" : undefined}
                                            >
                                                <span style={isDeleted ? { textDecoration: 'line-through', opacity: 0.7 } : {}}>
                                                    {label}
                                                </span>
                                                <button 
                                                    type="button"
                                                    className={styles.removeGroupBtn}
                                                    onClick={() => setTeacherData(prev => ({
                                                        ...prev,
                                                        groups: prev.groups.filter((g, i) => i !== index)
                                                    }))}
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                            <button type="button" className={styles.addGroupBtnInline} onClick={toggleAddGroupModal}>
                                <AddRoundedIcon fontSize="small" />
                                <span>Qo'shish</span>
                            </button>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label>Surati</label>
                        <label
                            className={styles.uploadArea}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                    setTeacherData(prev => ({
                                        ...prev,
                                        photo: e.dataTransfer.files[0]
                                    }));
                                }
                            }}
                        >
                            <input
                                type="file"
                                style={{ display: "none" }}
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setTeacherData(prev => ({
                                            ...prev,
                                            photo: e.target.files[0]
                                        }));
                                    }
                                }}
                            />
                            <CloudUploadOutlinedIcon className={styles.uploadIcon} />
                            {teacherData.photo ? (
                                <>
                                    <p className={styles.uploadText}>
                                        Tanlandi: <span className={styles.purpleText}>{teacherData.photo.name}</span>
                                    </p>
                                    <p className={styles.uploadHint}>O'zgartirish uchun bosing</p>
                                </>
                            ) : (
                                <>
                                    <p className={styles.uploadText}>
                                        <span className={styles.purpleText}>Click to upload</span> or drag and drop
                                    </p>
                                    <p className={styles.uploadHint}>JPG or PNG (max. 2 MB)</p>
                                </>
                            )}
                        </label>
                    </div>
                </div>

                <div className={styles.footer}>
                    <div className={styles.footerButtons}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose}>Bekor qilish</button>
                        <button type="submit" className={styles.saveBtn}>Saqlash</button>
                    </div>
                    <div className={styles.logoWrapper}>
                        <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M50 20L80 35V65L50 80L20 65V35L50 20Z" stroke="#D4AF37" strokeOpacity="0.2" strokeWidth="1" />
                            <path d="M50 30L70 40V60L50 70L30 60V40L50 30Z" stroke="#D4AF37" strokeOpacity="0.2" strokeWidth="1" />
                            <path d="M50 40L60 45V55L50 60L40 55V45L50 40Z" fill="#D4AF37" fillOpacity="0.1" />
                        </svg>
                    </div>
                </div>

                <AddGroupModal
                    isOpen={isAddGroupModalOpen}
                    onClose={toggleAddGroupModal}
                    initialSelectedGroups={teacherData.groups}
                    preloadedGroups={allGroups}
                    onAdd={(selected) => {
                        setTeacherData(prev => ({
                            ...prev,
                            groups: selected
                        }));
                        toggleAddGroupModal();
                    }}
                />
            </form>

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
        </div>,
        document.body
    );
}
