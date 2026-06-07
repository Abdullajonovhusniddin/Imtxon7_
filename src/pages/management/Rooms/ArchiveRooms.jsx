import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Rooms.module.scss";
import RestoreOutlinedIcon from '@mui/icons-material/RestoreOutlined';
import KeyboardArrowLeftRoundedIcon from '@mui/icons-material/KeyboardArrowLeftRounded';
import { api } from "../../../api/api";
import ConfirmDialog from "../../../components/UI/ConfirmDialog/ConfirmDialog";
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

export default function ArchiveRooms() {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [restoreConfirm, setRestoreConfirm] = useState({ isOpen: false, roomId: null });

    const fetchArchivedRooms = () => {
        setIsLoading(true);
        api.get('/rooms/arxive').then(
            res => {
                setRooms(res.data.data || []);
                setIsLoading(false);
            }
        ).catch(
            err => {
                console.log(err.message);
                setIsLoading(false);
            }
        );
    };

    useEffect(() => {
        fetchArchivedRooms();
    }, []);

    function actualRestoreRoom(id) {
        setIsLoading(true);
        api.post(`/rooms/${id}/restore`)
            .then(() => {
                setRooms(prev => prev.filter(item => item.id !== id));
            })
            .catch(err => {
                const responseData = err.response?.data;
                let errorMsg = err.message;
                if (responseData?.message) errorMsg = responseData.message;
                alert("Xatolik yuz berdi: " + errorMsg);
            })
            .finally(() => setIsLoading(false));
    }

    return (
        <div className={styles.roomsContainer}>
            <div className={styles.header}>
                <div className={styles.titleWrapper}>
                    <button
                        className={styles.backIconBtn}
                        onClick={() => navigate('/management/rooms')}
                        title="Xonalarga qaytish"
                    >
                        <KeyboardArrowLeftRoundedIcon fontSize="small" />
                    </button>
                    <h2 className={styles.title}>Xonalar (Arxiv)</h2>
                </div>
            </div>

            <div className={styles.grid} style={{ position: 'relative', opacity: isLoading ? 0.6 : 1, transition: 'opacity 0.2s', minHeight: '100px' }}>
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

                {!isLoading && rooms.length === 0 && (
                    <div className={styles.emptyState}>
                        Arxivlangan xonalar yo'q
                    </div>
                )}

                {rooms.map((room) => (
                    <div key={room.id} className={`${styles.card} ${styles.archivedCard}`}>
                        <div className={styles.cardHeader}>
                            <h3 className={styles.roomName}>{room.name}</h3>
                            <div className={styles.actions}>
                                <button
                                    onClick={() => setRestoreConfirm({ isOpen: true, roomId: room.id })}
                                    className={styles.actionBtn}
                                    title="Tiklash"
                                >
                                    <RestoreOutlinedIcon style={{ color: '#16a34a' }} />
                                </button>
                            </div>
                        </div>
                        <p className={styles.capacity}>Sig'imi: {room.capacity}</p>
                    </div>
                ))}
            </div>

            <ConfirmDialog
                isOpen={restoreConfirm.isOpen}
                onClose={() => setRestoreConfirm({ isOpen: false, roomId: null })}
                onConfirm={() => {
                    const id = restoreConfirm.roomId;
                    setRestoreConfirm({ isOpen: false, roomId: null });
                    if (id) actualRestoreRoom(id);
                }}
                title="Xonani tiklash"
                message="Ushbu xonani arxivdan tiklashni xohlaysizmi?"
                confirmText="Tiklash"
                cancelText="Bekor qilish"
            />
        </div>
    );
}
