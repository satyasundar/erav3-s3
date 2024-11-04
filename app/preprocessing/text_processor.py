import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import string
import pandas as pd
import base64
from typing import List

# Download required NLTK data
nltk.download('punkt')
nltk.download('stopwords')

def get_preview(file_path: str) -> str:
    """Return preview of the text file"""
    try:
        if file_path.endswith('.csv'):
            df = pd.read_csv(file_path)
            preview = df.head().to_string()
        else:
            with open(file_path, 'r', encoding='utf-8') as file:
                preview = file.read(1000)  # Read first 1000 characters
        return preview
    except Exception as e:
        return f"Error reading file: {str(e)}"

def process(file_path: str, techniques: List[str]) -> dict:
    """Apply preprocessing techniques to the text"""
    results = {}
    
    try:
        # Read the text file
        if file_path.endswith('.csv'):
            df = pd.read_csv(file_path)
            text = df.to_string()
        else:
            with open(file_path, 'r', encoding='utf-8') as file:
                text = file.read()
        
        for technique in techniques:
            if technique == "lowercase":
                results[technique] = text.lower()
            
            elif technique == "remove_punctuation":
                translator = str.maketrans('', '', string.punctuation)
                results[technique] = text.translate(translator)
            
            elif technique == "tokenize":
                tokens = word_tokenize(text)
                results[technique] = ' '.join(tokens)
            
            elif technique == "remove_stopwords":
                stop_words = set(stopwords.words('english'))
                tokens = word_tokenize(text.lower())
                filtered_text = [word for word in tokens if word not in stop_words]
                results[technique] = ' '.join(filtered_text)
                
    except Exception as e:
        results["error"] = str(e)
    
    return results 