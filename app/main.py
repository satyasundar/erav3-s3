from fastapi import FastAPI, UploadFile, File, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
import os
from typing import List, Optional
import base64
from io import BytesIO
import json

# Update imports to use relative imports
from .preprocessing import (
    text_processor,
    image_processor,
    audio_processor,
    mesh_processor
)
from .augmentation import (
    text_augmentor,
    image_augmentor,
    audio_augmentor,
    mesh_augmentor
)

# Update Pydantic model to handle all types of preprocessed data
class PreprocessRequest(BaseModel):
    filename: str
    techniques: List[str]
    preprocessed_result: Optional[str] = None

app = FastAPI(title="Data Processing & Augmentation API")

# Mount static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Templates
templates = Jinja2Templates(directory="app/templates")

# Create upload directory if it doesn't exist
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    file_ext = file.filename.split('.')[-1].lower()
    
    # Save the uploaded file
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Determine file type and return appropriate preview
    if file_ext in ['txt', 'csv']:
        preview = text_processor.get_preview(file_path)
        file_type = "text"
    elif file_ext in ['jpg', 'jpeg', 'png']:
        preview = image_processor.get_preview(file_path)
        file_type = "image"
    elif file_ext in ['wav', 'mp3']:
        preview = audio_processor.get_preview(file_path)
        file_type = "audio"
    elif file_ext in ['obj', 'stl', 'off', 'ply']:
        preview = mesh_processor.get_preview(file_path)
        file_type = "3d"
    else:
        return {"error": "Unsupported file type"}
    
    return {
        "filename": file.filename,
        "file_type": file_type,
        "preview": preview
    }

@app.post("/preprocess/{file_type}")
async def preprocess_file(
    file_type: str,
    request: PreprocessRequest
):
    file_path = os.path.join(UPLOAD_DIR, request.filename)
    
    if file_type == "text":
        result = text_processor.process(file_path, request.techniques)
    elif file_type == "image":
        result = image_processor.process(file_path, request.techniques)
    elif file_type == "audio":
        result = audio_processor.process(file_path, request.techniques)
    elif file_type == "3d":
        result = mesh_processor.process(file_path, request.techniques)
    else:
        return {"error": "Unsupported file type"}
    
    return result

@app.post("/augment/{file_type}")
async def augment_file(
    file_type: str,
    request: PreprocessRequest
):
    try:
        if request.preprocessed_result:
            # Handle preprocessed data based on file type
            if file_type == "text":
                # Create temporary file with preprocessed text
                temp_path = os.path.join(UPLOAD_DIR, "temp_preprocessed.txt")
                decoded_text = request.preprocessed_result
                try:
                    # Try to decode URL-encoded text
                    from urllib.parse import unquote
                    decoded_text = unquote(request.preprocessed_result)
                except:
                    pass
                
                with open(temp_path, "w", encoding='utf-8') as f:
                    f.write(decoded_text)
                result = text_augmentor.augment(temp_path, request.techniques)
                os.remove(temp_path)  # Clean up
                return result
                
            elif file_type == "image":
                # Convert base64 to image
                image_data = base64.b64decode(request.preprocessed_result)
                temp_path = os.path.join(UPLOAD_DIR, "temp_preprocessed.png")
                with open(temp_path, "wb") as f:
                    f.write(image_data)
                result = image_augmentor.augment(temp_path, request.techniques)
                os.remove(temp_path)
                return result
                
            elif file_type == "audio":
                # Convert base64 to audio
                audio_data = base64.b64decode(request.preprocessed_result)
                temp_path = os.path.join(UPLOAD_DIR, "temp_preprocessed.wav")
                with open(temp_path, "wb") as f:
                    f.write(audio_data)
                result = audio_augmentor.augment(temp_path, request.techniques)
                os.remove(temp_path)
                return result
                
            elif file_type == "3d":
                try:
                    # Decode URL-encoded JSON string
                    from urllib.parse import unquote
                    decoded_data = unquote(request.preprocessed_result)
                    mesh_data = json.loads(decoded_data)
                    
                    # Create temporary file with preprocessed mesh data
                    temp_path = os.path.join(UPLOAD_DIR, "temp_preprocessed.obj")
                    
                    # Convert mesh data to trimesh object
                    import trimesh
                    import numpy as np
                    
                    # Create mesh from vertices and faces
                    mesh = trimesh.Trimesh(
                        vertices=np.array(mesh_data['vertices']),
                        faces=np.array(mesh_data['faces'])
                    )
                    
                    # Save mesh to temporary file
                    mesh.export(temp_path)
                    
                    # Process the mesh
                    result = mesh_augmentor.augment(temp_path, request.techniques)
                    os.remove(temp_path)
                    return result
                except Exception as e:
                    print(f"Error processing 3D data: {str(e)}")
                    return {"error": f"Error processing 3D data: {str(e)}"}
    
        # If no preprocessed data or processing failed, use original file
        file_path = os.path.join(UPLOAD_DIR, request.filename)
        
        if file_type == "text":
            result = text_augmentor.augment(file_path, request.techniques)
        elif file_type == "image":
            result = image_augmentor.augment(file_path, request.techniques)
        elif file_type == "audio":
            result = audio_augmentor.augment(file_path, request.techniques)
        elif file_type == "3d":
            result = mesh_augmentor.augment(file_path, request.techniques)
        else:
            return {"error": "Unsupported file type"}
        
        return result
        
    except Exception as e:
        print(f"Error in augment_file: {str(e)}")
        return {"error": f"Error processing file: {str(e)}"}