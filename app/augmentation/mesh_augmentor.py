import trimesh
import numpy as np
from typing import List
import json

def augment(file_path: str, techniques: List[str]) -> dict:
    """Apply augmentation techniques to the 3D mesh"""
    results = {}
    
    try:
        mesh = trimesh.load(file_path)
        
        for technique in techniques:
            if technique == "rotate":
                # Rotate mesh by 45 degrees around Y axis
                rotation = trimesh.transformations.rotation_matrix(
                    angle=np.radians(45),
                    direction=[0, 1, 0]
                )
                processed = mesh.copy()
                processed.apply_transform(rotation)
            
            elif technique == "scale":
                # Random non-uniform scaling
                scale = np.random.uniform(0.8, 1.2, size=3)
                processed = mesh.copy()
                processed.vertices *= scale
            
            elif technique == "noise":
                # Add random vertex displacement
                processed = mesh.copy()
                noise = np.random.normal(0, 0.02, size=processed.vertices.shape)
                processed.vertices += noise
            
            # Convert processed mesh to JSON-compatible format
            result_data = {
                "vertices": processed.vertices.tolist(),
                "faces": processed.faces.tolist()
            }
            results[technique] = json.dumps(result_data)
            
    except Exception as e:
        results["error"] = str(e)
    
    return results 