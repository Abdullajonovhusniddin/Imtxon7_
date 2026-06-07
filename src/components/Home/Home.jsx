import { useState, useEffect } from "react";
import { api } from "../../api/api";
import styles from "./Home.module.scss";

import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import ClassRoundedIcon from '@mui/icons-material/ClassRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import AcUnitRoundedIcon from '@mui/icons-material/AcUnitRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';

const initialStats = [
    { key: 'students', label: "Faol talabalar", value: "52", icon: <PeopleAltRoundedIcon /> },
    { key: 'groups', label: "Guruhlar", value: "23", icon: <ClassRoundedIcon /> },
    { key: 'payments', label: "Joriy oy to'lovlar", value: "0", icon: <AccountBalanceWalletRoundedIcon /> },
    { key: 'debtors', label: "Qarzdorlar", value: "104", icon: <ErrorOutlineRoundedIcon /> },
    { key: 'frozen', label: "Muzlatilganlar", value: "0", icon: <AcUnitRoundedIcon /> },
    { key: 'archive', label: "Arxivdagilar", value: "23", icon: <Inventory2RoundedIcon /> },
];

export default function Home() {
    const [openAccordion, setOpenAccordion] = useState(0);
    const [stats, setStats] = useState(initialStats);

    useEffect(() => {
        document.title = "Najot edu";
        
        api.get('/dashboard/stats')
            .then(res => {
                if (res.data?.data) {
                    // Ma'lumotlarni yangilash, lekin ikonkalarni saqlab qolish
                    setStats(prev => prev.map(stat => {
                        const backendItem = res.data.data.find(item => item.key === stat.key);
                        return backendItem ? { ...stat, value: backendItem.count.toString() } : stat;
                    }));
                }
            })
            .catch(err => {
                console.error("Stats fetch error:", err);
            });
    }, []);

    const toggleAccordion = (index) => {
        setOpenAccordion(openAccordion === index ? null : index);
    };

    return (
        <div className={styles.container}>
            <div className={styles.welcomeSection}>
                <h1 className={styles.welcomeTitle}>Salom, Abdullajonov Husniddin!</h1>
                <p className={styles.welcomeSubtitle}>Najot edu platformasiga xush kelibsiz!</p>
            </div>

            <div className={styles.statsGrid}>
                {stats.map((stat, index) => (
                    <div key={index} className={styles.statCard}>
                        <div className={styles.statIcon}>
                            {stat.icon}
                        </div>
                        <div className={styles.statInfo}>
                            <div className={styles.statLabel}>{stat.label}</div>
                            <div className={styles.statValue}>{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.accordionList}>
                <div className={styles.accordionItem}>
                    <div
                        className={styles.accordionHeader}
                        onClick={() => toggleAccordion(0)}
                    >
                        <span>Joriy oy uchun to'lovlar</span>
                        <KeyboardArrowDownRoundedIcon
                            style={{ transform: openAccordion === 0 ? 'rotate(180deg)' : 'rotate(0)' }}
                        />
                    </div>
                </div>
                <div className={styles.accordionItem}>
                    <div
                        className={styles.accordionHeader}
                        onClick={() => toggleAccordion(1)}
                    >
                        <span>Yillik Foyda</span>
                        <KeyboardArrowDownRoundedIcon
                            style={{ transform: openAccordion === 1 ? 'rotate(180deg)' : 'rotate(0)' }}
                        />
                    </div>
                </div>
                <div className={styles.accordionItem}>
                    <div
                        className={styles.accordionHeader}
                        onClick={() => toggleAccordion(2)}
                    >
                        <span>Dars jadvali</span>
                        <KeyboardArrowDownRoundedIcon
                            style={{ transform: openAccordion === 2 ? 'rotate(180deg)' : 'rotate(0)' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
