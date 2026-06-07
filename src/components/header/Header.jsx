import styles from './Header.module.scss';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';

export default function Header({ isDarkMode, toggleDarkMode }) {
    return (
        <header className={styles.header}>
            <div className={styles.left}>
                <button className={styles.iconBtn}>
                    <CalendarTodayRoundedIcon fontSize="small" />
                </button>
                <button className={styles.addBtn}>
                    <AddRoundedIcon fontSize="small" /> 
                    <span>Qo'shish</span> 
                    <ExpandMoreRoundedIcon fontSize="small" />
                </button>
                <div className={styles.searchBox}>
                    <input className={styles.searchIcon} type="text" placeholder="Qidirish..." />
                </div>
            </div>

            <div className={styles.right}>
                <div className={styles.language}>
                    <span>O'zbekcha</span>
                    <ExpandMoreRoundedIcon className={styles.langIcon} fontSize="small" />
                </div>
                <button className={styles.iconBtn}>
                    <NotificationsNoneRoundedIcon />
                </button>
                <button className={styles.iconBtn} onClick={toggleDarkMode} aria-label="Toggle dark mode">
                    {isDarkMode ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
                </button>
                <div className={styles.avatar}>
                    A
                </div>
            </div>
        </header>
    );
}
