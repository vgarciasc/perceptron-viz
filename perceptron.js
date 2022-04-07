var width = 600;
var height = 450;
var margin = { top: 20, right: 10, bottom: 20, left: 30 };

var target_fn;
var perceptron;
var points;

var actions = ["WHILE CHECK", "PICK_MISCLASSIFIED_POINT", "UDPATE_WEIGHTS"];
var states = ["PAUSED", "PLAYING"];
var current_action;
var current_state;
var current_interval;
var current_iteration;

function restart() {
	if (current_state == 1) {
		press_play();
	}

	current_state = 0;
	current_action = 0;
	current_interval = null;
	current_iteration = 0;

	target_fn = [generateTargetFunction()];
	perceptron = [{w0: 0, w1: 1, w2: -1.5}];
	points = generatePoints(parseInt($("#number_of_points").val()));
	update();
}

function generateTargetFunction() {
	var pt1 = {x1: Math.random(), x2: Math.random()};
	var pt2 = {x1: Math.random(), x2: Math.random()};
	var a = (pt2.x2 - pt1.x2) / (pt2.x1 - pt1.x1);
	var b = (pt1.x2 - a * pt1.x1);
	return {a: a, b: b};
}

function generatePoints(points_qt) {
	let f = target_fn[0];
	let output = [];

	for (var i = 0; i < points_qt; i++) {
		let pt = {x: Math.random(), y: Math.random()};
		pt.label = pt.y <= (f.a * pt.x + f.b) ? +1 : -1;
		output.push(pt);
	}

	if (!$("#is_linearly_separable").is(":checked")) {
		for (var i = 0; i < 0.2 * points_qt; i++) {
			var point = output.random();
			point.label *= -1;
		}
	}

	return output;
}

function classifyPoint(point) {
	var p = perceptron[0];
	var sum = p.w0 + p.w1 * point.x + p.w2 * point.y;
	return sum > 0 ? +1 : -1;
}

function getMisclassifiedPoints(points) {
	var misclassified = [];
	for (var point of points) {
		if (classifyPoint(point) != point.label) {
			misclassified.push(point);
		}
	}
	return misclassified;
}

function pickMisclassifiedPoint(points) {
	return getMisclassifiedPoints(points).random();
}

function updatePerceptron() {
	var point = pickMisclassifiedPoint(points);
	if (point) {
		perceptron[0].w0 += point.label;
		perceptron[0].w1 += point.x * point.label;
		perceptron[0].w2 += point.y * point.label;
	}
}

function getAnimationDuration() {
    var timer = 650/3 - 5/3 * points.length;
	return timer < 30 ? 30 : timer;
}

function update_step() {
  $(".code-line").removeClass("successful-code");
  $(".code-line").removeClass("errorful-code");

  var misclassified = pickMisclassifiedPoint(points);
  if (misclassified == undefined) {
    $("#code-line-1").addClass("errorful-code");
    return;
  }

  if (current_action == 0) {
  } else if (current_action == 1) {
    misclassified.selected = true;
  } else if (current_action == 2) {
    points.forEach((pt) => pt.selected = false);
	current_iteration += 1;
    updatePerceptron();
  }
  
  update();
  $("#code-line-" + (current_action + 1)).addClass("successful-code")
  current_action = (current_action + 1) % actions.length;
}

function press_play() {
  current_state = (current_state + 1) % 2;
  if (current_state == 0) {
    $("#play_btn").text("Play >>>")
    clearInterval(current_interval);
  } else if (current_state == 1) {
    $("#play_btn").text("Pause ||");
    current_interval = setInterval(update_step, getAnimationDuration());
  }
}

let svg_perceptron = d3
	.select("#perceptron")
	.classed("perceptron-container", true)
	.attr("width", width)
	.attr("height", height)

let x_scale = d3.scaleLinear()
	.domain([0, 1])
	.range([margin.left, width - margin.left])

let y_scale = d3.scaleLinear()
	.domain([0, 1])
	.range([height - margin.bottom, margin.bottom])

function update() {
	svg_perceptron
		.selectAll("circle")
		.data(points)
		.join(
			enter => {
				enter.append("circle")
				.classed("data-point", true)
				.classed("positive", data => data.label == 1)
				.classed("negative", data => data.label == -1)
				.classed("misclassified", data => classifyPoint(data) != data.label)
				.classed("selected", data => data.selected)
				.attr("cx", data => x_scale(data.x))
				.attr("cy", data => y_scale(data.y))
				.transition().duration(800)
				.attr("r", 5)
			},
			update => {
				update
				.classed("data-point", true)
				.classed("positive", data => data.label == 1)
				.classed("negative", data => data.label == -1)
				.classed("misclassified", data => classifyPoint(data) != data.label)
				.classed("selected", data => data.selected)
				.transition().duration(500)
				.attr("cx", data => x_scale(data.x))
				.attr("cy", data => y_scale(data.y))
				.attr("r", 5)
			}
		)

	svg_perceptron
		.selectAll(".perceptron-line")
		.data(perceptron)
	    .join(
	        enter => {
	            enter.append("line")
				.classed("perceptron-line", true)
				.attr("x1", p => x_scale(-1))
				.attr("y1", p => y_scale(- p.w1 / p.w2 * (-1) - p.w0 / p.w2))
				.attr("x2", p => x_scale(2))
				.attr("y2", p => y_scale(- p.w1 / p.w2 * 2 - p.w0 / p.w2))
	        },
	        update => {
				update.transition().duration(getAnimationDuration())
				.attr("x1", p => x_scale(-1))
				.attr("y1", p => y_scale(- p.w1 / p.w2 * (-1) - p.w0 / p.w2))
				.attr("x2", p => x_scale(2))
				.attr("y2", p => y_scale(- p.w1 / p.w2 * 2 - p.w0 / p.w2))
	        }
	    );

	svg_perceptron
		.selectAll(".target-fn-line")
		.data(target_fn)
		.join(
			enter => {
				enter.append("line")
				.classed("target-fn-line", true)
				.attr("x1", x_scale(0))
				.attr("y1", fn => y_scale(fn.a * 0 + fn.b))
				.attr("x2", x_scale(1))
				.attr("y2", fn => y_scale(fn.a * 1 + fn.b))
			},
			update => {
				update.classed("target-fn-line", true)
				.transition().duration(200)
				.attr("x1", x_scale(0))
				.attr("y1", fn => y_scale(fn.a * 0 + fn.b))
				.attr("x2", x_scale(1))
				.attr("y2", fn => y_scale(fn.a * 1 + fn.b))
			}
		);

	$("#iterations").text(current_iteration);
	let n_misclassified = getMisclassifiedPoints(points).length;
	$("#misclassifications").text(`${n_misclassified} / ${points.length}`);
}

let x_axis = svg_perceptron
	.append("g")
	.classed("axis", true)
	.call(d3.axisBottom(x_scale))
	.attr("transform", `translate(0, ${height - margin.bottom})`)

let y_axis = svg_perceptron
	.append("g")
	.classed("axis", true)
	.call(d3.axisLeft(y_scale))
	.attr("transform", `translate(${margin.left},0)`)

restart();