import { useEffect, useState } from "react";
import styles from "./RoomModal.module.scss";
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { createPortal } from "react-dom";

export default function RoomModal({
    isOpen,
    onClose,
    title,
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
                    <h2 className={styles.title}>{title}</h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <CloseRoundedIcon />
                    </button>
                </div>

                <div className={styles.body}>
                    {children}
                </div>

                {footer && (
                    <div className={styles.footer}>
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
