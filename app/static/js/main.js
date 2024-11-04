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
                resultsContainer.appendChild(resultElement);
            } else if (currentFileType === 'text') {
                resultElement.innerHTML = `
                    <h3 class="font-semibold mb-2">${prefix} - ${technique}</h3>
                    <pre class="whitespace-pre-wrap">${result}</pre>
                `;
                resultsContainer.appendChild(resultElement);
            } else if (currentFileType === 'audio') {
                resultElement.innerHTML = `
                    <h3 class="font-semibold mb-2">${prefix} - ${technique}</h3>
                    <audio controls src="data:audio/wav;base64,${result}"></audio>
                `;
                resultsContainer.appendChild(resultElement);
            } else if (currentFileType === '3d') {
                try {
                    const meshData = JSON.parse(result);
                    resultElement.innerHTML = `
                        <h3 class="font-semibold mb-2">${prefix} - ${technique}</h3>
                        <div id="result-${technique}" class="w-full h-[400px]"></div>
                        <details class="mt-2">
                            <summary class="cursor-pointer text-sm text-gray-600">Show Details</summary>
                            <pre class="text-xs mt-2">${JSON.stringify(meshData, null, 2)}</pre>
                        </details>
                    `;
                    resultsContainer.appendChild(resultElement);

                    // Initialize 3D viewer after the element is added to DOM
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
                    resultsContainer.appendChild(resultElement);
                }
            }
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
}); 