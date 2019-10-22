// -----------------------MAGIC NUMBERS--------------------------//
// Skeleton display:
const CANVAS_HEIGHT = 350;
const CANVAS_WIDTH = 350;
const KEYPOINT_HEIGHT = 10;
const KEYPOINT_WIDTH = 10;
const ITERATIONS_TO_STAY_COLORED = 10;

// Player:
const PLAYER_HEIGHT = '0';
const PLAYER_WIDTH = '0';
const PLAYING = 1;
const PAUSED = 2;
const VOLUME_CHANGE = 7;

// Thresholds:
const POSE_CONFIDENCE = 0.2;
const KEYPOINT_CONFIDENCE = 0.2;
const WRIST_THRESH = 0.2;
const ELBOW_THRESH = 0.2;
const EYE_THRASH = 0.2;

// Pose sensitivity:
const SLEEP_TIME = 15;
const OM_SENSITIVITY = 5;
const LISTENING_TIME = 35;
const DOWNS_SENSITIVITY = 10;
const UPS_SENSITIVITY = 10;

// -----------------------CONSTANTS--------------------------//
// HTML related:
const listeningBar = new ldBar('#myItem1');
const musicBar = new ldBar('#musicBar');
const modal = document.getElementById('myModal');
const guideButton = document.getElementById('guideButton');
const guideSpan = document.getElementsByClassName('close')[0];

// Youtube API related:
const tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// Currently we have just some hard-coded songs for POC:
const playlistIds = ['s3Q80mk7bxE', 'nqxVMLVe62U', '0fAQhSRLQnM', 'unfzfe8f9NI'];
const albumsCoverPics = ['album_cover_pics/Diana_Ross_Presents_the_Jackson_5.jpg',
  'album_cover_pics/Jacksons-destiny.jpg', 'album_cover_pics/sultans-front-b.jpg',
  'album_cover_pics/Mamma_Mia_Intermezzo_No_1.jpg'];
const songsNames = ['I Want You Back', 'Blame it on the Boogie', 'Sultans of Swing', 'Mamma Mia'];
const artistsDetails = ['The Jackson 5', 'The Jackson 5', 'Dire Straits', 'ABBA'];
const albumsNames = ['Diana Ross Presents the Jackson 5', 'Destiny', 'Sultans of Swing', ''];

// -----------------------GLOBALS--------------------------//
// Pose detection:
let poseCounter = 0;
let iterationsToSleep = 0;
let listeningTimeLeft = 0;
let omsDetected = 0;
let upsDetected = 0;
let downsDetected = 0;
let lastWristX = -1;
let lastWristY = -1;

// Skeleton related:
let prevPose;
let iterationsToColorPose = 0; // for skeleton color change when a pose is detected.

// PoseNet initialization:
let video;
let poseNet;
let poses = [];

// Youtube API related:
let currentlyPlayingIdx = 0;
let player;

// ----------------------PAGE INITIALIZATION---------------------------//
/**
 * Creates a Youtube player after the page had finished downloading the JS for the player API.
 * The implementation of this function is mandatory. For more information, see:
 * https://developers.google.com/youtube/iframe_api_reference.
 */
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: PLAYER_HEIGHT,
    width: PLAYER_WIDTH,
    videoId: playlistIds[currentlyPlayingIdx],
    events: {},
  });
}

/**
 * The setup() function initializes a canvas for the skeleton display, and sets up PoseNet.
 * Setup() is a part of the p5.js library, and is called automatically when the program starts.
 * For more information see: https://p5js.org/reference/#/p5/setup.
 * After setup() had finished, the function draw() is called automatically.
 */
function setup() {
  // Initializes canvas:
  const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  canvas.background(6, 6, 6);
  canvas.parent('skeleton');
  video = createCapture(VIDEO);
  video.size(CANVAS_WIDTH, CANVAS_HEIGHT);

  // Creates a new poseNet method with a single detection:
  poseNet = ml5.poseNet(video, {
    imageScaleFactor: 0.6,
    outputStride: 8,
    detectionType: 'single',
  });

  // Sets up an event that records the newly detected pose and responds to it:
  poseNet.on('pose', (results) => {
    poses = results;
    respondToPose();
  });

  // Hides the video element (to show the canvas only):
  video.hide();
}

// ----------------------------PLAYER CONTROL-----------------------------//
function changePlayerState(newState){
  document.getElementById('playerStateIndicator').innerHTML = newState;
  document.getElementById('playerStateIndicator').style.color = '#F7DFA3';
}

/**
 * Changes player's state to "PLAYING" if paused and vice-versa.
 */
function playPauseVid() {
  if (!player) return;
  const buttonId = document.getElementById('playPause');
  if (getPlayerStateSafely() === PLAYING) {
    player.pauseVideo();
    changePlayerState('Paused');
    buttonId.src = 'icons\\play-button.png';
  } else {
    player.playVideo();
    changePlayerState('Playing');
    buttonId.src = 'icons\\pause.png';
  }
}

function raiseVolume() {
  if (!player) return;
  player.setVolume(player.getVolume() + VOLUME_CHANGE);
}

function decreaseVolume() {
  if (!player) return;
  player.setVolume(player.getVolume() - VOLUME_CHANGE);
}

function changeSongsMetaData() {
  document.getElementById('albumCover').src = albumsCoverPics[currentlyPlayingIdx];
  document.getElementById('songName').innerHTML = songsNames[currentlyPlayingIdx];
  document.getElementById('artistName').innerHTML = artistsDetails[currentlyPlayingIdx];
  document.getElementById('albumName').innerHTML = albumsNames[currentlyPlayingIdx];
}

function nextSong() {
  if (!player) return;
  currentlyPlayingIdx = (currentlyPlayingIdx + 1) % playlistIds.length;
  player.loadVideoById(playlistIds[currentlyPlayingIdx]);
  changeSongsMetaData();
}

function previousSong() {
  if (!player) return;
  if (currentlyPlayingIdx === 0) {
    currentlyPlayingIdx = playlistIds.length - 1;
  } else {
    currentlyPlayingIdx -= 1;
  }
  player.loadVideoById(playlistIds[currentlyPlayingIdx]);
  changeSongsMetaData();
}

function getPlayerStateSafely(){
  return typeof player.getPlayerState !== 'function' ? PAUSED : player.getPlayerState();
}

// ----------------------------POSE DETECTION--------------------------------//
function euclidDist(keyPoint1, keyPoint2) {
  return Math.sqrt(((keyPoint1.y - keyPoint2.y) ** 2)
      + ((keyPoint1.x - keyPoint2.x) ** 2));
}

function sameHeight(keyPoint1, keyPoint2, errThresh) {
  return Math.abs(keyPoint1.y - keyPoint2.y) < errThresh;
}

function checkScore({ confidence }, threshold) {
  return confidence > threshold;
}

/**
 * Tests if the elbows were detected with high confidence and are in the same height.
 */
function elbowsAligned({ leftElbow, rightElbow }, errThresh) {
  return checkScore(leftElbow, ELBOW_THRESH) && checkScore(rightElbow, ELBOW_THRESH)
      && sameHeight(leftElbow, rightElbow, errThresh);
}

/**
 * Tests if the waists were detected with high confidence, and if they are close.
 */
function closeWrists({ leftWrist, rightWrist }, errThresh) {
  const wristDist = euclidDist(leftWrist, rightWrist);
  return checkScore(leftWrist, WRIST_THRESH)
      && checkScore(rightWrist, WRIST_THRESH) && wristDist < errThresh;
}

/**
 * Tests if the wrists are inner compared to the elbows.
 */
function wristsInwards({
  rightWrist, leftWrist, rightElbow, leftElbow,
}) {
  return rightWrist.x > rightElbow.x && leftWrist.x < leftElbow.x;
}

/**
 * Gets the maximal distance allowed between wrists in the Om gesture. In order to get a distance
 * appropriate to the object's depth, we use the distance between the eyes as a measure of what's
 * considered a "small distance" in the picture.
 */
function getMaxWristsDistance(eyesDist){
  return 1.9 * eyesDist;  // 1.9 is the constant we think gives the best results.
}

/**
 * Detects an Om pose. Om is the name we gave the main gesture: a kind of a hand clapping.
 */
function detectOm(pose) {
  // eyesDist is used as a measure of what considered a "small distance" in the picture:
  const eyesDist = euclidDist(pose.leftEye, pose.rightEye);
  if (elbowsAligned(pose, eyesDist) && closeWrists(pose, getMaxWristsDistance(eyesDist))
      && wristsInwards(pose)) {
    poseCounter += 1;
    if (poseCounter === OM_SENSITIVITY) { // If we detected enough Oms, its probably not a noise.
      poseCounter = 0;
      iterationsToSleep = SLEEP_TIME; // Do not detect another pose for the next SLEEP_TIME iterations.
      omsDetected += 1;
      listeningTimeLeft = LISTENING_TIME;
      if (omsDetected === 1) { // indicates delay
        changePlayerState('Got it! \nJust a Sec...');
        iterationsToColorPose = ITERATIONS_TO_STAY_COLORED;
      }
      return true;
    }
  }
  return false;
}

/**
 * Updates the last position of the right wrist.
 */
function updateWristCoords({ rightWrist }) {
  lastWristX = rightWrist.x;
  lastWristY = rightWrist.y;
}

/**
 * Gets the minimal distance change that we consider to be a vertical wrist movement.
 * In order to get a distance appropriate to the object's depth, we use the distance between the
 * eyes as a measure of what's considered a "small distance" in the picture.
 */
function getMinVerticalChange(eyesDist){
  return 0.3 * eyesDist;  // 0.3 is the constant we thinks works best.
}

/**
 * Records the wrist movements of the user and keeps them in the global array detectedDirections[].
 */
function recordWristMovement({ rightWrist, leftEye, rightEye }) {
  if (checkScore(rightWrist, WRIST_THRESH) && checkScore(rightEye, EYE_THRASH)
      && checkScore(leftEye, EYE_THRASH)) {
    const yDelta = rightWrist.y - lastWristY;
    const eyesDist = euclidDist(leftEye, rightEye);

    if (yDelta >= getMinVerticalChange(eyesDist)) {
      if (downsDetected >= DOWNS_SENSITIVITY) {
        downsDetected = 0;
      } else {
        downsDetected += 1;
      }
      decreaseVolume();
      iterationsToColorPose = ITERATIONS_TO_STAY_COLORED;
    } else if (yDelta <= -getMinVerticalChange(eyesDist)) {
      if (upsDetected >= UPS_SENSITIVITY) {
        upsDetected = 0;
      } else {
        upsDetected += 1;
      }
      raiseVolume();
      iterationsToColorPose = ITERATIONS_TO_STAY_COLORED;
    }
  }
}

function resetListeningPeriod() {
  omsDetected = 0;
  downsDetected = 0;
  upsDetected = 0;
  poseCounter = 0;
}

function prepareForNewMovement() {
  resetListeningPeriod();
  listeningTimeLeft = 0;
  iterationsToColorPose = ITERATIONS_TO_STAY_COLORED;
}

/**
 * This function inspects the current pose and checks if its a spacial pose.
 * If the pose detected is indeed spacial, the function starts the action triggered by it.
 */
function respondToPose() {
  for (let i = 0; i < poses.length; i += 1) {
    const { pose } = poses[i];

    if (!pose || !player) continue;

    // If we just detected a pose, the current pose is probably trash, so move on:
    if (iterationsToSleep > 0) {
      iterationsToSleep -= 1;
      if (omsDetected !== 0) {
        listeningBar.set((1 - iterationsToSleep / SLEEP_TIME) * 100);
      }
      return;
    }
    listeningBar.set(0);

    // Waits for activation:
    if (omsDetected === 0) {
      detectOm(pose);
    } else {
      // Indicates that the player is listening
      changePlayerState('Listening');
      // After activated, listens for the next command:
      if (listeningTimeLeft > 0) {
        if (detectOm(pose)) {
          playPauseVid();
          prepareForNewMovement();
        } else if (getPlayerStateSafely() === PLAYING) {
          if (lastWristX !== -1 && lastWristY !== -1) { // -1 is the initial value.
            recordWristMovement(pose);
          }
          updateWristCoords(pose);
          listeningTimeLeft -= 1;
        } else {
          lastWristX = -1;  // initial value.
          lastWristY = -1;
          listeningTimeLeft -= 1;
        }
      } else { // End of listening time.
        resetListeningPeriod();
        if (getPlayerStateSafely() !== PLAYING) {
          changePlayerState('Paused');
        } else {
          changePlayerState('Playing');
        }
      }
    }
  }
}

// --------------------------ANIMATIONS----------------------------//
guideButton.onclick = function loadGuid() {
  modal.style.display = 'block';
};
// When the user clicks on <guideSpan> (x), close the modal
guideSpan.onclick = function closeGuide() {
  modal.style.display = 'none';
};

function updateCurrTime(timeElementId, minutes, seconds){
  if (seconds < 10) {
    document.getElementById(timeElementId).innerHTML = `${minutes}:0${seconds}`;
  } else {
    document.getElementById(timeElementId).innerHTML = `${minutes}:${seconds}`;
  }
}

function updatePlayerProgress() {
  if(!player) return;
  // Update the progress bar animation:
  const curr = !player.getCurrentTime ? 0.0 : player.getCurrentTime(); // To work around a bug in Youtube API: https://stackoverflow.com/questions/44523396/player-getduration-and-player-getcurrenttime-is-not-function-error
  const total = !player.getDuration ? 0.0 : player.getDuration();
  musicBar.set((curr / total) * 100);

  // Update the time animations:
  const totalMinutes = Math.floor(total / 60).toString();
  const totalSec = Math.floor(total - totalMinutes * 60).toString();
  const currMinutes = Math.floor(curr / 60).toString();
  const currSec = Math.floor(curr - currMinutes * 60).toString();
  if (getPlayerStateSafely() === PLAYING && currSec >= 0) {
    updateCurrTime('currTime', currMinutes, currSec);
    updateCurrTime('totalTime', totalMinutes, totalSec);
  }
}

function drawSkeletonKeypoints(pose) {
  for (let j = 0; j < pose.keypoints.length; j += 1) {
    // A keypoint is an object describing a body part (like rightArm or leftShoulder)
    const keypoint = pose.keypoints[j];
    // Only draw an ellipse if the point score is bigger than 0.2
    if (keypoint.score > KEYPOINT_CONFIDENCE) {
      if (iterationsToColorPose > 0) {
        fill(163, 247, 223);
      } else {
        fill(247, 223, 163);
      }
      ellipse(keypoint.position.x, keypoint.position.y, KEYPOINT_HEIGHT, KEYPOINT_WIDTH);
    }
  }
}

function drawLine(poseKeyPoint1, poseKeyPoint2) {
  if (iterationsToColorPose > 0) {
    stroke(163, 247, 223);
  } else {
    stroke(247, 223, 163);
  }
  line(
    poseKeyPoint1.x, poseKeyPoint1.y,
    poseKeyPoint2.x, poseKeyPoint2.y,
  );
}

function drawSkeletonLines(pose) {
  ['left', 'right'].forEach((side) => {
    const [elbow, wrist, shoulder, hip] = ['Elbow', 'Wrist', 'Shoulder', 'Hip']
      .map((joint) => pose[side + joint]);

    drawLine(shoulder, elbow);
    drawLine(shoulder, hip);
    drawLine(elbow, wrist);
  });

  drawLine(pose.rightShoulder, pose.leftShoulder);
  drawLine(pose.rightHip, pose.leftHip);
  if (iterationsToColorPose > 0) {
    iterationsToColorPose -= 1;
  }
}

function drawSkeleton() {
  // Loop through all the poses detected
  for (let i = 0; i < poses.length; i += 1) {
    const { pose } = poses[i];

    if (!prevPose) { // Inits prevPose with the first valid pose:
      if (pose) {
        if (pose.score < POSE_CONFIDENCE) {
          return;
        }
      }
      prevPose = pose;
      return;
    }

    if (!pose) {
      drawSkeletonKeypoints(prevPose); // Draws the last valid pose.
      drawSkeletonLines(prevPose);
    } else {
      if (pose.score < POSE_CONFIDENCE) {
        drawSkeletonKeypoints(prevPose); // Draws the last valid pose.
        drawSkeletonLines(prevPose);
        return;
      }
      drawSkeletonKeypoints(pose);
      drawSkeletonLines(pose);
      prevPose = pose;
    }
  }
}

/**
 * Draws the page animations. Called automatically after setup is executed.
 */
function draw() {
  // image is set at the beginning of it's container, hence 0,0:
  image(video, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  background(24, 23, 23);
  drawSkeleton();
  updatePlayerProgress();
}
