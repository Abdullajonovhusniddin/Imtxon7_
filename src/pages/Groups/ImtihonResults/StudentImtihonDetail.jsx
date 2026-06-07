import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import MicNoneOutlinedIcon from '@mui/icons-material/MicNoneOutlined';
import styles from "../HomeworkResults/StudentHomeworkDetail.module.scss";

export default function StudentImtihonDetail() {
  const { id, examId, resultId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tabLabel = searchParams.get("tab") || "Kutayotganlar";

  const [ballValue, setBallValue] = useState(60);
  const [checkComment, setCheckComment] = useState("");
  const [isLate, setIsLate] = useState(false);

  const sliderColor = ballValue >= 60 ? '#22c55e' : '#ef4444';

  const handleSubmit = async () => {
    navigate(`/dashboard/groups/${id}/exam/${examId}/results?tab=${searchParams.get('tab') || 'Kutayotganlar'}`);
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date)) return "-";
    const months = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const mins = String(date.getMinutes()).padStart(2, "0");
    return `${day} ${months[date.getMonth()]}, ${date.getFullYear()} ${hours}:${mins}`;
  };

  const displayStudentName = "Ali Valiyev";
  const displayStatus = "PENDING";
  const dateParam = searchParams.get("date") || "2026-05-16T12:00:00Z";

  return (
    <div className={styles.container}>
      <div className={styles.innerContainer}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <button
            className={styles.breadcrumbLink}
            onClick={() => navigate(`/dashboard/groups/${id}/exam/${examId}/results?tab=${searchParams.get('tab') || 'Kutayotganlar'}`)}
          >
            {tabLabel}
          </button>
          <span className={styles.breadcrumbSep}>›</span>
          <span className={styles.breadcrumbCurrent}>Imtihon</span>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Imtihon vazifasi</h3>
          <div className={styles.cardInner}>
            <span className={styles.izohLabel}>Mavzu:</span>
            <p className={styles.izohText}>1-oy Oraliq Imtihon topshiriqlari</p>
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.studentName}>{displayStudentName}</h2>

          <div className={styles.metaRow}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Vaqti:</span>
              <strong className={styles.metaValue}>{formatDateTime(dateParam)}</strong>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Fayllar soni:</span>
              <strong className={styles.metaValue}>1</strong>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Status:</span>
              <span className={`${styles.statusBadge} ${styles.statusPending}`}>
                Kutayabti
              </span>
            </div>
          </div>

          <div className={styles.filesSection}>
            <p className={styles.filesLabel}>
              Fayl: <strong>1</strong>
            </p>
            <div className={styles.filesGrid}>
                <a
                  href={"#"}
                  onClick={(e) => e.preventDefault()}
                  className={styles.fileLink}
                >
                  📎 imtihon_javoblari.pdf
                </a>
            </div>
          </div>
        </div>

        {/* Grading section */}
        <div className={styles.card}>
          <div className={styles.infoBanner}>
            <InfoOutlinedIcon className={styles.infoIcon} />
            <span>
              60-100 oralig'ida ball qo'yilgan vazifa 'Qabul qilingan', 0-59 oralig'ida ball qo'yilgan vazifa 'Qaytarilgan' hisoblanadi.
            </span>
          </div>

          <h3 className={styles.sectionTitle}>Ball</h3>

          <div className={styles.sliderContainer}>
            <div className={styles.sliderWrapper}>
              <input
                type="range"
                min="0"
                max="100"
                value={ballValue}
                onChange={(e) => {
                  if (!isLate) {
                    setBallValue(Number(e.target.value));
                  }
                }}
                className={styles.rangeSlider}
                style={{ '--val': `${ballValue}%`, '--color': sliderColor, cursor: isLate ? 'not-allowed' : 'pointer', opacity: isLate ? 0.6 : 1 }}
                disabled={isLate}
              />
              <div className={styles.sliderLabel}>O'tish bali</div>
            </div>
            <div className={styles.sliderValueBox} style={{ color: sliderColor, borderColor: sliderColor }}>{ballValue}</div>
          </div>

          <h3 className={styles.sectionTitle}>Fayllar</h3>
          <div className={styles.uploadArea}>
            <CloudUploadOutlinedIcon className={styles.uploadIcon} />
            <p className={styles.uploadMainText}>
              Faylni yuklash uchun ushbu hudud ustiga bosing yoki faylni shu yerga olib keling
            </p>
            <p className={styles.uploadSubText}>
              .jpg, .png, .pdf, .mp4, .docs formatlaridan birida bo'lishi mumkin
            </p>
          </div>

          <div className={styles.commentInputContainer}>
            <textarea
              className={styles.commentInput}
              placeholder="Izohingiz"
              rows="4"
              value={checkComment}
              onChange={(e) => setCheckComment(e.target.value)}
            ></textarea>
            <button className={styles.micButton}>
              <MicNoneOutlinedIcon fontSize="small" />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <button
            className={styles.cancelBtn}
            onClick={() => navigate(`/dashboard/groups/${id}/exam/${examId}/results?tab=${searchParams.get('tab') || 'Kutayotganlar'}`)}
          >
            Bekor qilish
          </button>
          <button className={styles.submitBtn} onClick={handleSubmit}>
            Yuborish
          </button>
        </div>
      </div>
    </div>
  );
}
