import React, { useEffect, useState } from "react";
import styles from "./CourseModal.module.scss";
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { createPortal } from "react-dom";

export default function CourseModal({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    footer
}) {
    const [shouldRender, setShouldRender] = useState(isOpen);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => {
                setShouldRender(false);
                document.body.style.overflow = 'unset';
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!shouldRender) return null;

    return createPortal(
        <div
            className={`${styles.overlay} ${!isOpen ? styles.fadeOut : ""}`}
            onClick={onClose}
        >
            <div
                className={`${styles.modal} ${!isOpen ? styles.slideOut : ""}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.header}>
                    <div className={styles.headerTop}>
                        <h2 className={styles.title}>{title}</h2>
                        <button className={styles.closeBtn} onClick={onClose}>
                            <CloseRoundedIcon />
                        </button>
                    </div>
                    {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                </div>

                <div className={styles.body}>
                    {children}
                </div>

                {footer && (
                    <div className={styles.footer}>
                        <div className={styles.footerButtons}>
                            {footer}
                        </div>
                        <div className={styles.logoWrapper}>
                            <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M50 20L80 35V65L50 80L20 65V35L50 20Z" stroke="#D4AF37" strokeWidth="1" />
                                <path d="M50 30L70 40V60L50 70L30 60V40L50 30Z" stroke="#D4AF37" strokeWidth="1" />
                                <path d="M50 40L60 45V55L50 60L40 55V45L50 40Z" fill="#D4AF37" />
                            </svg>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
