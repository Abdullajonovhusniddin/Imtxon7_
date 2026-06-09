import { createRoot } from 'react-dom/client'
import App from './App.jsx';
import 'bootstrap-icons/font/bootstrap-icons.css';

// Sahifa yuklanishi bilanoq sarlavhani o'zgartiramiz
document.title = "Najot edu";

createRoot(document.getElementById('root')).render(
    <App />
)
