console.log('CamToCam App Loading...');
// Écouteur pour le bouton "Démarrer"const socket = io();

class CamToCamApp {
    constructor() {
        console.log('Initializing CamToCam App...');
        this.socket = io(); // socket stocké dans l'objet
        // Initialize Socket.IO with better error handling
        this.initializeSocket();
        
        this.localStream = null;
        this.remoteStream = null;
        this.peerConnection = null;
        this.currentUser = null;
        this.isAuthenticated = false;
        this.isConnected = false;
        
        this.initializeElements();
        this.setupEventListeners();
        

        this.setupSocketListeners();
        this.checkAuthentication();
        this.checkMediaPermissions();
    }
// Écouteur pour le bouton "Démarrer"
setupEventListeners() {
    this.startBtn.addEventListener('click', () => {
        console.log("▶️ Démarrage de la caméra");

        // 🔴 Informer le serveur
        this.socket.emit("start-record", {
            time: new Date().toISOString()
        });
    });

    this.stopBtn.addEventListener('click', () => {
        console.log("⏹️ Arrêt de la caméra");

        // 🔴 Informer le serveur
        this.socket.emit("stop-record", {
            time: new Date().toISOString()
        });
    });
}

    // Initialize Socket.IO with better error handling

    initializeSocket() {
        try {
            if (typeof io !== 'undefined') {
                this.socket = io({
                    transports: ['websocket', 'polling'],
                    timeout: 20000,
                    reconnection: true,
                    reconnectionDelay: 1000,
                    reconnectionAttempts: 5,
                    maxReconnectionAttempts: 5
                });
                console.log('✅ Socket.IO initialized');
            } else {
                console.error('❌ Socket.IO not loaded!');
                this.showError('Socket.IO failed to load. Please refresh the page.');
                return;
            }
        } catch (error) {
            console.error('❌ Socket initialization error:', error);
            this.showError('Connection failed. Please refresh the page.');
        }
    }

    async checkMediaPermissions() {
        try {
            // Check if getUserMedia is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                this.showError('Your browser does not support camera/microphone access. Please use a modern browser like Chrome, Firefox, or Safari.');
                return;
            }

            // Check current permissions
            if (navigator.permissions) {
                try {
                    const cameraPermission = await navigator.permissions.query({ name: 'camera' });
                    const microphonePermission = await navigator.permissions.query({ name: 'microphone' });
                    
                    console.log('Camera permission:', cameraPermission.state);
                    console.log('Microphone permission:', microphonePermission.state);
                    
                    if (cameraPermission.state === 'denied' || microphonePermission.state === 'denied') {
                        this.showMediaPermissionError();
                    }
                } catch (permError) {
                    console.log('Permission API not fully supported, will check during media access');
                }
            }
        } catch (error) {
            console.error('Error checking media permissions:', error);
        }
    }

    showMediaPermissionError() {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'media-permission-error';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #fed7d7;
            color: #742a2a;
            padding: 1rem 2rem;
            border-radius: 10px;
            border: 1px solid #feb2b2;
            z-index: 10000;
            max-width: 500px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        
        errorDiv.innerHTML = `
            <h4>🎥 Camera/Microphone Access Required</h4>
            <p>To use video chat, please:</p>
            <ol style="text-align: left; margin: 1rem 0;">
                <li>Click the camera icon in your browser's address bar</li>
                <li>Select "Allow" for both camera and microphone</li>
                <li>Refresh the page if needed</li>
            </ol>
            <button onclick="this.parentElement.remove()" style="
                margin-top: 0.5rem;
                padding: 0.5rem 1rem;
                background: #742a2a;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            ">Got it</button>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Auto-remove after 15 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 15000);
    }

    // Add this method to handle video loading states
    handleVideoLoaded(videoElement, wrapperElement) {
        if (videoElement && wrapperElement) {
            videoElement.addEventListener('loadeddata', () => {
                wrapperElement.classList.add('video-loaded');
                console.log('✅ Video loaded:', videoElement.id);
            });
            
            videoElement.addEventListener('playing', () => {
                wrapperElement.classList.add('video-loaded');
                console.log('▶️ Video playing:', videoElement.id);
            });
            
            videoElement.addEventListener('loadstart', () => {
                wrapperElement.classList.remove('video-loaded');
                console.log('🔄 Video loading:', videoElement.id);
            });
        }
    }

    initializeElements() {
        console.log('Initializing elements...');
        
        // Auth elements
        this.authModal = document.getElementById('authModal');
        this.authForm = document.getElementById('authForm');
        this.authTitle = document.getElementById('authTitle');
        this.authSubmit = document.getElementById('authSubmit');
        this.authToggle = document.getElementById('authToggle');
        this.authToggleText = document.getElementById('authToggleText');
        this.registerFields = document.getElementById('registerFields');
        this.emailInput = document.getElementById('email');
        this.usernameInput = document.getElementById('username');
        this.passwordInput = document.getElementById('password');

        // App elements
        this.app = document.getElementById('app');
        this.currentUserSpan = document.getElementById('currentUser');
        this.logoutBtn = document.getElementById('logoutBtn');
        this.localVideo = document.getElementById('localVideo');
        this.remoteVideo = document.getElementById('remoteVideo');
        this.startBtn = document.getElementById('startBtn');
        this.skipBtn = document.getElementById('skipBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.status = document.getElementById('status');
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');

        // Get video wrapper elements
        this.localVideoWrapper = this.localVideo?.parentElement;
        this.remoteVideoWrapper = this.remoteVideo?.parentElement;

        // Set up video loading handlers
        this.handleVideoLoaded(this.localVideo, this.localVideoWrapper);
        this.handleVideoLoaded(this.remoteVideo, this.remoteVideoWrapper);

        this.isLoginMode = true;
        
        console.log('✅ Elements initialized');
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Auth events
        if (this.authForm) {
            this.authForm.addEventListener('submit', (e) => {
                console.log('Form submitted');
                this.handleAuth(e);
            });
        }
        
        if (this.authToggle) {
            this.authToggle.addEventListener('click', (e) => {
                console.log('Toggle clicked');
                this.toggleAuthMode(e);
            });
        }
        
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => this.logout());
        }

        // Control events
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => this.startChat());
        }
        if (this.skipBtn) {
            this.skipBtn.addEventListener('click', () => this.skipPartner());
        }
        if (this.stopBtn) {
            this.stopBtn.addEventListener('click', () => this.stopChat());
        }

        // Chat events
        if (this.sendBtn) {
            this.sendBtn.addEventListener('click', () => this.sendMessage());
        }
        if (this.messageInput) {
            this.messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });
        }
        
        console.log('✅ Event listeners set up');
    }

    setupSocketListeners() {
        if (!this.socket) return;
        
        this.socket.on('connect', () => {
            console.log('✅ Connected to server');
            this.updateStatus('Connected to server');
            
            // Auto-login if user is authenticated
            if (this.isAuthenticated && this.currentUser) {
                console.log('🔐 Auto-logging in user:', this.currentUser);
                this.socket.emit('user-login', { username: this.currentUser });
            }
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Disconnected from server');
            this.updateStatus('Disconnected from server');
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ Connection error:', error);
            this.showError('Connection failed. Please check your internet connection.');
        });

        this.socket.on('login-success', (data) => {
            console.log('✅ Socket login success:', data);
            this.updateStatus('Successfully connected to server');
        });

        this.socket.on('login-error', (data) => {
            console.error('❌ Socket login error:', data);
            this.showError('Failed to connect to server. Please try logging in again.');
            // Optionally logout user
            this.logout();
        });
        
        this.socket.on('waiting-for-partner', () => {
            this.updateStatus('Looking for someone to chat with...');
            if (this.skipBtn) this.skipBtn.disabled = false;
        });

        this.socket.on('partner-found', async (data) => {
            console.log('🤝 Partner found!', data);
            this.updateStatus('Partner found! Connecting...');
            this.isConnected = true;
            
            if (this.skipBtn) this.skipBtn.disabled = false;
            if (this.stopBtn) this.stopBtn.disabled = false;
            if (this.startBtn) {
                this.startBtn.innerHTML = 'Connected';
                this.startBtn.disabled = true;
            }
            
            this.enableChat();
            
            // Create peer connection
            await this.createPeerConnection();
            
            // Only create offer if this user is the initiator
            if (data.isInitiator) {
                this.isInitiator = true;
                try {
                    console.log('📝 Creating offer as initiator');
                    const offer = await this.peerConnection.createOffer({
                        offerToReceiveAudio: true,
                        offerToReceiveVideo: true
                    });
                    await this.peerConnection.setLocalDescription(offer);
                    console.log('✅ Local description set (offer)');
                    
                    if (this.socket && this.socket.connected) {
                        console.log('📤 Sending offer');
                        this.socket.emit('offer', { offer });
                    }
                } catch (error) {
                    console.error('❌ Error creating offer:', error);
                    this.showError('Failed to initiate video connection');
                }
            } else {
                this.isInitiator = false;
                console.log('⏳ Waiting for offer from initiator');
            }
        });

        this.socket.on('partner-disconnected', () => {
            this.updateStatus('Partner disconnected');
            this.handlePartnerDisconnect();
        });

        this.socket.on('offer', async (data) => {
            await this.handleOffer(data.offer);
        });

        this.socket.on('answer', async (data) => {
            await this.handleAnswer(data.answer);
        });

        this.socket.on('ice-candidate', async (data) => {
            await this.handleIceCandidate(data.candidate);
        });

        this.socket.on('chat-message', (data) => {
            this.displayMessage(data.message, data.username, data.timestamp, false);
        });

        this.socket.on('error', (error) => {
            console.error('❌ Socket error:', error);
            if (error.message === 'User not authenticated') {
                this.showError('Authentication required. Please log in again.');
                this.logout();
            } else {
                this.showError('Connection error occurred');
            }
        });
    }

    checkAuthentication() {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');
        
        if (token && username) {
            this.currentUser = username;
            this.isAuthenticated = true;
            this.showApp();
        } else {
            this.showAuthModal();
        }
    }

    async handleAuth(e) {
        e.preventDefault();
        console.log('Handling authentication...');
        
        const username = this.usernameInput?.value?.trim();
        const password = this.passwordInput?.value;
        const email = this.emailInput?.value?.trim();

        // Validate required fields based on mode
        if (!username || !password) {
            this.showError('Please fill in all required fields');
            return;
        }

        if (!this.isLoginMode && !email) {
            this.showError('Email is required for registration');
            return;
        }

        // Additional validation
        if (username.length < 3) {
            this.showError('Username must be at least 3 characters long');
            return;
        }

        if (password.length < 6) {
            this.showError('Password must be at least 6 characters long');
            return;
        }

        if (!this.isLoginMode && email && !this.isValidEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        // Disable submit button to prevent double submission
        if (this.authSubmit) {
            this.authSubmit.disabled = true;
            this.authSubmit.textContent = this.isLoginMode ? 'Logging in...' : 'Registering...';
        }

        const endpoint = this.isLoginMode ? '/api/login' : '/api/register';
        const body = this.isLoginMode ? 
            { username, password } : 
            { username, password, email };

        try {
            console.log('Sending request to:', endpoint);
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(body)
            });

            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                console.error('Failed to parse JSON response:', jsonError);
                throw new Error('Server returned invalid response');
            }

            console.log('Response:', data);

            if (response.ok && data.success) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', data.username);
                this.currentUser = data.username;
                this.isAuthenticated = true;
                this.showApp();
                
                if (this.socket && this.socket.connected) {
                    this.socket.emit('user-login', { username: data.username });
                }
                
                this.showSuccess(`Welcome, ${data.username}!`);
            } else {
                this.showError(data.error || 'Authentication failed');
            }
        } catch (error) {
            console.error('Auth error:', error);
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                this.showError('Network error. Please check your connection and try again.');
            } else if (error.message.includes('JSON') || error.message.includes('invalid response')) {
                this.showError('Server error. Please try again later.');
            } else {
                this.showError('Authentication failed. Please try again.');
            }
        } finally {
            // Re-enable submit button
            if (this.authSubmit) {
                this.authSubmit.disabled = false;
                this.authSubmit.textContent = this.isLoginMode ? 'Login' : 'Register';
            }
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    toggleAuthMode(e) {
        e.preventDefault();
        console.log('Toggling auth mode...');
        
        this.isLoginMode = !this.isLoginMode;
        
        if (this.isLoginMode) {
            // Switch to Login mode
            this.authTitle.textContent = 'Login';
            this.authSubmit.textContent = 'Login';
            this.authToggleText.textContent = "Don't have an account?";
            this.authToggle.textContent = 'Register';
            this.registerFields.style.display = 'none';
            
            // Remove required attribute from email when hidden
            if (this.emailInput) {
                this.emailInput.removeAttribute('required');
                this.emailInput.value = ''; // Clear email field
            }
        } else {
            // Switch to Register mode
            this.authTitle.textContent = 'Register';
            this.authSubmit.textContent = 'Register';
            this.authToggleText.textContent = 'Already have an account?';
            this.authToggle.textContent = 'Login';
            this.registerFields.style.display = 'block';
            
            // Add required attribute to email when visible
            if (this.emailInput) {
                this.emailInput.setAttribute('required', 'required');
            }
        }
        
        // Clear any existing error messages
        this.clearError();
        
        // Clear form fields
        if (this.usernameInput) this.usernameInput.value = '';
        if (this.passwordInput) this.passwordInput.value = '';
if (this.emailInput) this.emailInput.value = '';
    }

    showAuthModal() {
        if (this.authModal) this.authModal.style.display = 'flex';
        if (this.app) this.app.style.display = 'none';
    }

    showApp() {
        if (this.authModal) this.authModal.style.display = 'none';
        if (this.app) this.app.style.display = 'block';
        if (this.currentUserSpan) this.currentUserSpan.textContent = this.currentUser;
        
        // Ensure socket is authenticated when showing app
        if (this.socket && this.socket.connected && this.currentUser) {
            this.socket.emit('user-login', { username: this.currentUser });
        }
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        this.currentUser = null;
        this.isAuthenticated = false;
        this.stopChat();
        this.showAuthModal();
        
        if (this.socket && this.socket.connected) {
            this.socket.disconnect();
        }
    }

    async startChat() {
        try {
            // Check if socket is connected
            if (!this.socket || !this.socket.connected) {
                this.showError('Not connected to server. Please refresh the page.');
                return;
            }

            // Show loading state
            if (this.startBtn) {
                this.startBtn.disabled = true;
                this.startBtn.innerHTML = '<span class="loading"></span>Accessing Camera...';
            }

            // Remove video-loaded class to show loading spinner
            if (this.localVideoWrapper) {
                this.localVideoWrapper.classList.remove('video-loaded');
            }

            // Check if getUserMedia is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Your browser does not support camera/microphone access. Please use Chrome, Firefox, Safari, or Edge.');
            }

            console.log('🎥 Requesting camera and microphone access...');
            
            // Request user media with better constraints
            const constraints = {
                video: {
                    width: { min: 640, ideal: 1280, max: 1920 },
                    height: { min: 480, ideal: 720, max: 1080 },
                    frameRate: { min: 15, ideal: 30, max: 60 },
                    facingMode: 'user'
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100
                }
            };

            try {
                this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
                console.log('✅ Camera and microphone access granted');
            } catch (mediaError) {
                console.error('❌ Media access error:', mediaError);
                
                // Try with lower quality settings
                console.log('🔄 Trying with basic settings...');
                const basicConstraints = {
                    video: true,
                    audio: true
                };
                
                try {
                    this.localStream = await navigator.mediaDevices.getUserMedia(basicConstraints);
                    console.log('✅ Camera and microphone access granted (basic quality)');
                } catch (basicError) {
                    throw basicError;
                }
            }
            
            if (this.localVideo) {
                this.localVideo.srcObject = this.localStream;
                console.log('✅ Local video stream set');
                
                // The loading animation will be hidden by the video event handlers
            }
            
            // Update UI
            if (this.startBtn) {
                this.startBtn.innerHTML = 'Finding Partner...';
            }
            this.updateStatus('Looking for someone to chat with...');
            
            // Find partner
            this.socket.emit('find-partner');
            
        } catch (error) {
            console.error('❌ Error accessing media devices:', error);
            
            let errorMessage = 'Could not access camera/microphone. ';
            let showPermissionHelp = false;
            
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMessage = 'Camera/microphone access denied. ';
                showPermissionHelp = true;
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                errorMessage = 'No camera or microphone found. Please connect a camera and microphone.';
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                errorMessage = 'Camera or microphone is already in use by another application.';
            } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
                errorMessage = 'Camera/microphone does not meet requirements. Trying basic settings...';
            } else if (error.name === 'NotSupportedError') {
                errorMessage = 'Your browser does not support camera/microphone access. Please use Chrome, Firefox, Safari, or Edge.';
            } else if (error.name === 'SecurityError') {
                errorMessage = 'Camera/microphone access blocked due to security restrictions. Please use HTTPS or localhost.';
            } else {
                errorMessage += 'Please check your device permissions and try again.';
                showPermissionHelp = true;
            }
            
            this.showError(errorMessage);
            
            if (showPermissionHelp) {
                this.showMediaPermissionHelp();
            }
            
            // Re-enable start button
            if (this.startBtn) {
                this.startBtn.disabled = false;
                this.startBtn.innerHTML = 'Start Chat';
            }
        }
    }

    showMediaPermissionHelp() {
        setTimeout(() => {
            const helpDiv = document.createElement('div');
            helpDiv.className = 'permission-help';
            helpDiv.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 2rem;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                z-index: 10001;
                max-width: 500px;
                text-align: center;
                border: 2px solid #667eea;
            `;
            
            const isChrome = /Chrome/.test(navigator.userAgent);
            const isFirefox = /Firefox/.test(navigator.userAgent);
            const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
            
            let instructions = '';
            if (isChrome) {
                instructions = `
                    <h3>🎥 Enable Camera & Microphone in Chrome</h3>
                    <ol style="text-align: left; margin: 1rem 0;">
                        <li>Look for the camera icon in the address bar</li>
                        <li>Click it and select "Always allow"</li>
                        <li>Or go to Settings → Privacy → Site Settings → Camera/Microphone</li>
                        <li>Refresh this page</li>
                    </ol>
                `;
            } else if (isFirefox) {
                instructions = `
                    <h3>🎥 Enable Camera & Microphone in Firefox</h3>
                    <ol style="text-align: left; margin: 1rem 0;">
                        <li>Look for the camera/microphone icon in the address bar</li>
                        <li>Click it and select "Allow"</li>
                        <li>Check "Remember this decision"</li>
                        <li>Refresh this page</li>
                    </ol>
                `;
            } else if (isSafari) {
                instructions = `
                    <h3>🎥 Enable Camera & Microphone in Safari</h3>
                    <ol style="text-align: left; margin: 1rem 0;">
                        <li>Go to Safari → Preferences → Websites</li>
                        <li>Select Camera and Microphone</li>
                        <li>Set this website to "Allow"</li>
                        <li>Refresh this page</li>
                    </ol>
                `;
            } else {
                instructions = `
                    <h3>🎥 Enable Camera & Microphone</h3>
                    <ol style="text-align: left; margin: 1rem 0;">
                        <li>Look for camera/microphone icons in your browser</li>
                        <li>Click and select "Allow" or "Always allow"</li>
                        <li>Check your browser's site settings</li>
                        <li>Refresh this page</li>
                    </ol>
                `;
            }
            
            helpDiv.innerHTML = `
                ${instructions}
                <div style="margin-top: 1.5rem;">
                    <button onclick="location.reload()" style="
                        padding: 0.75rem 1.5rem;
                        background: #667eea;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        margin-right: 1rem;
                        font-weight: bold;
                    ">Refresh Page</button>
                    <button onclick="this.parentElement.parentElement.remove()" style="
                        padding: 0.75rem 1.5rem;
                        background: #gray;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        background: #718096;
                    ">Close</button>
                </div>
            `;
            
            document.body.appendChild(helpDiv);
        }, 1000);
    }

    skipPartner() {
        console.log('🔄 Skipping current partner...');
        
        if (this.socket && this.socket.connected) {
            this.socket.emit('skip-partner');
        }
        
        // Clear current connection immediately
        this.handlePartnerDisconnect();

        
        // Update UI to show searching state
        this.updateStatus('Looking for someone new to chat with...');
        if (this.skipBtn) this.skipBtn.disabled = false;
        if (this.stopBtn) this.stopBtn.disabled = false;
    }

    stopChat() {
        console.log('🛑 Stopping chat...');
        
        // Stop local stream
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                track.stop();
                console.log('Stopped track:', track.kind);
            });
            this.localStream = null;
        }

        // Close peer connection
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        // Clear videos and remove loading states
        if (this.localVideo) {
            this.localVideo.srcObject = null;
        }
        if (this.remoteVideo) {
            this.remoteVideo.srcObject = null;
        }
        if (this.localVideoWrapper) {
            this.localVideoWrapper.classList.remove('video-loaded');
        }
        if (this.remoteVideoWrapper) {
            this.remoteVideoWrapper.classList.remove('video-loaded');
        }

        // Update UI
        if (this.startBtn) {
            this.startBtn.disabled = false;
            this.startBtn.innerHTML = 'Start Chat';
        }
        if (this.skipBtn) this.skipBtn.disabled = true;
        if (this.stopBtn) this.stopBtn.disabled = true;
        
        this.disableChat();
        this.clearChat();
        this.updateStatus('Click "Start Chat" to begin');
        
        this.isConnected = false;
        
        // Notify server
        if (this.socket && this.socket.connected) {
            this.socket.emit('stop-chat');
        }
    }

    async createPeerConnection() {
        try {
            // Close existing peer connection if any
            if (this.peerConnection) {
                this.peerConnection.close();
                this.peerConnection = null;
            }

            this.peerConnection = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' }
                ],
                iceCandidatePoolSize: 10
            });

            // Track connection state
            this.isInitiator = false;
            this.pendingIceCandidates = [];

            // Add local stream
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => {
                    this.peerConnection.addTrack(track, this.localStream);
                });
                console.log('✅ Local stream added to peer connection');
            }

            // Handle remote stream
            this.peerConnection.ontrack = (event) => {
                console.log('✅ Remote stream received');
                this.remoteStream = event.streams[0];
                if (this.remoteVideo) {
                    this.remoteVideo.srcObject = this.remoteStream;
                }
                this.updateStatus('Connected! You can now chat.');
            };

            // Handle ICE candidates
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate && this.socket && this.socket.connected) {
                    console.log('📤 Sending ICE candidate');
                    this.socket.emit('ice-candidate', { candidate: event.candidate });
                }
            };

            // Handle connection state changes
            this.peerConnection.onconnectionstatechange = () => {
                console.log('🔗 Connection state:', this.peerConnection.connectionState);
                switch (this.peerConnection.connectionState) {
                    case 'connected':
                        this.updateStatus('Connected! You can now chat.');
                        break;
                    case 'connecting':
                        this.updateStatus('Connecting to partner...');
                        break;
                    case 'disconnected':
                        this.updateStatus('Connection lost. Trying to reconnect...');
                        break;
                    case 'failed':
                        this.updateStatus('Connection failed. Please try again.');
                        this.handlePartnerDisconnect();
                        break;
                    case 'closed':
                        console.log('🔒 Peer connection closed');
                        break;
                }
            };

            // Handle ICE connection state changes
            this.peerConnection.oniceconnectionstatechange = () => {
                console.log('🧊 ICE connection state:', this.peerConnection.iceConnectionState);
                switch (this.peerConnection.iceConnectionState) {
                    case 'failed':
                    case 'disconnected':
                        console.log('❌ ICE connection failed/disconnected');
                        setTimeout(() => {
                            if (this.peerConnection && this.peerConnection.iceConnectionState === 'failed') {
                                this.handlePartnerDisconnect();
                            }
                        }, 5000); // Wait 5 seconds before giving up
                        break;
                }
            };

            console.log('✅ Peer connection created');
            
        } catch (error) {
            console.error('❌ Error creating peer connection:', error);
            this.showError('Failed to establish video connection');
        }
    }

    async handleOffer(offer) {
        try {
            console.log('📥 Received offer');
            
            // Create peer connection if it doesn't exist
            if (!this.peerConnection) {
                await this.createPeerConnection();
            }

            // Check if we're in the right state to handle an offer
            if (this.peerConnection.signalingState !== 'stable' && this.peerConnection.signalingState !== 'have-local-offer') {
                console.log('⚠️ Peer connection not in stable state, current state:', this.peerConnection.signalingState);
                // Reset the connection
                await this.createPeerConnection();
            }

            // Set remote description
            console.log('📝 Setting remote description (offer)');
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            console.log('✅ Remote description set successfully');

            // Create and send answer
            console.log('📝 Creating answer');
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            console.log('✅ Local description set (answer)');
            
            if (this.socket && this.socket.connected) {
                console.log('📤 Sending answer');
                this.socket.emit('answer', { answer });
            }

            // Process any pending ICE candidates
            await this.processPendingIceCandidates();
            
        } catch (error) {
            console.error('❌ Error handling offer:', error);
            this.showError('Failed to establish video connection');
            
            // Try to recover by creating a new peer connection
            setTimeout(() => {
                this.createPeerConnection();
            }, 1000);
        }
    }

    async handleAnswer(answer) {
        try {
            console.log('📥 Received answer');
            
            if (!this.peerConnection) {
                console.error('❌ No peer connection available for answer');
                return;
            }

            // Check if we're in the right state to handle an answer
            if (this.peerConnection.signalingState !== 'have-local-offer') {
                console.log('⚠️ Peer connection not in correct state for answer, current state:', this.peerConnection.signalingState);
                return;
            }

            console.log('📝 Setting remote description (answer)');
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            console.log('✅ Remote description set successfully');

            // Process any pending ICE candidates
            await this.processPendingIceCandidates();
            
        } catch (error) {
            console.error('❌ Error handling answer:', error);
            this.showError('Failed to establish video connection');
        }
    }

    async handleIceCandidate(candidate) {
        try {
            if (!this.peerConnection) {
                console.log('⚠️ No peer connection available for ICE candidate');
                return;
            }

            if (!candidate) {
                console.log('⚠️ Received empty ICE candidate');
                return;
            }

            // If remote description is not set yet, store the candidate
            if (this.peerConnection.remoteDescription === null) {
                console.log('📦 Storing ICE candidate for later processing');
                this.pendingIceCandidates.push(candidate);
                return;
            }

            console.log('🧊 Adding ICE candidate');
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            console.log('✅ ICE candidate added successfully');
            
        } catch (error) {
            console.error('❌ Error handling ICE candidate:', error);
            // Don't show error to user for ICE candidate failures as they're common
        }
    }

    async processPendingIceCandidates() {
        if (this.pendingIceCandidates.length > 0) {
            console.log(`📦 Processing ${this.pendingIceCandidates.length} pending ICE candidates`);
            
            for (const candidate of this.pendingIceCandidates) {
                try {
                    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                    console.log('✅ Pending ICE candidate added');
                } catch (error) {
                    console.error('❌ Error adding pending ICE candidate:', error);
                }
            }
            
            this.pendingIceCandidates = [];
        }
    }

    handlePartnerDisconnect() {
        console.log('🧹 Cleaning up partner connection');
        
        // Close peer connection
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        // Clear pending ICE candidates
        this.pendingIceCandidates = [];
        this.isInitiator = false;

        // Clear remote video and remove loading state
        if (this.remoteVideo) {
            this.remoteVideo.srcObject = null;
        }
        if (this.remoteVideoWrapper) {
            this.remoteVideoWrapper.classList.remove('video-loaded');
        }
        this.remoteStream = null;

        // Update UI
        this.disableChat();
        this.clearChat();
        
        this.isConnected = false;
    }

    sendMessage() {
        const message = this.messageInput?.value.trim();
        if (message && this.isConnected && this.socket && this.socket.connected) {
            this.socket.emit('chat-message', { message });
            this.displayMessage(message, this.currentUser, new Date().toISOString(), true);
            if (this.messageInput) this.messageInput.value = '';
        }
    }

    displayMessage(message, username, timestamp, isOwn) {
        if (!this.chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isOwn ? 'own' : 'other'}`;
        
        const usernameDiv = document.createElement('div');
        usernameDiv.className = 'username';
        usernameDiv.textContent = isOwn ? 'You' : username;
        
        const textDiv = document.createElement('div');
        textDiv.className = 'text';
        textDiv.textContent = message;
        
        const timestampDiv = document.createElement('div');
        timestampDiv.className = 'timestamp';
        timestampDiv.textContent = new Date(timestamp).toLocaleTimeString();
        
        messageDiv.appendChild(usernameDiv);
        messageDiv.appendChild(textDiv);
        messageDiv.appendChild(timestampDiv);
        
        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    enableChat() {
        if (this.messageInput) {
            this.messageInput.disabled = false;
            this.messageInput.placeholder = 'Type a message...';
        }
        if (this.sendBtn) this.sendBtn.disabled = false;
    }

    disableChat() {
        if (this.messageInput) {
            this.messageInput.disabled = true;
            this.messageInput.placeholder = 'Connect to chat...';
        }
        if (this.sendBtn) this.sendBtn.disabled = true;
    }

    clearChat() {
        if (this.chatMessages) {
            this.chatMessages.innerHTML = '';
        }
    }

    updateStatus(message) {
        if (this.status) {
            this.status.textContent = message;
            this.status.className = 'status';
            
            // Add appropriate status class
            if (message.includes('Connected')) {
                this.status.classList.add('connected');
            } else if (message.includes('Looking') || message.includes('Connecting')) {
                this.status.classList.add('connecting');
            } else if (message.includes('failed') || message.includes('error')) {
                this.status.classList.add('error');
            }
        }
        console.log('Status:', message);
    }

    showError(message) {
        console.error('Error:', message);
        
        // Remove any existing error messages
        this.clearError();
        
        // Create error element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            background: #fed7d7;
            color: #742a2a;
            padding: 1rem;
            margin: 1rem 0;
            border-radius: 5px;
            border: 1px solid #feb2b2;
            text-align: center;
            font-weight: bold;
            position: relative;
            z-index: 1001;
        `;
        errorDiv.textContent = message;
        
        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 5px;
            right: 10px;
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #742a2a;
        `;
        closeBtn.onclick = () => errorDiv.remove();
        errorDiv.appendChild(closeBtn);
        
        // Add to auth modal or main app
        const container = this.isAuthenticated ? this.app : this.authModal?.querySelector('.modal-content');
        if (container) {
            const firstChild = container.firstElementChild;
            if (firstChild) {
                container.insertBefore(errorDiv, firstChild);
            } else {
                container.appendChild(errorDiv);
            }
        }
        
        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 8000);
    }

    showSuccess(message) {
        console.log('Success:', message);
        
        // Remove any existing messages
        this.clearError();
        
        // Create success element
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.style.cssText = `
            background: #c6f6d5;
            color: #22543d;
            padding: 1rem;
            margin: 1rem 0;
            border-radius: 5px;
            border: 1px solid #9ae6b4;
            text-align: center;
            font-weight: bold;
            position: relative;
            z-index: 1001;
        `;
        successDiv.textContent = message;
        
        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 5px;
            right: 10px;
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #22543d;
        `;
        closeBtn.onclick = () => successDiv.remove();
        successDiv.appendChild(closeBtn);
        
        // Add to auth modal or main app
        const container = this.isAuthenticated ? this.app : this.authModal?.querySelector('.modal-content');
        if (container) {
            const firstChild = container.firstElementChild;
            if (firstChild) {
                container.insertBefore(successDiv, firstChild);
            } else {
                container.appendChild(successDiv);
            }
        }
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 5000);
    }

    clearError() {
        const errorMessages = document.querySelectorAll('.error-message, .success-message');
        errorMessages.forEach(msg => {
            if (msg.parentNode) {
                msg.parentNode.removeChild(msg);
            }
        });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing App...');
    try {
        window.camToCamApp = new CamToCamApp();
    } catch (error) {
        console.error('Failed to initialize app:', error);
        
        // Show fallback error message
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #fed7d7;
            color: #742a2a;
            padding: 2rem;
            border-radius: 10px;
            text-align: center;
            z-index: 10000;
            max-width: 400px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        errorDiv.innerHTML = `
            <h3>Failed to Initialize App</h3>
            <p>Please refresh the page and try again.</p>
            <button onclick="location.reload()" style="
                margin-top: 1rem;
                padding: 0.5rem 1rem;
                background: #742a2a;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            ">Refresh Page</button>
        `;
        document.body.appendChild(errorDiv);
    }
});

// Also try to initialize if DOM is already loaded
if (document.readyState === 'loading') {
    console.log('DOM still loading...');
} else {
    console.log('DOM already loaded - Initializing App...');
    try {
        if (!window.camToCamApp) {
            window.camToCamApp = new CamToCamApp();
        }
    } catch (error) {
        console.error('Failed to initialize app:', error);
    }
}

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (window.camToCamApp && window.camToCamApp.socket) {
        if (document.hidden) {
            console.log('Page hidden - maintaining connection');
        } else {
            console.log('Page visible - checking connection');
            if (!window.camToCamApp.socket.connected) {
                console.log('Reconnecting...');
                window.camToCamApp.socket.connect();
            }
        }
    }
});

// Handle beforeunload to cleanup
window.addEventListener('beforeunload', () => {
    if (window.camToCamApp) {
        window.camToCamApp.stopChat();
        if (window.camToCamApp.socket) {
            window.camToCamApp.socket.disconnect();
        }
    }
});

// Handle online/offline events
window.addEventListener('online', () => {
    console.log('✅ Back online');
    if (window.camToCamApp && window.camToCamApp.socket && !window.camToCamApp.socket.connected) {
        window.camToCamApp.socket.connect();
    }
});

window.addEventListener('offline', () => {
    console.log('❌ Gone offline');
    if (window.camToCamApp) {
        window.camToCamApp.updateStatus('Connection lost - you are offline');
    }
});