document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const previewSection = document.getElementById('previewSection');
    const processingSection = document.getElementById('processingSection');
    const augmentationSection = document.getElementById('augmentationSection');
    const resultsSection = document.getElementById('resultsSection');

    let currentFile = null;
    let currentFileType = null;

    fileInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/upload/', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            if (data.error) {
                alert(data.error);
                return;
            }

            currentFile = data.filename;
            currentFileType = data.file_type;

            // Show preview
            previewSection.classList.remove('hidden');
            const previewElement = document.getElementById('preview');
            
            if (currentFileType === 'image') {
                previewElement.innerHTML = `<img src="data:image/png;base64,${data.preview}" class="max-w-full h-auto" />`;
            } else if (currentFileType === 'text') {
                previewElement.innerHTML = `<pre class="whitespace-pre-wrap">${data.preview}</pre>`;
            } else if (currentFileType === 'audio') {
                previewElement.innerHTML = `<audio controls src="data:audio/wav;base64,${data.preview}"></audio>`;
            } else if (currentFileType === '3d') {
                previewElement.innerHTML = `<pre>${data.preview}</pre>`;
            }

            // Show processing options
            showProcessingOptions(currentFileType);
            showAugmentationOptions(currentFileType);

        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while uploading the file');
        }
    });

    function showProcessingOptions(fileType) {
        processingSection.classList.remove('hidden');
        const optionsContainer = document.getElementById('preprocessingOptions');
        optionsContainer.innerHTML = '';

        const options = getProcessingOptions(fileType);
        options.forEach(option => {
            optionsContainer.innerHTML += `
                <label class="flex items-center space-x-2">
                    <input type="checkbox" value="${option.value}" class="processing-option">
                    <span>${option.label}</span>
                </label>
            `;
        });
    }

    function showAugmentationOptions(fileType) {
        augmentationSection.classList.remove('hidden');
        const optionsContainer = document.getElementById('augmentationOptions');
        optionsContainer.innerHTML = '';

        const options = getAugmentationOptions(fileType);
        options.forEach(option => {
            optionsContainer.innerHTML += `
                <label class="flex items-center space-x-2">
                    <input type="checkbox" value="${option.value}" class="augmentation-option">
                    <span>${option.label}</span>
                </label>
            `;
        });
    }

    function getProcessingOptions(fileType) {
        switch (fileType) {
            case 'image':
                return [
                    { value: 'grayscale', label: 'Convert to Grayscale' },
                    { value: 'resize', label: 'Resize (224x224)' },
                    { value: 'normalize', label: 'Normalize' }
                ];
            case 'text':
                return [
                    { value: 'lowercase', label: 'Convert to Lowercase' },
                    { value: 'remove_punctuation', label: 'Remove Punctuation' },
                    { value: 'tokenize', label: 'Tokenize' },
                    { value: 'remove_stopwords', label: 'Remove Stopwords' }
                ];
            case 'audio':
                return [
                    { value: 'normalize', label: 'Normalize' },
                    { value: 'noise_reduction', label: 'Noise Reduction' },
                    { value: 'trim_silence', label: 'Trim Silence' }
                ];
            case '3d':
                return [
                    { value: 'normalize', label: 'Normalize' },
                    { value: 'center', label: 'Center' },
                    { value: 'simplify', label: 'Simplify' }
                ];
            default:
                return [];
        }
    }

    function getAugmentationOptions(fileType) {
        switch (fileType) {
            case 'image':
                return [
                    { value: 'flip', label: 'Flip' },
                    { value: 'rotate', label: 'Rotate' },
                    { value: 'noise', label: 'Add Noise' }
                ];
            case 'text':
                return [
                    { value: 'synonym', label: 'Synonym Replacement' },
                    { value: 'insertion', label: 'Random Insertion' }
                ];
            case 'audio':
                return [
                    { value: 'pitch_shift', label: 'Pitch Shift' },
                    { value: 'time_stretch', label: 'Time Stretch' },
                    { value: 'reverse', label: 'Reverse' }
                ];
            case '3d':
                return [
                    { value: 'rotate', label: 'Rotate' },
                    { value: 'scale', label: 'Scale' },
                    { value: 'noise', label: 'Add Noise' }
                ];
            default:
                return [];
        }
    }

    // Process button click handler
    document.getElementById('processBtn').addEventListener('click', async function() {
        const selectedOptions = Array.from(document.querySelectorAll('.processing-option:checked'))
            .map(option => option.value);

        if (selectedOptions.length === 0) {
            alert('Please select at least one processing option');
            return;
        }

        try {
            const response = await fetch(`/preprocess/${currentFileType}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filename: currentFile,
                    techniques: selectedOptions
                })
            });

            const results = await response.json();
            if (results.error) {
                alert(results.error);
                return;
            }
            displayResults(results, 'Processed');
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred during processing');
        }
    });

    // Augment button click handler
    document.getElementById('augmentBtn').addEventListener('click', async function() {
        const selectedOptions = Array.from(document.querySelectorAll('.augmentation-option:checked'))
            .map(option => option.value);

        if (selectedOptions.length === 0) {
            alert('Please select at least one augmentation option');
            return;
        }

        try {
            const response = await fetch(`/augment/${currentFileType}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filename: currentFile,
                    techniques: selectedOptions
                })
            });

            const results = await response.json();
            if (results.error) {
                alert(results.error);
                return;
            }
            displayResults(results, 'Augmented');
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred during augmentation');
        }
    });

    function displayResults(results, prefix) {
        resultsSection.classList.remove('hidden');
        const resultsContainer = document.getElementById('results');
        resultsContainer.innerHTML = '';

        Object.entries(results).forEach(([technique, result]) => {
            const resultElement = document.createElement('div');
            resultElement.className = 'border p-4 rounded';
            
            if (currentFileType === 'image') {
                resultElement.innerHTML = `
                    <h3 class="font-semibold mb-2">${prefix} - ${technique}</h3>
                    <img src="data:image/png;base64,${result}" class="max-w-full h-auto" />
                `;
            } else if (currentFileType === 'text') {
                resultElement.innerHTML = `
                    <h3 class="font-semibold mb-2">${prefix} - ${technique}</h3>
                    <pre class="whitespace-pre-wrap">${result}</pre>
                `;
            } else if (currentFileType === 'audio') {
                resultElement.innerHTML = `
                    <h3 class="font-semibold mb-2">${prefix} - ${technique}</h3>
                    <audio controls src="data:audio/wav;base64,${result}"></audio>
                `;
            } else if (currentFileType === '3d') {
                resultElement.innerHTML = `
                    <h3 class="font-semibold mb-2">${prefix} - ${technique}</h3>
                    <pre>${result}</pre>
                `;
            }

            resultsContainer.appendChild(resultElement);
        });
    }
}); 