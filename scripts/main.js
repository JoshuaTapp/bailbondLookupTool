const baseUrl = 'https://our.ncdoi.com/bailbond';

// DOM Elements
const elements = {
    agentInfo: document.getElementById('agentInfo'),
    agentInfoDisplay: document.getElementById('agentInfoDisplay'),
    errorMessage: document.getElementById('errorMessage'),
    npnInput: document.getElementById('npnInput'),
    npnForm: document.getElementById('npnForm'),
    loader: document.getElementById('loader-div'),
    getAgentInfoBtn: document.getElementById('getAgentInfoBtn'),
    scanQrCodeBtn: document.getElementById('scanQrCode')
};

// Event Listeners
elements.npnForm.addEventListener('submit', (event) => {
    event.preventDefault();
    fetchAgentInfo();
});

elements.npnInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        fetchAgentInfo();
    }
});

elements.getAgentInfoBtn.addEventListener('click', fetchAgentInfo);
elements.scanQrCodeBtn.addEventListener('click', scanQrCode);

// Main Functions
async function fetchAgentInfo() {
    const npn = elements.npnInput.value.trim();
    if (!npn) {
        elements.errorMessage.textContent = "Please enter a valid NPN.";
        elements.errorMessage.style.display = 'block';
        return;
    }
    resetDisplay();

    elements.loader.style.display = 'flex';

    try {
        const response = await fetch(`${baseUrl}/npn_lookup/${npn}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`API Error: ${response.status} - ${errorData.message || response.statusText} - Likely invalid NPN`);
        }

        const data = await response.json();
        elements.loader.style.display = 'none';
        displayAgentInfo(data);

    } catch (error) {
        elements.loader.style.display = 'none';
        console.error('Fetch Error:', error);
        displayAgentInfo({ agent: null, photo_url: '', licenses: [] });
    }
}

function resetDisplay() {
    elements.agentInfo.style.display = 'none';
    elements.errorMessage.style.display = 'none';
    elements.agentInfoDisplay.innerHTML = '';
}

async function scanQrCode() {
    const videoContainer = document.getElementById('video-container');
    const qrVideo = document.getElementById('qr-video');
    const closeCameraButton = document.getElementById('close-camera');
    let scanning = true;

    qrVideo.innerHTML = '';
    videoContainer.style.display = 'flex';

    const video = document.createElement('video');
    video.setAttribute('playsinline', '');

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: window.innerWidth } }
        });

        video.srcObject = stream;
        qrVideo.appendChild(video);
        await video.play();

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const interval = setInterval(processQrCode, 100);

        function processQrCode() {
            if (!scanning) return;

            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

            try {
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert"
                });

                if (code && code.data) {
                    stopScanning();
                    elements.npnInput.value = code.data.split('x')[0];
                    fetchAgentInfo();
                }
            } catch (qrError) {
                console.error('QR Code scanning error:', qrError);
            }
        }

        function stopScanning() {
            scanning = false;
            clearInterval(interval);
            stream.getTracks().forEach(track => track.stop());
            videoContainer.style.display = 'none';
        }

        closeCameraButton.onclick = stopScanning;

    } catch (error) {
        console.error('Camera access error:', error);
        elements.errorMessage.textContent = 'Unable to access camera. Please ensure camera permissions are granted.';
        elements.errorMessage.style.display = 'block';
        videoContainer.style.display = 'none';
    }
}

function displayAgentInfo(data) {
    if (!data.agent || !data.agent.npn) {
        elements.errorMessage.textContent = 'Bondsman not found.';
        elements.errorMessage.style.display = 'block';
        return;
    }

    const agentBasicInfo = createBasicAgentInfo(data.agent, data.photo_url);
    const licenseCards = createLicenseCards(data.licenses);

    elements.agentInfoDisplay.innerHTML = agentBasicInfo + licenseCards;
    elements.agentInfo.style.display = 'block';

    const agentElement = document.querySelector('.agent');
    if (agentElement) {
        agentElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}


// Helper Functions
function createBasicAgentInfo(agent, photoUrl) {
    return `
        <div class="profile-card">
            <div class="profile-header">
                <img src="${photoUrl}" alt="${agent.name}" class="profile-photo">
                <div class="profile-info">
                    <h2 class="profile-name">${agent.name}</h2>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">
                                <span class="emoji">🆔</span>
                                NPN
                            </span>
                            <strong>${agent.npn}</strong>
                        </div>
                        <div class="info-item">
                            <span class="info-label">
                                <span class="emoji">📞</span>
                                    Phone
                            </span>
                            <strong>${formatPhoneNumber(agent.businessPhone)}</strong>
                        </div>
                        <div class="info-item">
                            <span class="info-label">
                                <span class="emoji">🏢</span>
                                Location
                            </span>
                            <strong>${agent.businessAddress}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function createLicenseCards(licenses) {
    let licenseCards = '<div class="license-cards">';
    licenses.forEach(license => {
        const isLicenseActive = license.licenseStatus === 'Active';
        const statusEmoji = isLicenseActive ? '✅' : '❌';
        licenseCards += `
            <div class="license-card ${isLicenseActive ? 'active-license' : 'inactive-license'}">
                <h3>${license.licenseType}</h3>
                <div class="license-status">${statusEmoji} ${license.licenseStatus} ${statusEmoji}</div>
                <div class="license-details">
                    <p><strong>🔑 License ID:</strong> ${license.licenseId}</p>
                    <p><strong>📋 License Number:</strong> ${license.licenseNumber}</p>
                    <p><strong>⚖️ Type Code:</strong> ${license.licenseTypeCode}</p>
                    <p><strong>📅 Status Date:</strong> ${license.statusDate}</p>
                    <p><strong>📆 Effective Date:</strong> ${license.effectiveDate}</p>
                    <p><strong>⌛ Expiration Date:</strong> ${license.expirationDate}</p>
                </div>
            </div>
        `;
    });
    return licenseCards + '</div>';
}

function formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return '';
    const cleaned = ('' + phoneNumber).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    return match ? `(${match[1]}) ${match[2]}-${match[3]}` : phoneNumber;
}