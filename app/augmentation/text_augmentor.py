import nltk
from nltk.corpus import wordnet
import random
from typing import List

nltk.download('wordnet')

def augment(file_path: str, techniques: List[str]) -> dict:
    """Apply augmentation techniques to the text"""
    results = {}
    
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            text = file.read()
        
        words = text.split()
        
        for technique in techniques:
            if technique == "synonym":
                # Replace random words with synonyms
                augmented_words = words.copy()
                for i in range(len(augmented_words)):
                    if random.random() < 0.3:  # 30% chance to replace word
                        syns = wordnet.synsets(augmented_words[i])
                        if syns:
                            augmented_words[i] = random.choice(syns).lemmas()[0].name()
                results[technique] = ' '.join(augmented_words)
            
            elif technique == "insertion":
                # Insert random words from the text
                augmented_words = words.copy()
                for i in range(len(augmented_words)):
                    if random.random() < 0.2:  # 20% chance to insert word
                        augmented_words.insert(i, random.choice(words))
                results[technique] = ' '.join(augmented_words)
            
    except Exception as e:
        results["error"] = str(e)
    
    return results 