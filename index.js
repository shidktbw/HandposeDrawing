document.addEventListener('DOMContentLoaded', async () => {
    const canvas = document.getElementById('video-canvas');
    canvas.width = 640;
    canvas.height = 480;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const drawingCanvas = document.getElementById('drawing-canvas');
    drawingCanvas.width = 640;
    drawingCanvas.height = 480;
    document.body.appendChild(drawingCanvas);
    const drawingCtx = drawingCanvas.getContext('2d');

    async function setupCamera() {
        const video = document.createElement('video');
        video.width = 640;
        video.height = 480;
        video.autoplay = true;

        const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: { facingMode: 'user' },
        });

        video.srcObject = stream;

        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                resolve(video);
            };
        });
    }

    async function detectFinger(video) {
        const model = await handpose.load();
        let previousFingerTip = null;

        function processFrame() {
            model.estimateHands(video).then(predictions => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(video, 0, 0, video.width, video.height);

                if (predictions.length > 0) {
                    const fingerTip = predictions[0].annotations.indexFinger[3];

                    if (previousFingerTip) {
                        const smoothFactor = 0.3;
                        const x = smoothFactor * previousFingerTip[0] + (1 - smoothFactor) * fingerTip[0];
                        const y = smoothFactor * previousFingerTip[1] + (1 - smoothFactor) * fingerTip[1];

                        drawingCtx.beginPath();
                        drawingCtx.moveTo(previousFingerTip[0], previousFingerTip[1]);
                        drawingCtx.lineTo(x, y);
                        drawingCtx.lineWidth = 5;
                        drawingCtx.strokeStyle = 'red';
                        drawingCtx.stroke();

                        previousFingerTip = [x, y];
                    } else {
                        previousFingerTip = fingerTip;
                    }

                    for (let i = 0; i < predictions.length; i++) {
                        const keypoints = predictions[i].landmarks;
                        for (let j = 0; j < keypoints.length; j++) {
                            const [x, y, z] = keypoints[j];
                            ctx.beginPath();
                            ctx.arc(x, y, 5, 0, 2 * Math.PI);
                            ctx.fillStyle = 'rgba(0, 255, 0, 1)';
                            ctx.fill();
                        }
                    }
                } else {
                    previousFingerTip = null;
                }
                requestAnimationFrame(processFrame);
            });
        }

        processFrame();
    }

    const video = await setupCamera();
    document.body.appendChild(video);
    detectFinger(video);
});
