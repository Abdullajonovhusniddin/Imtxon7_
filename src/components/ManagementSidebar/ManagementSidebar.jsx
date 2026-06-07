import { useNavigate, useLocation } from "react-router-dom";
import styles from "./ManagementSidebar.module.scss";
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import MonetizationOnRoundedIcon from '@mui/icons-material/MonetizationOnRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';

const subMenuItems = [
    { label: "Kurslar", slug: "courses", icon: <MenuBookRoundedIcon /> },
    { label: "Xonalar", slug: "rooms", icon: <MeetingRoomRoundedIcon /> },
    { label: "Xodimlar", slug: "staff", icon: <BadgeRoundedIcon /> },
    { label: "Coin", slug: "coin", icon: <MonetizationOnRoundedIcon /> },
    { label: "Xabar Yuborish", slug: "send-message", icon: <SendRoundedIcon /> },
];

export default function ManagementSidebar({ isOpen, isCollapsed, onClose }) {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    // Determine current active sub-page slug
    const pathParts = pathname.split("/").filter(Boolean);
    const managementIndex = pathParts.indexOf("management");
    const currentSlug = managementIndex >= 0 ? pathParts[managementIndex + 1] : "courses";

    return (
        <div className={`${styles.subSidebar} ${isOpen ? styles.open : ""} ${isCollapsed ? styles.collapsed : ""}`}>
            <div className={styles.header}>
                <h3 className={styles.title}>Menu</h3>
            </div>
            <div className={styles.content}>
                {subMenuItems.map((item, index) => {
                    const isActive = currentSlug === item.slug;
                    return (
                        <div
                            key={index}
                            className={`${styles.item} ${isActive ? styles.itemActive : ""}`}
                            onClick={() => {
                                onClose();
                                navigate(`/management/${item.slug}`);
                            }}
                        >
                            <span className={styles.icon}>{item.icon}</span>
                            <span className={styles.label}>{item.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
