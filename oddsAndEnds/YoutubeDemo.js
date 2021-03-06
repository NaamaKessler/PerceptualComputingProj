// 2. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube poseDemo)
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

// 4. The API will call this function when the video poseDemo is ready.
function onPlayerReady(event) {
    event.target.playVideo();
}

// 5. The API calls this function when the poseDemo's state changes.
//    The function indicates that when playing a video (state=1),
//    the poseDemo should play for six seconds and then stop.
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