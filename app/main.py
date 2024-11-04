from fastapi import FastAPI, UploadFile, File, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
import os
from typing import List

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

# Add Pydantic model for preprocessing request
class PreprocessRequest(BaseModel):
    filename: str
    techniques: List[str]

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