import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../../api/api";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import styles from "./HomeworkResults.module.scss";

const STATUS_MAP = {
  "Kutayotganlar": "PENDING",
  "Qaytarilganlar": "REJECTED",
  "Qabul qilinganlar": "ACCEPTED",
  "Bajarilmagan": "CHECKED",
};

export default function HomeworkResults() {
  const { id, homeworkId } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("Kutayotganlar");
  const [resultsData, setResultsData] = useState(null);
  const [tabData, setTabData] = useState({
    "Kutayotganlar": [],
    "Qaytarilganlar": [],
    "Qabul qilinganlar": [],
    "Bajarilmagan": [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const fetchDataForTab = async (tabName) => {
          let res;
          if (tabName === "Bajarilmagan") {
            res = await api.get(`/group/${id}/homework/${homeworkId}/results`);
          } else {
            res = await api.get(`/group/${id}/homework/${homeworkId}/results`, {
              params: { status: STATUS_MAP[tabName] }
            });
          }
          return res;
        };

        const [resKut, resQay, resQab, resBaj] = await Promise.all([
          fetchDataForTab("Kutayotganlar"),
          fetchDataForTab("Qaytarilganlar"),
          fetchDataForTab("Qabul qilinganlar"),
          fetchDataForTab("Bajarilmagan")
        ]);

        let metaData = null;
        const processRes = (res) => {
          const raw = res.data?.data || res.data || {};
          if (!metaData && !Array.isArray(raw) && (raw.topic || raw.homework?.topic)) {
              metaData = raw;
          } else if (!metaData && !Array.isArray(raw)) {
              metaData = raw; // fallback in case topic is not there but it's an object
          }
          
          if (Array.isArray(raw)) return raw;
          const list = raw.students || raw.results || raw.homeworks || raw.list || [];
          return Array.isArray(list) ? list : [];
        };

        const kutList = processRes(resKut);
        const qayList = processRes(resQay);
        const qabList = processRes(resQab);
        const bajList = processRes(resBaj);

        if (metaData) setResultsData(metaData);
        setTabData({
          "Kutayotganlar": kutList,
          "Qaytarilganlar": qayList,
          "Qabul qilinganlar": qabList,
          "Bajarilmagan": bajList
        });
      } catch (err) {
        console.error("Error fetching all tab data:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id && homeworkId) {
      fetchAllData();
    }
  }, [id, homeworkId]);

  const [homeworkDetails, setHomeworkDetails] = useState(null);

  useEffect(() => {
    const fetchHomeworkDetails = async () => {
      try {
        const res = await api.get(`/homework/${id}`);
        const data = res.data?.data || res.data || [];
        const hwList = Array.isArray(data) ? data : [data];
        
        // Match by homework[0].id (homework id) — this is what's passed in the URL
        const hw = hwList.find(lesson =>
          String(lesson.homework?.[0]?.id) === String(homeworkId)
        );
        
        if (hw) {
          // Attach the homework sent date for deadline calculation
          hw._homeworkSentAt = hw.homework?.[0]?.created_at || hw.created_at;
          setHomeworkDetails(hw);
        }
      } catch (err) {
        console.error("Error fetching homework details:", err);
      }
    };
    if (id && homeworkId) {
      fetchHomeworkDetails();
    }
  }, [id, homeworkId]);

  const addDays = (dateString, days) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    date.setDate(date.getDate() + days);
    return date.toISOString();
  };

  const students = tabData[activeTab] || [];

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

  const counts = resultsData?.counts || resultsData?.statusCounts || {};

  const tabs = [
    { id: "Kutayotganlar",     label: "Kutayotganlar",     count: tabData["Kutayotganlar"]?.length || 0, colorClass: styles.badgeOrange },
    { id: "Qaytarilganlar",   label: "Qaytarilganlar",    count: tabData["Qaytarilganlar"]?.length || 0, colorClass: styles.badgeRed    },
    { id: "Qabul qilinganlar",label: "Qabul qilinganlar", count: tabData["Qabul qilinganlar"]?.length || 0, colorClass: styles.badgeGreen  },
    { id: "Bajarilmagan",     label: "Bajarilmagan",      count: tabData["Bajarilmagan"]?.length || 0, colorClass: styles.badgeGreen  },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(`/dashboard/groups/${id}?tab=1`)} title="Orqaga qaytish">
          <ChevronLeftRoundedIcon fontSize="small" />
        </button>
        <h1>{homeworkDetails?.topic || resultsData?.topic || resultsData?.homework?.topic || "Uyga vazifa"}</h1>
      </div>

      <div className={styles.infoCard}>
        <div className={styles.infoGroup}>
          <div className={styles.infoItem}>
            <span className={styles.label}>Mavzu</span>
            <span className={styles.value}>
              {homeworkDetails?.topic || resultsData?.topic || resultsData?.homework?.topic || "-"}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Tugash vaqti</span>
            <span className={styles.value}>
              {homeworkDetails?._homeworkSentAt
                ? formatDateTime(addDays(homeworkDetails._homeworkSentAt, 2))
                : formatDateTime(resultsData?.deadline || resultsData?.homework?.deadline || resultsData?.end_date)}
            </span>
          </div>
        </div>
        <div className={styles.largeNumber}>
          {resultsData?.total ?? resultsData?.homework?.total ?? ""}
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
              <th style={{ textAlign: "right" }}>Uyga vazifa jo'natilgan vaqt</th>
            </tr>
          </thead>
          <tbody>
            {!loading && students.map((student, idx) => (
              <tr 
                key={student.id || idx}
                onClick={() => {
                  if (activeTab !== "Kutayotganlar") return;
                  const dateToPass = student.submitted_at || student.created_at || student.sent_at || "";
                  navigate(`/dashboard/groups/${id}/homework/${homeworkId}/results/${student.id || student.student?.id || idx}?tab=${activeTab}&date=${dateToPass}`);
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
        {loading && <div className={styles.emptyState}>Yuklanmoqda...</div>}
        {!loading && students.length === 0 && (
          <div className={styles.emptyState}>Ma'lumot mavjud emas</div>
        )}
      </div>
    </div>
  );
}
