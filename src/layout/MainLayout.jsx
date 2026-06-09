import { useState, Suspense, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
import Header from "../components/header/Header";
import ManagementSidebar from "../components/ManagementSidebar/ManagementSidebar";
import Loader from "../components/UI/Loader/Loader";
import styles from "./MainLayout.module.scss";

export default function MainLayout() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isSubSidebarVisible, setIsSubSidebarVisible] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== "undefined") {
            const stored = window.localStorage.getItem("lms-theme");
            if (stored) return stored === "dark";
            return window.matchMedia("(prefers-color-scheme: dark)").matches;
        }

        return false;
    });

    useEffect(() => {
        document.title = "Najot edu";
        document.documentElement.classList.toggle("dark", isDarkMode);
        window.localStorage.setItem("lms-theme", isDarkMode ? "dark" : "light");
    }, [isDarkMode]);

    const toggleSidebar = () => {
        setIsCollapsed(!isCollapsed);
    };

    const toggleSubSidebar = () => {
        setIsSubSidebarVisible(!isSubSidebarVisible);
    };

    const closeSubSidebar = () => {
        setIsSubSidebarVisible(false);
    };

    const toggleDarkMode = () => {
        setIsDarkMode((prev) => !prev);
    };

    return (
        <div className={styles.layout}>
            <Sidebar
                isCollapsed={isCollapsed}
                toggleSidebar={toggleSidebar}
                isSubSidebarOpen={isSubSidebarVisible}
                toggleSubSidebar={toggleSubSidebar}
            />
            <ManagementSidebar
                isOpen={isSubSidebarVisible}
                isCollapsed={isCollapsed}
                onClose={closeSubSidebar}
            />
            <div 
                className={`${styles.backdrop} ${isSubSidebarVisible ? styles.backdropVisible : ""}`} 
                onClick={closeSubSidebar} 
            />
            <div className={`${styles.main} ${isCollapsed ? styles.mainCollapsed : ""} ${isSubSidebarVisible ? styles.mainWithSubSidebar : ""}`}>
                <Header isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
                <main className={styles.content}>
                    <Suspense fallback={<Loader fullScreen={false} />}>
                        <Outlet />
                    </Suspense>
                </main>
            </div>
        </div>
    );
}
