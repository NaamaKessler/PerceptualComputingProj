// Copyright (c) 2018 ml5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/* ===
ml5 Example
PoseNet example using p5.js
=== */

let video;
let poseNet;
let poses = [];
let COUNTER = 0;
// var coolSong = new Audio('https://s3-us-west-2.amazonaws.com/s.cdpn.io/355309/Swing_Jazz_Drum.mp3');
// function play_sound() {
//     document.getElementById('myaudio').play();
// }
let COUNTDOWN = 0;
var delayInMilliseconds = 10000; //10 second

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

function modelReady() {
    select('#status').html('Model Loaded');
}

function draw() {
    image(video, 0, 0, width, height);

// We can call both functions to draw all keypoints and the skeletons
    drawKeypoints();
    drawSkeleton();
    // setTimeout(function() {
    //     your code to be executed after 1 second
        poseDetection();
    // }, delayInMilliseconds);
}

// A function to draw ellipses over the detected keypoints
function drawKeypoints()  {
    // Loop through all the poses detected
    for (let i = 0; i < poses.length; i++) {
        // For each pose detected, loop through all the keypoints
        let pose = poses[i].pose;
        if (pose) {
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

// A function to draw the skeletons
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


function poseDetection() {
    for (let i = 0; i < poses.length; i++) { // For each pose detected, loop through all the keypoints
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
        if(pose.keypoints[left_elbow].score > 0.6 && pose.keypoints[right_elbow].score > 0.6){
            if (Math.abs(pose.keypoints[left_elbow].position.y - pose.keypoints[right_elbow].position.y) < eyes_dist) {   // elbow's hight
                if (pose.keypoints[left_wrist].score > 0.3 && pose.keypoints[right_wrist].score > 0.3 && wrist_dist < 1.5*ears_dist) {
                    if (pose.keypoints[right_wrist].position.x > pose.keypoints[right_elbow].position.x &&
                        pose.keypoints[left_wrist].position.x < pose.keypoints[left_elbow].position.x) {
                            COUNTER++;
                            if (COUNTER === 10) {
                                console.log("Hoooo yeee pose detected!!!");
                                playPups();
                                COUNTER = 0;
                                COUNTDOWN = 30;
                            }

                    }
                }
            }
        }
    }
}


// Youtube things
// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');

tag.src = "http://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '390',
        width: '640',
        videoId: 'ZZb_ZtjVxUQ',
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
    event.target.playVideo();
}

// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
var done = false;
function onPlayerStateChange(event) {
    // if (event.data == YT.PlayerState.PLAYING && !done) {
    //     setTimeout(stopVideo, 6000);
    //     done = true;
    // }
}
function pausePups() {
    player.pauseVideo();
}

function playPups() {
    player.playVideo();
}

function raiseVolume() {
    var currVolume = player.getVolume();
    player.setVolume(currVolume += 10);
}

function puppiesAreTooLoud() {
    var currVolume = player.getVolume();
    player.setVolume(currVolume -= 10);
}