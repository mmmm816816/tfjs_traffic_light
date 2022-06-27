const demosSection = document.getElementById('demos');

var tfModel = undefined;

cocoSsd.load().then(function (loadedModel) {
    tfModel = loadedModel;
    demosSection.classList.remove('invisible');
});

const video = document.getElementById('webcam');
const liveView = document.getElementById('liveView');

function hasGetUserMedia() {
    return !!(navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia);
}

var children = [];

if (hasGetUserMedia()) {
    const enableWebcamButton = document.getElementById('webcamButton');
    enableWebcamButton.addEventListener('click', enableCam);
} else {
    console.warn('getUserMedia() is not supported by your browser');
}

function enableCam(event) {
    if (!tfModel) {
        console.log('Wait! Model not loaded yet.')
        return;
    }

    event.target.classList.add('removed');

    // const constraints = {
    //     video: true
    // };

    const constraints = {
        video: {
            frameRate: {
                ideal: 1, // 15
                max: 30
            }
        }
    };

    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
        video.srcObject = stream;
        video.addEventListener('loadeddata', predictWebcam);
    });
}

let prediction;

function predictWebcam() {
    tfModel.detect(video).then(function (predictions) {
        for (let i = 0; i < children.length; i++) {
            liveView.removeChild(children[i]);
        }
        children.splice(0);

        for (let n = 0; n < predictions.length; n++) {
            if (predictions[n].score > 0.66) {
                const p = document.createElement('p');
                p.innerText = predictions[n].class + ' - with '
                    + Math.round(parseFloat(predictions[n].score) * 100)
                    + '% confidence.';
                p.style = 'left: ' + predictions[n].bbox[0] + 'px;' +
                    'top: ' + predictions[n].bbox[1] + 'px;' +
                    'width: ' + (predictions[n].bbox[2] - 10) + 'px;';

                const highlighter = document.createElement('div');
                highlighter.setAttribute('class', 'highlighter');
                highlighter.style = 'left: '
                    + predictions[n].bbox[0] + 'px; top: '
                    + predictions[n].bbox[1] + 'px; width: '
                    + predictions[n].bbox[2] + 'px; height: '
                    + predictions[n].bbox[3] + 'px;';

                liveView.appendChild(highlighter);
                liveView.appendChild(p);
                prediction = predictions[n];
                displayCanvas(prediction);

                children.push(highlighter);
                children.push(p);
            }
        }

        window.requestAnimationFrame(predictWebcam);
    });
}

// let frame;
// ImageData {data: Uint8ClampedArray(307200), width: 320, height: 240, colorSpace: 'srgb'}
// data: Uint8ClampedArray(307200) [131, 143, 128, 0, 133, 141, 129, 0, 134, 140, 136, 0, 134, 140, 136, 0, 135, 143, 136, 0, 137, 145, 138, 0, 137, 139, 138, 0, 140, 143, 138, 0, 139, 145, 136, 0, 138, 146, 139, 0, 140, 147, 135, 0, 142, 146, 135, 0, 140, 143, 140, 0, 143, 143, 143, 0, 142, 142, 142, 0, 144, 145, 138, 0, 143, 144, 139, 0, 142, 145, 137, 0, 140, 152, 133, 0, 140, 152, 135, 0, 141, 147, 141, 0, 143, 145, 144, 0, 144, 147, 144, 0, 145, 145, 143, 0, 147, 147, 145, 0, …]
// colorSpace: "srgb"
// height: 240
// width: 320
// [[Prototype]]: ImageData

let cnt = document.getElementById('cnt');

function displayCanvas(prediction) {
    // video.addEventListener("timeupdate", function () {
    //     var canvas = document.getElementById("c");
    //     canvas.getContext("2d").drawImage(video, 0, 0, 480, 270);
    // }, true);

    setInterval(function () { // every time the new frame arrives, resizing the canvas -> heavy
        let canvas = document.getElementById("c");
        canvas.width = Math.floor(prediction.bbox[2]);
        canvas.height = Math.floor(prediction.bbox[3]);
        let ctx = canvas.getContext("2d");
        ctx.drawImage(
            video,
            Math.floor(prediction.bbox[0]),
            Math.floor(prediction.bbox[1]),
            Math.floor(prediction.bbox[2]),
            Math.floor(prediction.bbox[3])
        );
        //ctx.drawImage(video, 100, 0, 200, 300);
        let frame = ctx.getImageData(0, 0, Math.floor(prediction.bbox[2]), Math.floor(prediction.bbox[3]));
        //let frame = ctx.getImageData(0, 0, 100, 300);
        let l = frame.data.length / 4;
        let num = l;
        for (let i = 0; i < l; i++) {
            let r = frame.data[i * 4 + 0];
            let g = frame.data[i * 4 + 1];
            let b = frame.data[i * 4 + 2];
            if (r <= 225 && g >= 50 && b >= 50) {
                frame.data[i * 4 + 3] = 0; // opacity = zero
                num -= 1;
            }
        }
        ctx.putImageData(frame, 0, 0);
        cnt.innerText = num + '/' + l + '(' + Math.round(num/l*1000)/10 +' %)';
        //console.log(frame.data.length); // 518400 = 480 * 270 * 4
        // }, 1000 / 30);
    }, 1000 / 15); // ideal < frameRate
}
