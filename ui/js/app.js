//Dynamically grow a graph, adding nodes and edges
//By Adrian Cockcroft @adrianco github.com/adrianco/d3grow

;(function(window, document, d3, $, _, undefined) {
	'use strict';

	var width = 1400;
	var height = 1000;
	var dataset = { nodes: [], edges: [] };
	var nodecount = 0;
	var charge = -100;
	var colors = d3.scale.category10();
	var query = {};
	var root;
	var svg;
	var force;
	var step;
	var architecture;

	//Initialize a default force layout, using the nodes and edges in dataset
	force = d3.layout.force()
		.nodes(dataset.nodes)
		.links(dataset.edges)
		.size([width, height])
		.charge([charge]);

	force.linkDistance(function(d) {
		return 10 + 7 * (d.source.size + d.target.size) / 2;
	});

	//Create SVG element
	svg = d3.select("body")
		.append("svg")
		.attr("width", width)
		.attr("height", height);

	//Every time the simulation "ticks", this will be called
	force.on("tick", function() {
		svg.selectAll("line").attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });

		svg.selectAll("circle").attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) { return d.y; });

		var k = .65;
		root.y += (height * 1 / 10 - root.y) * k;
		root.x += (width * 1 / 5 - root.x) * k;
	});

	// add a node and some edges
	var addNode = function addNode(name) {
		dataset.nodes.push([name]);
		dataset.nodes[nodecount].size = 1;
		root = dataset.nodes[nodecount];
		nodecount++;
	};

	var addEdge = function addEdge(s, t) {
		//console.log("edge between " + s + " and " + t);
		var sn = findNode(s);
		var tn = findNode(t);
		dataset.edges.push({ source: sn, target: tn });
	};

	var findNode = function findNode(name) {
		var found = false;
		var index = 0;

		while (!found) {
			if (dataset.nodes[index][0] === name) found = true;
			else index++;
		}

		dataset.nodes[index].size++;
		return dataset.nodes[index];
	};

	var update = function update() {
		console.log("update");

		svg.selectAll("line")
			.data(dataset.edges)
			.enter()
			.append("line")
			.style("stroke", "#ccc")
			.style("stroke-width", 2);

		svg.selectAll("circle")
			.data(dataset.nodes)
			.enter()
			.append("circle")
			.attr("r", function(d, i) { return Math.sqrt(d.size) * 2; })
			.style("fill", function(d, i) {
				var names = d[0].split(".");

				console.log(names);

				if (names.length < 4) return colors(0);
				else return colors(names[3].length);
			})
			.on("mouseover", function(d) {

				/*
				 * Get this node's x/y values, then augment for the tooltip
				 * var xPosition = parseFloat(d3.select(this).attr("x"));
				 * var yPosition = parseFloat(d3.select(this).attr("y"));
				 * Update the tooltip position and value
				 */
				d3.select("#tooltip")
					// .style("left", xPosition + "px")
					// .style("top", yPosition + "px")
					.select("#value")
					.text(d);

				//Show the tooltip
				d3.select("#tooltip").classed("hidden", false);
			})
			.on("mouseout", function() {
				//Hide the tooltip
				d3.select("#tooltip").classed("hidden", true);
			})
			.call(force.drag);

		force.start();
	};

	var decreaseCharge = function decreaseCharge() {
		charge = charge - 10;
		force.charge([charge]);
		update();
	};

	var cycleNext = function cycleNext() {
		step = (step !== '') ? parseInt(step, 10) + 1 : 1;

		if (step > 9) step = 1;

		window.location.assign(buildUrl(true));
	};

	var updateArchitecture = function updateArchitecture(e) {
		var $target = $(this);

		architecture = $target
			.find('option:selected')
			.val();

		window.location.assign(buildUrl(false));
	};

	var buildUrl = function buildUrl(includeStep) {
		var arch = (architecture) ? '?arch=' + architecture : '?arch=migration';
		var s = (step) ? '&step=' + step : '&step=0';

		var url = window.location.origin +
				window.location.pathname +
				arch ;

		url = (includeStep) ? url + s : url;
		return url;
	};

	var init = function init() {
		var queryParams = window.location.search
			.substring(1)
			.split('&');

		_(queryParams).each(function(param) {
			var parts = param.split('=');
			query[parts[0]] = parts[1];
		});

		step = (query.step && query.step !== 0) ? query.step : '';
		architecture = (query.arch) ? query.arch : 'migration';
		var jsonFile = 'json/' + architecture + step + '.json';

		d3.json(jsonFile, function(error, json) {
			if (error) {
				console.log('>>>>> Error loading json file: ' + jsonFile);
				return;
			}

			console.log('>>>>> JSON version: ' + json.version);

			$('#architecture').val(architecture);

			if (architecture === 'lamp') $('#next').hide();
			else $('#next').show();

			json.graph.forEach(function(element) {
				if (element.node) addNode(element.node);
			});

			json.graph.forEach(function(element) {
				if (element.edge) addEdge(element.source, element.target);
			});

			update();
		});
	};

	// set up event handlers
	$('#next').on('click', cycleNext);
	$('#charge-button').on('click', decreaseCharge);
	$('#architecture').on('change', updateArchitecture);

	init();
})(this, this.document, d3, jQuery, _);

