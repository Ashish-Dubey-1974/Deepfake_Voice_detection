from setuptools import setup, find_packages

setup(
    name="deepfake_voice_detector",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "torch>=1.10.0",
        "transformers>=4.16.0",
        "librosa>=0.8.0",
        "soundfile>=0.10.3",
        "gradio>=3.0.0",
        "matplotlib>=3.4.0",
        "numpy>=1.20.0",
        "pydub>=0.25.1",
    ],
    author="DeepfakeDetector",
    author_email="info@deepfakedetector.app",
    description="An application for detecting deepfake audio using the MelodyMachine/Deepfake-audio-detection-V2 model",
    keywords="deepfake, audio, detection, ai",
    python_requires=">=3.7",
)