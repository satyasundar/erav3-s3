import trimesh
import numpy as np
import base64
from typing import List
import json
import os

def get_preview(file_path: str) -> str:
    """Return preview data of the 3D mesh"""
    try:
        # Force using the appropriate loader based on file extension
        file_ext = os.path.splitext(file_path)[1].lower()
        if file_ext == '.off':
            mesh = trimesh.load_mesh(file_path, file_type='off')
        else:
            mesh = trimesh.load(file_path)

        preview_data = {
            "vertices": mesh.vertices.tolist(),
            "faces": mesh.faces.tolist(),
            "stats": {
                "n_vertices": len(mesh.vertices),
                "n_faces": len(mesh.faces),
                "bounds": mesh.bounds.tolist(),
                "volume": float(mesh.volume) if mesh.is_watertight else "N/A",
                "center_mass": mesh.center_mass.tolist()
            }
        }
        return json.dumps(preview_data)
    except Exception as e:
        return f"Error processing mesh: {str(e)}"

def process(file_path: str, techniques: List[str]) -> dict:
    """Apply preprocessing techniques to the 3D mesh"""
    results = {}
    
    try:
        # Force using the appropriate loader based on file extension
        file_ext = os.path.splitext(file_path)[1].lower()
        if file_ext == '.off':
            mesh = trimesh.load_mesh(file_path, file_type='off')
        else:
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
                try:
                    # Use trimesh's built-in simplification
                    processed = mesh.copy()
                    target_faces = len(mesh.faces) // 2  # Reduce to 50%
                    processed = processed.simplify_quadratic_decimation(target_faces)
                    
                    if processed is None or len(processed.faces) == 0:
                        # Fallback to vertex clustering if quadratic decimation fails
                        processed = mesh.copy()
                        processed = processed.simplify_vertex_clustering(
                            spacing=mesh.bounding_box.extents.max() / 32
                        )
                except Exception as e:
                    print(f"Simplification error: {str(e)}")
                    # If both simplification methods fail, return original mesh
                    processed = mesh.copy()
            
            # Convert processed mesh to JSON-compatible format
            result_data = {
                "vertices": processed.vertices.tolist(),
                "faces": processed.faces.tolist()
            }
            results[technique] = json.dumps(result_data)
            
    except Exception as e:
        results["error"] = str(e)
    
    return results