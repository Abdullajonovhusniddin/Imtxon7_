import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../../api/api";
import styles from "./LessonDetail.module.scss";
import KeyboardArrowLeftRoundedIcon from '@mui/icons-material/KeyboardArrowLeftRounded';
import KeyboardArrowRightRoundedIcon from '@mui/icons-material/KeyboardArrowRightRounded';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import Switch from '@mui/material/Switch';

export default function LessonDetail() {
  const { id, date } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("Teacher");
  const [topicType, setTopicType] = useState("Boshqa");
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");

  const [students, setStudents] = useState([]);
  const [curriculumLessons, setCurriculumLessons] = useState([]);

  const [schedules, setSchedules] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(0);
  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    if (date) {
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      const currentLessonDate = new Date(date);
      currentLessonDate.setHours(0, 0, 0, 0);
      setIsPast(currentLessonDate < todayDate);
    }
  }, [date]);

  useEffect(() => {
    const fetchSchedules = async () => {
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
      }
    };
    if (id) {
      fetchSchedules();
    }
  }, [id]);

  useEffect(() => {
    const fetchGroupOne = async () => {
      try {
        const res = await api.get(`/groups/one/${id}`);
        setTeachers(res.data?.data?.teachers || []);
      } catch (err) {
        console.error("Error fetching group details:", err);
      }
    };
    if (id) {
      fetchGroupOne();
    }
  }, [id]);

  useEffect(() => {
    if (schedules.length === 0 || !date) return;
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return;
    const m = dateObj.getMonth();
    const d = dateObj.getDate();

    let foundIndex = schedules.findIndex(sm => {
      return sm.days.some(item => {
        const monthMap = {
          "yan": 0, "jan": 0, "fev": 1, "feb": 1, "mar": 2, "apr": 3, "may": 4, "iyun": 5, "jun": 5,
          "iyul": 6, "jul": 6, "avg": 7, "aug": 7, "sen": 8, "sep": 8, "okt": 9, "oct": 9,
          "noy": 10, "nov": 10, "dek": 11, "dec": 11
        };
        let mIndex = -1;
        for (const [key, val] of Object.entries(monthMap)) {
          if (item.month && item.month.toLowerCase().startsWith(key)) {
            mIndex = val; break;
          }
        }
        return mIndex === m && parseInt(item.day, 10) === d;
      });
    });

    if (foundIndex !== -1) {
      setCurrentMonth(foundIndex);
    } else {
      foundIndex = schedules.findIndex(sm => {
        return sm.days.some(item => {
          const monthMap = {
            "yan": 0, "jan": 0, "fev": 1, "feb": 1, "mar": 2, "apr": 3, "may": 4, "iyun": 5, "jun": 5,
            "iyul": 6, "jul": 6, "avg": 7, "aug": 7, "sen": 8, "sep": 8, "okt": 9, "oct": 9,
            "noy": 10, "nov": 10, "dek": 11, "dec": 11
          };
          let mIndex = -1;
          for (const [key, val] of Object.entries(monthMap)) {
            if (item.month && item.month.toLowerCase().startsWith(key)) {
              mIndex = val; break;
            }
          }
          return mIndex === m;
        });
      });
      if (foundIndex !== -1) {
        setCurrentMonth(foundIndex);
      }
    }
  }, [schedules, date]);

  useEffect(() => {
    const fetchCurriculumLessons = async () => {
      try {
        const res = await api.get(`/lessons/my/group/${id}`);
        setCurriculumLessons(res.data?.data || []);
      } catch (err) {
        console.error("Error fetching curriculum lessons:", err);
      }
    };
    if (id && topicType === "O'quv reja bo'yicha" && curriculumLessons.length === 0) {
      fetchCurriculumLessons();
    }
  }, [id, topicType, curriculumLessons.length]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await api.get(`/groups/${id}/lesson?date=${date}`);
        const mainData = res.data?.data || res.data || {};
        const lessonData = mainData.lesson || null;
        const attendanceData = mainData.attendance || mainData.attendances || [];

        setTopic(lessonData?.topic || mainData.topic || "");
        setDescription(lessonData?.description || mainData.description || "");

        setStudents(
          attendanceData.map(s => ({
            id: s.student_id,
            name: s.full_name || "Noma'lum",
            photo: s.photo,
            present: String(s.isPresent).toLowerCase() === "true" || s.isPresent === 1
          }))
        );
      } catch (err) {
        console.error("Error fetching students:", err);
      }
    };

    if (id && date) {
      fetchStudents();
    }
  }, [id, date]);

  const handleToggleStudent = (studentId) => {
    setStudents(students.map(s => s.id === studentId ? { ...s, present: !s.present } : s));
  };

  const handleSave = async () => {
    if (!topic.trim()) {
      alert("Iltimos, dars mavzusini kiriting.");
      return;
    }

    try {
      const payload = {
        group_id: Number(id),
        topic: topic,
        lesson_date: date,
        description: description,
        attendances: students
          .filter(student => student.present)
          .map(student => ({
            student_id: student.id,
            isPresent: student.present
          }))
      };

      await api.post(`/groups/${id}/lesson`, payload);
      alert("Ma'lumotlar saqlandi!");
    } catch (error) {
      console.error("Saqlashda xatolik yuz berdi:", error);
      alert("Saqlashda xatolik yuz berdi.");
    }
  };

  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : "?";
  };

  const currentDayInfo = (() => {
    if (!date || schedules.length === 0) return null;
    const [y, m, d] = date.split('-');
    const mIndex = parseInt(m, 10) - 1;
    const dayInt = parseInt(d, 10);
    
    for (const sm of schedules) {
      for (const item of sm.days) {
        const monthMap = {
          "yan": 0, "jan": 0, "fev": 1, "feb": 1, "mar": 2, "apr": 3, "may": 4, "iyun": 5, "jun": 5,
          "iyul": 6, "jul": 6, "avg": 7, "aug": 7, "sen": 8, "sep": 8, "okt": 9, "oct": 9,
          "noy": 10, "nov": 10, "dek": 11, "dec": 11
        };
        let itemMIndex = -1;
        for (const [key, val] of Object.entries(monthMap)) {
          if (item.month && item.month.toLowerCase().startsWith(key)) {
            itemMIndex = val; break;
          }
        }
        if (itemMIndex === mIndex && parseInt(item.day, 10) === dayInt) {
          return item;
        }
      }
    }
    return null;
  })();

  const isCompleted = currentDayInfo?.isCompleted || false;

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={() => navigate(`/dashboard/groups/${id}`)}>
          <ArrowBackIosNewRoundedIcon fontSize="small" />
        </button>
        <h2>Dars tafsilotlari</h2>
      </div>

      <div className={styles.dateNavigatorContainer}>
        <div className={styles.monthNavRow}>
          <button
            className={styles.navArrow}
            onClick={() => setCurrentMonth(Math.max(0, currentMonth - 1))}
            disabled={currentMonth === 0}
          >
            <KeyboardArrowLeftRoundedIcon fontSize="small" />
          </button>
          <span className={styles.monthLabel}>
            {schedules[currentMonth]?.label || "1-o'quv oyi"}
          </span>
          <button
            className={styles.navArrow}
            onClick={() => setCurrentMonth(Math.min(schedules.length - 1, currentMonth + 1))}
            disabled={schedules.length === 0 || currentMonth === schedules.length - 1}
          >
            <KeyboardArrowRightRoundedIcon fontSize="small" />
          </button>
        </div>

        <div className={styles.dateChips}>
          {schedules[currentMonth]?.days.map((d, index) => {
            const { isFuture, dateStr } = (() => {
              if (!d.month || !d.day) return { isFuture: false, dateStr: `2026-05-${String(d.day).padStart(2, '0')}` };
              const monthMap = {
                "yan": 0, "jan": 0, "fev": 1, "feb": 1, "mar": 2, "apr": 3, "may": 4, "iyun": 5, "jun": 5,
                "iyul": 6, "jul": 6, "avg": 7, "aug": 7, "sen": 8, "sep": 8, "okt": 9, "oct": 9,
                "noy": 10, "nov": 10, "dek": 11, "dec": 11
              };
              let mIndex = -1;
              for (const [key, val] of Object.entries(monthMap)) {
                if (d.month.toLowerCase().startsWith(key)) {
                  mIndex = val; break;
                }
              }
              if (mIndex === -1) return { isFuture: false, dateStr: `2026-05-${String(d.day).padStart(2, '0')}` };
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              let year = today.getFullYear();
              if (today.getMonth() === 0 && mIndex === 11) year -= 1;
              if (today.getMonth() === 11 && mIndex === 0) year += 1;
              const itemDate = new Date(year, mIndex, parseInt(d.day, 10));

              const paddedMonth = String(mIndex + 1).padStart(2, '0');
              const paddedDay = String(d.day).padStart(2, '0');
              return {
                isFuture: itemDate > today,
                dateStr: `${year}-${paddedMonth}-${paddedDay}`
              };
            })();

            const isActive = date === dateStr;

            let chipClass = styles.dateChip;
            if (isActive) {
              chipClass += ` ${styles.active}`;
            } else if (!isFuture) {
              chipClass += ` ${styles.past}`;
            } else {
              chipClass += ` ${styles.future} ${styles.disabled}`;
            }

            return (
              <div
                key={index}
                className={chipClass}
                onClick={() => {
                  if (!isFuture) {
                    navigate(`/dashboard/groups/${id}/lesson/${dateStr}`);
                  }
                }}
                style={{ cursor: isFuture ? "not-allowed" : "pointer", opacity: isFuture ? 0.5 : 1 }}
              >
                <span className={styles.chipMonth}>{d.month}</span>
                <span className={styles.chipDay}>{d.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tab} ${activeTab === "Assistant" ? styles.active : ""}`}
          onClick={() => setActiveTab("Assistant")}
        >
          Assistant
        </button>
        <button
          className={`${styles.tab} ${activeTab === "Teacher" ? styles.active : ""}`}
          onClick={() => setActiveTab("Teacher")}
        >
          Teacher
        </button>
      </div>

      <div className={styles.section}>
        <h3>Ma'lumot</h3>
        <div className={styles.infoContent}>
          {activeTab === "Teacher" ? (
            teachers.length > 0 ? (
              <div className={styles.mentorProfile}>
                <div className={styles.avatar}>{getInitials(teachers[0].full_name || teachers[0].name)}</div>
                <div className={styles.details}>
                  <span className={styles.name}>{teachers[0].full_name || teachers[0].name}</span>
                  <span className={styles.role}>Teacher</span>
                </div>
              </div>
            ) : (
              <div className={styles.mentorProfile}>
                <div className={styles.details}>
                  <span className={styles.name}>Topilmadi</span>
                  <span className={styles.role}>Teacher</span>
                </div>
              </div>
            )
          ) : (
            teachers.slice(1).length > 0 ? (
              <div className={styles.assistantsList}>
                {teachers.slice(1).map((assistant, idx) => (
                  <div key={assistant.id || idx} className={styles.mentorProfile} style={{ flexShrink: 0 }}>
                    <div className={styles.avatar}>{getInitials(assistant.full_name || assistant.name)}</div>
                    <div className={styles.details}>
                      <span className={styles.name}>{assistant.full_name || assistant.name}</span>
                      <span className={styles.role}>Assistant</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.mentorProfile}>
                <div className={styles.details}>
                  <span className={styles.name}>Topilmadi</span>
                  <span className={styles.role}>Assistant</span>
                </div>
              </div>
            )
          )}
          
          <div className={styles.infoItem}>
            <span className={styles.label}>Dars kuni</span>
            <span className={styles.value}>{date ? date.replace(/-/g, ' M') : "2026 M05 21"}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Holat</span>
            <span className={styles.status}>{isCompleted ? "Dars tugagan" : "Dars o'tilmagan"}</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3>Yo'qlama va mavzu kiritish</h3>

        <div className={styles.formGroup}>
          <div className={styles.radioGroup}>
            <label>
              <input
                type="radio"
                name="topicType"
                value="O'quv reja bo'yicha"
                checked={topicType === "O'quv reja bo'yicha"}
                onChange={(e) => setTopicType(e.target.value)}
                disabled={isPast}
              />
              O'quv reja bo'yicha
            </label>
            <label>
              <input
                type="radio"
                name="topicType"
                value="Boshqa"
                checked={topicType === "Boshqa"}
                onChange={(e) => setTopicType(e.target.value)}
                style={{ accentColor: "#10b981" }}
                disabled={isPast}
              />
              <span style={{ color: topicType === "Boshqa" ? "#10b981" : "inherit", fontWeight: topicType === "Boshqa" ? 500 : 400 }}>Boshqa</span>
            </label>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.inputLabel}>
            <span className={styles.required}>*</span> Mavzu
          </label>
          {topicType === "O'quv reja bo'yicha" ? (
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              style={{ width: "100%", padding: "12px 16px", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "14px", fontFamily: "inherit", outline: "none", backgroundColor: isPast ? "#f1f5f9" : "white" }}
              disabled={isPast}
            >
              <option value="" disabled>Mavzuni tanlang...</option>
              {curriculumLessons.map((lesson) => (
                <option key={lesson.id} value={lesson.topic}>
                  {lesson.topic}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              placeholder="Mavzuni kiriting..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isPast}
            />
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.inputLabel}>
            Tavsif (ixtiyoriy)
          </label>
          <textarea
            placeholder="Dars haqida qo'shimcha ma'lumot..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isPast}
          />
        </div>

        <table className={styles.studentsTable}>
          <thead>
            <tr>
              <th width="5%">#</th>
              <th width="80%">O'quvchi ismi</th>
              <th width="15%" className={styles.attendanceCell}>Keldi</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, idx) => (
              <tr key={student.id}>
                <td>{idx + 1}</td>
                <td>
                  <div className={styles.studentNameCell}>
                    <div className={styles.avatar}>{getInitials(student.name)}</div>
                    {student.name}
                  </div>
                </td>
                <td className={styles.attendanceCell}>
                  <Switch
                    checked={student.present}
                    onChange={() => handleToggleStudent(student.id)}
                    disabled={isPast}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: '#10b981',
                        '&:hover': {
                          backgroundColor: 'rgba(16, 185, 129, 0.08)',
                        },
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: '#10b981',
                      },
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.saveButtonWrapper}>
          <button
            onClick={handleSave}
            disabled={isPast}
            style={isPast ? { backgroundColor: '#cbd5e1', cursor: 'not-allowed', color: '#64748b' } : {}}
          >
            Saqlash
          </button>
        </div>
      </div>
    </div>
  );
}
