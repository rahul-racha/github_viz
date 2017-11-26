$(document).ready(function() {
//var width = (window.innerWidth > 0) ? window.innerWidth : screen.width;

d3.csv("population.csv", function(err, data) {
  var config = {"data0":"Country (or dependent territory)","data1":"Population",
              "label0":"label 0","label1":"label 1","color0":"#99ccff","color1":"#0050A1",
              "width":960,"height":960}

  var width = config.width,
      height = config.height,
      centered;

  var COLOR_COUNTS = 9;



  function Interpolate(start, end, steps, count) {
      var s = start,
          e = end,
          final = s + (((e - s) / steps) * count);
      return Math.floor(final);
  }

  function Color(_r, _g, _b) {
      var r, g, b;
      var setColors = function(_r, _g, _b) {
          r = _r;
          g = _g;
          b = _b;
      };

      setColors(_r, _g, _b);
      this.getColors = function() {
          var colors = {
              r: r,
              g: g,
              b: b
          };
          return colors;
      };
  }

  function hexToRgb(hex) {
      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
      } : null;
  }

  function valueFormat(d) {
    if (d > 1000000000) {
      return Math.round(d / 1000000000 * 10) / 10 + "B";
    } else if (d > 1000000) {
      return Math.round(d / 1000000 * 10) / 10 + "M";
    } else if (d > 1000) {
      return Math.round(d / 1000 * 10) / 10 + "K";
    } else {
      return d;
    }
  }

  var COLOR_FIRST = config.color0, COLOR_LAST = config.color1;

  var rgb = hexToRgb(COLOR_FIRST);

  var COLOR_START = new Color(rgb.r, rgb.g, rgb.b);

  rgb = hexToRgb(COLOR_LAST);
  var COLOR_END = new Color(rgb.r, rgb.g, rgb.b);

  var startColors = COLOR_START.getColors(),
      endColors = COLOR_END.getColors();

  var colors = [];

  for (var i = 0; i < COLOR_COUNTS; i++) {
    var r = Interpolate(startColors.r, endColors.r, COLOR_COUNTS, i);
    var g = Interpolate(startColors.g, endColors.g, COLOR_COUNTS, i);
    var b = Interpolate(startColors.b, endColors.b, COLOR_COUNTS, i);
    colors.push(new Color(r, g, b));
  }

  var MAP_KEY = config.data0;
  var MAP_VALUE = config.data1;

  var projection = d3.geo.mercator()
      .scale((width + 1) / 2 / Math.PI)
      .translate([width / 2, height / 2])
      .precision(.1);

  var path = d3.geo.path()
      .projection(projection);

  var graticule = d3.geo.graticule();

  var svg = d3.select("#canvas-svg").append("svg")
      .attr("width", width)
      .attr("height", height);//
      //.attr("id","svgClick");
      svg.append("rect")
        .attr("id", "background-canvas")
        .attr("width", width)
        .attr("height", height);
        //.on("click", clicked);

  svg.append("path")
      .datum(graticule)
      .attr("class", "graticule")
      .attr("d", path);


  var valueHash = {};

  function log10(val) {
    return Math.log(val);
  }

  data.forEach(function(d) {
    valueHash[d[MAP_KEY]] = +d[MAP_VALUE];
  });

  var quantize = d3.scale.quantize()
      .domain([0, 1.0])
      .range(d3.range(COLOR_COUNTS).map(function(i) { return i }));

  quantize.domain([d3.min(data, function(d){
      return (+d[MAP_VALUE]) }),
    d3.max(data, function(d){
      return (+d[MAP_VALUE]) })]);

  d3.json("https://s3-us-west-2.amazonaws.com/vida-public/geo/world-topo-min.json", function(error, world) {
    var countries = topojson.feature(world, world.objects.countries).features;
    aa = [-122.490402, 37.786453];
	  bb = [-122.389809, 40.72728];

    svg.append("path")
       .datum(graticule)
       .attr("class", "choropleth")
       .attr("d", path);

    var g = svg.append("g");

    g.append("path")
     .datum({type: "LineString", coordinates: [[-180, 0], [-90, 0], [0, 0], [90, 0], [180, 0]]})
     .attr("class", "equator")
     .attr("d", path);
/*****/
     // add circles to svg
    //  svg.selectAll("circle")
    //  .data([aa,bb]).enter()
    //  .append("circle")
    //  .attr("cx", function (d) { console.log(projection(d)); return projection(d)[0]; })
    //  .attr("cy", function (d) { return projection(d)[1]; })
    //  .attr("r", "8px")
    //  .attr("fill", "red")
/****/
    //var country = g.selectAll(".country").data(countries);
//country.enter().insert("path")
    g.selectAll(".country").data(countries).enter().insert("path")
        .attr("class", "country  countries")
        .attr("d", path)
        .attr("id", function(d,i) { return d.id; })
        .attr("title", function(d) { return d.properties.name; })
        .style("fill", function(d) {
          if (valueHash[d.properties.name]) {
            var c = quantize((valueHash[d.properties.name]));
            var color = colors[c].getColors();
            return "rgb(" + color.r + "," + color.g +
                "," + color.b + ")";
          } else {
            return "#ccc";
          }
        })
        .on("mousemove", function(d) {
            var html = "";

            html += "<div class=\"tooltip_kv\">";
            html += "<span class=\"tooltip_key\">";
            html += d.properties.name;
            html += "</span>";
            html += "<span class=\"tooltip_value\">";
            html += (valueHash[d.properties.name] ? valueFormat(valueHash[d.properties.name]) : "");
            html += "";
            html += "</span>";
            html += "</div>";

            $("#tooltip-container").html(html);
            $(this).attr("fill-opacity", "0.8");
            $("#tooltip-container").show();

            var coordinates = d3.mouse(this);

            var map_width = $('.choropleth')[0].getBoundingClientRect().width;

            if (d3.event.pageX < map_width / 2) {
              d3.select("#tooltip-container")
                .style("top", (d3.event.layerY + 15) + "px")
                .style("left", (d3.event.layerX + 15) + "px");
            } else {
              var tooltip_width = $("#tooltip-container").width();
              d3.select("#tooltip-container")
                .style("top", (d3.event.layerY + 15) + "px")
                .style("left", (d3.event.layerX - tooltip_width - 30) + "px");
            }
        })
        .on("mouseout", function() {
                $(this).attr("fill-opacity", "1.0");
                $("#tooltip-container").hide();
            })
        .on("click", clicked);

    g.append("path")
        .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
        .attr("class", "boundary")
        .attr("d", path);


    svg.attr("height", config.height * 2.2 / 3);

    svg.select("#background-canvas")
        .on("click", clicked);

        function clicked(d) {
          clicked2(d);
          var x, y, k;

          if (d && centered !== d) {
            var centroid = path.centroid(d);
            x = centroid[0];
            y = centroid[1];
            k = 4;
            centered = d;
          } else {
            x = width / 2;
            y = height / 2;
            k = 1;
            centered = null;
          }

          g.selectAll("path")
              .classed("active", centered && function(d) { return d === centered; });

          g.transition()
              .duration(750)
              .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
              .style("stroke-width", 1.5 / k + "px");
        }

  });
  // d3.json("https://s3-us-west-2.amazonaws.com/vida-public/geo/world-topo-min.json", function(error, world) {
  //   svg.selectAll(".pin")
  //       .data(places)
  //     .enter().append("circle", ".pin")
  //       .attr("r", 5)
  //       .attr("transform", function(d) {
  //         return "translate(" + projection([
  //           d.location.latitude,
  //           d.location.longitude
  //         ]) + ")";
  //       });
  // });

  d3.select(self.frameElement).style("height", (height * 2.3 / 3) + "px");
});

var svg;
var centered;
var g2;
var path2;
var width;
var height;
var location = new Array();
var projection;
d3.csv("population.csv", function(err, data) {
  var config = {"data0":"Country (or dependent territory)","data1":"Population",
              "label0":"label 0","label1":"label 1","color0":"#99ccff","color1":"#0050A1",
              "width":960,"height":960}

  width = config.width;
  height = config.height;

  var COLOR_COUNTS = 9;

  function Interpolate(start, end, steps, count) {
      var s = start,
          e = end,
          final = s + (((e - s) / steps) * count);
      return Math.floor(final);
  }

  function Color(_r, _g, _b) {
      var r, g, b;
      var setColors = function(_r, _g, _b) {
          r = _r;
          g = _g;
          b = _b;
      };

      setColors(_r, _g, _b);
      this.getColors = function() {
          var colors = {
              r: r,
              g: g,
              b: b
          };
          return colors;
      };
  }

  function hexToRgb(hex) {
      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
      } : null;
  }

  function valueFormat(d) {
    if (d > 1000000000) {
      return Math.round(d / 1000000000 * 10) / 10 + "B";
    } else if (d > 1000000) {
      return Math.round(d / 1000000 * 10) / 10 + "M";
    } else if (d > 1000) {
      return Math.round(d / 1000 * 10) / 10 + "K";
    } else {
      return d;
    }
  }

  var COLOR_FIRST = config.color0, COLOR_LAST = config.color1;

  var rgb = hexToRgb(COLOR_FIRST);

  var COLOR_START = new Color(rgb.r, rgb.g, rgb.b);

  rgb = hexToRgb(COLOR_LAST);
  var COLOR_END = new Color(rgb.r, rgb.g, rgb.b);

  var startColors = COLOR_START.getColors(),
      endColors = COLOR_END.getColors();

  var colors = [];

  for (var i = 0; i < COLOR_COUNTS; i++) {
    var r = Interpolate(startColors.r, endColors.r, COLOR_COUNTS, i);
    var g = Interpolate(startColors.g, endColors.g, COLOR_COUNTS, i);
    var b = Interpolate(startColors.b, endColors.b, COLOR_COUNTS, i);
    colors.push(new Color(r, g, b));
  }

  var MAP_KEY = config.data0;
  var MAP_VALUE = config.data1;

  projection = d3.geo.mercator()
      .scale((width + 1) / 2 / Math.PI)
      .translate([width / 2, height / 2])
      .precision(.1);

  path2 = d3.geo.path()
      .projection(projection);

  var graticule = d3.geo.graticule();

  svg = d3.select("#canvas-svg-2").append("svg")
      .attr("width", width)
      .attr("height", height);

      svg.append("rect")
        .attr("id", "background-canvas-2")
        .attr("width", width)
        .attr("height", height);

  svg.append("path")
      .datum(graticule)
      .attr("class", "graticule")
      .attr("d", path2);

  var valueHash = {};

  function log10(val) {
    return Math.log(val);
  }

  data.forEach(function(d) {
    valueHash[d[MAP_KEY]] = +d[MAP_VALUE];
  });

  var quantize = d3.scale.quantize()
      .domain([0, 1.0])
      .range(d3.range(COLOR_COUNTS).map(function(i) { return i }));

  quantize.domain([d3.min(data, function(d){
      return (+d[MAP_VALUE]) }),
    d3.max(data, function(d){
      return (+d[MAP_VALUE]) })]);

  d3.json("https://s3-us-west-2.amazonaws.com/vida-public/geo/world-topo-min.json", function(error, world) {
    var countries = topojson.feature(world, world.objects.countries).features;
    aa = [-122.490402, 37.786453];
	  bb = [-122.389809, 40.72728];

    svg.append("path")
       .datum(graticule)
       .attr("class", "choropleth")
       .attr("d", path2);

    g2 = svg.append("g");

    g2.append("path")
     .datum({type: "LineString", coordinates: [[-180, 0], [-90, 0], [0, 0], [90, 0], [180, 0]]})
     .attr("class", "equator")
     .attr("d", path2);
/*****/
     // add circles to svg

     //var subLoc = new Array();
     d3.csv("geo.csv", function(err, data) {
       data.forEach(function(dloc) {
       console.log(dloc['lat']);
       console.log(dloc['long']);
       var lat = parseFloat(dloc['lat']);
       var long = parseFloat(dloc['long']);
       var subLoc = new Array([lat,long]);
       location.push([lat,long]);
     });
     //var m = [-122.490402, 37.786453];
     //var n = [-122.389809, 40.72728];
     //location.push(m);
     //location.push(n);
     //location = new Array([-122.490402, 37.786453], [-122.389809, 40.72728]);
     console.log(location);
     svg.selectAll("circle")
     .data(location).enter()
     .append("circle")
     .attr("cx", function (d) { console.log(projection(d)); return projection(d)[0]; })
     .attr("cy", function (d) { return projection(d)[1]; })
     .attr("r", "2px")
     .attr("fill", "red");
     });


/****/
    //var country = g.selectAll(".country").data(countries);

    g2.selectAll(".country").data(countries).enter().insert("path")
        .attr("class", "country")
        .attr("d", path2)
        .attr("id", function(d,i) { return d.id; })
        .attr("title", function(d) { return d.properties.name; })
        .style("fill", function(d) {
        //   if (valueHash[d.properties.name]) {
        //     var c = quantize((valueHash[d.properties.name]));
        //     var color = colors[c].getColors();
        //     return "rgb(" + color.r + "," + color.g +
        //         "," + color.b + ")";
        //   } else {
        //     return "#ccc";
        //   }
          return "#ccc";
        })
        .on("mousemove", function(d) {
            var html = "";

            html += "<div class=\"tooltip_kv\">";
            html += "<span class=\"tooltip_key\">";
            html += d.properties.name;
            html += "</span>";
            //html += "<span class=\"tooltip_value\">";
            //html += (valueHash[d.properties.name] ? valueFormat(valueHash[d.properties.name]) : "");
            //html += "";
            //html += "</span>";
            html += "</div>";

            $("#tooltip-container-2").html(html);
            $(this).attr("fill-opacity", "0.8");
            $("#tooltip-container-2").show();

            var coordinates = d3.mouse(this);

            var map_width = $('.choropleth')[0].getBoundingClientRect().width;

            if (d3.event.pageX < map_width / 2) {
              d3.select("#tooltip-container-2")
                .style("top", (d3.event.layerY + 15) + "px")
                .style("left", (d3.event.layerX + 15) + "px");
            } else {
              var tooltip_width = $("#tooltip-container-2").width();
              d3.select("#tooltip-container-2")
                .style("top", (d3.event.layerY + 15) + "px")
                .style("left", (d3.event.layerX - tooltip_width - 30) + "px");
            }
         })
         .on("mouseout", function() {
                $(this).attr("fill-opacity", "1.0");
                $("#tooltip-container-2").hide();
         })
         .on("click", clicked2);

         svg.select("#background-canvas-2")
             .on("click", clicked2);

    g2.append("path")
        .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
        .attr("class", "boundary")
        .attr("d", path2);

    svg.attr("height", config.height * 2.2 / 3);



  });
  // d3.json("https://s3-us-west-2.amazonaws.com/vida-public/geo/world-topo-min.json", function(error, world) {
  //   svg.selectAll(".pin")
  //       .data(places)
  //     .enter().append("circle", ".pin")
  //       .attr("r", 5)
  //       .attr("transform", function(d) {
  //         return "translate(" + projection([
  //           d.location.latitude,
  //           d.location.longitude
  //         ]) + ")";
  //       });
  // });

  d3.select(self.frameElement).style("height", (height * 2.3 / 3) + "px");
});


function clicked2(d) {
  var x, y, k;

  if (d && centered !== d) {
    var centroid = path2.centroid(d);
    x = centroid[0];
    y = centroid[1];
    k = 4;
    centered = d;
  } else {
    x = width / 2;
    y = height / 2;
    k = 1;
    centered = null;
  }

  g2.selectAll("path")
      .classed("active", centered && function(d) { return d === centered; });

  // var newLoc = new Array();
  // location.forEach(function(dloc) {
  //   var lat = dloc['lat']-x;
  //   var long
  // }
  //svg.selectAll("circle").remove();

  // console.log(location);
  //   svg.selectAll("circle")
  //   .data(location).enter()
  //   //.append("g")
  //   //.attr("transform", function(d) {"translate(" + path2.centroid(d) + ")" })
  //   //.style("stroke-width", 1.5 / k + "px")
  //   .append("circle")
  //   .attr("cx", function (d) { console.log(projection(d)); return projection(d)[0] - x; })
  //   .attr("cy", function (d) { return projection(d)[1] - y; })
  //   .attr("r", "2px")
  //   .attr("fill", "red");


  g2.transition()
      .duration(750)
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
      .style("stroke-width", 1.5 / k + "px");
}

});
