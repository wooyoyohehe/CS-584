var image_width = 200;
var image_height = 200;
var whole_width = 1024;
var whole_height = 768;

var windowWidth = window.screen.availWidth;
var tipOffset = [0, (windowWidth - whole_width) / 2];

var active = d3.select(null);

var projection = d3.geo.albersUsa()
    .translate([whole_width/3, whole_height/3.5])
    .scale([900]);

var path = d3.geo.path()
    .projection(projection);

var Opacity = d3.scale.linear()
    .range([0.2, 0.9]);

var Scale = d3.scale.linear()
    .range([2, 20]);

var svg = d3.select("body")
    .append("svg")
    .attr("width", whole_width)
    .attr("height", whole_height)
    .on("click", stopped, true);

var g = svg.append("g")
    .attr("class","map");

d3.csv("data/US-states.csv", function(data) {
    d3.json("data/US-geo.json", function(json) {
        for (var i = 0; i < data.length; i++) {
            var dataState = data[i].state;				
            var dataValue = parseFloat(data[i].value);	
            var dataEASTorWEST = data[i].E_W;
            for (var j = 0; j < json.features.length; j++) {
                var jsonState = json.features[j].properties.name;
                if (dataState == jsonState) {
                    json.features[j].properties.E_W = dataEASTorWEST;
                    break;
                }
            }
        }

        g.selectAll("path")
            .data(json.features).enter()
            .append("path")
            .attr("stroke","white")
            .attr("stroke-width",2)
            .attr("d", path)
            .attr("class", function(d) {
                return d.properties.postal;})
            .style("fill", function(d) {
                var E_W = d.properties.E_W;

                if (E_W) {
                    if (E_W == "East") {
                        return "#7abbff";
                    } else {
                        return "#ff9493";
                    }
                } else {
                    return "#CCCCCC";
                }
            })
            .on("click", click_on_state);

        d3.csv("new_data/team_info.csv", function(data) {
            Scale.domain([0, d3.max(data, function(d) { return parseInt(d.winrate*100) })]);

            Opacity.domain([0, d3.max(data, function(d) { return parseInt(d.winrate*100) })]);

            var font_Size = d3.scale.linear()
                .domain([15, 1])
                .range([10, 20]);

            var nodes = g.selectAll("nodes")
                .data(data)
                .enter()
                .append("g")
                .attr("class", "team")
                .attr("transform", function(d) {
                    return "translate(" + projection([d.lon, d.lat])[0] + "," + projection([d.lon, d.lat])[1] + ")";})
                .on("mouseover", hover_on_node)
                .on("mouseout", hover_out_node);


            nodes.append("circle")
                .attr("class", function(d) { return d.abbr })
                .attr("r", function(d){
                    return Scale(parseInt(d.winrate*100));})
                .style("fill", function(d){
                    if (d.E_W == "East") {
                        return "blue";
                    } else {
                        return "red";
                    };
                })
                .style("opacity", function(d){
                    return Opacity(parseInt(d.winrate*100));})
                .style("cursor", "pointer")
                .on("click", click_on_team);

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


function click_on_team(d) {
    console.log(d);
    selectedTeamName = d.TEAM.split(' ')[d.TEAM.split(' ').length - 1];
    console.log(selectedTeamName);
    var fileName = "./" + selectedTeamName + ".html";
    var newWin = open(fileName, '', 'width=1000,height=800');
    d3.select(this).on("Click",newWin);

}


function click_on_state(d) {
    if (active.node() == this) {
        active.style("fill", function(d) {
            var E_W = d.properties.E_W;
            if (E_W) {
                if (E_W == "East") {
                    return "#C6E2FF";
                } else {
                    return "#FFB6C1";
                }
            } else {
                return "#ccc";
            }
        });
        stateAbb = d3.select(this).attr("class");
        svg.selectAll(".text-" + stateAbb).remove();

        return stateReset();
    }

    active = d3.select(this).style("fill", "orange");

    var bounds = path.bounds(d),
        dx = bounds[1][0] - bounds[0][0],
        dy = bounds[1][1] - bounds[0][1],
        x = (bounds[0][0] + bounds[1][0]) / 2,
        y = (bounds[0][1] + bounds[1][1]) / 2,
        scale = 0.7 / Math.max(dx / whole_width, dy / whole_height),
        translate = [whole_width / 2 - scale * x, whole_height / 2 - scale * y];

    g.append("text")
        .attr("class", "text-" + d.properties.postal)
        .attr("x", x - 20)
        .attr("y", y)
        .attr("font-size", "10px")
        .style("cursor", "default")
        .text(d.properties.name);
}

function stopped() {
    if (d3.event.defaultPrevented) {
        d3.event.stopPropagation();
    }
}

function hover_on_node(d){
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

    g.append("image")
        .attr("class", d.abbr)
        .attr("xlink:href", "logo/" + d.abbr + "_logo.svg")
        .attr("width", image_width + "px")
        .attr("height", image_height + "px")
        .attr("x", projection([d.lon, d.lat])[0] + 5)
        .attr("y", projection([d.lon, d.lat])[1] + 5);
}

function hover_out_node(d){
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