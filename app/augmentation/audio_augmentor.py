import librosa
import soundfile as sf
import numpy as np
import base64
from typing import List
import io

def augment(file_path: str, techniques: List[str]) -> dict:
    """Apply augmentation techniques to the audio"""
    results = {}
    
    try:
        audio, sr = librosa.load(file_path)
        
        for technique in techniques:
            if technique == "pitch_shift":
                # Shift pitch up by 2 semitones
                processed = librosa.effects.pitch_shift(audio, sr=sr, n_steps=2)
            
            elif technique == "time_stretch":
                # Stretch time by 20%
                processed = librosa.effects.time_stretch(audio, rate=1.2)
            
            elif technique == "reverse":
                processed = audio[::-1]
            
            # Save processed audio to buffer
            buffer = io.BytesIO()
            sf.write(buffer, processed, sr, format='wav')
            buffer.seek(0)
            results[technique] = base64.b64encode(buffer.read()).decode()
            
    except Exception as e:
        results["error"] = str(e)
    
    return results 