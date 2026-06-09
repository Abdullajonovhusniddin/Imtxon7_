import styles from './Login.module.scss';
import LMS from "../../assets/logo-md.png";
import { useNavigate, Navigate } from 'react-router-dom';
import { api } from '../../api/api';
import { useState, useEffect } from 'react';
import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';

const translations = {
    uz: {
        title: <>MUHAMMAD AL-XORAZMIY NOMIDAGI <br /> TOSHKENT AXBOROT TEXNOLOGIYALARI <br /> UNIVERSITETI</>,
        lms: "Najot edu",
        login: "Login",
        password: "Parol",
        login_ph: "Loginni kiriting",
        password_ph: "Parolni kiriting",
        btn: "Kirish",
        err: "Login yoki parol noto'g'ri",
        success: "Muvaffaqiyatli kirdingiz",
        license: "Copyright © 2021 of Tashkent University of Information Technologies"
    },
    ru: {
        title: <>ТАШКЕНТСКИЙ УНИВЕРСИТЕТ <br /> ИНФОРМАЦИОННЫХ ТЕХНОЛОГИЙ <br /> ИМЕНИ МУХАММАДА АЛЬ-ХОРАЗМИ</>,
        lms: "Najot edu",
        login: "Логин",
        password: "Пароль",
        login_ph: "Введите логин",
        password_ph: "Введите пароль",
        btn: "Войти",
        err: "Неверный пароль или логин",
        success: "Вы вошли",
        license: "Copyright © 2021 Ташкентский университет информационных технологий"
    },
    en: {
        title: <>TASHKENT UNIVERSITY OF <br /> INFORMATION TECHNOLOGIES <br /> NAMED AFTER MUHAMMAD AL-KHWARIZMI</>,
        lms: "Najot edu",
        login: "Login",
        password: "Password",
        login_ph: "Enter login",
        password_ph: "Enter password",
        btn: "Sign In",
        err: "Incorrect login or password",
        success: "You are in",
        license: "Copyright © 2021 of Tashkent University of Information Technologies"
    }
};

export default function Login() {
    const [input, setInput] = useState({
        phone: '998975661099',
        password: "Benazir99!"
    });
    const [error, setError] = useState(false);
    const [success, setSuccess] = useState(false);
    const [lang, setLang] = useState(localStorage.getItem('lang') || 'uz');

    const navigate = useNavigate();
    const t = translations[lang];

    useEffect(() => {
        document.title = "Najot edu";
        const theme = localStorage.getItem('lms-theme') || 'light';
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, []);

    const changeLang = (l) => {
        setLang(l);
        localStorage.setItem('lang', l);
    };

    function Submit(e) {
        e.preventDefault();

        api.post('/auth/login', input).then(
            res => {
                if (res.status === 201) {
                    const auth = res.data?.accessToken;

                    if (auth) {
                        sessionStorage.setItem("accessToken", auth);
                        setSuccess(true);
                        setTimeout(() => {
                            navigate('/dashboard', {
                                replace: true
                            });
                        }, 1000);
                    } else {
                        setError(true);
                    }
                } else {
                    setError(true);
                }
            }
        ).catch(
            err => {
                console.error(err);
                setError(true);
            }
        )
    }

    function InputData(e) {
        setError(false);
        setSuccess(false);
        setInput(current => ({
            ...current,
            [e.target.id]: e.target.value
        }))
    }

    return (
        <div className={styles.container}>
            <div className={styles.left_side}>
                <img className={styles.left_icon} src='/study.svg' alt="left images" />
            </div>
            <div className={`${styles.right_side}`}>
                <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '12px', zIndex: 10 }}>
                    {['uz', 'ru', 'en'].map(l => (
                        <span 
                            key={l} 
                            onClick={() => changeLang(l)} 
                            style={{ 
                                cursor: 'pointer', 
                                fontWeight: lang === l ? 'bold' : '500',
                                color: lang === l ? '#6c35de' : '#888',
                                textTransform: 'uppercase',
                                fontSize: '0.85rem',
                                transition: 'all 0.2s'
                            }}
                        >
                            {l}
                        </span>
                    ))}
                </div>
                <div className={styles.right_container}>
                    <div style={{ padding: "0 20px" }}>
                        <h1 className={styles.title}>{t.title}</h1>

                        <img className={styles.lms__icon} src={LMS} alt="" />
                        <h2 className={styles.lms_login}>{t.lms}</h2>
                    </div>
                    <form onSubmit={Submit} className={`${styles.form} ${error ? styles.shake : ''}`}>
                        <Collapse in={error}>
                            <Alert
                                severity="error"
                                sx={{
                                    mb: 1,
                                    fontSize: '0.85rem',
                                    borderRadius: '8px',
                                    fontFamily: 'inherit'
                                }}
                            >
                                {t.err}
                            </Alert>
                        </Collapse>

                        <Collapse in={success}>
                            <Alert
                                severity="success"
                                sx={{
                                    mb: 1,
                                    fontSize: '0.85rem',
                                    borderRadius: '8px',
                                    fontFamily: 'inherit'
                                }}
                            >
                                {t.success}
                            </Alert>
                        </Collapse>

                        <div className={styles.box}>
                            <label className={styles.form__label} htmlFor="phone">{t.login}</label>
                            <input onChange={InputData} value={input.phone} className={styles.form__input} id='phone' type="text" placeholder={t.login_ph} required />
                        </div>
                        <div className={styles.box}>
                            <label className={styles.form__label} htmlFor="password">{t.password}</label>
                            <input onChange={InputData} value={input.password} className={styles.form__input} id='password' type="password" placeholder={t.password_ph} required />
                        </div>
                        <button className={styles.form__button}>{t.btn}</button>
                    </form>
                </div>

                <p className={styles.lisence}>{t.license}</p>
            </div>
        </div>
    )
}