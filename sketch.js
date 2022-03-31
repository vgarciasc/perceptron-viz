var WIDTH = 640;
var HEIGHT = 480;
var PT_RADIUS = 10;
var TICKS_QT = 9;
var GRAPH_W = WIDTH * 0.8;
var GRAPH_H = HEIGHT * 0.8;

var target_fn = [0, 0]
var points = []
var perceptron_weights = [0, 0, 0];
var iterations = 0;

var actions = ["WHILE CHECK", "PICK_MISCLASSIFIED_POINT", "UDPATE_WEIGHTS"];
var current_action = 0;
var states = ["PAUSED", "PLAYING"];
var current_state = 0;

function setup() {
  var cv = createCanvas(WIDTH, HEIGHT);
  cv.parent("canvas-holder");

  textAlign(LEFT, CENTER);
  textFont("MS Gothic")
  // textStyle(BOLD);
  textSize(16);
  noSmooth();
  
  restart();
}

function initialize() {
  var points_qt = $("#number_of_points").val();
  for (var i = 0; i < points_qt; i++) {
    points.push({
      x1: random(0, 1),
      x2: random(0, 1)
    });
  }
  
  var pt1 = {x1: random(0, 1), x2: random(0, 1)};
  var pt2 = {x1: random(0, 1), x2: random(0, 1)};
  var a = (pt2.x2 - pt1.x2) / (pt2.x1 - pt1.x1);
  var b = (pt1.x2 - a * pt1.x1);
  target_fn = [a, b];

  points.forEach((pt) => pt.y = (target_fn[0] * pt.x1 + target_fn[1] <= pt.x2) ? 1 : - 1);
}

function restart() {
  target_fn = [0, 0]
  points = []
  perceptron_weights = [0, 0, 0];
  iterations = 0;
  current_action = 0;

  initialize();
}

function draw() {
  background(255);
  
  push();
  translate(0, height);
  translate(40, -25);
  
  draw_graph();
  draw_points();
  draw_perceptron(perceptron_weights);
  draw_target_fn(target_fn)
  draw_ui();  

  pop();
  
  if (states[current_state] == "PLAYING" && frameCount % 2 == 0) {
    update_step();
  }
}

function draw_graph() {
  // axis
  line(0, 0, width*0.85, 0);
  line(0, 0, 0, -height*0.9);
  
  // ticks
  for (let i = 0; i < TICKS_QT; i++) {
    var h_dist = (width * 0.95 / TICKS_QT) - (width * 0.95 / TICKS_QT) % 10;
    line(i * h_dist, -5, i * h_dist, 5);
    textAlign(LEFT, CENTER);
    text(i * h_dist, i * h_dist - 10, 15);
    
    var v_dist = (height * 0.95 / TICKS_QT) - (height * 0.95 / TICKS_QT) % 10;
    line(-5, -i * v_dist, 5, -i * v_dist);
    textAlign(RIGHT, CENTER);
    text(i * v_dist, -12, - i * v_dist);
  }
}

function draw_points() {
  // i know this is really ugly but don't want to mess with this now
  for (let i = 0; i < points.length; i++) {
    var point = points[i];
    point.misclassified = classify_point(perceptron_weights, points[i]) != points[i].y
    noStroke();
    
    if (point.y == 1) {
      if (point.misclassified) {
        fill('grey')
        circle(point.x1 * GRAPH_W, -point.x2 * GRAPH_H, PT_RADIUS * 1.5);
      }
    
      fill('red');
      if (point.selected) fill('lime')
      circle(point.x1 * GRAPH_W, -point.x2 * GRAPH_H, PT_RADIUS);
    }
    else {
      push()
      translate(-PT_RADIUS*0.5, -PT_RADIUS*0.5)

      if (point.misclassified) {
        fill('grey')
        square(point.x1 * GRAPH_W - PT_RADIUS * 0.25,
               -point.x2 * GRAPH_H - PT_RADIUS*0.25, PT_RADIUS * 1.5);
      }
      
      fill('blue');
      
      if (point.selected) {
        fill('lime')
      }
      
      square(point.x1 * GRAPH_W, -point.x2 * GRAPH_H, PT_RADIUS);
      pop()
    }
  }
}

function draw_perceptron(w) {
  var f = ((x1) => - w[1]/w[2] * x1 - w[0]/w[2]);
  strokeWeight(3);
  var pad = 1;
  
  stroke(color(0, 0, 180));
  line(-1 * GRAPH_W, -f(-1) * GRAPH_H, 1 * GRAPH_W, -f(1) * GRAPH_H)
  
//   stroke(color(0, 180, 0));
//   line(0 - pad, -f(0) * GRAPH_H - pad, 1 * GRAPH_W - pad, -f(1) * GRAPH_H - pad)
  
  stroke(color(180, 0, 0));
  line(-1 * GRAPH_W - pad * 2, -f(-1) * GRAPH_H - pad * 2, 1 * GRAPH_W - pad * 2, -f(1) * GRAPH_H - pad * 2)
}

function draw_target_fn(w) {
  stroke('purple')
  strokeWeight(1);
  drawingContext.setLineDash([5, 5]);
  
  var f = ((x1) => target_fn[0] * x1 + target_fn[1]);
  line(0 * GRAPH_W, - f(0) * GRAPH_H, 1 * GRAPH_W, -f(1) * GRAPH_H)
  
  drawingContext.setLineDash([]);
}

function draw_ui() {
  let errors = get_misclassified_points(perceptron_weights, points).length;

  fill("black");
  noStroke();
  textAlign(LEFT, TOP);

  text("iterations: " + iterations +  "\n    errors: " + errors,
    width * 0.8 - 30, - height * 0.9 - 20, 150, 50)
}

function update_step() {
  $(".code-line").removeClass("successful-code");
  $(".code-line").removeClass("errorful-code");

  var misclassified = get_misclassified_points(perceptron_weights, points);
  if (misclassified == undefined || misclassified.length == 0) {
    $("#code-line-1").addClass("errorful-code");
    return;
  }

  if (current_action == 0) {
  } else if (current_action == 1) {
    misclassified[0].selected = true;
  } else if (current_action == 2) {
    points.forEach((pt) => pt.selected = false);
    update_perceptron(1);
  }
  
  $("#code-line-" + (current_action + 1)).addClass("successful-code")
  current_action = (current_action + 1) % actions.length;
}

function update_perceptron(steps) {
  var w = perceptron_weights;
  
  for (var i = 0; i < steps; i++) {
    var misclassified = get_misclassified_points(w, points);
    if (!misclassified) {
      return;
    }
    
    var wrong_x = random(misclassified);
    if (wrong_x) {
      perceptron_weights = [
        w[0] + wrong_x.y,
        w[1] + wrong_x.y * wrong_x.x1,
        w[2] + wrong_x.y * wrong_x.x2];
    }
    
    iterations += 1;
  }  
}

function classify_point(w, pt) {
  var sign = Math.sign(w[0] + w[1] * pt.x1 + w[2] * pt.x2);
  return sign;
}

function get_misclassified_points(w, points) {
  return points.filter((pt) => classify_point(w, pt) != pt.y);
}

function press_play() {
  current_state = (current_state + 1) % 2;
  if (current_state == 0) {
    $("#play_btn").text("Play >>>")
  } else if (current_state == 1) {
    $("#play_btn").text("Pause ||")
  }
}