import os
import torch
import gradio as gr
import numpy as np
import librosa
import soundfile as sf
from transformers import Wav2Vec2FeatureExtractor, Wav2Vec2ForSequenceClassification
from pydub import AudioSegment
import tempfile
import matplotlib
matplotlib.use('Agg')

# Constants
MODEL_ID = "MelodyMachine/Deepfake-audio-detection-V2"
SAMPLE_RATE = 16000
MAX_DURATION = 30  # maximum audio duration in seconds

class DeepfakeDetector:
    def __init__(self, model_id=MODEL_ID):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"Using device: {self.device}")
        
        print(f"Loading model from {model_id}...")
        self.feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained(model_id)
        self.model = Wav2Vec2ForSequenceClassification.from_pretrained(model_id).to(self.device)
        print("Model loaded successfully!")
        
        # Labels for classification
        self.id2label = {0: "Real", 1: "Deepfake"}
        
    def preprocess_audio(self, audio_path):
        """Process audio file to match model requirements."""
        try:
            # Load audio file
            y, sr = librosa.load(audio_path, sr=SAMPLE_RATE, mono=True)
            
            # Trim silence from the beginning and end
            y, _ = librosa.effects.trim(y, top_db=20)
            
            # If audio is longer than MAX_DURATION seconds, take the first MAX_DURATION seconds
            if len(y) > MAX_DURATION * SAMPLE_RATE:
                y = y[:MAX_DURATION * SAMPLE_RATE]
                
            return y
        except Exception as e:
            raise ValueError(f"Error preprocessing audio: {str(e)}")
    
    def detect(self, audio_path):
        """Detect if audio is real or deepfake."""
        try:
            # Preprocess audio
            audio_array = self.preprocess_audio(audio_path)
            
            # Extract features
            inputs = self.feature_extractor(
                audio_array, 
                sampling_rate=SAMPLE_RATE, 
                return_tensors="pt",
                padding=True
            ).to(self.device)
            
            # Get prediction
            with torch.no_grad():
                outputs = self.model(**inputs)
                logits = outputs.logits
                predictions = torch.softmax(logits, dim=1)
                
            # Get results
            predicted_class = torch.argmax(predictions, dim=1).item()
            confidence = predictions[0][predicted_class].item()
            
            result = {
                "prediction": self.id2label[predicted_class],
                "confidence": float(confidence),
                "probabilities": {
                    "Real": float(predictions[0][0].item()),
                    "Deepfake": float(predictions[0][1].item())
                }
            }
            
            return result
        except Exception as e:
            raise ValueError(f"Error during detection: {str(e)}")

def convert_audio(input_file):
    """Convert the audio file to the required format."""
    # Create temp file with .wav extension
    temp_dir = tempfile.gettempdir()
    temp_path = os.path.join(temp_dir, "temp_audio_file.wav")
    
    # Handle various input formats
    if input_file.endswith('.mp3'):
        audio = AudioSegment.from_mp3(input_file)
        audio = audio.set_channels(1)  # Convert to mono
        audio = audio.set_frame_rate(SAMPLE_RATE)  # Set sample rate
        audio.export(temp_path, format="wav")
    elif input_file.endswith('.wav'):
        audio = AudioSegment.from_wav(input_file)
        audio = audio.set_channels(1)  # Convert to mono
        audio = audio.set_frame_rate(SAMPLE_RATE)  # Set sample rate
        audio.export(temp_path, format="wav")
    elif input_file.endswith('.ogg'):
        audio = AudioSegment.from_ogg(input_file)
        audio = audio.set_channels(1)  # Convert to mono
        audio = audio.set_frame_rate(SAMPLE_RATE)  # Set sample rate
        audio.export(temp_path, format="wav")
    elif input_file.endswith('.flac'):
        audio = AudioSegment.from_file(input_file, format="flac")
        audio = audio.set_channels(1)  # Convert to mono
        audio = audio.set_frame_rate(SAMPLE_RATE)  # Set sample rate
        audio.export(temp_path, format="wav")
    else:
        # Try to convert using pydub's generic from_file
        try:
            audio = AudioSegment.from_file(input_file)
            audio = audio.set_channels(1)  # Convert to mono
            audio = audio.set_frame_rate(SAMPLE_RATE)  # Set sample rate
            audio.export(temp_path, format="wav")
        except:
            raise ValueError(f"Unsupported audio format for file: {input_file}")
    
    return temp_path

def detect_deepfake(audio_file, detector):
    """Process audio and detect if it's a deepfake."""
    if audio_file is None:
        return {
            "error": "Please upload an audio file."
        }
    
    try:
        # Convert audio to required format
        processed_audio = convert_audio(audio_file)
        
        # Detect deepfake
        result = detector.detect(processed_audio)
        
        # Create a visually appealing output
        prediction = result["prediction"]
        confidence = result["confidence"] * 100
        
        # Prepare visualization data
        labels = list(result["probabilities"].keys())
        values = list(result["probabilities"].values())
        
        output = {
            "prediction": prediction,
            "confidence": f"{confidence:.2f}%",
            "chart_labels": labels,
            "chart_values": values
        }
        
        # Create result text with confidence
        result_text = f"Prediction: {prediction} (Confidence: {confidence:.2f}%)"
        
        return result_text, output
    except Exception as e:
        return f"Error: {str(e)}", None
    
def create_interface():
    """Create Gradio interface for the application."""
    # Initialize the deepfake detector
    detector = DeepfakeDetector()
    
    with gr.Blocks(title="Deepfake Voice Detector") as interface:
        gr.Markdown("""
        # Deepfake Voice Detector
        
        Upload an audio file to check if it's a real human voice or an AI-generated deepfake.
        
        **Model:** MelodyMachine/Deepfake-audio-detection-V2 (Accuracy: 99.73%)
        """)
        
        with gr.Row():
            with gr.Column(scale=1):
                audio_input = gr.Audio(
                    type="filepath", 
                    label="Upload Audio File",
                    sources=["upload", "microphone"]
                )
                submit_btn = gr.Button("Analyze Audio", variant="primary")
            
            with gr.Column(scale=1):
                result_text = gr.Textbox(label="Result")
                
                # Visualization component
                with gr.Accordion("Detailed Analysis", open=False):
                    gr.Markdown("### Confidence Scores")
                    confidence_plot = gr.Plot(label="Confidence Scores")
        
        # Process function for the submit button
        def process_and_visualize(audio_file):
            result_text, output = detect_deepfake(audio_file, detector)
            
            if output:
                # Create bar chart visualization
                import matplotlib.pyplot as plt
                
                fig, ax = plt.subplots(figsize=(6, 4))
                bars = ax.bar(output["chart_labels"], output["chart_values"], color=['green', 'red'])
                
                # Add percentage labels on top of each bar
                for bar in bars:
                    height = bar.get_height()
                    ax.text(bar.get_x() + bar.get_width()/2., height + 0.02,
                            f'{height*100:.1f}%', ha='center', va='bottom')
                
                ax.set_ylim(0, 1.1)
                ax.set_title('Confidence Scores')
                ax.set_ylabel('Probability')
                
                return result_text, fig
            else:
                return result_text, None
        
        submit_btn.click(
            process_and_visualize,
            inputs=[audio_input],
            outputs=[result_text, confidence_plot]
        )
    
    return interface

if __name__ == "__main__":
    interface = create_interface()
    interface.launch()