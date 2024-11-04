from PIL import Image, ImageOps
import numpy as np
from typing import List
import base64
from io import BytesIO

def augment(file_path: str, techniques: List[str]) -> dict:
    """Apply augmentation techniques to the image"""
    results = {}
    try:
        img = Image.open(file_path)
        
        # Convert image to RGB if it's not
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        for technique in techniques:
            if technique == "flip":
                processed = ImageOps.mirror(img)  # Horizontal flip
            
            elif technique == "rotate":
                processed = img.rotate(30, expand=True)  # Rotate by 30 degrees
            
            elif technique == "noise":
                # Add random noise
                img_array = np.array(img)
                noise = np.random.normal(0, 25, img_array.shape).astype(np.uint8)
                noisy_array = np.clip(img_array.astype(np.int16) + noise, 0, 255).astype(np.uint8)
                processed = Image.fromarray(noisy_array)
            
            # Convert processed image to base64
            buffered = BytesIO()
            processed.save(buffered, format="PNG")
            buffered.seek(0)
            results[technique] = base64.b64encode(buffered.getvalue()).decode()
            
    except Exception as e:
        results["error"] = str(e)
    
    return results