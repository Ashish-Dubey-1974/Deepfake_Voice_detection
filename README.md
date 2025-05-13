# Deepfake Voice Detector

A powerful application for detecting AI-generated (deepfake) voices using state-of-the-art machine learning.

![Deepfake Voice Detection](https://deepfake-voice-detection-ct0t.onrender.com)

## About the Project

This application leverages the "MelodyMachine/Deepfake-audio-detection-V2" model to analyze audio files and determine whether they contain genuine human voices or AI-generated (deepfake) audio. With a reported accuracy of 99.73%, the model provides reliable detection capabilities essential in today's world of increasingly sophisticated AI voice synthesis.

### Key Features

- **High Accuracy Detection**: Built on the Wav2Vec2 architecture with 99.73% reported accuracy
- **Multiple Interfaces**: Web UI, API, batch processing tool, and Gradio interface
- **Support for Various Audio Formats**: Process WAV, MP3, OGG, and FLAC files
- **Real-time Recording**: Record and analyze audio directly from your microphone
- **Detailed Analysis**: View confidence scores and probability distributions
- **Batch Processing**: Process entire directories of audio files
- **Containerized Deployment**: Easy deployment with Docker

## Tech Stack

- **Backend**: FastAPI, PyTorch, Transformers
- **Frontend**: React with Material-UI
- **Audio Processing**: Librosa, Pydub, SoundFile
- **Visualization**: Recharts, Matplotlib
- **Deployment**: Docker, Gunicorn, Uvicorn

## Getting Started

### Prerequisites

- Python 3.7+
- PyTorch 1.10+
- Node.js and npm (for frontend development)
- Docker and Docker Compose (optional, for containerized deployment)

### Installation

#### Option 1: Local Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/deepfake-voice-detector.git
   cd deepfake-voice-detector
   ```

2. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Start the API server:
   ```
   python api.py
   ```

4. In a separate terminal, navigate to the frontend directory and install dependencies:
   ```
   cd frontend
   npm install
   npm start
   ```

#### Option 2: Docker Deployment

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/deepfake-voice-detector.git
   cd deepfake-voice-detector
   ```

2. Build and start the containers:
   ```
   docker-compose up -d
   ```

3. Access the application at http://localhost:80

### Cloud Deployment (Render)

To deploy on Render:

1. Push your code to a Git repository (GitHub, GitLab, etc.)

2. Create a new Web Service on Render, pointing to your repository

3. Make sure your repository includes:
   - `requirements.txt` with all dependencies, including `gunicorn`
   - `Procfile` with the command: `web: gunicorn api:app -k uvicorn.workers.UvicornWorker`

4. Deploy and access your application via the Render-provided URL

## Usage

### Web Interface

1. Open the application in your web browser
2. Either upload an audio file or record audio using your microphone
3. Click "Analyze Audio" to process the file
4. View the results, including the prediction (Real or Deepfake) and confidence score

### API Usage

Send requests to the API endpoint:

```python
import requests

url = "http://localhost:8000/detect/"
files = {"file": open("your_audio_file.wav", "rb")}
response = requests.post(url, files=files)
result = response.json()

print(f"Prediction: {result['prediction']}")
print(f"Confidence: {result['confidence'] * 100:.2f}%")
```

### Batch Processing

Process multiple audio files at once:

```
python batch_processor.py /path/to/audio/directory --format json --recursive
```

Options:
- `--format`: Output format (json or csv, default: json)
- `--workers`: Number of worker processes (default: CPU count)
- `--recursive`: Search for audio files recursively in subdirectories

## Model Information

- **Model ID**: MelodyMachine/Deepfake-audio-detection-V2
- **Base Model**: facebook/wav2vec2-base
- **Accuracy**: 99.73%
- **Classification**: Binary (Real vs Deepfake)

## Project Structure

```
deepfake-voice-detector/
├── app.py                  # Core detection functionality
├── api.py                  # FastAPI server implementation
├── batch_processor.py      # Command-line tool for batch processing
├── requirements.txt        # Python dependencies
├── Dockerfile              # Docker configuration for API
├── docker-compose.yml      # Docker Compose configuration
├── Procfile                # For cloud deployment (e.g., Render)
├── setup.py                # Package setup
└── frontend/               # React web interface
    └── src/
        └── App.js          # Main React component
```

## Limitations

- The model works best with clean audio recordings with minimal background noise
- Audio samples should ideally be at least 3 seconds long for better accuracy
- Very short utterances may have lower detection accuracy
- The model may not perform as well on heavily processed or compressed audio

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- MelodyMachine for the Deepfake-audio-detection-V2 model
- The Hugging Face team for the Transformers library
- The PyTorch team for their deep learning framework

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
