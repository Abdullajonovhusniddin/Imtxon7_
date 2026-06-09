import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import styles from "./GroupDetail.module.scss";

import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

export default function Imtihonlar({ groupId }) {
    const navigate = useNavigate();
    const [exams, setExams] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!groupId) return;
        setIsLoading(true);
        // Assuming exams might come from a specific endpoint or homework with specific criteria
        // Here we mock or fetch if API exists. Let's try fetching from /exams if it exists, or fallback to mock
        api.get(`/homework/${groupId}`)
            .then(res => {
                const data = res.data?.data || res.data || [];
                // If API returns all homeworks, you might filter for exams here. 
                // For now, if empty, we provide mock just to show UI if needed, or just show empty.
                const items = Array.isArray(data) ? data : [data];
                setExams(items.filter(item => item.title?.toLowerCase().includes('imtihon') || item.topic?.toLowerCase().includes('imtihon')));
            })
            .catch(err => console.error("Exams fetch err:", err))
            .finally(() => setIsLoading(false));
    }, [groupId]);

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "";
        const months = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
        return `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]}, ${date.getFullYear()}`;
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "-";
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${formatDate(dateString)} ${hours}:${minutes}`;
    };

    const addDays = (dateString, days) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "-";
        date.setDate(date.getDate() + days);
        return date.toISOString();
    };

    return (
        <div style={{ position: 'relative', width: '100%', minHeight: '150px' }}>
            {isLoading && (
                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.4)', zIndex: 10 }}>
                    <CircularProgress sx={{ color: '#6c35de' }} />
                </Box>
            )}
            <table className={styles.lessonsTable}>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Mavzu</th>
                        <th><PersonOutlineRoundedIcon fontSize="small" style={{ color: '#94a3b8' }} /></th>
                        <th><TimerOutlinedIcon fontSize="small" style={{ color: '#f59e0b' }} /></th>
                        <th><CheckCircleOutlineRoundedIcon fontSize="small" style={{ color: '#22c55e' }} /></th>
                        <th>Berilgan vaqt</th>
                        <th>Tugash vaqti</th>
                        <th>Imtihon sanasi</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {exams.length > 0 ? exams.map((lesson, idx) => (
                        <tr
                            key={`${lesson.id}-${idx}`}
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                                const examId = lesson.homework?.[0]?.id || lesson.id;
                                if (examId) navigate(`/dashboard/groups/${groupId}/exam/${examId}/results`);
                            }}
                        >
                            <td>{idx + 1}</td>
                            <td>
                                {lesson.homeworkPending > 0 ? (
                                    <div className={styles.pillOrange}>{lesson.topic || lesson.title}</div>
                                ) : (
                                    <div className={styles.lessonTitleText}>{lesson.topic || lesson.title}</div>
                                )}
                            </td>
                            <td>{lesson.existStudentsIngroup || 0}</td>
                            <td>{lesson.homeworkPending || 0}</td>
                            <td>{lesson.homeworkAccept || 0}</td>
                            <td className={styles.timeCell}>{formatDateTime(lesson.homework?.[0]?.created_at || lesson.created_at)}</td>
                            <td className={styles.timeCell}>{formatDateTime(addDays(lesson.homework?.[0]?.created_at || lesson.created_at, 2))}</td>
                            <td className={styles.timeCell}>{formatDate(lesson.created_at)}</td>
                            <td><MoreVertRoundedIcon className={styles.moreIcon} /></td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="9" style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>Imtihonlar topilmadi</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
