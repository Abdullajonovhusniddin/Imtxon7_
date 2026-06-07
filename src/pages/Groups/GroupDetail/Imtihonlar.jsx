import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./GroupDetail.module.scss";

// Icons
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';

export default function Imtihonlar() {
    const { id } = useParams();
    const navigate = useNavigate();

    // Fake data for Imtihonlar
    const fakeImtihonlarData = [
        {
            id: 1,
            topic: "1-oy Oraliq Imtihon",
            existStudentsIngroup: 15,
            homeworkPending: 3,
            homeworkAccept: 12,
            created_at: "2026-05-15T10:00:00Z",
            homework: [{ id: 991, created_at: "2026-05-15T10:00:00Z" }]
        },
        {
            id: 2,
            topic: "2-oy Yakuniy Imtihon",
            existStudentsIngroup: 15,
            homeworkPending: 0,
            homeworkAccept: 15,
            created_at: "2026-06-15T10:00:00Z",
            homework: [{ id: 992, created_at: "2026-06-15T10:00:00Z" }]
        },
        {
            id: 3,
            topic: "3-oy Oraliq Imtihon",
            existStudentsIngroup: 15,
            homeworkPending: 15,
            homeworkAccept: 0,
            created_at: "2026-07-15T10:00:00Z",
            homework: [{ id: 993, created_at: "2026-07-15T10:00:00Z" }]
        }
    ];

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
        <div style={{ position: 'relative', width: '100%', minHeight: '150px' }}>
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
                    {fakeImtihonlarData.map((lesson, idx) => (
                        <tr
                            key={`${lesson.id}-${idx}`}
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                                const examId = lesson.homework?.[0]?.id;
                                if (examId) navigate(`/dashboard/groups/${id}/exam/${examId}/results`);
                            }}
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
                            <td className={styles.timeCell}>{formatDateTime(lesson.homework?.[0]?.created_at || lesson.created_at)}</td>
                            <td className={styles.timeCell}>{formatDateTime(addDays(lesson.homework?.[0]?.created_at || lesson.created_at, 2))}</td>
                            <td className={styles.timeCell}>{formatDate(lesson.created_at)}</td>
                            <td><MoreVertRoundedIcon className={styles.moreIcon} /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
