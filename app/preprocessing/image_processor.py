from PIL import Image
import numpy as np
from typing import List
import base64
from io import BytesIO

def get_preview(file_path: str) -> str:
    """Return base64 encoded preview of the image"""
    with Image.open(file_path) as img:
        # Resize for preview if needed
        max_size = (800, 800)
        img.thumbnail(max_size)
        
        # Convert to base64
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        return base64.b64encode(buffered.getvalue()).decode()

def process(file_path: str, techniques: List[str]) -> dict:
    """Apply preprocessing techniques to the image"""
    results = {}
    img = Image.open(file_path)
    
    for technique in techniques:
        if technique == "grayscale":
            processed = img.convert('L')
        elif technique == "resize":
            processed = img.resize((224, 224))
        elif technique == "normalize":
            img_array = np.array(img) / 255.0
            processed = Image.fromarray((img_array * 255).astype(np.uint8))
        
        # Convert processed image to base64
        buffered = BytesIO()
        processed.save(buffered, format="PNG")
        results[technique] = base64.b64encode(buffered.getvalue()).decode()
    
    return results 