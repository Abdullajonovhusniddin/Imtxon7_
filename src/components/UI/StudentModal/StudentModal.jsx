import { useEffect, useState } from "react";
import styles from "./StudentModal.module.scss";
import { createPortal } from "react-dom";
import AddStudentModal from "./AddStudentModal/AddStudentModal";

export default function StudentModal({
    isOpen,
    onClose,
    onSave,
    studentToEdit
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
            <AddStudentModal 
                isOpen={isOpen}
                onClose={onClose} 
                onSave={onSave}
                studentToEdit={studentToEdit}
            />
        </div>,
        document.body
    );
}
