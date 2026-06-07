import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { api, getFileUrl } from "../../../api/api";
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

export default function GroupDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [currentMonth, setCurrentMonth] = useState(0);
    const [showAllMonths, setShowAllMonths] = useState(false);
    const [OverallLessons] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [groupDetails, setGroupDetails] = useState(location.state?.groupData || null);
    const [videoRefresh, setVideoRefresh] = useState(0);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [selectedVideoFile, setSelectedVideoFile] = useState(null);
    const [videoFileName, setVideoFileName] = useState("");
    const [selectedLessonId, setSelectedLessonId] = useState("");
    const [isUploadingVideo, setIsUploadingVideo] = useState(false);
    const [groupLessons, setGroupLessons] = useState([]);
    const [groupStudents, setGroupStudents] = useState([]);
    const [isMentorsOpen, setIsMentorsOpen] = useState(true);
    const [isParamsOpen, setIsParamsOpen] = useState(true);
    const fileInputRef = useRef(null);

    // Refs to prevent duplicate fetching on re-renders
    const schedulesFetchedRef = useRef(false);
    const groupDetailsFetchedRef = useRef(false);
    const lessonsFetchedRef = useRef(false);

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

    useEffect(() => {
        const fetchSchedules = async () => {
            schedulesFetchedRef.current = true;
            try {
                const res = await api.get(`/groups/${id}/schedules`);
                const data = res.data;
                const formattedSchedules = [];
                data.forEach((item) => {
                    const keys = Object.keys(item).sort((a, b) => Number(a) - Number(b));
                    keys.forEach((key) => {
                        const value = item[key];
                        formattedSchedules.push({
                            id: key,
                            label: `${key}-o'quv oyi`,
                            isCurrent: value.isActive,
                            days: value.days.map((d, dIdx) => ({
                                id: `${key}-${dIdx}`,
                                day: d.day,
                                month: d.month,
                                isCompleted: d.isCompleted
                            }))
                        });
                    });
                });
                setSchedules(formattedSchedules);
            } catch (err) {
                console.error("Error fetching schedules:", err);
                schedulesFetchedRef.current = false;
            }
        };
        if (id && searchParams.get("tab") !== "1" && searchParams.get("tab") !== "2" && !schedulesFetchedRef.current) {
            fetchSchedules();
        }
    }, [id, searchParams]);

    useEffect(() => {
        const fetchBasicDetails = async () => {
            groupDetailsFetchedRef.current = true;
            try {
                const res = await api.get(`/groups/${id}`).catch(() => ({ data: {} }));
                const dataBasic = res.data?.data || res.data || {};
                setGroupDetails(prev => ({ ...prev, ...dataBasic }));
            } catch (err) {
                console.error("Error fetching basic group details:", err);
                groupDetailsFetchedRef.current = false;
            }
        };

        const isTab0 = searchParams.get("tab") !== "1" && searchParams.get("tab") !== "2";

        if (id && isTab0 && !groupDetailsFetchedRef.current) {
            if (location.state?.groupData) {
                groupDetailsFetchedRef.current = true;
            } else {
                fetchBasicDetails();
            }
        }
    }, [id, location.state, searchParams]);

    const detailedFetchedRef = useRef(false);
    useEffect(() => {
        const fetchDetailedInfo = async () => {
            detailedFetchedRef.current = true;
            try {
                const res = await api.get(`/groups/one/${id}`).catch(() => ({ data: {} }));
                const dataOne = res.data?.data || res.data || {};
                setGroupDetails(prev => ({ ...prev, ...dataOne }));
            } catch (err) {
                console.error("Error fetching detailed info:", err);
                detailedFetchedRef.current = false;
            }
        };
        const isTab0 = searchParams.get("tab") !== "1" && searchParams.get("tab") !== "2";
        if (id && isTab0 && !detailedFetchedRef.current) {
            fetchDetailedInfo();
        }
    }, [id, searchParams]);

    const tabIndex = searchParams.get("tab") || "0";
    let activeTab = "Ma'lumotlar";
    if (tabIndex === "1") activeTab = "Guruh darsliklari";
    if (tabIndex === "2") activeTab = "Akademik davomati";

    const activeSubTab = searchParams.get("subtab") || "Uyga vazifa";
    const [showAllSchedules, setShowAllSchedules] = useState(false);

    const setActiveSubTab = (subtab) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set("subtab", subtab);
        setSearchParams(newParams);
    };

    const handleTabChange = (index) => {
        setSearchParams({ tab: index });
    };

    useEffect(() => {
        const fetchGroupLessons = async () => {
            lessonsFetchedRef.current = true;
            try {
                const res = await api.get(`/lessons/my/group/${id}`);
                const data = res.data.data || res.data || [];
                setGroupLessons(Array.isArray(data) ? data : [data]);
            } catch (err) {
                console.error("Error fetching group lessons:", err);
                lessonsFetchedRef.current = false;
            }
        };
        if (id && isVideoModalOpen && !lessonsFetchedRef.current) {
            fetchGroupLessons();
        }
    }, [id, isVideoModalOpen]);

    const dayTranslations = {
        MONDAY: "Du",
        TUESDAY: "Se",
        WEDNESDAY: "Ch",
        THURSDAY: "Pa",
        FRIDAY: "Ju",
        SATURDAY: "Sha",
        SUNDAY: "Yak"
    };
    const translateDays = (days) => {
        if (!days || !Array.isArray(days)) return "";
        return days.map(d => dayTranslations[d] || d).join("/");
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "";
        const months = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
        const day = String(date.getDate()).padStart(2, '0');
        return `${day} ${months[date.getMonth()]}, ${date.getFullYear()}`;
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "-";
        const datePart = formatDate(dateString);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${datePart} ${hours}:${minutes}`;
    };

    const addDays = (dateString, days) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "-";
        date.setDate(date.getDate() + days);
        return date.toISOString();
    };

    const calculateEndTime = (timeStr, hoursToAdd = 2) => {
        if (!timeStr) return "";
        const parts = timeStr.split(":");
        const hours = parseInt(parts[0], 10) || 0;
        const minutes = parseInt(parts[1], 10) || 0;
        const date = new Date();
        date.setHours(hours + hoursToAdd, minutes);
        if (isNaN(date.getTime())) return "";
        const endHours = String(date.getHours()).padStart(2, '0');
        const endMinutes = String(date.getMinutes()).padStart(2, '0');
        return `${endHours}:${endMinutes}`;
    };

    const calculateEndDate = (dateStr, monthsToAdd) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "";
        const parsedMonths = parseInt(monthsToAdd, 10) || 0;
        date.setMonth(date.getMonth() + parsedMonths);
        return date.toISOString(); // Format back to ISO so formatDate can parse it
    };

    const formatFileSize = (size) => {
        if (!size) return "-";
        if (typeof size === 'string' && size.includes("MB")) return size;
        const bytes = Number(size);
        if (isNaN(bytes)) return size;
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleVideoUpload = async () => {
        if (!selectedVideoFile || !selectedLessonId) {
            alert("Iltimos, darsni tanlang!");
            return;
        }

        setIsUploadingVideo(true);
        try {
            const formData = new FormData();
            formData.append("file", selectedVideoFile);

            await api.post(
                `/files/group/${id}/upload?lessonId=${selectedLessonId}`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            setVideoRefresh(prev => prev + 1);
            handleModalClose();
        } catch (err) {
            console.error("Error uploading video:", err);
            alert("Video yuklashda xatolik yuz berdi");
        } finally {
            setIsUploadingVideo(false);
        }
    };

    // Fake data for tabs that don't have API yet
    const fakeGroupData = {
        lessons: [
            { id: 1, number: 1, title: "Html asoslari", isPill: true, count1: 5, count2: 1, count3: 0, startDate: "13 May, 2026 10:00", endDate: "14 May, 2026 06:00", lessonDate: "12 May, 2026" },
            { id: 2, number: 2, title: "Kirish", isPill: false, count1: 5, count2: 0, count3: 0, startDate: "13 May, 2026 11:52", endDate: "14 May, 2026 07:52", lessonDate: "9 May, 2026" },
            { id: 3, number: 3, title: "Nodejs", isPill: false, count1: 5, count2: 0, count3: 3, startDate: "14 May, 2026 09:47", endDate: "15 May, 2026 05:47", lessonDate: "14 May, 2026" }
        ],
        calendarDays: [
            { id: 1, day: 2, month: "May", active: true },
            { id: 2, day: 5, month: "May", active: true },
            { id: 3, day: 7, month: "May", active: true },
            { id: 4, day: 9, month: "May", active: true },
            { id: 5, day: 12, month: "May", active: true },
            { id: 6, day: 14, month: "May", active: true },
            { id: 7, day: 16, month: "May", active: true },
            { id: 8, day: 19, month: "May", active: true },
            { id: 9, day: 21, month: "May", active: true },
            { id: 10, day: 23, month: "May", active: true },
            { id: 11, day: 26, month: "May", active: true },
            { id: 12, day: 28, month: "May", active: true },
            { id: 13, day: 30, month: "May", active: true }
        ]
    };

    let startYear = new Date().getFullYear();
    let startMonth = new Date().getMonth();
    if (groupDetails?.start_date) {
        const sd = new Date(groupDetails.start_date);
        if (!isNaN(sd.getTime())) {
            startYear = sd.getFullYear();
            startMonth = sd.getMonth();
        }
    }

    const scheduleYears = [];
    let currentYearCounter = startYear;
    let lastMonthIndex = startMonth;

    schedules.forEach((schedule) => {
        const firstDay = schedule.days[0];
        if (firstDay && firstDay.month) {
            const monthMap = {
                "yan": 0, "jan": 0, "fev": 1, "feb": 1, "mar": 2, "apr": 3, "may": 4, "iyun": 5, "jun": 5,
                "iyul": 6, "jul": 6, "avg": 7, "aug": 7, "sen": 8, "sep": 8, "okt": 9, "oct": 9,
                "noy": 10, "nov": 10, "dek": 11, "dec": 11
            };
            let mIndex = -1;
            for (const [key, val] of Object.entries(monthMap)) {
                if (firstDay.month.toLowerCase().startsWith(key)) {
                    mIndex = val; break;
                }
            }
            if (mIndex !== -1) {
                if (mIndex < lastMonthIndex && (lastMonthIndex - mIndex) > 2) {
                    currentYearCounter++;
                }
                lastMonthIndex = mIndex;
            }
        }
        scheduleYears.push(currentYearCounter);
    });

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerTitle}>
                    <button className={styles.backBtn} onClick={() => navigate("/dashboard/groups")}>
                        <ArrowBackIosNewRoundedIcon fontSize="small" />
                    </button>
                    <h1>{groupDetails?.name || ""}</h1>
                    <span className={styles.statusTag}>{groupDetails?.status || "Aktiv"}</span>
                </div>
                <button className={styles.statsBtn}>
                    <AssessmentOutlinedIcon fontSize="small" />
                    Statistika
                </button>
            </div>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === "Ma'lumotlar" ? styles.activeTab : ""}`}
                    onClick={() => handleTabChange("0")}
                >
                    Ma'lumotlar
                </button>
                <button
                    className={`${styles.tab} ${activeTab === "Guruh darsliklari" ? styles.activeTab : ""}`}
                    onClick={() => handleTabChange("1")}
                >
                    Guruh darsliklari
                </button>
                <button
                    className={`${styles.tab} ${activeTab === "Akademik davomati" ? styles.activeTab : ""}`}
                    onClick={() => handleTabChange("2")}
                >
                    Akademik davomati
                </button>
            </div>

            {activeTab === "Ma'lumotlar" && (
                <div className={styles.tabContentScrollable}>
                    <div className={styles.content}>
                        <div className={styles.mentorsCard}>
                            <div
                                className={styles.cardHeader}
                                onClick={() => setIsMentorsOpen(!isMentorsOpen)}
                                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                                <h3>Guruh mentorlari</h3>
                                {isMentorsOpen ? <KeyboardArrowUpRoundedIcon fontSize="small" style={{ color: "white" }} /> : <KeyboardArrowDownRoundedIcon fontSize="small" style={{ color: "white" }} />}
                            </div>
                            <div className={`${styles.cardBodyWrapper} ${isMentorsOpen ? styles.open : ''}`}>
                                <div className={styles.cardBody}>
                                    {groupDetails?.teachers?.map((mentor, index) => (
                                        <div key={index} className={styles.mentorItem}>
                                            <img
                                                src={getFileUrl(mentor.photo) || `https://ui-avatars.com/api/?name=${mentor.full_name || mentor.name || 'MO'}&background=f8fafc&color=3b82f6&size=128`}
                                                alt={mentor.full_name || mentor.name}
                                                className={styles.mentorAvatar}
                                            />
                                            <span className={styles.mentorRole}>Teacher</span>
                                            <span className={styles.mentorName}>{mentor.full_name || mentor.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className={styles.parametersCard}>
                            <div
                                className={styles.cardHeader}
                                onClick={() => setIsParamsOpen(!isParamsOpen)}
                                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                            >
                                <h3>Guruh parametrlari</h3>
                                {isParamsOpen ? <KeyboardArrowUpRoundedIcon fontSize="small" style={{ color: "white" }} /> : <KeyboardArrowDownRoundedIcon fontSize="small" style={{ color: "white" }} />}
                            </div>
                            <div className={`${styles.cardBodyWrapper} ${isParamsOpen ? styles.open : ''}`}>
                                <div className={styles.cardBody}>
                                    <div className={styles.paramRow}>
                                        <span>Yo'nalish</span>
                                        <strong>{groupDetails?.course?.name || ""}</strong>
                                    </div>
                                    <div className={styles.paramRow}>
                                        <span>O'rtacha yosh</span>
                                        <strong>{groupDetails?.averageAge ?? "0"} yosh</strong>
                                    </div>
                                    <div className={styles.paramRow}>
                                        <span>Sig'imi</span>
                                        <strong>{groupDetails?.room_capacity ?? "0"} ta</strong>
                                    </div>
                                    <div className={styles.paramRow}>
                                        <span>Hozirgi o'quvchilar</span>
                                        <strong>{groupDetails?.student_count ?? "0"} ta</strong>
                                    </div>
                                    <div className={styles.paramRow}>
                                        <span>Darslar soni (1 oyda)</span>
                                        <strong>{schedules.length > 0 ? Math.round(schedules.reduce((sum, m) => sum + m.days.length, 0) / schedules.length) : "0"} ta</strong>
                                    </div>
                                    <div className={styles.paramRow}>
                                        <span>Kurs davomiyligi</span>
                                        <strong>{groupDetails?.course?.duration_month ?? "0"} oy</strong>
                                    </div>
                                    <div className={styles.paramRow}>
                                        <span>Darslar soni (Jami)</span>
                                        <strong>{schedules.reduce((sum, m) => sum + m.days.length, 0)} ta</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.scheduleSection}>
                        <h2>Dars jadvali</h2>
                        <div className={styles.scheduleList}>
                            {(() => {
                                const teachersList = groupDetails?.teachers?.length > 0 ? groupDetails.teachers : (groupDetails ? [{ id: 'unknown', full_name: "Noma'lum" }] : []);
                                const displayedTeachers = showAllSchedules ? teachersList : teachersList.slice(0, 2);

                                return displayedTeachers.map((teacher, index) => {
                                    const item = {
                                        id: `${groupDetails?.id || 'g'}-${teacher.id || index}`,
                                        teacher: teacher.full_name || teacher.name || "Noma'lum",
                                        days: translateDays(groupDetails?.week_day),
                                        time: groupDetails?.start_time ? `${groupDetails.start_time} dan - ${calculateEndTime(groupDetails.start_time, 2)} gacha` : "",
                                        period: groupDetails?.start_date ? `${formatDate(groupDetails.start_date)} - ${formatDate(calculateEndDate(groupDetails.start_date, groupDetails.course?.duration_month))}` : "",
                                        room: groupDetails?.room || "Noma'lum"
                                    };
                                    return (
                                        <div key={item.id} className={styles.scheduleItem}>
                                            <span className={styles.teacherName}>{item.teacher}</span>
                                            <div className={styles.scheduleDetails}>
                                                <span>{item.days}</span>
                                                <span>{item.time}</span>
                                                <span>{item.period}</span>
                                                <span>{item.room}</span>
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>

                        {groupDetails?.teachers?.length > 2 && (
                            <div className={styles.showMoreBtnWrapper}>
                                <button
                                    className={styles.showMoreBtn}
                                    onClick={() => setShowAllSchedules(!showAllSchedules)}
                                >
                                    {showAllSchedules ? "Yashirish" : `Yana ko'rsatish (${groupDetails.teachers.length - 2})`}
                                </button>
                            </div>
                        )}

                        {/* Month navigation */}
                        <div className={styles.monthNav}>
                            <button
                                className={styles.monthNavBtn}
                                onClick={() => setCurrentMonth(Math.max(0, currentMonth - 1))}
                                disabled={currentMonth === 0}
                            >
                                <KeyboardArrowLeftRoundedIcon fontSize="small" />
                            </button>
                            <span className={styles.monthNavLabel}>
                                {schedules[currentMonth]?.label || ""}
                            </span>
                            <button
                                className={styles.monthNavBtn}
                                onClick={() => setCurrentMonth(Math.min(schedules.length - 1, currentMonth + 1))}
                                disabled={currentMonth >= schedules.length - 1 || schedules.length === 0}
                            >
                                <KeyboardArrowRightRoundedIcon fontSize="small" />
                            </button>
                        </div>

                        {/* Study months and calendar */}
                        {(showAllMonths ? schedules : schedules.slice(currentMonth, currentMonth + 1)).map((studyMonth, idx) => (
                            <div key={idx} className={styles.studyMonthBlock}>
                                <div className={styles.studyMonthHeader}>
                                    <span className={styles.studyMonthLabel}>{studyMonth.label}</span>
                                    {studyMonth.isCurrent && (
                                        <span className={styles.currentMonthBadge}>Joriy oy</span>
                                    )}
                                </div>
                                <div className={styles.calendarDaysRow}>
                                    {studyMonth.days.map(item => {
                                        const { isFuture, dateStr } = (() => {
                                            if (!item.month || !item.day) return { isFuture: false, dateStr: `2026-05-${String(item.day).padStart(2, '0')}` };
                                            const monthMap = {
                                                "yan": 0, "jan": 0, "fev": 1, "feb": 1, "mar": 2, "apr": 3, "may": 4, "iyun": 5, "jun": 5,
                                                "iyul": 6, "jul": 6, "avg": 7, "aug": 7, "sen": 8, "sep": 8, "okt": 9, "oct": 9,
                                                "noy": 10, "nov": 10, "dek": 11, "dec": 11
                                            };
                                            let mIndex = -1;
                                            for (const [key, val] of Object.entries(monthMap)) {
                                                if (item.month.toLowerCase().startsWith(key)) {
                                                    mIndex = val; break;
                                                }
                                            }
                                            if (mIndex === -1) return { isFuture: false, dateStr: `2026-05-${String(item.day).padStart(2, '0')}` };

                                            // Calculate actual true index inside the schedules array
                                            const trueIdx = showAllMonths ? idx : currentMonth;
                                            const year = scheduleYears[trueIdx] || new Date().getFullYear();

                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);

                                            const itemDate = new Date(year, mIndex, parseInt(item.day, 10));

                                            const paddedMonth = String(mIndex + 1).padStart(2, '0');
                                            const paddedDay = String(item.day).padStart(2, '0');
                                            return {
                                                isFuture: itemDate > today,
                                                dateStr: `${year}-${paddedMonth}-${paddedDay}`
                                            };
                                        })();

                                        return (
                                            <div
                                                key={item.id}
                                                className={`${styles.calendarChip} ${isFuture ? styles.disabledDate : ""}`}
                                                onClick={() => {
                                                    if (!isFuture) {
                                                        navigate(`/dashboard/groups/${id}/lesson/${dateStr}`);
                                                    }
                                                }}
                                                style={{ cursor: isFuture ? "not-allowed" : "pointer", opacity: isFuture ? 0.5 : 1 }}
                                            >
                                                <span className={styles.chipMonth}>{item.month}</span>
                                                <span className={styles.chipDay}>{item.day}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {schedules.length > 1 && (
                            <div className={styles.showAllBtnWrapper}>
                                <button
                                    className={styles.showAllBtn}
                                    onClick={() => setShowAllMonths(!showAllMonths)}
                                >
                                    {showAllMonths ? 'Yopish' : 'Barchasini ko\'rish'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === "Guruh darsliklari" && (
                <div className={styles.lessonsSection}>
                    <div className={styles.lessonsHeader}>
                        <div className={styles.lessonsTabsAndTitle}>
                            <h2>Guruh darsliklari</h2>
                            <div className={styles.subTabs}>
                                <button
                                    className={`${styles.subTab} ${activeSubTab === "Uyga vazifa" ? styles.activeSubTab : ""}`}
                                    onClick={() => setActiveSubTab("Uyga vazifa")}
                                >
                                    Uyga vazifa
                                </button>
                                <button
                                    className={`${styles.subTab} ${activeSubTab === "Videolar" ? styles.activeSubTab : ""}`}
                                    onClick={() => setActiveSubTab("Videolar")}
                                >
                                    Videolar
                                </button>
                                <button
                                    className={`${styles.subTab} ${activeSubTab === "Imtihonlar" ? styles.activeSubTab : ""}`}
                                    onClick={() => setActiveSubTab("Imtihonlar")}
                                >
                                    Imtihonlar
                                </button>
                                <button
                                    className={`${styles.subTab} ${activeSubTab === "Jurnal" ? styles.activeSubTab : ""}`}
                                    onClick={() => setActiveSubTab("Jurnal")}
                                >
                                    Jurnal
                                </button>
                            </div>
                        </div>

                        <button
                            className={styles.addLessonBtn}
                            onClick={() => {
                                if (activeSubTab === "Videolar") {
                                    setIsVideoModalOpen(true);
                                } else {
                                    navigate(`/dashboard/groups/${id}/homework/create`);
                                }
                            }}
                        >
                            Qo'shish
                        </button>
                    </div>

                    <div className={styles.tableCard}>
                        {activeSubTab === "Uyga vazifa" && (
                            <UygaVazifa />
                        )}

                        {activeSubTab === "Videolar" && (
                            <Videolar refreshTrigger={videoRefresh} />
                        )}

                        {activeSubTab === "Imtihonlar" && (
                            <Imtihonlar />
                        )}
                    </div>
                </div>
            )}

            {activeTab === "Akademik davomati" && (
                <div className={styles.tabContentScrollable}>
                    <div className={styles.scheduleSection}>
                        <div className={styles.monthNavigator}>
                            <button className={styles.navBtn}>
                                <KeyboardArrowLeftRoundedIcon />
                            </button>
                            <span className={styles.monthText}>May 2026</span>
                            <button className={styles.navBtn}>
                                <KeyboardArrowRightRoundedIcon />
                            </button>
                        </div>

                        <div className={styles.calendarList}>
                            {fakeGroupData.calendarDays.map(item => {
                                const { isFuture, dateStr } = (() => {
                                    if (!item.month || !item.day) return { isFuture: false, dateStr: `2026-05-${String(item.day).padStart(2, '0')}` };
                                    const monthMap = {
                                        "yan": 0, "jan": 0, "fev": 1, "feb": 1, "mar": 2, "apr": 3, "may": 4, "iyun": 5, "jun": 5,
                                        "iyul": 6, "jul": 6, "avg": 7, "aug": 7, "sen": 8, "sep": 8, "okt": 9, "oct": 9,
                                        "noy": 10, "nov": 10, "dek": 11, "dec": 11
                                    };
                                    let mIndex = -1;
                                    for (const [key, val] of Object.entries(monthMap)) {
                                        if (item.month.toLowerCase().startsWith(key)) {
                                            mIndex = val; break;
                                        }
                                    }
                                    if (mIndex === -1) return { isFuture: false, dateStr: `2026-05-${String(item.day).padStart(2, '0')}` };
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    let year = today.getFullYear();
                                    if (today.getMonth() === 0 && mIndex === 11) year -= 1;
                                    if (today.getMonth() === 11 && mIndex === 0) year += 1;
                                    const itemDate = new Date(year, mIndex, parseInt(item.day, 10));

                                    const paddedMonth = String(mIndex + 1).padStart(2, '0');
                                    const paddedDay = String(item.day).padStart(2, '0');
                                    return {
                                        isFuture: itemDate > today,
                                        dateStr: `${year}-${paddedMonth}-${paddedDay}`
                                    };
                                })();

                                return (
                                    <div
                                        key={item.id}
                                        className={`${styles.calendarDay} ${item.active && !isFuture ? styles.activeDay : ""} ${isFuture ? styles.disabledDate : ""}`}
                                        onClick={() => {
                                            if (!isFuture) {
                                                navigate(`/dashboard/groups/${id}/lesson/${dateStr}`);
                                            }
                                        }}
                                        style={{ cursor: isFuture ? "not-allowed" : "pointer", opacity: isFuture ? 0.5 : 1 }}
                                    >
                                        <span className={styles.month}>{item.month}</span>
                                        <span className={styles.day}>{item.day}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className={styles.showAllBtnWrapper}>
                            <button className={styles.showAllBtn}>Barchasini ko'rish</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Video Modal */}
            {isVideoModalOpen && (
                <div className={styles.modalOverlay} onClick={handleModalClose}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Qo'shish</h2>
                            <button className={styles.closeBtn} onClick={handleModalClose}>
                                <CloseRoundedIcon fontSize="small" />
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.uploadBox} onClick={() => fileInputRef.current?.click()}>
                                <CloudUploadOutlinedIcon className={styles.uploadIcon} />
                                <p className={styles.uploadTitle}>
                                    Videofaylni yuklash uchun ushbu hudud ustiga bosing yoki faylni shu yerga olib keling
                                </p>
                                <p className={styles.uploadDesc}>
                                    Videofayl: .mp4, .webm, .mpeg, .avi, .mkv, .m4v, .ogm, .mov formatlaridan birida bo'lishi kerak
                                </p>
                            </div>

                            {selectedVideoFile && (
                                <div className={styles.selectedVideoContainer}>
                                    <table className={styles.selectedVideoTable}>
                                        <thead>
                                            <tr>
                                                <th>File name</th>
                                                <th><span>*</span> Dars</th>
                                                <th><span>*</span> Video nomi</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className={styles.fileNameCol}>{selectedVideoFile.name}</td>
                                                <td>
                                                    <select
                                                        className={styles.darsSelect}
                                                        value={selectedLessonId}
                                                        onChange={(e) => setSelectedLessonId(e.target.value)}
                                                    >
                                                        <option value="" disabled>Darsni tanlang</option>
                                                        {groupLessons.map((lesson) => (
                                                            <option key={lesson.id} value={lesson.id}>{lesson.topic || lesson.title || lesson.name}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        className={styles.videoNameInput}
                                                        value={videoFileName}
                                                        onChange={(e) => setVideoFileName(e.target.value)}
                                                    />
                                                </td>
                                                <td className={styles.actionsCol}>
                                                    <button className={styles.deleteIconBtn} onClick={() => setSelectedVideoFile(null)}>
                                                        <DeleteOutlineRoundedIcon fontSize="small" />
                                                    </button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept=".mp4,.webm,.mpeg,.avi,.mkv,.m4v,.ogm,.mov"
                                onChange={handleFileSelect}
                            />
                        </div>

                        <div className={styles.modalFooter}>
                            <button className={styles.cancelBtn} onClick={handleModalClose} disabled={isUploadingVideo}>
                                Bekor qilish
                            </button>
                            {selectedVideoFile && (
                                <button
                                    className={styles.uploadSubmitBtn}
                                    onClick={handleVideoUpload}
                                    disabled={isUploadingVideo}
                                >
                                    {isUploadingVideo ? "Yuklanmoqda..." : "Fayllarni yuklash"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
