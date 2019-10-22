# BumbleBeat 
![alt text](READMEImages/logo.png "our logo")

BumbleBeat is a gestured-based music player written in JavaScript. The target of the app is 
to free users from the need to be close to any sort of controller in order to affect music flow.

![alt text](READMEImages/BumbleBeatInAction.PNG "BumbleBeat in action")

The pose detection is preformed by TensorFlow's [poseNet module](https://medium.com/tensorflow/real-time-human-pose-estimation-in-the-browser-with-tensorflow-js-7dd0bc881cd5)
using [ml5 interface](https://ml5js.org/reference/api-PoseNet/), and we drew animations using the [p5.js library](https://p5js.org/). 
We also used [Youtube API](https://developers.google.com/youtube/iframe_api_reference) in order to load a few example songs.


## Usage
In order to run BumbleBeat, simply run PerceptualComputingProj\BumbleBeat\BumbleBeat.html. 
The interface is pretty simple, it is described in this guide we made:

![alt text](READMEImages/GuideFinished.png "guide")

Pay attention that BumbleBeat is just a POC, so for now we only have a small number of pre-defined 
songs, and there might be some small things that don't work as expected.