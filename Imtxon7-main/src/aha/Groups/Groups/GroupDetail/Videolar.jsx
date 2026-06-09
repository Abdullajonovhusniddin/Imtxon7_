import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../../api/api";
import styles from "./GroupDetail.module.scss";

// Icons
import PlayCircleOutlineRoundedIcon from '@mui/icons-material/PlayCircleOutlineRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

export default function Videolar({ refreshTrigger }) {
    const { id } = useParams();
    const [videosData, setVideosData] = useState([]);
    const [selectedPlayVideo, setSelectedPlayVideo] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const videosFetchedRef = useRef(false);

    const fetchVideos = async () => {
        videosFetchedRef.current = true;
        setIsLoading(true);
        try {
            const res = await api.get(`/files/${id}`);
            const data = res.data.data || res.data || [];
            setVideosData(Array.isArray(data) ? data : [data]);
        } catch (err) {
            console.error("Error fetching videos:", err);
            videosFetchedRef.current = false;
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchVideos();
        }
    }, [id, refreshTrigger]);

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "";
        const months = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
        const day = String(date.getDate()).padStart(2, '0');
        return `${day} ${months[date.getMonth()]}, ${date.getFullYear()}`;
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

    return (
        <>
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
                        <th>Video nomi</th>
                        <th>Dars nomi</th>
                        <th>Status</th>
                        <th>Dars sanasi</th>
                        <th>Hajmi</th>
                        <th>Qo'shilgan vaqti</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {videosData.length > 0 ? videosData.map((video, idx) => (
                        <tr key={video.id || idx}>
                            <td>{idx + 1}</td>
                            <td>
                                <div
                                    className={styles.videoNameCell}
                                    onClick={() => setSelectedPlayVideo(video)}
                                >
                                    <PlayCircleOutlineRoundedIcon className={styles.playIcon} fontSize="small" />
                                    {video.originalname || video.title || video.videoName || video.name || "Video"}
                                </div>
                            </td>
                            <td className={styles.lessonNameCell}>{video.lesson?.topic || video.lessonName || "-"}</td>
                            <td>
                                <div className={styles.statusPill}>{video.status || "Tayyor"}</div>
                            </td>
                            <td className={styles.timeCell}>{video.lesson?.created_at ? formatDate(video.lesson.created_at) : video.lessonDate || "-"}</td>
                            <td className={styles.timeCell}>{video.size_mb ? parseFloat(video.size_mb).toFixed(2) + ' MB' : formatFileSize(video.size || video.file_size)}</td>
                            <td className={styles.timeCell}>{formatDate(video.created_at || video.addedTime)}</td>
                            <td><MoreVertRoundedIcon className={styles.moreIcon} /></td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="8" style={{ textAlign: "center", padding: "20px" }}>Videolar topilmadi</td>
                        </tr>
                    )}
                </tbody>
            </table>
            </div>

            {/* Video Player Modal */}
            {selectedPlayVideo && (
                <div className={styles.modalOverlay} onClick={() => setSelectedPlayVideo(null)}>
                    <div className={styles.videoPlayerModalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.videoPlayerHeader}>
                            <h2>{selectedPlayVideo.originalname || selectedPlayVideo.title || "Video"}</h2>
                            <button className={styles.closeBtn} onClick={() => setSelectedPlayVideo(null)}>
                                <CloseRoundedIcon fontSize="small" />
                            </button>
                        </div>
                        <div className={styles.videoPlayerContainer}>
                            <video
                                controls
                                autoPlay
                                src={`https://najot-edu.softwareengineer.uz/files/files/${selectedPlayVideo.video_url}`}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
