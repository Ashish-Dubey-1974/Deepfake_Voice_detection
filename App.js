import React, { useState, useEffect } from 'react';
import { 
  Container, Box, Button, Typography, CircularProgress, 
  Paper, Grid, Card, CardContent, LinearProgress, 
  FormControl, IconButton, Alert, Snackbar, useMediaQuery
} from '@mui/material';
import { createTheme, ThemeProvider, styled, alpha } from '@mui/material/styles';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import SecurityIcon from '@mui/icons-material/Security';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

// API endpoint
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#3a86ff',
      light: '#83b9ff',
      dark: '#0056cb',
    },
    secondary: {
      main: '#ff006e',
      light: '#ff5b9e',
      dark: '#c50052',
    },
    success: {
      main: '#38b000',
      light: '#70e000',
      dark: '#008000',
      contrastText: '#ffffff',
    },
    error: {
      main: '#d00000',
      light: '#ff5c4d',
      dark: '#9d0208',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: "'Poppins', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h3: {
      fontWeight: 700,
      letterSpacing: '-0.5px',
    },
    h6: {
      fontWeight: 600,
    },
    subtitle1: {
      fontWeight: 500,
    }
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          padding: '10px 16px',
          boxShadow: 'none',
          fontWeight: 600,
        },
        containedPrimary: {
          '&:hover': {
            boxShadow: '0 6px 20px rgba(58, 134, 255, 0.3)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 8px 40px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          overflow: 'visible',
        },
      },
    },
  },
});

// Styled components
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 50px rgba(0, 0, 0, 0.1)',
  },
}));

const ResultCard = styled(Card)(({ theme, prediction }) => ({
  backgroundColor: prediction === 'Real' 
    ? alpha(theme.palette.success.light, 0.3)
    : prediction === 'Deepfake' 
      ? alpha(theme.palette.error.light, 0.3)
      : theme.palette.grey[100],
  borderLeft: `8px solid ${
    prediction === 'Real' 
      ? theme.palette.success.main 
      : prediction === 'Deepfake' 
        ? theme.palette.error.main 
        : theme.palette.grey[300]
  }`,
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s ease',
}));

const GradientHeader = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
  color: '#ffffff',
  padding: theme.spacing(6, 2, 8),
  borderRadius: '0 0 24px 24px',
  marginBottom: -theme.spacing(6),
}));

const GlassCard = styled(Card)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha('#fff', 0.2)}`,
}));

const RecordButton = styled(Button)(({ theme, isrecording }) => ({
  borderRadius: '50%',
  minWidth: '64px',
  width: '64px',
  height: '64px',
  padding: 0,
  boxShadow: isrecording === 'true' 
    ? `0 0 0 4px ${alpha(theme.palette.error.main, 0.3)}, 0 0 0 8px ${alpha(theme.palette.error.main, 0.15)}`
    : `0 0 0 4px ${alpha(theme.palette.primary.main, 0.3)}, 0 0 0 8px ${alpha(theme.palette.primary.main, 0.15)}`,
  animation: isrecording === 'true' ? 'pulse 1.5s infinite' : 'none',
  '@keyframes pulse': {
    '0%': {
      boxShadow: `0 0 0 0 ${alpha(theme.palette.error.main, 0.7)}`
    },
    '70%': {
      boxShadow: `0 0 0 15px ${alpha(theme.palette.error.main, 0)}`
    },
    '100%': {
      boxShadow: `0 0 0 0 ${alpha(theme.palette.error.main, 0)}`
    }
  }
}));

const AudioWaveAnimation = styled(Box)(({ theme, isplaying }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '3px',
  height: '40px',
  opacity: isplaying === 'true' ? 1 : 0.3,
  transition: 'opacity 0.3s ease',
  '& .bar': {
    width: '3px',
    backgroundColor: theme.palette.primary.main,
    borderRadius: '3px',
    animation: isplaying === 'true' ? 'soundwave 1s infinite' : 'none',
  },
  '@keyframes soundwave': {
    '0%': { height: '10%' },
    '50%': { height: '100%' },
    '100%': { height: '10%' }
  }
}));

function App() {
  const [file, setFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recorder, setRecorder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Create audio wave bars for animation
  const audioBars = Array.from({ length: 10 }, (_, i) => {
    const randomHeight = Math.floor(Math.random() * 100) + 1;
    const randomDelay = Math.random();
    return (
      <Box 
        key={i} 
        className="bar" 
        sx={{ 
          height: `${randomHeight}%`,
          animationDelay: `${randomDelay}s` 
        }} 
      />
    );
  });

  // Audio player logic
  const audioRef = React.useRef(null);
  
  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Fetch model info on component mount
  useEffect(() => {
    fetch(`${API_URL}/model-info/`)
      .then(response => response.json())
      .then(data => setModelInfo(data))
      .catch(err => console.error("Error fetching model info:", err));
  }, []);

  // Handle audio events
  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      const handleEnded = () => setIsPlaying(false);
      audioElement.addEventListener('ended', handleEnded);
      return () => {
        audioElement.removeEventListener('ended', handleEnded);
      };
    }
  }, [audioUrl]);

  // Handle file selection
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setAudioUrl(URL.createObjectURL(selectedFile));
      setIsPlaying(false);
      setResult(null); // Clear previous results
    }
  };

  // Start audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorder.addEventListener("dataavailable", event => {
        audioChunks.push(event.data);
      });

      mediaRecorder.addEventListener("stop", () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], "recorded-audio.wav", { type: 'audio/wav' });
        setFile(audioFile);
        setAudioUrl(URL.createObjectURL(audioBlob));
        setIsPlaying(false);
        setResult(null); // Clear previous results
      });

      mediaRecorder.start();
      setIsRecording(true);
      setRecorder(mediaRecorder);
    } catch (err) {
      setError("Could not access microphone. Please check permissions.");
      setOpenSnackbar(true);
      console.error("Error accessing microphone:", err);
    }
  };

  // Stop audio recording
  const stopRecording = () => {
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      setIsRecording(false);
    }
  };

  // Submit audio for analysis
  const handleSubmit = async () => {
    if (!file) {
      setError("Please upload or record an audio file first.");
      setOpenSnackbar(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/detect/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(`Error analyzing audio: ${err.message}`);
      setOpenSnackbar(true);
      console.error("Error analyzing audio:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset everything
  const handleReset = () => {
    setFile(null);
    setAudioUrl(null);
    setResult(null);
    setError(null);
    setIsPlaying(false);
  };

  // Format chart data
  const getChartData = () => {
    if (!result || !result.probabilities) return [];
    
    return Object.entries(result.probabilities).map(([name, value]) => ({
      name,
      value: parseFloat((value * 100).toFixed(2))
    }));
  };

  // Handle snackbar close
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
  };

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ 
        backgroundColor: 'background.default', 
        minHeight: '100vh',
        paddingBottom: 4
      }}>
        <GradientHeader>
          <Container maxWidth="md">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <Box sx={{ textAlign: 'center', position: 'relative' }}>
                <Typography variant="h3" component="h1" gutterBottom>
                  Deepfake Voice Detector
                </Typography>
                
                <Typography variant="subtitle1" sx={{ maxWidth: '700px', mx: 'auto', opacity: 0.9 }}>
                  Upload or record audio to instantly verify if it's authentic or AI-generated
                </Typography>
              </Box>
            </motion.div>
          </Container>
        </GradientHeader>
        
        <Container maxWidth="md">
          <Box sx={{ mt: 2, mb: 2 }}>
            {modelInfo && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1
                }}>
                  <SecurityIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Using model: {modelInfo.model_id} | Accuracy: {(modelInfo.performance.accuracy * 100).toFixed(2)}%
                  </Typography>
                </Box>
              </motion.div>
            )}
          </Box>

          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
          >
            <GlassCard elevation={0} sx={{ mb: 4, overflow: 'visible' }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <StyledCard variant="outlined">
                      <CardContent sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        height: '100%',
                        p: { xs: 2, sm: 3 }
                      }}>
                        <Typography variant="h6" component="div" gutterBottom sx={{ mb: 3 }}>
                          Upload Audio
                        </Typography>
                        
                        <Button
                          component="label"
                          variant="contained"
                          startIcon={<UploadFileIcon />}
                          sx={{ 
                            width: '100%',
                            py: 1.5,
                            mb: 3,
                            backgroundColor: theme.palette.primary.light,
                            '&:hover': {
                              backgroundColor: theme.palette.primary.main,
                            }
                          }}
                        >
                          Choose Audio File
                          <VisuallyHiddenInput type="file" accept="audio/*" onChange={handleFileChange} />
                        </Button>
                        
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Or record audio directly
                        </Typography>
                        
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column',
                          alignItems: 'center', 
                          mt: 2 
                        }}>
                          {!isRecording ? (
                            <RecordButton
                              variant="contained"
                              color="primary"
                              onClick={startRecording}
                              isrecording="false"
                            >
                              <MicIcon />
                            </RecordButton>
                          ) : (
                            <RecordButton
                              variant="contained"
                              color="error"
                              onClick={stopRecording}
                              isrecording="true"
                            >
                              <StopIcon />
                            </RecordButton>
                          )}
                          <Typography variant="body2" sx={{ mt: 1, color: isRecording ? 'error.main' : 'text.secondary' }}>
                            {isRecording ? 'Recording...' : 'Tap to record'}
                          </Typography>
                        </Box>
                      </CardContent>
                    </StyledCard>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <StyledCard variant="outlined">
                      <CardContent sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        justifyContent: audioUrl ? 'space-between' : 'center',
                        height: '100%',
                        p: { xs: 2, sm: 3 } 
                      }}>
                        {audioUrl ? (
                          <>
                            <Box sx={{ textAlign: 'center' }}>
                              <Typography variant="h6" component="div" gutterBottom>
                                <AudiotrackIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                                Audio Preview
                              </Typography>
                            </Box>
                            
                            <Box sx={{ 
                              my: 2, 
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center'
                            }}>
                              <audio 
                                ref={audioRef}
                                src={audioUrl} 
                                style={{ display: 'none' }}
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                              />
                              
                              <AudioWaveAnimation isplaying={isPlaying ? 'true' : 'false'}>
                                {audioBars}
                              </AudioWaveAnimation>
                              
                              <Box sx={{ mt: 2 }}>
                                <IconButton 
                                  color="primary" 
                                  onClick={handlePlayPause}
                                  size="large"
                                  sx={{ 
                                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                    '&:hover': {
                                      backgroundColor: alpha(theme.palette.primary.main, 0.2),
                                    }
                                  }}
                                >
                                  <VolumeUpIcon />
                                </IconButton>
                              </Box>
                              
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                {file ? file.name : "Audio loaded"}
                              </Typography>
                            </Box>
                          </>
                        ) : (
                          <Box sx={{ 
                            p: 3, 
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%'
                          }}>
                            <CloudUploadIcon sx={{ 
                              fontSize: 60, 
                              color: alpha(theme.palette.text.secondary, 0.5),
                              mb: 2
                            }} />
                            <Typography variant="body1" color="text.secondary">
                              No audio selected
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, opacity: 0.7 }}>
                              Upload or record to analyze
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </StyledCard>
                  </Grid>
                </Grid>
              </CardContent>
              
              <Box sx={{ 
                px: { xs: 2, sm: 3 }, 
                pb: { xs: 2, sm: 3 },
                textAlign: 'center' 
              }}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    disabled={!file || isLoading}
                    onClick={handleSubmit}
                    sx={{ 
                      px: 4, 
                      py: 1.2,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      mx: 1,
                      minWidth: { xs: '120px', sm: '160px' }
                    }}
                  >
                    {isLoading ? <CircularProgress size={24} sx={{ mr: 1 }} /> : "Analyze Audio"}
                  </Button>
                </motion.div>
                
                <Button
                  variant="outlined"
                  color="secondary"
                  size="large"
                  onClick={handleReset}
                  sx={{ 
                    mx: 1, 
                    mt: { xs: 1, sm: 0 },
                    minWidth: { xs: '120px', sm: '120px' }
                  }}
                  disabled={isLoading || (!file && !audioUrl)}
                >
                  Reset
                </Button>
              </Box>
            </GlassCard>
          </motion.div>
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ width: '100%', my: 4 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom align="center">
                  Analyzing audio...
                </Typography>
                <LinearProgress 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    backgroundColor: alpha(theme.palette.primary.main, 0.15)
                  }} 
                />
              </Box>
            </motion.div>
          )}
          
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Box sx={{ my: 4 }}>
                <ResultCard 
                  elevation={2} 
                  prediction={result.prediction} 
                  sx={{ mb: 3 }}
                >
                  <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'flex-start', sm: 'center' },
                      justifyContent: 'space-between'
                    }}>
                      <Box>
                        <Typography 
                          variant="h5" 
                          component="div" 
                          gutterBottom 
                          sx={{ 
                            fontWeight: 700,
                            color: result.prediction === 'Real' 
                              ? 'success.dark' 
                              : 'error.dark'
                          }}
                        >
                          {result.prediction === 'Real' ? '✓ Authentic Voice' : '⚠ Deepfake Detected'}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          Confidence: {(result.confidence * 100).toFixed(2)}%
                        </Typography>
                      </Box>
                      
                      <Box 
                        sx={{ 
                          mt: { xs: 2, sm: 0 },
                          display: 'flex',
                          alignItems: 'center',
                          px: 2,
                          py: 1,
                          backgroundColor: alpha(
                            result.prediction === 'Real' 
                              ? theme.palette.success.main 
                              : theme.palette.error.main,
                            0.1
                          ),
                          borderRadius: 2
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600, color: result.prediction === 'Real' ? 'success.dark' : 'error.dark' }}>
                          {result.prediction === 'Real' ? 'Human Voice' : 'AI-Generated'}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </ResultCard>
                
                <GlassCard elevation={2} sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Probability Distribution
                  </Typography>
                  <Box sx={{ height: isMobile ? 250 : 300, width: '100%', mt: 2 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={getChartData()}
                        margin={{
                          top: 30,
                          right: 30,
                          left: 20,
                          bottom: 10,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000', 0.1)} />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fill: theme.palette.text.secondary }}
                          axisLine={{ stroke: alpha('#000', 0.15) }}
                        />
                        <YAxis 
                          label={{ 
                            value: 'Probability (%)', 
                            angle: -90, 
                            position: 'insideLeft',
                            style: { fill: theme.palette.text.secondary } 
                          }}
                          tick={{ fill: theme.palette.text.secondary }}
                          axisLine={{ stroke: alpha('#000', 0.15) }}
                        />
                        <Tooltip 
                          formatter={(value) => [`${value}%`, 'Probability']} 
                          contentStyle={{ 
                            borderRadius: 8, 
                            border: 'none', 
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                            backgroundColor: alpha('#fff', 0.95) 
                          }}
                        />
                        <Bar 
                          dataKey="value" 
                          fill={(entry) => entry.name === 'Real' ? theme.palette.success.main : theme.palette.error.main}
                          radius={[8, 8, 0, 0]}
                          label={{ 
                            position: 'top', 
                            formatter: (value) => `${value}%`,
                            fill: theme.palette.text.secondary,
                            fontSize: 12,
                            fontWeight: 600
                          }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </GlassCard>
                
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Note: This model claims {modelInfo ? (modelInfo.performance.accuracy * 100).toFixed(2) : ''}% accuracy, but results may vary depending on audio quality.
                  </Typography>
                </Box>
              </Box>
            </motion.div>
          )}
        </Container>
      </Box>
      
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity="error" 
          sx={{ 
            width: '100%',
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}
        >
          {error}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;