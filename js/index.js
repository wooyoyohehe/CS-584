//Width and height for whole
var w = 1024;
var h = 768;

// Offset adjust for screen resolution
var windowWidth = window.screen.availWidth;
var tipOffset = [0, (windowWidth - w) / 2];

//Image width and height
var image_w = 200;
var image_h = 200;

//For selected node
var active = d3.select(null);

//Define map projection
var projection = d3.geo.albersUsa()
    .translate([w/3, h/3.5])
    .scale([900]);

//Define path generator
var path = d3.geo.path()
    .projection(projection);

//Map the winrate*100 to opacity[0.3, 0.9]
var Opacity = d3.scale.linear()
    .range([0.2, 0.9]);

//Map the rank to radius[2, 20]
var Scale = d3.scale.linear()
    .range([2, 20]);

//Create SVG element
var svg = d3.select("body")
    .append("svg")
    .attr("width", w)
    .attr("height", h)
    .on("click", stopped, true);

//Creater a group to store states
var g = svg.append("g")
    .attr("class","map");


//Load in state data, draw the map
d3.csv("data/US-states.csv", function(data) {
    //Load in GeoJSON data
    d3.json("data/US-geo.json", function(json) {
        //Merge the EastorWest data and GeoJSON
        //Loop through once for each EastorWest data value
        for (var i = 0; i < data.length; i++) {
            var dataState = data[i].state;				//Grab state name
            var dataValue = parseFloat(data[i].value);	//Grab data value, and convert from string to float
            var dataEASTorWEST = data[i].EASTorWEST;
            //Find the corresponding state inside the GeoJSON
            for (var j = 0; j < json.features.length; j++) {
                var jsonState = json.features[j].properties.name;
                if (dataState == jsonState) {
                    //Copy the data value into the JSON
                    json.features[j].properties.EASTorWEST = dataEASTorWEST;
                    //Stop looking through the JSON
                    break;
                }
            }
        }

        //Bind data and create one path per GeoJSON feature
        g.selectAll("path")
            .data(json.features).enter()
            .append("path")
            .attr("stroke","white")
            .attr("stroke-width",2)
            .attr("d", path)
            .attr("class", function(d) {
                return d.properties.postal;})
            .style("fill", function(d) {
                //Get data value
                var EASTorWEST = d.properties.EASTorWEST;

                if (EASTorWEST) {
                    //If value exists…
                    if (EASTorWEST == "East") {
                        return "#7abbff";
                    } else {
                        return "#ff9493";
                    }
                } else {
                    //If value is undefined…
                    return "#CCCCCC";
                }
            })
            .on("click", stateClick);

        //Load in NBA teams data
        d3.csv("new_data/team_info.csv", function(data) {
            //Map the rank to radius[2, 20]
            Scale.domain([0, d3.max(data, function(d) { return parseInt(d.winrate*100) })]);

            //Map the rank to opacity[0.3, 0.9]
            Opacity.domain([0, d3.max(data, function(d) { return parseInt(d.winrate*100) })]);
            var font_Size = d3.scale.linear()
            //Map the winrate*100 to fontsize[10, 20]
            var FontSize = d3.scale.linear()
                .domain([15, 1])
                .range([10, 20]);

            //Create nodes group
            var nodes = g.selectAll("nodes")
                .data(data)
                .enter()
                .append("g")
                .attr("class", "team")
                .attr("transform", function(d) {
                    return "translate(" + projection([d.lon, d.lat])[0] + "," + projection([d.lon, d.lat])[1] + ")";})
                .on("mouseover", nodeMouseover)
                .on("mouseout", nodeMouseout);


            //Circles for teams
            nodes.append("circle")
                .attr("class", function(d) { return d.abbr })
                .attr("r", function(d){
                    return Scale(parseInt(d.winrate*100));})
                .style("fill", function(d){
                    if (d.EASTorWEST == "East") {
                        return "blue";
                    } else {
                        return "red";
                    };
                })
                .style("opacity", function(d){
                    return Opacity(parseInt(d.winrate*100));})
                .style("cursor", "pointer")
                .on("click", teamClick);

            //Text for temm abbreviation
            nodes.append("text")
                .attr("class", function(d) {
                    return "text " + d.abbr;})
                .attr("dx", function(d){
                    return Scale(parseInt(d.winrate*100));})
                .attr("dy", ".3em")
                .attr("font-size", function(d) {
                    return font_Size(d.rank) + "px";})
                .style("fill", "#888888")
                .style("font-weight", "bold")
                .style("cursor", "default")
                .text(function(d) {
                    return d.abbr;});
        });
    });
});

//When click a Node
function teamClick(d) {
    console.log(d);
    selectedTeamName = d.TEAM.split(' ')[d.TEAM.split(' ').length - 1];
    console.log(selectedTeamName);
    var fileName = "./" + selectedTeamName + ".html";
    var newWin = open(fileName, '', 'width=1000,height=800');
    d3.select(this).on("Click",newWin);

}


function stateClick(d) {
    //Inverse when have selected

    if (active.node() == this) {
        active.style("fill", function(d) {
            //Get data value
            var EASTorWEST = d.properties.EASTorWEST;
            if (EASTorWEST) {
                //If value exists…
                if (EASTorWEST == "East") {
                    return "#C6E2FF";
                } else {
                    return "#FFB6C1";
                }
            } else {
                //If value is undefined…
                return "#ccc";
            }
        });
        //Delete the state name
        stateAbb = d3.select(this).attr("class");
        svg.selectAll(".text-" + stateAbb).remove();

    }

    active = d3.select(this).style("fill", "orange");

    //Modify the size
    var bounds = path.bounds(d),
        dx = bounds[1][0] - bounds[0][0],
        dy = bounds[1][1] - bounds[0][1],
        x = (bounds[0][0] + bounds[1][0]) / 2,
        y = (bounds[0][1] + bounds[1][1]) / 2,
        scale = 0.7 / Math.max(dx / w, dy / h),
        translate = [w / 2 - scale * x, h / 2 - scale * y];

    g.append("text")
        .attr("class", "text-" + d.properties.postal)
        .attr("x", x - 20)
        .attr("y", y)
        .attr("font-size", "10px")
        .style("cursor", "default")
        .text(d.properties.name);
}

// If the drag behavior prevents the default click,
// also stop propagation so we don’t click-to-zoom.
function stopped() {
    if (d3.event.defaultPrevented) {
        d3.event.stopPropagation();
    }
}

//Emphasize
function nodeMouseover(d){
    d3.select(this).select("circle")
        .transition()
        .duration(200)
        .attr("r", function(d){
            return 1.5 * Scale(parseInt(d.winrate*100)); })
        .style("opacity", 1)
        .style("stroke-width", "2px");

    d3.select(this).select("text")
        .transition()
        .duration(200)
        .attr("dx", function(d){
            return 1.5 * Scale(parseInt(d.winrate*100));})
        .style("fill", "#000000")
        .text(function(d) {
            return d.abbr + " (" + parseInt(d.winrate*100 )+ "%)";});

    //Append the logo of the team
    g.append("image")
        .attr("class", d.abbr)
        .attr("xlink:href", "logo/" + d.abbr + "_logo.svg")
        .attr("width", image_w + "px")
        .attr("height", image_h + "px")
        //remove the blink effect
        .attr("x", projection([d.lon, d.lat])[0] + 5)
        .attr("y", projection([d.lon, d.lat])[1] + 5);
}


//Get back to original status
function nodeMouseout(d){
    d3.select(this).select("circle")
        .transition()
        .duration(200)
        .attr("r", function(d) {
            return Scale(parseInt(d.winrate*100)); })
        .style("opacity", function(d){
            return Opacity(parseInt(d.winrate*100));})
        .style("stroke-width", "1px");

    d3.select(this).select("text")
        .transition()
        .duration(200)
        .attr("dx", function(d){
            return Scale(parseInt(d.winrate*100));})
        .style("fill", "#888888")
        .text(function(d) {
            return d.abbr});

    g.select("image")
        .remove();
    }