// TASKS:
// TODO: Why some of the poses are invalid?

//----------------------INIT YOUTUBE---------------------------//

// This code loads the IFrame Player API code asynchronously.
let tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
let firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

/**
 * This function creates an <iframe> (and YouTube poseDemo) after the API code downloads.
 */
let player;
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        // height: '390',
        // width: '640',
        height: '0',
        width: '0',
        videoId: 'ZZb_ZtjVxUQ',
        events: {}
    });
}

//---------------------INIT POSE NET------------------------------//

let video;
let poseNet;
let poses = [];

/**
 * Sets up the poseNet library:
 */
function setup() {
    createCanvas(640, 480);
    video = createCapture(VIDEO);
    video.size(width, height);

    // Create a new poseNet method with a single detection
    poseNet = ml5.poseNet(video, 'single', modelReady);
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


//----------------------------PLAYER CONTROL-----------------------------// // TODO: those funcs are unnecessary & add vol const

function pauseVid() {
    player.pauseVideo();
}

function playVid() {
    player.playVideo();
}

function raiseVolume() {
    const currVolume = player.getVolume() + 10;
    player.setVolume(currVolume);
}

function decreaseVolume() {
    const currVolume = player.getVolume() - 10;
    player.setVolume(currVolume);
}

//----------------------------POSE DETECTION--------------------------------//

//--------------CONSTANTS:

// Key points
const LEFT_ELBOW = 7;
const RIGHT_ELBOW = 8;
const LEFT_WRIST = 9;
const RIGHT_WRIST = 10;
const RIGHT_EYE = 2;
const LEFT_EYE = 1;
const RIGHT_EAR = 4;
const LEFT_EAR = 3;

// Thresholds
const WRIST_THRESH = 0.7;
const ELBOW_THRESH = 0.7;

// Pose sensitivity:
const SLEEP_TIME = 60;       // Determines the number of poses we consider as "junk" after a spacial pose was detected.
const OM_SENSITIVITY = 5;   // Determines how many Oms in a row we consider as a true Om (not noise)
const LISTENING_TIME = 130; // Determines for how many iterations we listen to the user's commands after activation.

// Directions
const LEFT = 'L';
const RIGHT = 'R';
const UP = 'U';
const DOWN = 'D';


//---------------GLOBALS

let counter = 0;
let countdown = 0;
let listeningTimeLeft = 0;
let omsDetected = 0;
let lastRightWristY;

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
            console.log("detectedOms num: ", omsDetected);
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
    lastRightWristY = pose.keypoints[RIGHT_WRIST].position.y;
}

/**
 * Records the wrist movements of the user and keeps them in the global array detectedDirections[].
 * @param pose
 */
function recordWristMovement(pose){
        if(checkScore(pose, RIGHT_WRIST, 0.6) && checkScore(pose, LEFT_WRIST, 0.6) &&
            checkScore(pose, RIGHT_EYE, WRIST_THRESH)
            && checkScore(pose, LEFT_EYE, WRIST_THRESH)){

            let right_delta = pose.keypoints[RIGHT_WRIST].position.y - lastRightWristY;
            let eyes_dist = euclidDist(pose, LEFT_EYE, RIGHT_EYE);

                if (right_delta <= -eyes_dist) {
                    raiseVolume();
                    console.log("increase volume");
                    console.log("volume: ", player.getVolume());
                }
                else if(right_delta >= eyes_dist) {
                        decreaseVolume();
                        console.log("decrease volume");
                        console.log("volume: ", player.getVolume());

                }
            }


            // }


            //     if (x_delta >= 10) {
            //         if(detectedDirections.substr(-1) !== LEFT){
            //             detectedDirections += LEFT;
            //         }
            //     } else if (x_delta <= -10) {
            //         if (detectedDirections.substr(-1) !== RIGHT) {
            //             detectedDirections += RIGHT;
            //         }
            //     }
            // }else { // up-down movement
            //     if(y_delta >= 10) {
            //             if (detectedDirections.substr(-1) !== DOWN) {
            //                 detectedDirections += DOWN;
            //             }
            //         } else if (x_delta <= -10) {
            //             if (detectedDirections.substr(-1) !== UP) {
            //                 detectedDirections += UP;
            //             }
            //         }
            //     }
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
            console.log("delaying");
            return; //(Naama) todo: why return and not continue?
        }

        // Waits for activation:
        if (omsDetected === 0) {
            console.log("Waits for activation");
            detectOm(pose);
            updateWristCoords(pose); // for future circle detection.
            // continue; (Naama)
        }
        else {
            // After activated, listens for the next command:
            if (listeningTimeLeft > 0) {
                console.log("listening");
                if (detectOm(pose)) {
                    console.log("detected Om while listening.");
                    if (player.getPlayerState() !== 1) { // start playing
                        playVid();
                    } else { // stop playing
                        pauseVid();
                    }
                    listeningTimeLeft = 0;
                    omsDetected = 0; // two oms were detected - reset counter and wait for activation again.
                } else if (player.getPlayerState() === 1){
                    // Listens for circles:
                    recordWristMovement(pose);
                    detectCircleAndRespond();
                    updateWristCoords(pose);
                    listeningTimeLeft--;
                }
            } else { // End of listening time.
                omsDetected = 0;
                counter = 0;
            }
        }
    }
}
