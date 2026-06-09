import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./CreateHomework.module.scss";
import { api } from "../../../api/api";
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import FormatBoldRoundedIcon from '@mui/icons-material/FormatBoldRounded';
import FormatItalicRoundedIcon from '@mui/icons-material/FormatItalicRounded';
import FormatUnderlinedRoundedIcon from '@mui/icons-material/FormatUnderlinedRounded';
import StrikethroughSRoundedIcon from '@mui/icons-material/StrikethroughSRounded';
import FormatQuoteRoundedIcon from '@mui/icons-material/FormatQuoteRounded';
import CodeRoundedIcon from '@mui/icons-material/CodeRounded';
import FormatListBulletedRoundedIcon from '@mui/icons-material/FormatListBulletedRounded';
import FormatListNumberedRoundedIcon from '@mui/icons-material/FormatListNumberedRounded';
import FormatAlignLeftRoundedIcon from '@mui/icons-material/FormatAlignLeftRounded';
import InsertLinkRoundedIcon from '@mui/icons-material/InsertLinkRounded';
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

export default function CreateHomework() {
    const navigate = useNavigate();
    const { id: groupId } = useParams();

    const [lessons, setLessons] = useState([]);
    const [lessonId, setLessonId] = useState("");
    const [title, setTitle] = useState("");
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const fileInputRef = useRef(null);

    // Fetch lessons for this group to populate Mavzu dropdown
    useEffect(() => {
        const fetchLessons = async () => {
            try {
                const res = await api.get(`/lessons/my/group/${groupId}`);
                const data = res.data.data || res.data || [];
                const arr = Array.isArray(data) ? data : [data];
                setLessons(arr);
            } catch (err) {
                console.error("Error fetching lessons:", err);
            }
        };
        if (groupId) fetchLessons();
    }, [groupId]);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) setFile(selected);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const dropped = e.dataTransfer.files[0];
        if (dropped) setFile(dropped);
    };

    const handleSubmit = async () => {
        if (!lessonId) {
            setError("Mavzuni tanlang!");
            return;
        }
        if (!title.trim()) {
            setError("Izoh kiritilishi shart!");
            return;
        }
        setError("");
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("lesson_id", Number(lessonId));
            formData.append("group_id", Number(groupId));
            formData.append("title", title);
            if (file) {
                formData.append("file", file);
            }

            await api.post("/homework", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            navigate(-1);
        } catch (err) {
            console.error("Error creating homework:", err);
            setError("Xatolik yuz berdi. Qayta urinib ko'ring.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button className={styles.backBtn} onClick={() => navigate(-1)}>
                    <ArrowBackIosNewRoundedIcon fontSize="small" />
                </button>
                <h1>Yangi uyga vazifa yaratish</h1>
            </div>

            <div className={styles.form}>
                {/* Mavzu (lesson) select */}
                <div className={styles.formGroup}>
                    <label><span>*</span> Mavzu</label>
                    <select
                        className={styles.select}
                        value={lessonId}
                        onChange={(e) => setLessonId(e.target.value)}
                    >
                        <option value="">Mavzuni tanlang...</option>
                        {lessons.map((lesson) => (
                            <option key={lesson.id} value={lesson.id}>
                                {lesson.topic || lesson.title || lesson.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Izoh (title) */}
                <div className={styles.formGroup}>
                    <label><span>*</span> Izoh</label>
                    <div className={styles.richEditor}>
                        <div className={styles.toolbar}>
                            <button type="button" className={styles.toolTextBtn}>H1</button>
                            <button type="button" className={styles.toolTextBtn}>H2</button>

                            <div className={styles.divider}></div>
                            <select className={styles.fontSelect} defaultValue="Sans Serif">
                                <option value="Sans Serif">Sans Serif</option>
                            </select>
                            <select className={styles.styleSelect} defaultValue="Normal">
                                <option value="Normal">Normal</option>
                            </select>

                            <div className={styles.divider}></div>

                            <button type="button" className={styles.toolBtn}><FormatBoldRoundedIcon fontSize="small" /></button>
                            <button type="button" className={styles.toolBtn}><FormatItalicRoundedIcon fontSize="small" /></button>
                            <button type="button" className={styles.toolBtn}><FormatUnderlinedRoundedIcon fontSize="small" /></button>
                            <button type="button" className={styles.toolBtn}><StrikethroughSRoundedIcon fontSize="small" /></button>
                            <button type="button" className={styles.toolBtn}><FormatQuoteRoundedIcon fontSize="small" /></button>
                            <button type="button" className={styles.toolBtn}><CodeRoundedIcon fontSize="small" /></button>

                            <div className={styles.divider}></div>

                            <button type="button" className={styles.toolBtn}><FormatListBulletedRoundedIcon fontSize="small" /></button>
                            <button type="button" className={styles.toolBtn}><FormatListNumberedRoundedIcon fontSize="small" /></button>
                            <button type="button" className={styles.toolBtn}><FormatAlignLeftRoundedIcon fontSize="small" /></button>

                            <div className={styles.divider}></div>

                            <button type="button" className={styles.toolBtn}><InsertLinkRoundedIcon fontSize="small" /></button>
                        </div>
                        <textarea
                            className={styles.editorTextarea}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Vazifa haqida batafsil ma'lumot kiriting..."
                        ></textarea>
                    </div>
                </div>

                {/* File upload */}
                <div
                    className={styles.uploadArea}
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                    />
                    {file ? (
                        <div className={styles.filePreview}>
                            <InsertDriveFileRoundedIcon className={styles.fileIcon} />
                            <span className={styles.fileName}>{file.name}</span>
                            <button
                                type="button"
                                className={styles.removeFileBtn}
                                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                            >
                                <CloseRoundedIcon fontSize="small" />
                            </button>
                        </div>
                    ) : (
                        <div className={styles.uploadContent}>
                            <CloudUploadRoundedIcon className={styles.uploadIcon} />
                            <p>Faylni tanlash yoki shu yerga tashlang</p>
                        </div>
                    )}
                </div>

                {error && <p className={styles.errorMsg}>{error}</p>}

                <div className={styles.formActions}>
                    <button type="button" className={styles.cancelBtn} onClick={() => navigate(-1)}>
                        Bekor qilish
                    </button>
                    <button
                        type="button"
                        className={styles.submitBtn}
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? "Yuborilmoqda..." : "E'lon qilish"}
                    </button>
                </div>
            </div>
        </div>
    );
}
