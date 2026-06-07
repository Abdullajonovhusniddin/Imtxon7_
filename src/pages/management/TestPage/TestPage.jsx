import React from "react";
import styles from "./TestPage.module.scss";
import ConstructionRoundedIcon from "@mui/icons-material/ConstructionRounded";
import ScienceRoundedIcon from "@mui/icons-material/ScienceRounded";

export default function TestPage({ title }) {
    return (
        <div className={styles.wrapper}>
            <div className={styles.card}>
                <div className={styles.iconWrapper}>
                    <ScienceRoundedIcon className={styles.mainIcon} />
                    <ConstructionRoundedIcon className={styles.badgeIcon} />
                </div>
                <div className={styles.badge}>Test sahifa</div>
                <h1 className={styles.title}>{title || "Sahifa"}</h1>
                <p className={styles.description}>
                    Bu <strong>test sahifasi</strong> hisoblanadi. Funksionallik hali ishlab
                    chiqilmoqda va yaqin kunda to'liq ishlashga tayyor bo'ladi.
                </p>
                <div className={styles.statusRow}>
                    <span className={styles.dot} />
                    <span className={styles.statusText}>Ishlab chiqilmoqda...</span>
                </div>
            </div>
        </div>
    );
}
