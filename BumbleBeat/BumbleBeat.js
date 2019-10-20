// TODO: documentation
// TODO: separate to multiple files.
// TODO: volume funcs are unnecessary & add vol const

// -----------------------MAGIC NUMBERS--------------------------//
// Player's states
const PLAYING = 1;

// Init poseNet:
const HEIGHT = 350;
const WIDTH = 350;

// Key points
const LEFT_SHOULDER = 5;
const RIGHT_SHOULDER = 6;
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

// Thresholds
const WRIST_THRESH = 0.2;
const ELBOW_THRESH = 0.2;
const EYE_THRASH = 0.2;

// Pose sensitivity:
// Determines the number of poses we consider as 'junk' after a spacial pose was detected:
const SLEEP_TIME = 70;
// Determines how many Oms in a row we consider as a true Om (not noise):
const OM_SENSITIVITY = 10;
// Determines for how many iterations we listen to the user's commands after activation:
const LISTENING_TIME = 170;
const DOWNS_SENSITIVITY = 5;
const UPS_SENSITIVITY = 5;

// -----------------------GLOBALS--------------------------//
// Pose detection:
let counter = 0;
let countdown = 0;
let listeningTimeLeft = 0;
let omsDetected = 0;
let upsDetected = 0;
let downsDetected = 0;
let lastWristX = -1;
let lastWristY = -1;

// Give pose feedback:
let prevPose;
let poseDetected = 0; // for skeleton color change when a pose is detected

// Init PoseNet:
let video;
let poseNet;
let poses = [];

// HTML related:
const listeningBar = new ldBar('#myItem1');
const musicBar = new ldBar('#musicBar');

// ----------------------INIT YOUTUBE---------------------------//
// This code loads the IFrame Player API code asynchronously.
const tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

const playlistIds = ['s3Q80mk7bxE', 'nqxVMLVe62U', '0fAQhSRLQnM', 'unfzfe8f9NI'];
const albumsCoverPics = ['album_cover_pics/Diana_Ross_Presents_the_Jackson_5.jpg',
  'album_cover_pics/Jacksons-destiny.jpg', 'album_cover_pics/sultans-front-b.jpg',
  'album_cover_pics/Mamma_Mia_Intermezzo_No_1.jpg'];
const songsNames = ['I Want You Back', 'Blame it on the Boogie', 'Sultans of Swing', 'Mamma Mia'];
const artistsDetails = ['The Jackson 5', 'The Jackson 5', 'Dire Straits', 'ABBA'];
const albumsNames = ['Diana Ross Presents the Jackson 5', 'Destiny', 'Sultans of Swing', ''];
let currentlyPlayingIdx = 0;

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
    events: {},
  });
}

// ---------------------INIT POSE NET------------------------------//
/**
 * prints(?) to the screen 'Model Loaded' when the model is ready.
 */
function modelReady() {
  select('#status').html('');
}

/**
 * Sets up the poseNet library:
 */
function setup() {
  const canvas = createCanvas(WIDTH, HEIGHT);
  canvas.background(6, 6, 6);
  canvas.parent('skeleton');
  video = createCapture(VIDEO);
  video.size(WIDTH, HEIGHT);

  // Create a new poseNet method with a single detection
  poseNet = ml5.poseNet(video, {
    imageScaleFactor: 0.6,
    outputStride: 8,
    detectionType: 'single',
  }, modelReady);
  // This sets up an event that fills the global variable 'poses'
  // with an array every time new poses are detected (listeners)
  poseNet.on('pose', (results) => {
    poses = results;
  });
  // Hide the video element, and just show the canvas
  video.hide();
}

// -----------------------HTML related------------------------//
// Get the modal
const modal = document.getElementById('myModal');

// Get the image and insert it inside the modal - use its 'alt' text as a caption
const guideButton = document.getElementById('guideButton');

guideButton.onclick = function () {
  modal.style.display = 'block';
};

// Get the <span> element that closes the modal
const span = document.getElementsByClassName('close')[0];

// When the user clicks on <span> (x), close the modal
span.onclick = function () {
  modal.style.display = 'none';
};


function updatePlayerProgress() {
  const curr = !player.getCurrentTime ? 0.0 : player.getCurrentTime();
  const total = !player.getDuration ? 0.0 : player.getDuration();
  musicBar.set((curr / total) * 100);
  const totalMinutes = Math.floor(total / 60).toString();
  const totalSec = Math.floor(total - totalMinutes * 60).toString();
  const currMinutes = Math.floor(curr / 60).toString();
  const currSec = Math.floor(curr - currMinutes * 60).toString();
  if (player.getPlayerState() === PLAYING && currSec >= 0) {
    if (currSec < 10) {
      document.getElementById('currTime').innerHTML = `${currMinutes}:0${currSec}`;
    } else {
      document.getElementById('currTime').innerHTML = `${currMinutes}:${currSec}`;
    }
    if (totalSec < 10) {
      document.getElementById('totalTime').innerHTML = `${totalMinutes}:0${totalSec}`;
    } else {
      document.getElementById('totalTime').innerHTML = `${totalMinutes}:${totalSec}`;
    }
  }
}

// ----------------------------PLAYER CONTROL-----------------------------//
/**
 * Called when the play-pause button is clicked.
 */
function playPauseVid() {
  const buttonId = document.getElementById('playPause');
  if (player.getPlayerState() === PLAYING) {
    player.pauseVideo();
    console.log('playPauseVid: paused!');
    document.getElementById('playerStateIndicator').innerHTML = 'Paused';
    buttonId.src = 'icons\\play-button.png';
  } else {
    player.playVideo();
    console.log('playPauseVid: playing!');
    document.getElementById('playerStateIndicator').innerHTML = 'Playing';
    buttonId.src = 'icons\\pause.png';
  }
}

function raiseVolume() {
  const currVolume = player.getVolume() + 7;
  player.setVolume(currVolume);
}

function decreaseVolume() {
  const currVolume = player.getVolume() - 7;
  player.setVolume(currVolume);
}

function changeSongsMetaData() {
  document.getElementById('albumCover').src = albumsCoverPics[currentlyPlayingIdx];
  document.getElementById('songName').innerHTML = songsNames[currentlyPlayingIdx];
  document.getElementById('artistName').innerHTML = artistsDetails[currentlyPlayingIdx];
  document.getElementById('albumName').innerHTML = albumsNames[currentlyPlayingIdx];
}

function nextSong() {
  currentlyPlayingIdx = (currentlyPlayingIdx + 1) % playlistIds.length;
  player.loadVideoById(playlistIds[currentlyPlayingIdx]);
  changeSongsMetaData();
}

function previousSong() {
  if (currentlyPlayingIdx === 0) {
    currentlyPlayingIdx = playlistIds.length - 1;
  } else {
    currentlyPlayingIdx -= 1;
  }
  player.loadVideoById(playlistIds[currentlyPlayingIdx]);
  changeSongsMetaData();
}

// ----------------------------POSE DETECTION--------------------------------//
/**
 * Calculates the Euclidean distance between two key points in a pose object.
 * @param pose
 * @param keyPoint1
 * @param keyPoint2
 */
function euclidDist(pose, keyPoint1, keyPoint2) {
  return Math.sqrt(((pose.keypoints[keyPoint1].position.y
      - pose.keypoints[keyPoint2].position.y) ** 2) + ((pose.keypoints[keyPoint1].position.x
      - pose.keypoints[keyPoint2].position.x) ** 2));
}

/**
 * Tests if two key points are in the same height.
 * @param pose
 * @param keyPoint1
 * @param keyPoint2
 * @param errThresh
 */
function sameHeight(pose, keyPoint1, keyPoint2, errThresh) {
  return Math.abs(pose.keypoints[keyPoint1].position.y
      - pose.keypoints[keyPoint2].position.y) < errThresh;
}

/**
 * Returns true if the score of a key point is above the given threshold.
 * @param pose
 * @param keyPoint
 * @param threshold
 */
function checkScore(pose, keyPoint, threshold) {
  return pose.keypoints[keyPoint].score > threshold;
}

/**
 * Tests if the elbows were detected with high confidence and have in the same height.
 * @param pose
 * @param errThresh
 * @returns {*}
 */
function elbowsAligned(pose, errThresh) {
  return checkScore(pose, LEFT_ELBOW, ELBOW_THRESH) && checkScore(pose, RIGHT_ELBOW, ELBOW_THRESH)
      && sameHeight(pose, LEFT_ELBOW, RIGHT_ELBOW, errThresh);
}

/**
 * Tests if the waists were detected with high confidence, and if they are close.
 * @param pose
 * @param errThresh
 */
function closeWrists(pose, errThresh) {
  const wristDist = euclidDist(pose, LEFT_WRIST, RIGHT_WRIST);
  return checkScore(pose, LEFT_WRIST, WRIST_THRESH)
      && checkScore(pose, RIGHT_WRIST, WRIST_THRESH) && wristDist < errThresh;
}

/**
 * Tests if the wrists are inner compared to the elbows.
 * @param pose
 * @returns {boolean}
 */
function wristsInwards(pose) {
  return pose.keypoints[RIGHT_WRIST].position.x > pose.keypoints[RIGHT_ELBOW].position.x
      && pose.keypoints[LEFT_WRIST].position.x < pose.keypoints[LEFT_ELBOW].position.x;
}

/**
 * Tests if the pose is the Om pose.
 * @param pose
 * @returns {boolean}
 */

function detectOm(pose) {
  const eyesDist = euclidDist(pose, LEFT_EYE, RIGHT_EYE);
  if (elbowsAligned(pose, eyesDist) && closeWrists(pose, 1.9 * eyesDist)
      && wristsInwards(pose)) {
    counter += 1;
    if (counter === OM_SENSITIVITY) { // If we detected enough Oms, its probably not a noise.
      counter = 0;
      countdown = SLEEP_TIME; // Do not detect another pose for the next SLEEP_TIME iterations.
      omsDetected += 1;
      listeningTimeLeft = LISTENING_TIME;
      if (omsDetected === 1) { // indicates delay
        document.getElementById('playerStateIndicator').innerHTML = 'Got it! \nJust a Sec...';
        document.getElementById('playerStateIndicator').style.color = '#F7DFA3';
        poseDetected = 10;
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
function recordWristMovement(pose) {
  if (checkScore(pose, RIGHT_WRIST, WRIST_THRESH) && checkScore(pose, RIGHT_EYE, EYE_THRASH)
      && checkScore(pose, LEFT_EYE, EYE_THRASH)) {
    const yDelta = pose.keypoints[RIGHT_WRIST].position.y - lastWristY;
    const eyesDist = euclidDist(pose, LEFT_EYE, RIGHT_EYE);

    if (yDelta >= 0.3 * eyesDist) {
      if (downsDetected >= DOWNS_SENSITIVITY) {
        downsDetected = 0;
      } else {
        downsDetected += 1;
      }
      decreaseVolume();
      poseDetected = 10;
      console.log('recordWristMovement: decrease volume');
      console.log('recordWristMovement: volume: ', player.getVolume());
    } else if (yDelta <= -0.3 * eyesDist) {
      if (upsDetected >= UPS_SENSITIVITY) {
        upsDetected = 0;
      } else {
        upsDetected += 1;
      }
      raiseVolume();
      poseDetected = 10;
      console.log(`recordWristMovement: ups detected: ${upsDetected}`);
      console.log('recordWristMovement: raise volume');
      console.log('recordWristMovement: volume: ', player.getVolume());
    }
  }
}

/**
 * This function inspects the current pose and checks if its a spacial pose.
 * If the pose detected is indeed spacial, the function starts the action triggered by it.
 */
function poseDetection() {
  for (let i = 0; i < poses.length; i += 1) {
    const { pose } = poses[i];

    // Tests if the pose is valid:
    if (!pose) {
      continue;
    }

    // If we just detected a pose, the current pose is probably trash, so move on:
    if (countdown > 0) {
      countdown -= 1;
      if (omsDetected !== 0) {
        listeningBar.set((1 - countdown / SLEEP_TIME) * 100);
      }
      console.log('poseDetection: delaying');
      return;
    }
    listeningBar.set(0);

    // Waits for activation:
    if (omsDetected === 0) {
      console.log('poseDetection: Waits for activation');
      detectOm(pose);
    } else {
      // Indicates that the player is listening
      document.getElementById('playerStateIndicator').innerHTML = 'Listening';
      document.getElementById('playerStateIndicator').style.color = '#F7DFA3';
      // After activated, listens for the next command:
      if (listeningTimeLeft > 0) {
        if (detectOm(pose)) {
          playPauseVid();
          listeningTimeLeft = 0;
          downsDetected = 0;
          upsDetected = 0;
          counter = 0;
          omsDetected = 0; // two oms were detected - reset counter and wait for activation again.
          poseDetected = 10;
        } else if (player.getPlayerState() === PLAYING) {
          // Listens for circles:
          if (lastWristX !== -1 && lastWristY !== -1) {
            recordWristMovement(pose);
          }
          updateWristCoords(pose);
          listeningTimeLeft -= 1;
        } else {
          lastWristX = -1;
          lastWristY = -1;
          listeningTimeLeft -= 1;
        }
      } else { // End of listening time.
        omsDetected = 0;
        downsDetected = 0;
        upsDetected = 0;
        counter = 0;
        if (player.getPlayerState() !== PLAYING) {
          document.getElementById('playerStateIndicator').innerHTML = 'Paused';
        } else {
          document.getElementById('playerStateIndicator').innerHTML = 'Playing';
        }
      }
    }
  }
}

// --------------------------GIVE POSE FEEDBACK----------------------------//
/**
 * Draws the actual key points
 * @param pose
 */
function keypointsHelper(pose) {
  for (let j = 0; j < pose.keypoints.length; j += 1) {
    // A keypoint is an object describing a body part (like rightArm or leftShoulder)
    const keypoint = pose.keypoints[j];
    // Only draw an ellipse is the pose probability is bigger than 0.2
    if (keypoint.score > 0.2) {
      if (poseDetected > 0) {
        fill(163, 247, 223);
      } else {
        fill(247, 223, 163);
      }
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
function drawLine(pose, kp1, kp2) {
  if (poseDetected > 0) {
    stroke(163, 247, 223);
  } else {
    stroke(247, 223, 163);
  }

  line(pose.keypoints[kp1].position.x, pose.keypoints[kp1].position.y,
    pose.keypoints[kp2].position.x, pose.keypoints[kp2].position.y);
}

function skeletonHelper(pose) {
  drawLine(pose, LEFT_SHOULDER, RIGHT_SHOULDER);
  drawLine(pose, LEFT_SHOULDER, LEFT_ELBOW);
  drawLine(pose, LEFT_ELBOW, LEFT_WRIST);
  drawLine(pose, RIGHT_SHOULDER, RIGHT_ELBOW);
  drawLine(pose, RIGHT_ELBOW, RIGHT_WRIST);
  drawLine(pose, RIGHT_SHOULDER, RIGHT_HIP);
  drawLine(pose, LEFT_SHOULDER, LEFT_HIP);
  drawLine(pose, RIGHT_HIP, LEFT_HIP);
  if (poseDetected > 0) {
    poseDetected -= 1;
  }
}

/**
 * A function to draw ellipses over the detected key points.
 */
function drawKeypoints() {
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
      keypointsHelper(prevPose); // Draws the last valid pose.
      skeletonHelper(prevPose);
    } else {
      if (pose.score < POSE_CONFIDENCE) {
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

/**
 * Draws the skeleton and key points of each pose when detected.
 */
function draw() {
  image(video, 0, 0, WIDTH, HEIGHT);
  background(24, 23, 23);
  updatePlayerProgress();
  drawKeypoints();
  poseDetection();
}
