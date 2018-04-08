/**
 * Audio Detection and Viz
 */

var pieces, radius, fft, mapMouseX, mapMouseY, mic;
var audioScoreMax = 100;
var audioPlot;
var updateInterval = 30;
var audioTriggerThreshold = 50;
var data = [],
  totalPoints = 300;

var colorPalette = ["#fbd53c", "#00b3c8", "#fff", "#ff0000"];

function setup() {
  fft = new p5.FFT();
  mic = new p5.AudioIn();
  mic.start();
  fft = new p5.FFT();
  fft.setInput(mic);
  resizeCanvas(windowWidth, windowHeight);

  audioPlot = $.plot("#audioMotionPlot", [getAudioData()], {
    series: {
      shadowSize: 0,
      color: "#fff",
      lines: {
        lineWidth: 1
      }
    },
    yaxis: {
      min: 0,
      max: audioScoreMax,
      show: false
    },
    xaxis: {
      show: false
    },
    grid: {
      borderWidth: 0,
      labelMargin: 0,
      axisMargin: 0,
      minBorderMargin: 0
    }
  });

  updateAudioPlot();

  $("#flat-slider-vertical-2")
    .slider({
      max: audioScoreMax,
      min: 0,
      range: "min",
      value: 50,
      orientation: "vertical",
      change: function(event, ui) {
        audioTriggerThreshold = ui.value;
        console.log("AUDIO THRESHOLD LEVEL CHANGED", ui.value);
        $(".audioThresholdLevel").css("top", 100 - ui.value);
      }
    })
    .slider("pips", {
      step: "5",
      first: "pip",
      last: "pip"
    })
    .slider("float");
}

function updateAudioPlot() {
  audioPlot.setData([getAudioData()]);
  audioPlot.draw();
  setTimeout(updateAudioPlot, updateInterval);
}

function getAudioData() {
  if (data.length > 0) data = data.slice(1);

  // Do a random walk

  while (data.length < totalPoints) {
    var prev = data.length > 0 ? data[data.length - 1] : 50,
      y = mic.getLevel() * 1000;

    if (y < 0) {
      y = 0;
    } else if (y > audioScoreMax) {
      y = audioScoreMax;
    }

    data.push(y);
  }

  // Zip the generated y values with the x values

  var res = [];
  for (var i = 0; i < data.length; ++i) {
    res.push([i, data[i]]);
  }

  return res;
}

function draw() {
  background(colorPalette[0]);

  noFill();

  fft.analyze();

  var bass = fft.getEnergy("bass");
  var treble = fft.getEnergy("treble");
  var mid = fft.getEnergy("mid");

  var mapMid = map(mid, 0, 255, -radius, radius);
  var scaleMid = map(mid, 0, 255, 1, 1.5);

  var mapTreble = map(treble, 0, 255, -radius, radius);
  var scaleTreble = map(treble, 0, 255, 1, 1.5);

  var mapbass = map(bass, 0, 255, -100, 800);
  var scalebass = map(bass, 0, 255, 0, 0.8);

  mapMouseX = map(mouseX, 0, width, 4, 10);
  mapMouseY = map(mouseY, 0, height, windowHeight / 4, windowHeight);

  pieces = mapMouseX;
  radius = mapMouseY;

  translate(windowWidth / 2, windowHeight / 2);

  strokeWeight(1);

  for (i = 0; i < pieces; i += 0.5) {
    rotate(TWO_PI / pieces);

    /*----------  BASS  ----------*/
    push();
    strokeWeight(5);
    stroke(colorPalette[1]);
    scale(scalebass);
    rotate(frameCount * -0.5);
    line(mapbass, radius / 2, radius, radius);
    line(-mapbass, -radius / 2, radius, radius);
    pop();

    /*----------  MID  ----------*/
    push();
    strokeWeight(0.5);
    stroke(colorPalette[2]);
    scale(scaleMid);
    line(mapMid, radius / 2, radius, radius);
    line(-mapMid, -radius / 2, radius, radius);
    pop();

    /*----------  TREMBLE  ----------*/
    push();
    stroke(colorPalette[3]);
    scale(scaleTreble);
    line(mapTreble, radius / 2, radius, radius);
    line(-mapTreble, -radius / 2, radius, radius);
    pop();
  }

  laughTrackHander();
}

function laughTrackHander() {
  vol = mic.getLevel() * 1000;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Set up the control widget

/**
 * Video Detection
 */

var initVideoDetection = function() {
  var motionPreview = document.getElementById("motionPreview");
  //var videoPreview = document.getElementById("videoPreview");
  var motionScore = 0;
  var motionScoreMax = 1000;
  var videoTriggerThreshold = 500;

  function initDiffcamSuccess() {
    DiffCamEngine.start();
  }

  function initDiffcamError() {
    alert(
      "Something went wrong with loading video. Please check allow video stream in Chrome."
    );
  }

  function captureVideo(payload) {
    motionScore = payload.score;
    // score.textContent = payload.score;
    // if (payload.score >= videoTriggerThreshold) {
    //   console.log("triggered!" + payload.score);
    //   if (audio.paused && introOn) {
    //     audio = new Audio("audio/intro-" + getRandomInt(1, 3) + ".mp3");
    //     audio.play();
    //   }
    // }
  }

  DiffCamEngine.init({
    //video: videoPreview,
    motionCanvas: motionPreview,
    initSuccessCallback: initDiffcamSuccess,
    initErrorCallback: initDiffcamError,
    captureCallback: captureVideo
  });

  // We use an inline data source in the example, usually data would
  // be fetched from a server

  var data = [],
    totalPoints = 300;

  function getMotionData() {
    if (data.length > 0) data = data.slice(1);

    // Do a random walk

    while (data.length < totalPoints) {
      var prev = data.length > 0 ? data[data.length - 1] : 50,
        y = motionScore;

      if (y < 0) {
        y = 0;
      } else if (y > motionScoreMax) {
        y = motionScoreMax;
      }

      data.push(y);
    }

    // Zip the generated y values with the x values

    var res = [];
    for (var i = 0; i < data.length; ++i) {
      res.push([i, data[i]]);
    }

    return res;
  }

  // Set up the control widget

  var updateInterval = 30;

  var plot = $.plot("#videoMotionPlot", [getMotionData()], {
    series: {
      shadowSize: 0,
      color: "#fff",
      lines: {
        lineWidth: 1
        // fill: true,
        // fillColor: "#fff"
      }
    },
    yaxis: {
      min: 0,
      max: motionScoreMax,
      show: false
    },
    xaxis: {
      show: false
    },
    grid: {
      borderWidth: 0,
      labelMargin: 0,
      axisMargin: 0,
      minBorderMargin: 0
    }
  });

  function update() {
    plot.setData([getMotionData()]);

    // Since the axes don't change, we don't need to call plot.setupGrid()

    plot.draw();
    setTimeout(update, updateInterval);
  }

  update();

  $("#flat-slider-vertical-1")
    .slider({
      max: motionScoreMax,
      min: 0,
      range: "min",
      value: 500,
      orientation: "vertical",
      change: function(event, ui) {
        videoTriggerThreshold = ui.value;
        console.log(
          "videoTriggerThreshold changed to " + videoTriggerThreshold
        );
        $(".motionThresholdLevel").css("top", 100 - ui.value / 10);
      }
    })
    .slider("pips", {
      first: "pip",
      last: "pip"
    })
    .slider("float");
};

$(function() {
  initVideoDetection();
});
