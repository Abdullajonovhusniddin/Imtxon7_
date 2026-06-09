import React, { useEffect, useState } from "react";
import styles from "./AddStudentModal.module.scss";
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import AddGroupModal from "../../TeacherModal/AddGroupModal/AddGroupModal";
import { api } from "../../../../api/api";

export default function AddStudentModal({ isOpen, onClose, onSave, studentToEdit }) {
    const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
    const [allGroups, setAllGroups] = useState([]);

    const defaultStudentData = {
        phone: "+998",
        email: "",
        fullName: "",
        birthDate: "",
        address: "",
        password: "",
        photo: null,
        groups: []
    };

    const formatDateForInput = (dateValue) => {
        if (!dateValue) return "";
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return "";
        return date.toISOString().split("T")[0];
    };

    const [studentData, setStudentData] = useState(defaultStudentData);

    const toggleAddGroupModal = () => setIsAddGroupModalOpen(!isAddGroupModalOpen);

    const resetForm = () => {
        setStudentData(defaultStudentData);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setStudentData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    useEffect(() => {
        if (isOpen) {
            // Fetch all groups when modal opens
            api.get('/groups/all')
                .then(res => setAllGroups(res.data.data || []))
                .catch(err => console.log('groups/all error:', err.message));
        }

        if (studentToEdit) {
            setStudentData({
                phone: studentToEdit.phone || "+998",
                email: studentToEdit.email || "",
                fullName: studentToEdit.full_name || studentToEdit.fullName || "",
                birthDate: formatDateForInput(studentToEdit.birth_date || studentToEdit.birthDate || ""),
                address: studentToEdit.address || "",
                password: "",
                photo: null,
                groups: studentToEdit.groups || []
            });
        } else if (isOpen) {
            resetForm();
        }
    }, [studentToEdit, isOpen]);

    const handleSubmit = (e) => {
        if (e) e.preventDefault();

        const { fullName, email, password, phone, address, birthDate, photo, groups } = studentData;
        const isEditing = Boolean(studentToEdit?.id);

        if (!fullName || !email || !phone || !birthDate || !address || groups.length === 0) {
            alert("Iltimos, barcha majburiy maydonlarni (shu jumladan guruh va manzilni ham) to'ldiring!");
            return;
        }

        const hasDeletedGroups = groups.some(group => {
            const rawId = group?.id ?? group?.group_id;
            const groupId = rawId != null && !isNaN(Number(rawId)) ? Number(rawId) : null;

            if (allGroups.length > 0) {
                if (groupId !== null) {
                    return !allGroups.some(g => Number(g.id) === groupId);
                } else {
                    return !allGroups.some(g => g.name === group.name || g.title === group.name);
                }
            }
            return false;
        });

        if (hasDeletedGroups) {
            alert("Iltimos, o'chirilgan (qizil chiziq bilan belgilangan) guruhlarni ro'yxatdan olib tashlang!");
            return;
        }

        if (!isEditing && !password) {
            alert("Iltimos, parolni kiriting!");
            return;
        }

        // Clean phone number (format strictly as E.164 international phone number: +998XXXXXXXXX)
        let cleanPhone = phone.replace(/[^\d+]/g, "").trim();
        if (!cleanPhone.startsWith("+")) {
            cleanPhone = "+" + cleanPhone;
        }

        const formData = new FormData();
        formData.append("full_name", fullName);
        formData.append("email", email);
        formData.append("phone", cleanPhone);
        formData.append("address", address);
        formData.append("birth_date", birthDate);

        if (photo) {
            formData.append("photo", photo);
        }

        if (password) {
            formData.append("password", password);
        }

        groups.forEach(group => {
            formData.append("groups", Number(group.id));
        });

        const request = isEditing
            ? api.patch(`/students/${studentToEdit.id}`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            })
            : api.post('/students', formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });

        request.then(
            res => {
                console.log(isEditing ? "Student updated successfully:" : "Student created successfully:", res.status);
                if (onSave) {
                    onSave();
                }
                resetForm();
                onClose();
            }
        ).catch(
            err => {
                const responseData = err.response?.data;
                console.log("Error response from server:", responseData);

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

    return (
        <form className={`${styles.modal} ${!isOpen ? styles.slideOut : ""}`} onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h2 className={styles.title}>{studentToEdit ? "Talabani tahrirlash" : "Talaba qo'shish"}</h2>
                    <p className={styles.subtitle}>{studentToEdit ? "Bu yerda talabani yangilashingiz mumkin." : "Bu yerda siz yangi Talaba qo'shishingiz mumkin."}</p>
                </div>
                <button type="button" className={styles.closeBtn} onClick={onClose}>
                    <CloseRoundedIcon />
                </button>
            </div>

            <div className={styles.body}>
                <div className={styles.formGroup}>
                    <label>Talaba FIO</label>
                    <input
                        type="text"
                        name="fullName"
                        placeholder="Talaba FIO ni kiriting"
                        value={studentData.fullName}
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
                        value={studentData.phone}
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
                        value={studentData.email}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Tug'ilgan sanasi</label>
                    <div className={styles.dateInputWrapper}>
                        <input
                            type="date"
                            name="birthDate"
                            value={studentData.birthDate}
                            onChange={handleInputChange}
                            required
                        />
                        <CalendarTodayRoundedIcon className={styles.calendarIcon} />
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label>Manzil</label>
                    <input
                        type="text"
                        name="address"
                        placeholder="Manzilni kiriting"
                        value={studentData.address}
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
                        value={studentData.password}
                        onChange={handleInputChange}
                        required={!studentToEdit}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label>Guruh</label>
                    <div className={styles.groupsInputContainer}>
                        {studentData.groups.length > 0 && (
                            <div className={styles.groupTags}>
                                {studentData.groups.map(group => {
                                    const rawId = group?.id ?? group?.group_id;
                                    const groupId = rawId != null && !isNaN(Number(rawId)) ? Number(rawId) : null;

                                    let isDeleted = false;
                                    if (allGroups.length > 0) {
                                        if (groupId !== null) {
                                            isDeleted = !allGroups.some(g => Number(g.id) === groupId);
                                        } else {
                                            isDeleted = !allGroups.some(g => g.name === group.name || g.title === group.name);
                                        }
                                    }
                                    return (
                                        <span
                                            key={group.id}
                                            className={`${styles.groupTag} ${isDeleted ? styles.groupTagDeleted : ''}`}
                                            title={isDeleted ? "Bu guruh o'chirilgan" : undefined}
                                        >
                                            <span style={isDeleted ? { textDecoration: 'line-through', opacity: 0.7 } : {}}>
                                                {group.name}
                                            </span>
                                            <button
                                                type="button"
                                                className={styles.removeGroupBtn}
                                                onClick={() => setStudentData(prev => ({
                                                    ...prev,
                                                    groups: prev.groups.filter(g => g.id !== group.id)
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
                                setStudentData(prev => ({
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
                                    setStudentData(prev => ({
                                        ...prev,
                                        photo: e.target.files[0]
                                    }));
                                }
                            }}
                        />
                        <CloudUploadOutlinedIcon className={styles.uploadIcon} />
                        {studentData.photo ? (
                            <>
                                <p className={styles.uploadText}>
                                    Tanlandi: <span className={styles.purpleText}>{studentData.photo.name}</span>
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
                initialSelectedGroups={studentData.groups}
                preloadedGroups={allGroups}
                onAdd={(selected) => {
                    setStudentData(prev => ({
                        ...prev,
                        groups: selected
                    }));
                    toggleAddGroupModal();
                }}
            />
        </form>
    );
}
