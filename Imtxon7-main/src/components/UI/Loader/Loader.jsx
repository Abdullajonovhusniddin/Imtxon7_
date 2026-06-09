import { Box } from '@mui/material';
import SchoolRoundedIcon from '@mui/icons-material/esm/SchoolRounded.js';;
import { keyframes } from '@mui/system';

const pulse = keyframes`
  0% {
    transform: scale(0.9);
    opacity: 0.6;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(0.9);
    opacity: 0.6;
  }
`;

const rotate = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

export default function Loader({ fullScreen = true }) {
    return (
        <Box
            sx={{
                position: fullScreen ? 'fixed' : 'absolute',
                top: 0,
                left: 0,
                width: fullScreen ? '100vw' : '100%',
                height: fullScreen ? '100vh' : '100%',
                backgroundColor: 'var(--bg, #ffffff)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: fullScreen ? 9999 : 10,
            }}
        >
            <Box
                sx={{
                    position: 'relative',
                    width: 100,
                    height: 100,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                {/* Outer spinning ring */}
                <Box
                    sx={{
                        position: 'absolute',
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        border: '3px solid transparent',
                        borderTopColor: 'var(--primary, #6c35de)',
                        borderBottomColor: 'var(--primary, #6c35de)',
                        animation: `${rotate} 1.5s linear infinite`,
                    }}
                />
                
                {/* Central animated cap icon */}
                <SchoolRoundedIcon
                    sx={{
                        fontSize: 45,
                        color: 'var(--primary, #6c35de)',
                        animation: `${pulse} 1.8s ease-in-out infinite`,
                    }}
                />
            </Box>
            
            <Box
                sx={{
                    marginTop: 3,
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    color: 'var(--text, #1e1e2d)',
                    fontFamily: 'Outfit, Inter, sans-serif',
                    letterSpacing: '0.5px',
                    opacity: 0.8,
                }}
            >
                Najot edu
            </Box>
        </Box>
    );
}
