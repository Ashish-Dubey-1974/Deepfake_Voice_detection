import React, { useState, useEffect } from 'react';
import { 
  Container, Box, Button, Typography, CircularProgress, 
  Paper, Grid, Card, CardContent, LinearProgress, 
  FormControl, IconButton, Alert, Snackbar 
} from '@mui/material';
import { styled } from '@mui/material/styles';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// API endpoint
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

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

const ResultCard = styled(Card)(({ theme, prediction }) => ({
  backgroundColor: prediction === 'Real' 
    ? theme.palette.success.light 
    : prediction === 'Deepfake' 
      ? theme.palette.error.light 
      : theme.palette.grey[200],
  color: prediction === 'Real' 
    ? theme.palette.success.contrastText 
    : prediction === 'Deepfake' 
      ? theme.palette.error.contrastText 
      : theme.palette.text.primary,
}));

function App() {
  const [file, setFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  // Fetch model info on component mount
  useEffect(() => {
    fetch(`${API_URL}/model-info/`)
      .then(response => response.json())
      .then(data => setModelInfo(data))
      .catch(err => console.error("Error fetching model info:", err));
  }, []);

  // Handle file selection
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setAudioUrl(URL.createObjectURL(selectedFile));
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

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Deepfake Voice Detector
        </Typography>
        
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Upload or record audio to check if it's a real human voice or an AI-generated deepfake
        </Typography>

        {modelInfo && (
          <Box sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Using model: {modelInfo.model_id} | Accuracy: {(modelInfo.performance.accuracy * 100).toFixed(2)}%
            </Typography>
          </Box>
        )}

        <Paper elevation={3} sx={{ p: 3, my: 4, backgroundColor: '#f9f9f9' }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
                <CardContent sx={{ width: '100%', textAlign: 'center' }}>
                  <Typography variant="h6" component="div" gutterBottom>
                    Upload Audio
                  </Typography>
                  
                  <Button
                    component="label"
                    variant="contained"
                    startIcon={<UploadFileIcon />}
                    sx={{ mt: 1, mb: 2 }}
                  >
                    Choose Audio File
                    <VisuallyHiddenInput type="file" accept="audio/*" onChange={handleFileChange} />
                  </Button>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Or record audio directly
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 1 }}>
                    {!isRecording ? (
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<MicIcon />}
                        onClick={startRecording}
                      >
                        Record
                      </Button>
                    ) : (
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<StopIcon />}
                        onClick={stopRecording}
                      >
                        Stop Recording
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined" sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', p: 2 }}>
                <CardContent sx={{ width: '100%', textAlign: 'center' }}>
                  {audioUrl ? (
                    <>
                      <Typography variant="h6" component="div" gutterBottom>
                        <AudiotrackIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                        Audio Preview
                      </Typography>
                      <Box sx={{ my: 2 }}>
                        <audio src={audioUrl} controls style={{ width: '100%' }} />
                      </Box>
                    </>
                  ) : (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
                      <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                        No audio selected
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                disabled={!file || isLoading}
                onClick={handleSubmit}
                sx={{ mx: 1 }}
              >
                {isLoading ? <CircularProgress size={24} sx={{ mr: 1 }} /> : "Analyze Audio"}
              </Button>
              
              <Button
                variant="outlined"
                color="secondary"
                size="large"
                onClick={handleReset}
                sx={{ mx: 1 }}
                disabled={isLoading}
              >
                Reset
              </Button>
            </Grid>
          </Grid>
        </Paper>
        
        {isLoading && (
          <Box sx={{ width: '100%', my: 4 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom align="center">
              Analyzing audio...
            </Typography>
            <LinearProgress />
          </Box>
        )}
        
        {result && (
          <Box sx={{ my: 4 }}>
            <ResultCard variant="outlined" prediction={result.prediction} sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h5" component="div" gutterBottom>
                  Result: {result.prediction}
                </Typography>
                <Typography variant="body1">
                  Confidence: {(result.confidence * 100).toFixed(2)}%
                </Typography>
              </CardContent>
            </ResultCard>
            
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Probability Distribution
              </Typography>
              <Box sx={{ height: 300, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={getChartData()}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: 'Probability (%)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Probability']} />
                    <Bar 
                      dataKey="value" 
                      fill={(entry) => entry.name === 'Real' ? '#4caf50' : '#f44336'} 
                      label={{ position: 'top', formatter: (value) => `${value}%` }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
            
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Note: This model claims {modelInfo ? (modelInfo.performance.accuracy * 100).toFixed(2) : ''}% accuracy, but results may vary depending on audio quality.
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
      
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default App;