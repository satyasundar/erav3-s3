import librosa
import soundfile as sf
import numpy as np
import base64
from typing import List
import io

def get_preview(file_path: str) -> str:
    """Return base64 encoded preview of the audio"""
    try:
        # Load the audio file
        audio, sr = librosa.load(file_path)
        
        # Trim to first 10 seconds if longer
        if len(audio) > sr * 10:
            audio = audio[:sr * 10]
        
        # Save to buffer
        buffer = io.BytesIO()
        sf.write(buffer, audio, sr, format='wav')
        buffer.seek(0)
        
        return base64.b64encode(buffer.read()).decode()
    except Exception as e:
        return f"Error processing audio: {str(e)}"

def process(file_path: str, techniques: List[str]) -> dict:
    """Apply preprocessing techniques to the audio"""
    results = {}
    
    try:
        # Load the audio file
        audio, sr = librosa.load(file_path)
        
        for technique in techniques:
            if technique == "normalize":
                processed = librosa.util.normalize(audio)
            
            elif technique == "noise_reduction":
                # Simple noise reduction using spectral subtraction
                S = librosa.stft(audio)
                mag = np.abs(S)
                noise_mag = np.mean(mag[:, :10], axis=1, keepdims=True)
                processed = librosa.istft(mag - noise_mag)
            
            elif technique == "trim_silence":
                processed, _ = librosa.effects.trim(audio, top_db=20)
            
            # Save processed audio to buffer
            buffer = io.BytesIO()
            sf.write(buffer, processed, sr, format='wav')
            buffer.seek(0)
            results[technique] = base64.b64encode(buffer.read()).decode()
            
    except Exception as e:
        results["error"] = str(e)
    
    return results 