import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { api, getFileUrl } from "../api";
import styles from "./GroupDetail.module.scss";

import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import KeyboardArrowLeftRoundedIcon from '@mui/icons-material/KeyboardArrowLeftRounded';
import KeyboardArrowRightRoundedIcon from '@mui/icons-material/KeyboardArrowRightRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import PlayCircleOutlineRoundedIcon from '@mui/icons-material/PlayCircleOutlineRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';

import UygaVazifa from './UygaVazifa';
import Videolar from './Videolar';
import Imtihonlar from './Imtihonlar';

export default function GroupDetail({ groupId: propGroupId }) {
    const params = useParams();
    const id = propGroupId || params.id;
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    
    const [groupDetails, setGroupDetails] = useState(location.state?.groupData || null);
    const [schedules, setSchedules] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(0);
    const [showAllMonths, setShowAllMonths] = useState(false);
    
    const [isMentorsOpen, setIsMentorsOpen] = useState(true);
    const [isParamsOpen, setIsParamsOpen] = useState(true);
    const [showAllSchedules, setShowAllSchedules] = useState(false);

    // Modals
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [selectedVideoFile, setSelectedVideoFile] = useState(null);
    const [videoFileName, setVideoFileName] = useState("");
    const [selectedLessonId, setSelectedLessonId] = useState("");
    const [isUploadingVideo, setIsUploadingVideo] = useState(false);
    const [groupLessons, setGroupLessons] = useState([]);
    const fileInputRef = useRef(null);

    const groupDetailsFetchedRef = useRef(false);
    const schedulesFetchedRef = useRef(false);

    useEffect(() => {
        if (!id || groupDetailsFetchedRef.current) return;
        groupDetailsFetchedRef.current = true;
        api.get(`/groups/${id}`).then(res => {
            const data = res.data?.data || res.data || {};
            setGroupDetails(prev => ({ ...prev, ...data }));
        }).catch(err => {
            console.error("Error basic group info:", err);
            groupDetailsFetchedRef.current = false;
        });
    }, [id]);

    useEffect(() => {
        if (!id || schedulesFetchedRef.current) return;
        schedulesFetchedRef.current = true;
        api.get(`/groups/${id}/schedules`).then(res => {
            const data = res.data?.data || res.data || [];
            // Mocking schedule format if API differs, adapting to UI format
            const formattedSchedules = [];
            if (Array.isArray(data)) {
               // Adaptation for arrays
               const grouped = data.reduce((acc, curr) => {
                   const m = curr.month || 1;
                   if (!acc[m]) acc[m] = { id: m, label: `${m}-o'quv oyi`, isCurrent: false, days: [] };
                   acc[m].days.push({ id: curr.id, day: curr.day || 1, month: m, isCompleted: curr.isCompleted || false });
                   return acc;
               }, {});
               Object.values(grouped).forEach(g => formattedSchedules.push(g));
            } else if (typeof data === 'object') {
               // Adaptation for object format from reference
               const keys = Object.keys(data).sort((a,b) => Number(a) - Number(b));
               keys.forEach(key => {
                   const value = data[key];
                   formattedSchedules.push({
                       id: key, label: `${key}-o'quv oyi`, isCurrent: value.isActive,
                       days: (value.days||[]).map((d, i) => ({
                           id: `${key}-${i}`, day: d.day, month: d.month, isCompleted: d.isCompleted
                       }))
                   });
               });
            }
            if (formattedSchedules.length > 0) setSchedules(formattedSchedules);
            else {
                // Mock default schedule if API returns empty
                setSchedules([
                    { id: '1', label: "1-o'quv oyi", isCurrent: true, days: Array.from({length:12}, (_,i)=>({id: `1-${i}`, day: i+1, month: 5, isCompleted: i<5})) }
                ]);
            }
        }).catch(err => {
            console.error("Error fetching schedules:", err);
            schedulesFetchedRef.current = false;
        });
    }, [id]);

    const tabIndex = searchParams.get("tab") || "0";
    let activeTab = "Ma'lumotlar";
    if (tabIndex === "1") activeTab = "Guruh darsliklari";
    if (tabIndex === "2") activeTab = "Akademik davomati";

    const activeSubTab = searchParams.get("subtab") || "Uyga vazifa";

    const setActiveSubTab = (subtab) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set("subtab", subtab);
        setSearchParams(newParams);
    };

    const handleTabChange = (index) => {
        setSearchParams({ tab: index });
    };

    const fetchGroupLessons = () => {
        api.get(`/lessons/my/group/${id}`).then(res => {
            setGroupLessons(res.data?.data || res.data || []);
        }).catch(err => console.error("Error lessons:", err));
    };

    useEffect(() => {
        if (id && isVideoModalOpen) fetchGroupLessons();
    }, [id, isVideoModalOpen]);

    const dayTranslations = {
        MONDAY: "Du", TUESDAY: "Se", WEDNESDAY: "Ch", THURSDAY: "Pa",
        FRIDAY: "Ju", SATURDAY: "Sha", SUNDAY: "Yak"
    };

    const translateDays = (days) => {
        if (!days || !Array.isArray(days)) return "-";
        return days.map(d => dayTranslations[d] || d).join("/");
    };

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "-";
        const months = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
        return `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]}, ${date.getFullYear()}`;
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedVideoFile(file);
            setVideoFileName(file.name);
        }
    };

    const handleModalClose = () => {
        setIsVideoModalOpen(false);
        setSelectedVideoFile(null);
        setVideoFileName("");
        setSelectedLessonId("");
    };

    const uploadVideo = async () => {
        if (!selectedVideoFile || !selectedLessonId) { alert("Video va darsni tanlang!"); return; }
        setIsUploadingVideo(true);
        const formData = new FormData();
        formData.append("file", selectedVideoFile);
        formData.append("name", videoFileName || selectedVideoFile.name);

        try {
            await api.post(`/files/group/${id}/upload?lessonId=${selectedLessonId}`, formData);
            handleModalClose();
            // trigger refresh logic inside Videolar component if we had a ref or state
        } catch (err) {
            alert(err.response?.data?.message || err.message || "Xatolik yuz berdi");
        } finally {
            setIsUploadingVideo(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerTitle}>
                    <button className={styles.backBtn} onClick={() => navigate(-1)}>
                        <ArrowBackIosNewRoundedIcon fontSize="small" />
                    </button>
                    <h1>{groupDetails?.name || groupDetails?.group_name || "Guruh haqida"}</h1>
                    <div className={styles.statusTag}>FAOL</div>
                </div>
                <button className={styles.statsBtn}>
                    <AssessmentOutlinedIcon fontSize="small" />
                    Statistika
                </button>
            </div>

            <div className={styles.tabs}>
                <button className={`${styles.tab} ${activeTab === "Ma'lumotlar" ? styles.activeTab : ""}`} onClick={() => handleTabChange("0")}>
                    Ma'lumotlar
                </button>
                <button className={`${styles.tab} ${activeTab === "Guruh darsliklari" ? styles.activeTab : ""}`} onClick={() => handleTabChange("1")}>
                    Guruh darsliklari
                </button>
                <button className={`${styles.tab} ${activeTab === "Akademik davomati" ? styles.activeTab : ""}`} onClick={() => handleTabChange("2")}>
                    Akademik davomati
                </button>
            </div>

            <div className={styles.tabContentScrollable}>
                {activeTab === "Ma'lumotlar" && (
                    <>
                        <div className={styles.content}>
                            <div className={styles.mentorsCard}>
                                <div className={styles.cardHeader} onClick={() => setIsMentorsOpen(!isMentorsOpen)} style={{ cursor: "pointer" }}>
                                    <h3>Ustozlar</h3>
                                    {isMentorsOpen ? <KeyboardArrowUpRoundedIcon /> : <KeyboardArrowDownRoundedIcon />}
                                </div>
                                <div className={`${styles.cardBodyWrapper} ${isMentorsOpen ? styles.open : ''}`}>
                                    <div className={styles.cardBody}>
                                        {groupDetails?.teachers?.length > 0 ? groupDetails.teachers.map((mentor, idx) => (
                                            <div key={idx} className={styles.mentorItem}>
                                                <img src={mentor.avatar || "https://ui-avatars.com/api/?name=" + (mentor.full_name || mentor.name || "U") + "&background=random"} alt="mentor" className={styles.mentorAvatar} />
                                                <span className={styles.mentorRole}>Ustoz</span>
                                                <span className={styles.mentorName}>{mentor.full_name || mentor.name || "Noma'lum"}</span>
                                            </div>
                                        )) : (
                                            <div className={styles.mentorItem}>
                                                <img src="https://ui-avatars.com/api/?name=U&background=random" alt="mentor" className={styles.mentorAvatar} />
                                                <span className={styles.mentorRole}>Ustoz</span>
                                                <span className={styles.mentorName}>Biriktirilmagan</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className={styles.parametersCard}>
                                <div className={styles.cardHeader} onClick={() => setIsParamsOpen(!isParamsOpen)} style={{ cursor: "pointer" }}>
                                    <h3>Parametrlar</h3>
                                    {isParamsOpen ? <KeyboardArrowUpRoundedIcon /> : <KeyboardArrowDownRoundedIcon />}
                                </div>
                                <div className={`${styles.cardBodyWrapper} ${isParamsOpen ? styles.open : ''}`}>
                                    <div className={styles.cardBody}>
                                        <div className={styles.paramRow}>
                                            <span>O'quvchilar:</span>
                                            <strong>{groupDetails?.students?.length || groupDetails?.student_count || 0} nafar</strong>
                                        </div>
                                        <div className={styles.paramRow}>
                                            <span>Dars vaqti:</span>
                                            <strong>{groupDetails?.start_time || "-"} - {groupDetails?.end_time || "-"}</strong>
                                        </div>
                                        <div className={styles.paramRow}>
                                            <span>Xona:</span>
                                            <strong>{groupDetails?.room?.name || groupDetails?.room || "Noma'lum"}</strong>
                                        </div>
                                        <div className={styles.paramRow}>
                                            <span>Dars kunlari:</span>
                                            <strong>{translateDays(groupDetails?.week_day || groupDetails?.days)}</strong>
                                        </div>
                                        <div className={styles.paramRow}>
                                            <span>Ochilgan vaqti:</span>
                                            <strong>{formatDate(groupDetails?.start_date || groupDetails?.created_at)}</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Calendar schedules equivalent block */}
                        {schedules.length > 0 && (
                            <div className={styles.scheduleSection}>
                                <h2>O'quv reja</h2>
                                <div className={styles.monthNav}>
                                    <button
                                        className={styles.monthNavBtn}
                                        disabled={currentMonth === 0}
                                        onClick={() => setCurrentMonth(prev => Math.max(0, prev - 1))}
                                    >
                                        <KeyboardArrowLeftRoundedIcon fontSize="small" />
                                    </button>
                                    <button
                                        className={styles.monthNavBtn}
                                        disabled={currentMonth === schedules.length - 1}
                                        onClick={() => setCurrentMonth(prev => Math.min(schedules.length - 1, prev + 1))}
                                    >
                                        <KeyboardArrowRightRoundedIcon fontSize="small" />
                                    </button>
                                    <span className={styles.monthNavLabel}>{schedules[currentMonth]?.label}</span>
                                </div>

                                <div className={styles.calendarList}>
                                    {schedules[currentMonth]?.days?.map(d => (
                                        <div key={d.id} className={`${styles.calendarDay} ${d.isCompleted ? styles.activeDay : ""}`}>
                                            <span className={styles.month}>{d.month}-oy</span>
                                            <span className={styles.day}>{d.day}-dars</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {activeTab === "Guruh darsliklari" && (
                    <div className={styles.lessonsSection}>
                        <div className={styles.lessonsHeader}>
                            <div className={styles.lessonsTabsAndTitle}>
                                <h2>Darsliklar</h2>
                                <div className={styles.subTabs}>
                                    <button className={`${styles.subTab} ${activeSubTab === "Uyga vazifa" ? styles.activeSubTab : ""}`} onClick={() => setActiveSubTab("Uyga vazifa")}>
                                        Uyga vazifa
                                    </button>
                                    <button className={`${styles.subTab} ${activeSubTab === "Videolar" ? styles.activeSubTab : ""}`} onClick={() => setActiveSubTab("Videolar")}>
                                        Videolar
                                    </button>
                                    <button className={`${styles.subTab} ${activeSubTab === "Imtihonlar" ? styles.activeSubTab : ""}`} onClick={() => setActiveSubTab("Imtihonlar")}>
                                        Imtihonlar
                                    </button>
                                </div>
                            </div>

                            {activeSubTab === "Videolar" && (
                                <button className={styles.addLessonBtn} onClick={() => setIsVideoModalOpen(true)}>
                                    + Video yuklash
                                </button>
                            )}
                        </div>

                        <div className={styles.tableCard}>
                            {activeSubTab === "Uyga vazifa" && <UygaVazifa groupId={id} />}
                            {activeSubTab === "Videolar" && <Videolar groupId={id} />}
                            {activeSubTab === "Imtihonlar" && <Imtihonlar groupId={id} />}
                        </div>
                    </div>
                )}

                {activeTab === "Akademik davomati" && (
                    <div className={styles.tableCard}>
                        <div className={styles.cardHeader} style={{ background: 'var(--surface-strong)', color: 'var(--text)', padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
                            <h3 style={{ margin: 0, fontSize: 16 }}>Tez orada ishga tushadi...</h3>
                        </div>
                    </div>
                )}
            </div>

            {/* Video Upload Modal */}
            {isVideoModalOpen && (
                <div className={styles.overlay} onClick={handleModalClose}>
                    <div className={styles.slideover} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.slideoverHeader}>
                            <div>
                                <h2>Video yuklash</h2>
                                <p>Guruh uchun video darslik yuklash</p>
                            </div>
                            <button className={styles.closeBtn} onClick={handleModalClose}>
                                <CloseRoundedIcon fontSize="small" />
                            </button>
                        </div>
                        <div className={styles.uploadModalBody} style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Darsni tanlang</label>
                                <select 
                                    value={selectedLessonId}
                                    onChange={(e) => setSelectedLessonId(e.target.value)}
                                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                                >
                                    <option value="">Tanlang...</option>
                                    {groupLessons.map(lesson => (
                                        <option key={lesson.id} value={lesson.id}>{lesson.topic || lesson.title || `Dars ${lesson.id}`}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Video fayli</label>
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    accept="video/*"
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                />
                                <div 
                                    style={{ 
                                        border: '2px dashed var(--border)', borderRadius: '12px', padding: '32px', textAlign: 'center', 
                                        cursor: 'pointer', background: 'var(--surface-strong)', transition: 'all 0.2s' 
                                    }}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <CloudUploadOutlinedIcon style={{ fontSize: 48, color: 'var(--muted)', marginBottom: 12 }} />
                                    {selectedVideoFile ? (
                                        <p style={{ margin: 0, fontWeight: 500, color: 'var(--text)' }}>{selectedVideoFile.name}</p>
                                    ) : (
                                        <>
                                            <p style={{ margin: '0 0 4px', fontWeight: 500, color: 'var(--text)' }}>Faylni tanlang yoki shu yerga tashlang</p>
                                            <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>MP4, WEBM yoki OGG (Max: 500MB)</p>
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            {selectedVideoFile && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Video nomi</label>
                                    <input 
                                        type="text" 
                                        value={videoFileName}
                                        onChange={(e) => setVideoFileName(e.target.value)}
                                        style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                                    />
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button 
                                onClick={handleModalClose}
                                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontWeight: 500 }}
                            >
                                Bekor qilish
                            </button>
                            <button 
                                onClick={uploadVideo}
                                disabled={!selectedVideoFile || !selectedLessonId || isUploadingVideo}
                                style={{ 
                                    padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#6c35de', color: '#fff', 
                                    cursor: (!selectedVideoFile || !selectedLessonId || isUploadingVideo) ? 'not-allowed' : 'pointer', 
                                    fontWeight: 500, opacity: (!selectedVideoFile || !selectedLessonId || isUploadingVideo) ? 0.6 : 1 
                                }}
                            >
                                {isUploadingVideo ? 'Yuklanmoqda...' : 'Yuklash'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
