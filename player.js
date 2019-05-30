//----------------------INIT YOUTUBE---------------------------//

// This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

/**
 * This function creates an <iframe> (and YouTube poseDemo) after the API code downloads.
 */
var player;
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '390',
        width: '640',
        videoId: 'ZZb_ZtjVxUQ',
        events: {}
    });
}

//---------------------INIT POSE NET------------------------------//

let video;
let poseNet;
let poses = [];
let COUNTER = 0;
let COUNTDOWN = 0;

let omListener = 5;
let omsDetected = -1;
let lastWristX;
let lastWristY;
let detectedDirections = [];
// let rightCircleRegex = ;
// let leftCircleRegex = ;



/**
 * Sets up the poseNet library:
 */
function setup() {
    createCanvas(640, 480);
    video = createCapture(VIDEO);
    video.size(width, height);

    // Create a new poseNet method with a single detection
    poseNet = ml5.poseNet(video, detectionType='single', modelReady);
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
    select('#status').html('Model Loaded');
}

//--------------------------GIVE POSE FEEDBACK----------------------------//
/**
 * Draws the skeleton and key points of each pose when detected.
 */
function draw() {
    image(video, 0, 0, width, height);
    drawKeypoints();
    drawSkeleton();
    poseDetection();
}

/**
 * A function to draw ellipses over the detected key points.
 */
function drawKeypoints()  {
    // Loop through all the poses detected
    for (let i = 0; i < poses.length; i++) {
        // For each pose detected, loop through all the keypoints
        let pose = poses[i].pose;
        if (pose) { // TODO: Why does it sometimes invalid?
            for (let j = 0; j < pose.keypoints.length; j++) {
                // A keypoint is an object describing a body part (like rightArm or leftShoulder)
                let keypoint = pose.keypoints[j];
                // Only draw an ellipse is the pose probability is bigger than 0.2
                if (keypoint.score > 0.2) {
                    fill(255, 0, 0);
                    noStroke();
                    ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
                }
            }
        }
    }
}

/**
 * A function to draw the skeletons.
 */
function drawSkeleton() {
    // Loop through all the skeletons detected
    for (let i = 0; i < poses.length; i++) {
        let skeleton = poses[i].skeleton;
        // For every skeleton, loop through all body connections
        for (let j = 0; j < skeleton.length; j++) {
            let partA = skeleton[j][0];
            let partB = skeleton[j][1];
            stroke(255, 0, 0);
            line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
        }
    }
}


//----------------------------PLAYER CONTROL-----------------------------//

function pauseVid() {
    player.pauseVideo();
}

function playVid() {
    player.playVideo();
}

function raiseVolume() {
    var currVolume = player.getVolume();
    player.setVolume(currVolume += 10);
}

function decreseVolume() {
    var currVolume = player.getVolume();
    player.setVolume(currVolume -= 10);
}

//----------------------------POSE DETECTION--------------------------------//

function detectOm(pose) {
    eyes_dist = Math.sqrt(Math.pow((pose.keypoints[1].position.y - pose.keypoints[2].position.y), 2) +
        Math.pow((pose.keypoints[1].position.x - pose.keypoints[2].position.x), 2));
//
    ears_dist = Math.sqrt(Math.pow((pose.keypoints[3].position.y - pose.keypoints[4].position.y), 2) +
        Math.pow((pose.keypoints[3].position.x - pose.keypoints[4].position.x), 2));
//
    wrist_dist = Math.sqrt(Math.pow((pose.keypoints[left_wrist].position.y - pose.keypoints[right_wrist].position.y), 2) +
        Math.pow((pose.keypoints[left_wrist].position.x - pose.keypoints[right_wrist].position.x), 2));

    if(pose.keypoints[left_elbow].score > 0.6 && pose.keypoints[right_elbow].score > 0.6){
        if (Math.abs(pose.keypoints[left_elbow].position.y - pose.keypoints[right_elbow].position.y) < eyes_dist) {   // elbow's hight
            if (pose.keypoints[left_wrist].score > 0.3 && pose.keypoints[right_wrist].score > 0.3 && wrist_dist < 1.5*ears_dist) {
                if (pose.keypoints[right_wrist].position.x > pose.keypoints[right_elbow].position.x &&
                    pose.keypoints[left_wrist].position.x < pose.keypoints[left_elbow].position.x) {
                    COUNTER++;
                    if (COUNTER === 10) {
                        console.log("Hoooo yeee pose detected!!!");
                        COUNTER = 0;
                        COUNTDOWN = 30;
                        omsDetected += 1;
                        return true;
                    }
                }
            }
        }
    }
    return false;
}


/**
 * This function inspects the current pose and checks if its a spacial pose.
 * If the pose detected is indeed spacial, the function starts the action triggered by it.
 */
function poseDetection() {
    for (let i = 0; i < poses.length; i++) {
        let pose = poses[i].pose;
        if (!pose) {
            continue;
        }
        left_elbow = 7;
        right_elbow = 8;
        left_wrist = 9;
        right_wrist = 10;
        eyes_dist = Math.sqrt(Math.pow((pose.keypoints[1].position.y - pose.keypoints[2].position.y), 2) +
            Math.pow((pose.keypoints[1].position.x - pose.keypoints[2].position.x), 2));
//
        ears_dist = Math.sqrt(Math.pow((pose.keypoints[3].position.y - pose.keypoints[4].position.y), 2) +
            Math.pow((pose.keypoints[3].position.x - pose.keypoints[4].position.x), 2));
//
        wrist_dist = Math.sqrt(Math.pow((pose.keypoints[left_wrist].position.y - pose.keypoints[right_wrist].position.y), 2) +
            Math.pow((pose.keypoints[left_wrist].position.x - pose.keypoints[right_wrist].position.x), 2));
//
        if (COUNTDOWN > 0) {
            COUNTDOWN -=1;
            return;
        }
        if (omsDetected === -1) {
            console.log("Starting");
            detectOm(pose);
            continue;
        }

        if (omsDetected === 1){
            console.log("listening");
            if (omListener >= 0) {
                if (detectOm(pose)) {
                    if (player.getPlayerState() !== 1) { // start playing
                        playVid();
                    } else { // stop playing
                        player.pause();
                    }
                    omsDetected = 0;
                } else {
                    // detect circle
                    x_delta = pose.keypoints[right_wrist].position.x - lastWristX;
                    y_delta = pose.keypoints[right_wrist].position.y - lastWristY;
                    if (Math.abs(x_delta) > Math.abs(y_delta)) { // left-right movement
                        if (x_delta > 0) { //left
                            if (detectedDirections[detectedDirections.length - 1] !== 'l') {
                                detectedDirections.push('l');
                            }
                        } else { //right
                            if (detectedDirections[detectedDirections.length - 1] !== 'r') {
                                detectedDirections.push('r');
                            }
                        }
                    } else { // up-down movement
                        if (y_delta > 0) { // down
                            if (detectedDirections[detectedDirections.length - 1] !== 'd') {
                                detectedDirections.push('d');
                            }
                        } else { // up
                            if (detectedDirections[detectedDirections.length - 1] !== 'u') {
                                detectedDirections.push('u');
                            }
                        }
                    }
                }
                omListener -= 1;
            }
            if (omListener === 0) { // end of listening period
                // todo - check regex to see if there is a circle
                omsDetected = 0;
            }

        }
        // update last coordinates:
        lastWristX = pose.keypoints[right_wrist].position.x;
        lastWristY = pose.keypoints[right_wrist].position.y;
    }
}