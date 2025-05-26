import os
import tempfile
import uvicorn
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import shutil
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

# Import our detection module
from app import DeepfakeDetector, convert_audio

# Initialize the FastAPI app
app = FastAPI(
    title="Deepfake Voice Detection API",
    description="API for detecting deepfake audio using the MelodyMachine/Deepfake-audio-detection-V2 model",
    version="0.1.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Initialize the detector at startup
detector = None

@app.on_event("startup")
async def startup_event():
    global detector
    detector = DeepfakeDetector()
    print("Deepfake Detector model loaded and ready to use")

class PredictionResponse(BaseModel):
    prediction: str
    confidence: float
    probabilities: Dict[str, float]

@app.post("/detect/", response_model=PredictionResponse)
async def detect_audio(file: UploadFile = File(...)):
    """
    Detect if an audio file contains a deepfake voice
    """
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Validate file type
    if not file.filename.lower().endswith(('.wav', '.mp3', '.ogg', '.flac')):
        raise HTTPException(
            status_code=400, 
            detail="Invalid file format. Only WAV, MP3, OGG, and FLAC files are supported."
        )
    
    try:
        # Create a temporary file
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, file.filename)
        
        # Save uploaded file to the temp location
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Convert audio to required format
        processed_audio = convert_audio(temp_path)
        
        # Detect if it's a deepfake
        result = detector.detect(processed_audio)
        
        # Clean up the temporary files
        try:
            os.remove(temp_path)
            os.remove(processed_audio) if processed_audio != temp_path else None
        except:
            pass
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing audio: {str(e)}")

@app.get("/health/")
async def health_check():
    """
    Check if the API is running and the model is loaded
    """
    if detector is None:
        return JSONResponse(
            status_code=503,
            content={"status": "error", "message": "Model not loaded"}
        )
    return {"status": "ok", "model_loaded": True}

@app.get("/model-info/")
async def model_info():
    """
    Get information about the model being used
    """
    return {
        "model_id": "MelodyMachine/Deepfake-audio-detection-V2",
        "base_model": "facebook/wav2vec2-base",
        "performance": {
            "loss": 0.0141,
            "accuracy": 0.9973
        },
        "description": "Fine-tuned model for binary classification distinguishing between real and deepfake audio"
    }

if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)