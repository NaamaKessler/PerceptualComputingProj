//-----------------------HTML related------------------------//
let listeningBar = new ldBar("#myItem1");
let musicBar = new ldBar("#musicBar");
let images = ["images/dogDancing.PNG", "images/catDance.PNG"]; //(Noy) When replacing songs, we can do this: https://stackoverflow.com/questions/11722400/programmatically-change-the-src-of-an-img-tag  with the id "songPic"
let names = ["I Want You Back - Jackson 5", "some other song"]; //(Noy) We can do the same with getElementId.innerText (https://stackoverflow.com/questions/8550251/how-do-i-replace-change-the-heading-text-inside-h3-h3-using-jquery)

// Get the modal
let modal = document.getElementById("myModal");

// Get the image and insert it inside the modal - use its "alt" text as a caption
let guideButton = document.getElementById("guideButton");
let modalImg = document.getElementById("img01");
let captionText = document.getElementById("caption");
guideButton.onclick = function(){
    modal.style.display = "block";
    // modalImg.src = this.src;
    // captionText.innerHTML = this.alt;
};

// Get the <span> element that closes the modal
let span = document.getElementsByClassName("close")[0];

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
    modal.style.display = "none";
};


function hideImage(id) {
    let img = document.getElementById(id);
    img.style.visibility = 'hidden';
}

function showImage(id) {
    let img = document.getElementById(id);
    img.style.visibility = 'visible';
}

function updatePlayerProgress(){
    let curr = !player.getCurrentTime ? 0.0 : player.getCurrentTime();
    let total = !player.getDuration ? 0.0 : player.getDuration();
    musicBar.set((curr/total) * 100);

    let totalMinutes = Math.floor(total / 60).toString();
    let totalSec = Math.floor(total - totalMinutes*60).toString();
    let currMinutes = Math.floor(curr / 60).toString();
    let currSec = Math.floor(curr - currMinutes*60).toString();

    if(player.getPlayerState() === PLAYING && currSec >=0){
        if(currSec < 10){
            document.getElementById("currTime").innerHTML = currMinutes + ":0" + currSec;
        } else{
            document.getElementById("currTime").innerHTML = currMinutes + ":" + currSec;
        }
        if(totalSec < 10){
            document.getElementById("totalTime").innerHTML =  totalMinutes + ":0" + totalSec ;
        } else{
            document.getElementById("totalTime").innerHTML =  totalMinutes + ":" + totalSec ;
        }
    }
}

hideImage("downArrow");
hideImage("upArrow");
//----------------------INIT YOUTUBE---------------------------//

// This code loads the IFrame Player API code asynchronously.
let tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
let firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

playlistIds = ['s3Q80mk7bxE', 'nqxVMLVe62U', 'HgzGwKwLmgM', 'zO6D_BAuYCI', 'kijpcUv-b8M',
    'YoDh_gHDvkk', '2ZBtPf7FOoM'];
currentlyPlayingIdx = 0;

/**
 * This function creates an <iframe> (and YouTube poseDemo) after the API code downloads.
 */
let player;
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '0',
        width: '0',
        videoId: playlistIds[currentlyPlayingIdx],
        // playerVars: {listType: 'playlist', list: 'RDEMj7ObS6TgJ5zSOH9DUcVq8Q'},
        events: {}
    });
}

//---------------------INIT POSE NET------------------------------//

let video;
let poseNet;
let poses = [];
let HIGHT = 250;
let WIDTH = 250;


/**
 * Sets up the poseNet library:
 */
function setup() {
    var canvas = createCanvas(WIDTH, HIGHT);
    canvas.background(6, 6, 6);
    canvas.parent('skeleton');
    video = createCapture(VIDEO);
    video.size(WIDTH, HIGHT);

    // Create a new poseNet method with a single detection
    poseNet = ml5.poseNet(video, {
        imageScaleFactor: 0.6,
        outputStride: 8,
        detectionType: 'single',
    }, modelReady);
    // This sets up an event that fills the global variable "poses"
    // with an array every time new poses are detected (listeners)
    poseNet.on('pose', function(results) {
        poses = results;
    });
    // Hide the video element, and just show the canvas
    video.hide();
}

/**
 * prints(?) to the screen 'Model Loaded' when the model is ready.
 */
function modelReady() {
    select('#status').html('');
}

//--------------------------GIVE POSE FEEDBACK----------------------------//
// Key points
const LEFT_SHOLDER = 5;
const RIGHT_SHOLDER = 6;
const LEFT_ELBOW = 7;
const RIGHT_ELBOW = 8;
const LEFT_WRIST = 9;
const RIGHT_WRIST = 10;
const LEFT_HIP = 11;
const RIGHT_HIP = 12;
const RIGHT_EYE = 2;
const LEFT_EYE = 1;

// confidences:
const POSE_CONFIDENCE = 0.2;

// Globals
let prevPose;

/**
 * Draws the skeleton and key points of each pose when detected.
 */
function draw() {
    image(video, 0, 0, WIDTH, HIGHT);
    background(24,23,23);
    updatePlayerProgress();
    drawKeypoints();
    poseDetection();
}

/**
 * Draws the actual key points
 * @param pose
 */
function keypointsHelper(pose) {
    for (let j = 0; j < pose.keypoints.length; j++) {
        // A keypoint is an object describing a body part (like rightArm or leftShoulder)
        let keypoint = pose.keypoints[j];
        // Only draw an ellipse is the pose probability is bigger than 0.2
        if (keypoint.score > 0.2) {
            fill(247, 223, 163);
            noStroke();
            ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
        }
    }
}

/**
 * Draws a line between two key points.
 * @param pose
 * @param kp1
 * @param kp2
 */
function drawLine(pose, kp1, kp2){
    stroke(247, 223, 163);
    line(pose.keypoints[kp1].position.x, pose.keypoints[kp1].position.y,
        pose.keypoints[kp2].position.x, pose.keypoints[kp2].position.y);
}

function skeletonHelper(pose) {
    drawLine(pose, LEFT_SHOLDER, RIGHT_SHOLDER);
    drawLine(pose, LEFT_SHOLDER, LEFT_ELBOW);
    drawLine(pose, LEFT_ELBOW, LEFT_WRIST);
    drawLine(pose, RIGHT_SHOLDER, RIGHT_ELBOW);
    drawLine(pose, RIGHT_ELBOW, RIGHT_WRIST);
    drawLine(pose, RIGHT_SHOLDER, RIGHT_HIP);
    drawLine(pose, LEFT_SHOLDER, LEFT_HIP);
    drawLine(pose, RIGHT_HIP, LEFT_HIP);
}

/**
 * A function to draw ellipses over the detected key points.
 */
function drawKeypoints()  {
    // Loop through all the poses detected
    for (let i = 0; i < poses.length; i++) {
        let pose = poses[i].pose;

        if(!prevPose){ // Inits prevPose with the first valid pose:
            if(pose){
                if(pose.score < POSE_CONFIDENCE){
                    return;
                }
            }
            prevPose = pose;
            return;
        }

        if (!pose) {
            keypointsHelper(prevPose); // Draws the last valid pose.
            skeletonHelper(prevPose);
        } else{
            if(pose.score < POSE_CONFIDENCE){
                keypointsHelper(prevPose); // Draws the last valid pose.
                skeletonHelper(prevPose);
                return;
            }
            keypointsHelper(pose);
            skeletonHelper(pose);
            prevPose = pose;
        }

    }
}


//----------------------------PLAYER CONTROL-----------------------------// // TODO: those funcs are unnecessary & add vol const

let countdownState = 3;

/**
 * Called when the play-pause button is clicked.
 */
function playPauseVid(){
    let buttonId = document.getElementById("playPause");
    if(player.getPlayerState() === PLAYING){
        player.pauseVideo();
        console.log("paused!");
        document.getElementById("playerStateIndicator").innerHTML = "Paused";
        buttonId.src = "icons\\play-button.png"
    } else {
        player.playVideo();
        console.log("playing!");
        document.getElementById("playerStateIndicator").innerHTML = "Playing";
        buttonId.src = "icons\\pause.png"
    }
}

function raiseVolume() {
    const currVolume = player.getVolume() + 5;
    player.setVolume(currVolume);
}


function decreaseVolume() {
    const currVolume = player.getVolume() - 5;
    player.setVolume(currVolume);
}

function nextSong() {
    currentlyPlayingIdx = (currentlyPlayingIdx + 1) % playlistIds.length;
    player.loadVideoById(playlistIds[currentlyPlayingIdx]);
}

function previousSong() {
    if (currentlyPlayingIdx === 0){
        currentlyPlayingIdx = playlistIds.length-1;
    } else {
        currentlyPlayingIdx --;
    }
    player.loadVideoById(playlistIds[currentlyPlayingIdx]);
}

//----------------------------POSE DETECTION--------------------------------//

//--------------CONSTANTS:

// Thresholds
const WRIST_THRESH = 0.2;
const ELBOW_THRESH = 0.2;
const EYE_THREASH = 0.2;

// Pose sensitivity:
const SLEEP_TIME = 70;       // Determines the number of poses we consider as "junk" after a spacial pose was detected.
const OM_SENSITIVITY = 10;   // Determines how many Oms in a row we consider as a true Om (not noise)
const LISTENING_TIME = 250; // Determines for how many iterations we listen to the user's commands after activation.
const DOWNS_SENSITIVITY = 5;
const UPS_SENSITIVITY = 5;

// Player's states
const PLAYING = 1;

//---------------GLOBALS

let counter = 0;
let countdown = 0;
let listeningTimeLeft = 0;
let omsDetected = 0;
let upsDetected = 0;
let downsDetected = 0;
let lastWristX = -1;
let lastWristY = -1;


//---------------FUNCTIONS
/**
 * Calculates the Euclidean distance between two key points in a pose object.
 * @param pose
 * @param keyPoint1
 * @param keyPoint2
 */
function euclidDist(pose, keyPoint1, keyPoint2){
    return Math.sqrt(Math.pow((pose.keypoints[keyPoint1].position.y - pose.keypoints[keyPoint2].position.y), 2) +
        Math.pow((pose.keypoints[keyPoint1].position.x - pose.keypoints[keyPoint2].position.x), 2));
}

/**
 * Tests if two key points are in the same height.
 * @param pose
 * @param keyPoint1
 * @param keyPoint2
 * @param errThresh
 */
function sameHeight(pose, keyPoint1, keyPoint2, errThresh){
    return Math.abs(pose.keypoints[keyPoint1].position.y - pose.keypoints[keyPoint2].position.y) < errThresh;
}

/**
 * Returns true if the score of a key point is above the given threshold.
 * @param pose
 * @param keyPoint
 * @param threshold
 */
function checkScore(pose, keyPoint, threshold){
    return pose.keypoints[keyPoint].score > threshold;
}

/**
 * Tests if the elbows were detected with high confidence and have in the same height.
 * @param pose
 * @param errThresh
 * @returns {*}
 */
function elbowsAligned(pose, errThresh){
    return checkScore(pose, LEFT_ELBOW, ELBOW_THRESH) && checkScore(pose, RIGHT_ELBOW, ELBOW_THRESH) &&
        sameHeight(pose, LEFT_ELBOW, RIGHT_ELBOW, errThresh);
}

/**
 * Tests if the waists were detected with high confidence, and if they are close.
 * @param pose
 * @param errThresh
 */
function closeWrists(pose, errThresh){
    const wrist_dist = euclidDist(pose, LEFT_WRIST, RIGHT_WRIST);
    return checkScore(pose, LEFT_WRIST, WRIST_THRESH) &&
        checkScore(pose, RIGHT_WRIST, WRIST_THRESH) && wrist_dist < errThresh;
}

/**
 * Tests if the wrists are inner compared to the elbows.
 * @param pose
 * @returns {boolean}
 */
function wristsInwards(pose){
    return pose.keypoints[RIGHT_WRIST].position.x > pose.keypoints[RIGHT_ELBOW].position.x &&
        pose.keypoints[LEFT_WRIST].position.x < pose.keypoints[LEFT_ELBOW].position.x;
}

/**
 * Tests if the pose is the Om pose.
 * @param pose
 * @returns {boolean}
 */

function detectOm(pose) {
    let eyes_dist = euclidDist(pose, LEFT_EYE, RIGHT_EYE);
    if(elbowsAligned(pose, eyes_dist) && closeWrists(pose, 1.9*eyes_dist) && wristsInwards(pose)){
        counter++;
        if (counter === OM_SENSITIVITY) { // If we detected enough Oms, its probably not a noise.
            counter = 0;
            countdown = SLEEP_TIME; // Do not detect another pose for the next SLEEP_TIME iterations.
            omsDetected++;
            listeningTimeLeft = LISTENING_TIME;
            if (omsDetected === 1) { // indicates delay
                document.getElementById("playerStateIndicator").innerHTML = "Just a Sec...";
                document.getElementById("playerStateIndicator").style.color = "#F7DFA3";
            }
            return true;
        }
    }
    return false;
}

/**
 * Updates the last position of the right wrist.
 * @param pose
 */
function updateWristCoords(pose) {
    lastWristX = pose.keypoints[RIGHT_WRIST].position.x;
    lastWristY = pose.keypoints[RIGHT_WRIST].position.y;
}

/**
 * Records the wrist movements of the user and keeps them in the global array detectedDirections[].
 * @param pose
 */
function recordWristMovement(pose){
    if(checkScore(pose, RIGHT_WRIST, WRIST_THRESH) && checkScore(pose, RIGHT_EYE, EYE_THREASH)
        && checkScore(pose, LEFT_EYE, EYE_THREASH)){

        let y_delta = pose.keypoints[RIGHT_WRIST].position.y - lastWristY;
        let eyes_dist = euclidDist(pose, LEFT_EYE, RIGHT_EYE);

        if (y_delta >= 0.3*eyes_dist) {
            if(downsDetected >= DOWNS_SENSITIVITY){
                hideImage("upArrow");
                showImage("downArrow");
                downsDetected = 0;
            } else {
                downsDetected ++;
            }
            decreaseVolume();
            // console.log("decrease volume");
            // console.log("volume: ", player.getVolume());
        }
        else if(y_delta <= -0.3*eyes_dist) {
            if(upsDetected >= UPS_SENSITIVITY){
                hideImage("downArrow");
                showImage("upArrow");
                upsDetected = 0;
            } else {
                upsDetected ++;
            }
            raiseVolume();
            // console.log("ups detected: " + upsDetected);
            // console.log("raise volume");
            // console.log("volume: ", player.getVolume());

        }
    }
}

/**
 * This function inspects the current pose and checks if its a spacial pose.
 * If the pose detected is indeed spacial, the function starts the action triggered by it.
 */
function poseDetection() {
    for (let i = 0; i < poses.length; i++) {
        let pose = poses[i].pose;

        // Tests if the pose is valid:
        if (!pose) {
            continue;
        }

        // If we just detected a pose, the current pose is probably trash, so move on:
        if (countdown > 0) {
            countdown--;
            listeningBar.set((1 - countdown/SLEEP_TIME)*100);
            console.log("delaying");
            return;
        }
        listeningBar.set(0);

        // Waits for activation:
        if (omsDetected === 0) {
            console.log("Waits for activation");
            detectOm(pose);
            // updateWristCoords(pose); // removed for better recognition (14.06)
        }
        else {
            // Indicates that the player is listening
            document.getElementById("playerStateIndicator").innerHTML = "Listening";
            document.getElementById("playerStateIndicator").style.color = "#F7DFA3";
            // After activated, listens for the next command:
            if (listeningTimeLeft > 0) {
                // console.log("listening");
                if (detectOm(pose)) {
                    // console.log("detected Om while listening.");
                    playPauseVid();
                    listeningTimeLeft = 0;
                    hideImage("downArrow");
                    downsDetected = 0;
                    hideImage("upArrow");
                    upsDetected = 0;
                    counter = 0;
                    omsDetected = 0; // two oms were detected - reset counter and wait for activation again.
                } else if (player.getPlayerState() === PLAYING){
                    // Listens for circles:
                    if (lastWristX !== -1 && lastWristY !== -1) {
                        recordWristMovement(pose);
                    }
                    updateWristCoords(pose);
                    listeningTimeLeft--;

                } else {
                    lastWristX = -1;
                    lastWristY = -1;
                    listeningTimeLeft--;
                }
            } else { // End of listening time.
                omsDetected = 0;
                downsDetected = 0;
                hideImage("downArrow");
                upsDetected = 0;
                hideImage("upArrow");
                counter = 0;
                if (player.getPlayerState() !== PLAYING) {
                    document.getElementById("playerStateIndicator").innerHTML = "Paused";
                } else {
                    document.getElementById("playerStateIndicator").innerHTML = "Playing";
                }
            }
        }
    }
}
