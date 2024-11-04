document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const previewSection = document.getElementById('previewSection');
    const processingSection = document.getElementById('processingSection');
    const augmentationSection = document.getElementById('augmentationSection');
    const resultsSection = document.getElementById('resultsSection');

    let currentFile = null;
    let currentFileType = null;

    let previewRenderer, previewScene, previewCamera, previewControls;
    let resultRenderers = new Map();

    let currentPreprocessedImage = null;

    let originalPreview = null;

    let currentPreprocessedResult = null;

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
            originalPreview = data.preview;

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
                try {
                    const previewData = JSON.parse(data.preview);
                    previewElement.innerHTML = `
                        <div id="preview-container" class="w-full h-[400px]"></div>
                        <details class="mt-2">
                            <summary class="cursor-pointer text-sm text-gray-600">Show Details</summary>
                            <pre class="text-xs mt-2">${JSON.stringify(previewData.stats, null, 2)}</pre>
                        </details>
                    `;
                    
                    // Initialize 3D viewer after the element is added to DOM
                    setTimeout(() => {
                        const viewerData = init3DViewer('preview-container', {
                            vertices: previewData.vertices,
                            faces: previewData.faces
                        });
                        if (viewerData) {
                            previewRenderer = viewerData.renderer;
                            previewScene = viewerData.scene;
                            previewCamera = viewerData.camera;
                            previewControls = viewerData.controls;
                        }
                    }, 0);
                } catch (error) {
                    console.error('Error parsing 3D preview data:', error);
                    previewElement.innerHTML = `
                        <div class="text-red-500">Error displaying 3D model</div>
                        <pre class="text-xs mt-2">${data.preview}</pre>
                    `;
                }
            }

            // Show empty results section
            resultsSection.classList.remove('hidden');
            const resultsContainer = document.getElementById('results');
            resultsContainer.innerHTML = `
                <div class="flex items-center justify-center h-full text-gray-500">
                    <p>Process or augment the file to see results here</p>
                </div>
            `;

            // Show processing options
            showProcessingOptions(currentFileType);
            showAugmentationOptions(currentFileType);

        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while uploading the file');
        }
    });

    function showProcessingOptions(fileType) {
        // Show both preview and results sections
        previewSection.classList.remove('hidden');
        resultsSection.classList.remove('hidden');
        
        // Show processing section
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

        // Initialize empty results container with placeholder
        const resultsContainer = document.getElementById('results');
        resultsContainer.innerHTML = `
            <div class="flex items-center justify-center h-64 text-gray-500">
                <p>Process or augment the file to see results here</p>
            </div>
        `;
    }

    function showAugmentationOptions(fileType) {
        // Show augmentation section
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
                    techniques: selectedOptions,
                    preprocessed_result: currentPreprocessedResult
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
            resultElement.className = 'border p-4 rounded mb-4';
            
            if (currentFileType === 'image') {
                resultElement.innerHTML = `
                    <h3 class="font-semibold mb-2">${prefix} - ${technique}</h3>
                    <img src="data:image/png;base64,${result}" class="max-w-full h-auto mb-2" />
                    <div class="mt-4">
                        <button class="use-for-augmentation bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                data-result="${result}" data-type="image">
                            Use for Augmentation
                        </button>
                    </div>
                `;
            } else if (currentFileType === 'text') {
                resultElement.innerHTML = `
                    <h3 class="font-semibold mb-2">${prefix} - ${technique}</h3>
                    <pre class="whitespace-pre-wrap mb-2">${result}</pre>
                    <div class="mt-4">
                        <button class="use-for-augmentation bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                data-result="${encodeURIComponent(result)}" data-type="text">
                            Use for Augmentation
                        </button>
                    </div>
                `;
            } else if (currentFileType === 'audio') {
                resultElement.innerHTML = `
                    <h3 class="font-semibold mb-2">${prefix} - ${technique}</h3>
                    <audio controls src="data:audio/wav;base64,${result}" class="mb-2"></audio>
                    <div class="mt-4">
                        <button class="use-for-augmentation bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                data-result="${result}" data-type="audio">
                            Use for Augmentation
                        </button>
                    </div>
                `;
            } else if (currentFileType === '3d') {
                try {
                    const meshData = JSON.parse(result);
                    resultElement.innerHTML = `
                        <h3 class="font-semibold mb-2">${prefix} - ${technique}</h3>
                        <div id="result-${technique}" class="w-full h-[400px]"></div>
                        <details class="mt-2 mb-2">
                            <summary class="cursor-pointer text-sm text-gray-600">Show Details</summary>
                            <pre class="text-xs mt-2">${JSON.stringify(meshData, null, 2)}</pre>
                        </details>
                        <div class="mt-4">
                            <button class="use-for-augmentation bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                    data-result="${encodeURIComponent(result)}" data-type="3d">
                                Use for Augmentation
                            </button>
                        </div>
                    `;
                    resultsContainer.appendChild(resultElement);

                    setTimeout(() => {
                        const viewerData = init3DViewer(`result-${technique}`, {
                            vertices: meshData.vertices,
                            faces: meshData.faces
                        });
                        if (viewerData) {
                            resultRenderers.set(`result-${technique}`, viewerData);
                        }
                    }, 0);
                } catch (error) {
                    console.error('Error parsing 3D result:', error);
                    resultElement.innerHTML = `
                        <h3 class="font-semibold mb-2">${prefix} - ${technique}</h3>
                        <div class="text-red-500">Error displaying 3D model</div>
                        <pre class="text-xs mt-2">${result}</pre>
                    `;
                }
            }

            // Add click handler for the "Use for Augmentation" button
            resultElement.querySelector('.use-for-augmentation')?.addEventListener('click', function() {
                const resultData = this.getAttribute('data-result');
                const resultType = this.getAttribute('data-type');
                
                // Store the selected preprocessed result
                currentPreprocessedResult = resultData;
                
                // Update preview to show selected result
                const previewElement = document.getElementById('preview');
                const previewSection = document.getElementById('previewSection');
                
                // Update the preview section heading
                const previewHeading = previewSection.querySelector('h2');
                previewHeading.innerHTML = `
                    <div class="flex items-center">
                        <span class="text-blue-600">Using Preprocessed ${resultType.charAt(0).toUpperCase() + resultType.slice(1)}</span>
                        <button class="ml-2 text-sm text-gray-500 hover:text-gray-700" onclick="resetPreview()">
                            (Reset)
                        </button>
                    </div>
                `;

                // Update preview content based on file type
                if (resultType === 'image') {
                    previewElement.innerHTML = `
                        <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                            <div class="flex items-center">
                                <div class="flex-shrink-0">
                                    <svg class="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <p class="text-sm text-blue-700">Selected for augmentation</p>
                                </div>
                            </div>
                        </div>
                        <div class="flex justify-center">
                            <img src="data:image/png;base64,${resultData}" class="max-w-full h-auto rounded shadow-lg" />
                        </div>
                    `;
                } else if (resultType === 'text') {
                    previewElement.innerHTML = `
                        <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                            <div class="flex items-center">
                                <div class="flex-shrink-0">
                                    <svg class="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <p class="text-sm text-blue-700">Selected for augmentation</p>
                                </div>
                            </div>
                        </div>
                        <pre class="whitespace-pre-wrap">${decodeURIComponent(resultData)}</pre>
                    `;
                } else if (resultType === 'audio') {
                    previewElement.innerHTML = `
                        <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                            <div class="flex items-center">
                                <div class="flex-shrink-0">
                                    <svg class="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <p class="text-sm text-blue-700">Selected for augmentation</p>
                                </div>
                            </div>
                        </div>
                        <audio controls src="data:audio/wav;base64,${resultData}"></audio>
                    `;
                } else if (resultType === '3d') {
                    const meshData = JSON.parse(decodeURIComponent(resultData));
                    previewElement.innerHTML = `
                        <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                            <div class="flex items-center">
                                <div class="flex-shrink-0">
                                    <svg class="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                                    </svg>
                                </div>
                                <div class="ml-3">
                                    <p class="text-sm text-blue-700">Selected for augmentation</p>
                                </div>
                            </div>
                        </div>
                        <div id="preview-container" class="w-full h-[400px]"></div>
                    `;

                    setTimeout(() => {
                        const viewerData = init3DViewer('preview-container', {
                            vertices: meshData.vertices,
                            faces: meshData.faces
                        });
                        if (viewerData) {
                            previewRenderer = viewerData.renderer;
                            previewScene = viewerData.scene;
                            previewCamera = viewerData.camera;
                            previewControls = viewerData.controls;
                        }
                    }, 0);
                }

                // Scroll to augmentation section
                augmentationSection.scrollIntoView({ behavior: 'smooth' });
            });

            resultsContainer.appendChild(resultElement);
        });
    }

    // Add this function to initialize 3D viewer
    function init3DViewer(containerId, data) {
        try {
            console.log('Initializing 3D viewer for', containerId);
            console.log('Data:', data);
            
            const container = document.getElementById(containerId);
            if (!container) {
                console.error('Container not found:', containerId);
                return null;
            }

            const width = container.clientWidth;
            const height = 400;

            // Create scene
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0xf0f0f0);

            // Create camera
            const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
            camera.position.z = 2;

            // Create renderer
            const renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(width, height);
            container.innerHTML = '';
            container.appendChild(renderer.domElement);

            // Create controls
            if (typeof THREE.OrbitControls === 'undefined') {
                console.error('OrbitControls not loaded');
                return null;
            }
            
            const controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;

            // Create geometry from the data
            const geometry = new THREE.BufferGeometry();
            
            // Convert vertices array to Float32Array
            const vertices = new Float32Array(data.vertices.flat());
            geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

            // Convert faces array to Uint16Array for indices
            const indices = new Uint16Array(data.faces.flat());
            geometry.setIndex(new THREE.BufferAttribute(indices, 1));

            // Calculate normals
            geometry.computeVertexNormals();

            // Create material with better appearance
            const material = new THREE.MeshStandardMaterial({
                color: 0x808080,  // Gray color instead of blue
                roughness: 0.5,   // Add some roughness
                metalness: 0.5,   // Add some metallic effect
                side: THREE.DoubleSide
            });

            // Create mesh
            const mesh = new THREE.Mesh(geometry, material);
            scene.add(mesh);

            // Add better lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            scene.add(ambientLight);

            const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight1.position.set(1, 1, 1);
            scene.add(directionalLight1);

            const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
            directionalLight2.position.set(-1, -1, -1);
            scene.add(directionalLight2);

            // Center and scale the mesh
            geometry.computeBoundingSphere();
            const center = geometry.boundingSphere.center;
            const radius = geometry.boundingSphere.radius;
            
            mesh.position.sub(center);
            const scale = 1 / radius;
            mesh.scale.multiplyScalar(scale);

            // Animation loop
            function animate() {
                requestAnimationFrame(animate);
                controls.update();
                renderer.render(scene, camera);
            }
            animate();

            console.log('3D viewer initialized successfully');
            return { renderer, scene, camera, controls };
        } catch (error) {
            console.error('Error initializing 3D viewer:', error);
            return null;
        }
    }

    // Add window resize handler
    window.addEventListener('resize', function() {
        if (previewRenderer) {
            const container = document.getElementById('preview-container');
            const width = container.clientWidth;
            const height = 400;
            
            previewCamera.aspect = width / height;
            previewCamera.updateProjectionMatrix();
            previewRenderer.setSize(width, height);
        }

        resultRenderers.forEach((data, containerId) => {
            const container = document.getElementById(containerId);
            if (container) {
                const width = container.clientWidth;
                const height = 400;
                
                data.camera.aspect = width / height;
                data.camera.updateProjectionMatrix();
                data.renderer.setSize(width, height);
            }
        });
    });

    // Add this function to reset the preview section
    window.resetPreview = function() {
        const previewSection = document.getElementById('previewSection');
        const previewHeading = previewSection.querySelector('h2');
        previewHeading.textContent = 'File Preview';
        
        const previewElement = document.getElementById('preview');
        if (currentFileType === 'image') {
            previewElement.innerHTML = `<img src="data:image/png;base64,${originalPreview}" class="max-w-full h-auto" />`;
        } else if (currentFileType === 'text') {
            previewElement.innerHTML = `<pre class="whitespace-pre-wrap">${originalPreview}</pre>`;
        } else if (currentFileType === 'audio') {
            previewElement.innerHTML = `<audio controls src="data:audio/wav;base64,${originalPreview}"></audio>`;
        } else if (currentFileType === '3d') {
            try {
                const previewData = JSON.parse(originalPreview);
                previewElement.innerHTML = `
                    <div id="preview-container" class="w-full h-[400px]"></div>
                    <details class="mt-2">
                        <summary class="cursor-pointer text-sm text-gray-600">Show Details</summary>
                        <pre class="text-xs mt-2">${JSON.stringify(previewData.stats, null, 2)}</pre>
                    </details>
                `;
                
                setTimeout(() => {
                    const viewerData = init3DViewer('preview-container', {
                        vertices: previewData.vertices,
                        faces: previewData.faces
                    });
                    if (viewerData) {
                        previewRenderer = viewerData.renderer;
                        previewScene = viewerData.scene;
                        previewCamera = viewerData.camera;
                        previewControls = viewerData.controls;
                    }
                }, 0);
            } catch (error) {
                console.error('Error resetting 3D preview:', error);
            }
        }
        currentPreprocessedResult = null;
    };
}); 