import trimesh
import numpy as np
import base64
from typing import List
import io
import json

def get_preview(file_path: str) -> str:
    """Return preview data of the 3D mesh"""
    try:
        mesh = trimesh.load(file_path)
        preview_data = {
            "vertices": len(mesh.vertices),
            "faces": len(mesh.faces),
            "bounds": mesh.bounds.tolist()
        }
        return json.dumps(preview_data)
    except Exception as e:
        return f"Error processing mesh: {str(e)}"

def process(file_path: str, techniques: List[str]) -> dict:
    """Apply preprocessing techniques to the 3D mesh"""
    results = {}
    
    try:
        mesh = trimesh.load(file_path)
        
        for technique in techniques:
            if technique == "normalize":
                # Normalize to unit cube
                extents = mesh.extents
                scale = 1.0 / np.max(extents)
                processed = mesh.copy()
                processed.apply_scale(scale)
            
            elif technique == "center":
                processed = mesh.copy()
                processed.vertices -= processed.centroid
            
            elif technique == "simplify":
                # Simplify mesh to 50% of original faces
                target_faces = len(mesh.faces) // 2
                processed = mesh.simplify_quadratic_decimation(target_faces)
            
            # Convert processed mesh to JSON-compatible format
            result_data = {
                "vertices": processed.vertices.tolist(),
                "faces": processed.faces.tolist()
            }
            results[technique] = json.dumps(result_data)
            
    except Exception as e:
        results["error"] = str(e)
    
    return results 