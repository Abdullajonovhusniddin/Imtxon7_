import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../../api/api";
import styles from "./GroupDetail.module.scss";

// Icons
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

export default function UygaVazifa() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [homeworkData, setHomeworkData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const homeworkFetchedRef = useRef(false);

    useEffect(() => {
        const fetchHomework = async () => {
            homeworkFetchedRef.current = true;
            setIsLoading(true);
            try {
                const res = await api.get(`/homework/${id}`);
                const data = res.data.data || res.data || [];
                setHomeworkData(Array.isArray(data) ? data : [data]);
            } catch (err) {
                console.error("Error fetching homework:", err);
                homeworkFetchedRef.current = false;
            } finally {
                setIsLoading(false);
            }
        };

        if (id && !homeworkFetchedRef.current) {
            fetchHomework();
        }
    }, [id]);

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

    return (
        <div style={{ position: 'relative', opacity: isLoading ? 0.6 : 1, transition: 'opacity 0.2s', minHeight: '150px', width: '100%' }}>
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
                    <th>Dars sanasi</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {homeworkData.map((lesson, idx) => (
                    <tr
                        key={`${lesson.id}-${idx}`}
                        onClick={() => {
                            const hwId = lesson.homework?.[0]?.id;
                            if (hwId) navigate(`/dashboard/groups/${id}/homework/${hwId}/results`);
                        }}
                        style={{ cursor: lesson.homework?.[0]?.id ? "pointer" : "default" }}
                    >
                        <td>{idx + 1}</td>
                        <td>
                            {lesson.homeworkPending > 0 ? (
                                <div className={styles.pillOrange}>
                                    {lesson.topic}
                                </div>
                            ) : (
                                <div className={styles.lessonTitleText}>
                                    {lesson.topic}
                                </div>
                            )}
                        </td>
                        <td>{lesson.existStudentsIngroup || 0}</td>
                        <td>{lesson.homeworkPending || 0}</td>
                        <td>{lesson.homeworkAccept || 0}</td>
                        {/* Berilgan vaqt = when homework was sent to students */}
                        <td className={styles.timeCell}>{formatDateTime(lesson.homework?.[0]?.created_at || lesson.created_at)}</td>
                        {/* Tugash vaqti = 2 days after homework was sent */}
                        <td className={styles.timeCell}>{formatDateTime(addDays(lesson.homework?.[0]?.created_at || lesson.created_at, 2))}</td>
                        {/* Dars sanasi = when the lesson itself was created */}
                        <td className={styles.timeCell}>{formatDate(lesson.created_at)}</td>
                        <td><MoreVertRoundedIcon className={styles.moreIcon} /></td>
                    </tr>
                ))}
            </tbody>
        </table>
        </div>
    );
}
