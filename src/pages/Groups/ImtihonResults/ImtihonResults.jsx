import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import styles from "../HomeworkResults/HomeworkResults.module.scss";

const fakeImtihonlarData = [
    {
        id: 991,
        topic: "1-oy Oraliq Imtihon",
        deadline: "2026-05-17T10:00:00Z",
        total: 15,
        Kutayotganlar: [
            { id: 1, full_name: "Ali Valiyev", submitted_at: "2026-05-16T12:00:00Z" },
            { id: 2, full_name: "Sardor Karimov", submitted_at: "2026-05-16T14:30:00Z" }
        ],
        Qaytarilganlar: [
            { id: 3, full_name: "Malika Asatova", submitted_at: "2026-05-16T09:10:00Z" }
        ],
        "Qabul qilinganlar": [
            { id: 4, full_name: "Umid Qodirov", submitted_at: "2026-05-15T18:20:00Z" }
        ],
        Bajarilmagan: [
            { id: 5, full_name: "Doston Murodov", submitted_at: null }
        ]
    },
    {
        id: 992,
        topic: "2-oy Yakuniy Imtihon",
        deadline: "2026-06-17T10:00:00Z",
        total: 15,
        Kutayotganlar: [],
        Qaytarilganlar: [],
        "Qabul qilinganlar": [
            { id: 1, full_name: "Ali Valiyev", submitted_at: "2026-06-16T12:00:00Z" },
            { id: 2, full_name: "Sardor Karimov", submitted_at: "2026-06-16T14:30:00Z" }
        ],
        Bajarilmagan: []
    },
    {
        id: 993,
        topic: "3-oy Oraliq Imtihon",
        deadline: "2026-07-17T10:00:00Z",
        total: 15,
        Kutayotganlar: [
            { id: 1, full_name: "Ali Valiyev", submitted_at: "2026-07-16T12:00:00Z" },
            { id: 2, full_name: "Sardor Karimov", submitted_at: "2026-07-16T14:30:00Z" }
        ],
        Qaytarilganlar: [],
        "Qabul qilinganlar": [],
        Bajarilmagan: []
    }
];

export default function ImtihonResults() {
  const { id, examId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Kutayotganlar");

  const resultsData = fakeImtihonlarData.find(hw => String(hw.id) === String(examId)) || fakeImtihonlarData[0];
  const students = resultsData[activeTab] || [];

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

  const tabs = [
    { id: "Kutayotganlar",     label: "Kutayotganlar",     count: resultsData["Kutayotganlar"]?.length || 0, colorClass: styles.badgeOrange },
    { id: "Qaytarilganlar",   label: "Qaytarilganlar",    count: resultsData["Qaytarilganlar"]?.length || 0, colorClass: styles.badgeRed    },
    { id: "Qabul qilinganlar",label: "Qabul qilinganlar", count: resultsData["Qabul qilinganlar"]?.length || 0, colorClass: styles.badgeGreen  },
    { id: "Bajarilmagan",     label: "Bajarilmagan",      count: resultsData["Bajarilmagan"]?.length || 0, colorClass: styles.badgeGreen  },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(`/dashboard/groups/${id}?tab=1&subtab=Imtihonlar`)} title="Orqaga qaytish">
          <ChevronLeftRoundedIcon fontSize="small" />
        </button>
        <h1>{resultsData.topic}</h1>
      </div>

      <div className={styles.infoCard}>
        <div className={styles.infoGroup}>
          <div className={styles.infoItem}>
            <span className={styles.label}>Mavzu</span>
            <span className={styles.value}>
              {resultsData.topic}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Tugash vaqti</span>
            <span className={styles.value}>
              {formatDateTime(resultsData.deadline)}
            </span>
          </div>
        </div>
        <div className={styles.largeNumber}>
          {resultsData.total}
        </div>
      </div>

      <div className={styles.tabsContainer}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            <span className={`${styles.badge} ${tab.colorClass}`}>{tab.count}</span>
          </button>
        ))}
      </div>

      <div className={styles.tableSection}>
        <table>
          <thead>
            <tr>
              <th>O'quvchi ismi</th>
              <th style={{ textAlign: "right" }}>Imtihon jo'natilgan vaqt</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, idx) => (
              <tr 
                key={student.id || idx}
                onClick={() => {
                  if (activeTab !== "Kutayotganlar") return;
                  const dateToPass = student.submitted_at || student.created_at || student.sent_at || "";
                  navigate(`/dashboard/groups/${id}/exam/${examId}/results/${student.id || student.student?.id || idx}?tab=${activeTab}&date=${dateToPass}`);
                }}
                className={activeTab !== "Kutayotganlar" ? "" : styles.clickableRow}
                style={activeTab !== "Kutayotganlar" ? { cursor: "default" } : {}}
              >
                <td>{student.full_name || student.name || student.student?.full_name || "-"}</td>
                <td style={{ textAlign: "right" }}>
                  {formatDateTime(student.submitted_at || student.created_at || student.sent_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {students.length === 0 && (
          <div className={styles.emptyState}>Ma'lumot mavjud emas</div>
        )}
      </div>
    </div>
  );
}
