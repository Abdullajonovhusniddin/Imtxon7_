import React, { useEffect, useState } from "react";
import styles from "./ConfirmDialog.module.scss";
import { createPortal } from "react-dom";

export default function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title = "O'chirish",
    message = "Rostdan ham o'chirishni hohlaysizmi?"
}) {
    const [shouldRender, setShouldRender] = useState(isOpen);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
        } else {
            const timer = setTimeout(() => {
                setShouldRender(false);
            }, 200);
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
                className={`${styles.modal} ${!isOpen ? styles.scaleDown : ""}`} 
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.message}>{message}</p>
                <div className={styles.footer}>
                    <button type="button" className={styles.cancelBtn} onClick={onClose}>
                        Bekor qilish
                    </button>
                    <button type="button" className={styles.confirmBtn} onClick={onConfirm}>
                        Ha
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
