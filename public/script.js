document.addEventListener('DOMContentLoaded', function() {
    const dropArea = document.getElementById('dropArea');
    const fileInput = document.getElementById('fileInput');
    const serviceList = document.getElementById('serviceList');
    const resultsDiv = document.getElementById('results');
    const loadingModal = document.getElementById('loadingModal');
    
    let selectedService = null;
    let availableServices = [];
    
    // Load available services
    loadServices();
    
    // Handle drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.classList.add('highlight');
    }
    
    function unhighlight() {
        dropArea.classList.remove('highlight');
    }
    
    dropArea.addEventListener('drop', handleDrop, false);
    fileInput.addEventListener('change', handleFiles);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles({ target: { files } });
    }
    
    function handleFiles(e) {
        const files = e.target.files;
        if (!files.length) return;
        
        if (!selectedService) {
            alert('Please select an upload service first');
            return;
        }
        
        uploadFile(files[0]);
    }
    
    // Load available services from the backend
    async function loadServices() {
        try {
            const response = await fetch('/api/upload?action=list');
            const data = await response.json();
            
            if (data.success && data.services && data.services.length) {
                availableServices = data.services;
                renderServices();
            } else {
                serviceList.innerHTML = '<div class="error">Failed to load services. Please refresh the page.</div>';
            }
        } catch (error) {
            console.error('Error loading services:', error);
            serviceList.innerHTML = '<div class="error">Error loading services. Please check your connection.</div>';
        }
    }
    
    // Render available services
    function renderServices() {
        serviceList.innerHTML = '';
        
        availableServices.forEach((service, index) => {
            const serviceOption = document.createElement('div');
            serviceOption.className = 'service-option';
            serviceOption.innerHTML = `
                <input type="radio" name="service" id="service-${index}" value="${service}">
                <label for="service-${index}">${service}</label>
            `;
            
            serviceOption.addEventListener('click', () => {
                selectedService = service;
                document.querySelectorAll('.service-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                serviceOption.classList.add('selected');
            });
            
            serviceList.appendChild(serviceOption);
        });
    }
    
    // Upload file to the selected service
    async function uploadFile(file) {
        if (!file || !selectedService) return;
        
        // Show loading modal
        loadingModal.style.display = 'flex';
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('service', selectedService);
            
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                showResult(result);
            } else {
                throw new Error(result.message || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert(`Upload failed: ${error.message}`);
        } finally {
            loadingModal.style.display = 'none';
        }
    }
    
    // Show upload result
    function showResult(result) {
        resultsDiv.innerHTML = '';
        
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        
        let resultHTML = `
            <div class="result-title">
                <i class="fas fa-check-circle"></i>
                Upload successful to ${selectedService}
            </div>
        `;
        
        // Display all returned data
        for (const [key, value] of Object.entries(result.data)) {
            if (key === 'success') continue;
            
            resultHTML += `
                <div><strong>${key}:</strong></div>
                <div class="result-url">
                    ${value}
                    <button class="copy-btn" data-url="${value}">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                </div>
            `;
        }
        
        resultItem.innerHTML = resultHTML;
        resultsDiv.appendChild(resultItem);
        
        // Add copy functionality
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const url = this.getAttribute('data-url');
                navigator.clipboard.writeText(url).then(() => {
                    const originalText = this.innerHTML;
                    this.innerHTML = '<i class="fas fa-check"></i> Copied!';
                    setTimeout(() => {
                        this.innerHTML = originalText;
                    }, 2000);
                });
            });
        });
    }
});
