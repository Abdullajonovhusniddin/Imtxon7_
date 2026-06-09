import { NavLink, useNavigate, useLocation } from "react-router-dom";
import styles from "./Sidebar.module.scss";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import DiamondOutlinedIcon from '@mui/icons-material/DiamondOutlined';
import CardGiftcardOutlinedIcon from '@mui/icons-material/CardGiftcardOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

const menuItems = [
    { label: "Asosiy", icon: <HomeOutlinedIcon />, path: "/dashboard" },
    { label: "O'qituvchilar", icon: <PersonOutlineRoundedIcon />, path: "/dashboard/teachers" },
    { label: "Guruhlar", icon: <GroupOutlinedIcon />, path: "/dashboard/groups" },
    { label: "Talabalar", icon: <DiamondOutlinedIcon />, path: "/dashboard/students" },
    { label: "Sovg'alar", icon: <CardGiftcardOutlinedIcon />, path: "/dashboard/gifts" },
    { label: "Boshqarish", icon: <SettingsOutlinedIcon />, path: "/management" },
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
                        <RefreshRoundedIcon className={styles.subIcon} fontSize="small" />
                        <p className={styles.subtext}>Obunani yangilash</p>
                    </button>
                )}
            </div>
        </aside>
    );
}