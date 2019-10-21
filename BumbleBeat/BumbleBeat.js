// TODO: handle code structure
// TODO: magic numbers / text where needed.
// TODO: documentation
// TODO: update README ("it's just a POC, some things are not working...")
// TODO: check the html and css files look ok.
// TODO: fix bugs: first play, next/prev song
// TODO: separate to multiple files.

// -----------------------MAGIC NUMBERS--------------------------//
// Skeleton display:
const CANVAS_HEIGHT = 350;
const CANVAS_WIDTH = 350;
const ITERATIONS_TO_STAY_COLORED = 10;

// Player:
const PLAYER_HEIGHT = '0';
const PLAYER_WIDTH = '0';
const PLAYING = 1;

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

// Thresholds:
const POSE_CONFIDENCE = 0.2;
const WRIST_THRESH = 0.2;
const ELBOW_THRESH = 0.2;
const EYE_THRASH = 0.2;

// Pose sensitivity:
const SLEEP_TIME = 15; // Determines the number of poses we consider as 'junk' after a spacial pose was detected:
const OM_SENSITIVITY = 5; // Determines how many Oms in a row we consider as a true Om (not noise):
const LISTENING_TIME = 35; // Determines for how many iterations we listen to the user's commands after activation:
const DOWNS_SENSITIVITY = 10;
const UPS_SENSITIVITY = 10;

// -----------------------CONSTANTS--------------------------//
// HTML related:
const listeningBar = new ldBar('#myItem1');
const musicBar = new ldBar('#musicBar');
const modal = document.getElementById('myModal');
const guideButton = document.getElementById('guideButton');
const span = document.getElementsByClassName('close')[0];  // TODO: Awful name

// Youtube API related:
const tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
const playlistIds = ['s3Q80mk7bxE', 'nqxVMLVe62U', '0fAQhSRLQnM', 'unfzfe8f9NI'];  // TODO: Somewhat ugly.
const albumsCoverPics = ['album_cover_pics/Diana_Ross_Presents_the_Jackson_5.jpg',
  'album_cover_pics/Jacksons-destiny.jpg', 'album_cover_pics/sultans-front-b.jpg',
  'album_cover_pics/Mamma_Mia_Intermezzo_No_1.jpg'];
const songsNames = ['I Want You Back', 'Blame it on the Boogie', 'Sultans of Swing', 'Mamma Mia'];
const artistsDetails = ['The Jackson 5', 'The Jackson 5', 'Dire Straits', 'ABBA'];
const albumsNames = ['Diana Ross Presents the Jackson 5', 'Destiny', 'Sultans of Swing', ''];

// -----------------------GLOBALS--------------------------//
// Pose detection:
let poseCounter = 0;
let iterationsToSleep = 0;  // TODO: find a better name
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
 * You can read more about it here: https://p5js.org/reference/#/p5/setup.
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

  // Sets up an event that records the newly detected pose and detects it.
  poseNet.on('pose', function (results) {
    poses = results;
    respondToPose();
  });

  // Hides the video element (to show the canvas only):
  video.hide();
}

// ----------------------------PLAYER CONTROL-----------------------------//
/**
 * Changes player's state to "PLAYING" if paused and vice-versa.
 */
function playPauseVid() {
  if (!player) {
    return;
  }
  const buttonId = document.getElementById('playPause');
  if (player.getPlayerState() === PLAYING) {
    player.pauseVideo();
    document.getElementById('playerStateIndicator').innerHTML = 'Paused';
    buttonId.src = 'icons\\play-button.png';
  } else {
    player.playVideo();
    document.getElementById('playerStateIndicator').innerHTML = 'Playing';
    buttonId.src = 'icons\\pause.png';
  }
}

function raiseVolume() {
  if (!player) {
    return;
  }
  player.setVolume(player.getVolume() + 7);
}

function decreaseVolume() {
  if (!player) {
    return;
  }
  player.setVolume(player.getVolume() - 7);
}

function changeSongsMetaData() {
  document.getElementById('albumCover').src = albumsCoverPics[currentlyPlayingIdx];
  document.getElementById('songName').innerHTML = songsNames[currentlyPlayingIdx];
  document.getElementById('artistName').innerHTML = artistsDetails[currentlyPlayingIdx];
  document.getElementById('albumName').innerHTML = albumsNames[currentlyPlayingIdx];
}

function nextSong() {
  if (!player) {
    return;
  }
  currentlyPlayingIdx = (currentlyPlayingIdx + 1) % playlistIds.length;
  player.loadVideoById(playlistIds[currentlyPlayingIdx]);
  changeSongsMetaData();
}

function previousSong() {
  if (!player) {
    return;
  }
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
 */
function checkScore({confidence}, threshold) {
  return confidence > threshold;
}

/**
 * Tests if the elbows were detected with high confidence and have in the same height.
 * @param pose
 * @param errThresh
 * @returns {*}
 */
function elbowsAligned(pose, errThresh) {
  return checkScore(pose.leftElbow, ELBOW_THRESH) && checkScore(pose.rightElbow, ELBOW_THRESH)
      && sameHeight(pose, LEFT_ELBOW, RIGHT_ELBOW, errThresh);
}

/**
 * Tests if the waists were detected with high confidence, and if they are close.
 * @param pose
 * @param errThresh
 */
function closeWrists(pose, errThresh) {
  const wristDist = euclidDist(pose, LEFT_WRIST, RIGHT_WRIST);
  return checkScore(pose.leftWrist, WRIST_THRESH)
      && checkScore(pose.rightWrist, WRIST_THRESH) && wristDist < errThresh;
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
// TODO: dont be lame, comment Om.
function detectOm(pose) {
  const eyesDist = euclidDist(pose, LEFT_EYE, RIGHT_EYE);
  if (elbowsAligned(pose, eyesDist) && closeWrists(pose, 1.9 * eyesDist)
      && wristsInwards(pose)) {
    poseCounter += 1;
    if (poseCounter === OM_SENSITIVITY) { // If we detected enough Oms, its probably not a noise.
      poseCounter = 0;
      iterationsToSleep = SLEEP_TIME; // Do not detect another pose for the next SLEEP_TIME iterations.
      omsDetected += 1;
      listeningTimeLeft = LISTENING_TIME;
      if (omsDetected === 1) { // indicates delay
        document.getElementById('playerStateIndicator')
            .innerHTML = 'Got it! \nJust a Sec...';
        document.getElementById('playerStateIndicator').style.color = '#F7DFA3';
        iterationsToColorPose = ITERATIONS_TO_STAY_COLORED;
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
function updateWristCoords({ rightWrist }) {
  lastWristX = rightWrist.x;
  lastWristY = rightWrist.y;
}

/**
 * Records the wrist movements of the user and keeps them in the global array detectedDirections[].
 * @param pose
 */
function recordWristMovement(pose) {
  if (checkScore(pose.rightWrist, WRIST_THRESH) && checkScore(pose.rightEye, EYE_THRASH)
      && checkScore(pose.leftEye, EYE_THRASH)) {
    const yDelta = pose.keypoints[RIGHT_WRIST].position.y - lastWristY;
    const eyesDist = euclidDist(pose, LEFT_EYE, RIGHT_EYE);

    if (yDelta >= 0.3 * eyesDist) {
      if (downsDetected >= DOWNS_SENSITIVITY) {
        downsDetected = 0;
      } else {
        downsDetected += 1;
      }
      decreaseVolume();
      iterationsToColorPose = ITERATIONS_TO_STAY_COLORED;
    } else if (yDelta <= -0.3 * eyesDist) {
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
    const {pose} = poses[i];

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
      document.getElementById('playerStateIndicator').innerHTML = 'Listening';
      document.getElementById('playerStateIndicator').style.color = '#F7DFA3';
      // After activated, listens for the next command:
      if (listeningTimeLeft > 0) {
        if (detectOm(pose)) {
          playPauseVid();
          prepareForNewMovement();
        } else if (player.getPlayerState() === PLAYING) {
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
        resetListeningPeriod();
        if (player.getPlayerState() !== PLAYING) {
          document.getElementById('playerStateIndicator').innerHTML = 'Paused';
        } else {
          document.getElementById('playerStateIndicator').innerHTML = 'Playing';
        }
      }
    }
  }
}

// --------------------------ANIMATIONS----------------------------//
guideButton.onclick = function loadGuid() {
  modal.style.display = 'block';
};
// When the user clicks on <span> (x), close the modal
span.onclick = function closeGuide() {
  modal.style.display = 'none';
};

function updatePlayerProgress() {
  const curr = !player ? 0.0 : player.getCurrentTime();
  const total = !player ? 0.0 : player.getDuration();
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

/**
 * Draws the actual key points
 * @param pose
 */
function keypointsHelper(pose) {
  for (let j = 0; j < pose.keypoints.length; j += 1) {
    // A keypoint is an object describing a body part (like rightArm or leftShoulder)
    const keypoint = pose.keypoints[j];
    // Only draw an ellipse if the pose probability is bigger than 0.2
    if (keypoint.score > 0.2) {
      if (iterationsToColorPose > 0) {
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
 */
function drawLine(poseKeyPoint1, poseKeyPoint2) {
  if (iterationsToColorPose > 0) {
    stroke(163, 247, 223);
  } else {
    stroke(247, 223, 163);
  }

  line(
      poseKeyPoint1.x,
      poseKeyPoint1.y,
      poseKeyPoint2.x,
      poseKeyPoint2.y
  );
}

function skeletonHelper(pose) {
  ['left', 'right'].forEach(side => {
    const [elbow, wrist, shoulder, hip] = ["Elbow", "Wrist", "Shoulder", "Hip"]
        .map(joint => pose[side + joint]);

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

/**
 * A function to draw ellipses over the detected key points.
 */
function drawSkeleton() {
  // Loop through all the poses detected
  for (let i = 0; i < poses.length; i += 1) {
    const {pose} = poses[i];

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
 * Draws the page animations. Called automatically after setup is executed.
 */
function draw() {
  image(video, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  background(24, 23, 23);
  drawSkeleton();
  updatePlayerProgress();
}