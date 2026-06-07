import { NavLink, useNavigate, useLocation } from "react-router-dom";
import styles from "./Sidebar.module.scss";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import DiamondRoundedIcon from '@mui/icons-material/DiamondRounded';
import CardGiftcardRoundedIcon from '@mui/icons-material/CardGiftcardRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';

const menuItems = [
    { label: "Asosiy", icon: <HomeRoundedIcon />, path: "/dashboard" },
    { label: "O'qituvchilar", icon: <PersonRoundedIcon />, path: "/dashboard/teachers" },
    { label: "Guruhlar", icon: <GroupRoundedIcon />, path: "/dashboard/groups" },
    { label: "Talabalar", icon: <DiamondRoundedIcon />, path: "/dashboard/students" },
    { label: "Sovg'alar", icon: <CardGiftcardRoundedIcon />, path: "/dashboard/gifts" },
    { label: "Boshqarish", icon: <SettingsRoundedIcon />, path: "/management" },
];

export default function Sidebar({ isCollapsed, toggleSidebar, isSubSidebarOpen, toggleSubSidebar }) {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    return (
        <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}>
            <div className={styles.logo}>
                <SchoolRoundedIcon className={styles.logoIcon} />
                {!isCollapsed && <span className={styles.logoText}>NajotEdu</span>}
                <button className={styles.toggleBtn} onClick={toggleSidebar}>
                    <ChevronLeftRoundedIcon
                        fontSize="small"
                        style={{ transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}
                    />
                </button>
            </div>

            <nav className={styles.nav}>
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={(e) => {
                            if (item.label === "Boshqarish") {
                                e.preventDefault();
                                toggleSubSidebar();
                            } else {
                                // Close sub-sidebar when navigating to other sections
                                if (isSubSidebarOpen) toggleSubSidebar();
                            }
                        }}
                        className={({ isActive }) => {
                            const isManagement = item.label === "Boshqarish";
                            // Boshqarish is active when on any /management route
                            const shouldBeActive = isManagement ? pathname.startsWith("/management") : isActive;
                            return `${styles.item}${shouldBeActive ? ` ${styles.itemActive}` : ""}`;
                        }}
                        end={item.path === "/dashboard"}
                    >
                        <span className={styles.itemIcon}>{item.icon}</span>
                        {!isCollapsed && <span className={styles.itemLabel}>{item.label}</span>}
                        {isCollapsed && <span className={styles.tooltip}>{item.label}</span>}
                    </NavLink>
                ))}
            </nav>

            <div className={styles.subscription}>
                <div className={styles.subInfo}>
                    <img className={styles.alarm} src="/alarm.png" alt="" />
                    {!isCollapsed && (
                        <div>
                            <p className={styles.subTitle}>Obuna</p>
                            <p className={styles.subStatus}>Obunangiz tugagan</p>
                        </div>
                    )}
                </div>
                {!isCollapsed && (
                    <button className={styles.subBtn}>
                        <i style={{ transform: 'rotate(50deg)' }} className="bi bi-arrow-clockwise"></i><p className={styles.subtext}>Obunani yangilash</p>
                    </button>
                )}
            </div>
        </aside>
    );
}