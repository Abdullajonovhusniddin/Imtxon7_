import { useNavigate } from "react-router-dom";
import styles from "./NotFound.module.css";

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.errorCode}>404</div>
                <div className={styles.divider}></div>
                <div className={styles.textGroup}>
                    <h1 className={styles.title}>Page Not Found</h1>
                    <p className={styles.description}>
                        Oops! The page you're looking for doesn't exist or has been moved.
                    </p>
                    <button
                        className={styles.button}
                        onClick={() => navigate("/dashboard")}
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
