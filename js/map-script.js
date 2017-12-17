$(document).ready(function() {
//var width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
var langFilterList = new Array();
var userFilterList = new Array();
var filters = {};
var unfiltered;

var svg;
var centered;
var g2;
var path2;
var width;
var height;
var location = new Array();
var projection;
//var key1 = 'repository_language';
//var key2 = 'actor_attributes_type';
$('#langFilter').multiselect({
    allSelectedText: 'All',
    includeSelectAllOption: true,
    enableCaseInsensitiveFiltering: true,
    onDropdownHide: function(event) {
        langFilterList = $('#langFilter option:selected').map(function() {
          return this.value;
        }).get();
        console.log(langFilterList);
        filters.repository_language = langFilterList;
        location = [];
        filterRows();
    }
})
.multiselect('selectAll', false)
.multiselect('updateButtonText');

$('#userFilter').multiselect({
    allSelectedText: 'All',
    includeSelectAllOption: true,
    enableCaseInsensitiveFiltering: true,
    onDropdownHide: function(event) {
        userFilterList = $('#userFilter option:selected').map(function(){
          return this.value;
        }).get();
        console.log(userFilterList);
        filters.actor_attributes_type = userFilterList;
        location = [];
        filterRows();
    }
})
.multiselect('selectAll', false)
.multiselect('updateButtonText');


langFilterList = $('#langFilter option:selected').map(function(){
  return this.value;
}).get();

userFilterList = $('#userFilter option:selected').map(function(){
  return this.value;
}).get();

// var filters = {
//     'repository_language': langFilterList,
//     'actor_attributes_type': userFilterList
// };
filters.repository_language = langFilterList;
filters.actor_attributes_type = userFilterList;
console.log(langFilterList);
console.log(userFilterList);

filterRows();
//rederMap1(filteredData);
/****** functions for world map 1 *******/

function filterRows() {
  d3.csv("archive.csv", function(err, filteredData) {
    unfiltered = filteredData;
      filteredData = filteredData.filter(function(row) {
          // run through all the filters, returning a boolean
          return ['repository_language','actor_attributes_type'].reduce(function(pass, column) {
              return pass && (
                  // pass if no filter is set
                  !filters[column] ||
                      // pass if the row's value is equal to the filter
                      // (i.e. the filter is set to a string)
                      row[column] === filters[column] ||
                      // pass if the row's value is in an array of filter values
                      filters[column].indexOf(row[column]) >= 0
                  );
          }, true);
      });


       var dataForCountry = d3.nest()
  .key(function(d) { return d.country ;})
  .key(function(d) { return d.repository_url;})
  // .rollup(function(v) { return {
  //     no_repos: v.length,
  //     no_forks: d3.sum(v, function(d) { return d.repository_forks ;}),
  //     no_watches: d3.sum(v,function(d){ return d.repository_watchers})
  // }; })
  .entries(filteredData)
  .map(function(d){
  var ob = {};
  ob.country = d.key;
  ob.no_repos = d.values.length;
  // ob.no_forks = d.repository_forks;
  // ob.no_watches = d.repository_watchers;
  return ob;
  });

    filteredData.forEach(function(dloc) {
      var lat = parseFloat(dloc['lattitude']);
      var long = parseFloat(dloc['longitude']);
      var loc = dloc['city'];
      var actor_name = dloc['actor_attributes_name'];
      var repo_org = dloc['repository_organization'];
      //var subLoc = new Array([lat,long]);
      if (!isNaN(lat) && !isNaN(long)) {
        location.push([long,lat,loc,actor_name,repo_org]);
      }
   });



      renderMap1(dataForCountry);
      renderMap2(filteredData,dataForCountry);
      renderBar(unfiltered);
      prepareLine(unfiltered);
      document.querySelector('#countryName').innerHTML = 'World';
      
  });
}

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

function log10(val) {
  return Math.log(val);
}

function clicked(d) {
  clicked2(d);
  if (d != null) {
    prepareBar(d.properties.name);
  } else {
    renderBar(unfiltered);
    prepareLine(unfiltered);
    document.querySelector('#countryName').innerHTML = 'World';
  }
  // var x, y, k;
  //
  // if (d && centered !== d) {
  //   var centroid = path.centroid(d);
  //   x = centroid[0];
  //   y = centroid[1];
  //   k = 3;
  //   centered = d;
  // } else {
  //   x = width / 2;
  //   y = height / 2;
  //   k = 1;
  //   centered = null;
  // }
  //
  // g.selectAll("path")
  //     .classed("active", centered && function(d) { return d === centered; });
  //
  // g.transition()
  //     .duration(750)
  //     .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
  //     .style("stroke-width", 1.5 / k + "px");
}

function renderMap1(dataForCountry) {
  console.log(langFilterList);
  console.log(userFilterList);
  //JSON.parse(filteredData);
  //document.querySelector('#tooltip-container').innerHTML = '';
  //document.querySelector('#canvas-svg').innerHTML = '';
// d3.csv("archive.csv", function(err, filteredData) {
//     filteredData = filteredData.filter(function(row) {
//         // run through all the filters, returning a boolean
//         return ['repository_language','actor_attributes_type'].reduce(function(pass, column) {
//             return pass && (
//                 // pass if no filter is set
//                 !filters[column] ||
//                     // pass if the row's value is equal to the filter
//                     // (i.e. the filter is set to a string)
//                     row[column] === filters[column] ||
//                     // pass if the row's value is in an array of filter values
//                     filters[column].indexOf(row[column]) >= 0
//                 );
//         }, true);
//     });
    //console.log(filteredData.length, filteredData);
//});


//d3.csv("archive.csv", function(err, data) {
 // var dataForCountry = d3.nest()
 //  .key(function(d) { return d.country ;})
 //  .key(function(d) { return d.repository_url;}) //v.length; })
 //  // .rollup(function(v) { return {
 //  //     no_repos: v.length,
 //  //     no_forks: d3.sum(v, function(d) { return d.repository_forks ;}),
 //  //     no_watches: d3.sum(v,function(d){ return d.repository_watchers})
 //  // }; })
 //  .entries(filteredData)
 //  .map(function(d){
 //  var ob = {};
 //  ob.country = d.key;
 //  ob.no_repos = d.values.length;
 //  // ob.no_forks = d.repository_forks;
 //  // ob.no_watches = d.repository_watchers;
 //  return ob;
 //  });

  console.log(dataForCountry);
  //#99ccff,#0050A1
  var config = {"data0":"country","data1":"no_repos",
              "label0":"label 0","label1":"label 1","color0":"#99CCFF","color1":"#202A35",
              "width":700,"height":500 }//960

  var width = config.width,
      height = config.height,
      centered;

  var COLOR_COUNTS = 9;
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
      .scale((width + 1) / 2 / 4/*Math.PI*/)
      .translate([width / 2, height / 2])
      .precision(.1);

  var path = d3.geo.path()
      .projection(projection);

  var graticule = d3.geo.graticule();
  d3.select("#canvas-svg svg").remove();
  var svg = d3.select("#canvas-svg").append("svg")
      .attr("width", width)
      .attr("height", height);//
      //.attr("id","svgClick");
      svg.append("rect")
        .attr("id", "background-canvas")
        .attr("width", width)
        .attr("height", height);
        //.on("click", clicked);
  var ginitial = svg.append("g");
  ginitial.append("path")
      .datum(graticule)
      .attr("class", "graticule")
      .attr("d", path);


  var valueHash = {};


  dataForCountry.forEach(function(d) {
    if (isNaN(d[MAP_KEY]) && d[MAP_KEY] != "" &&  d[MAP_KEY] != null &&
        !isNaN(d[MAP_VALUE]) && d[MAP_VALUE] != "" &&  d[MAP_VALUE] != null) {
      valueHash[d[MAP_KEY]] = +d[MAP_VALUE];
    }
  });

  var quantize = d3.scale.quantize()
      .domain([0, 1.0])
      .range(d3.range(COLOR_COUNTS).map(function(i) { return i }));

  quantize.domain([d3.min(dataForCountry, function(d){
      return (+d[MAP_VALUE]) }),
    d3.max(dataForCountry, function(d){
      return (+d[MAP_VALUE]) })]);

// new encoding
 var colorRange= ["#cdbcdd","#3f007d"]; //["#99CCFF","#202A35"];  //
 var color = d3.scale.linear()
          .range(colorRange);

 var linear = d3.scale.linear()
          //.domain([0,1.0])
          .range(colorRange);

  color.domain([d3.min(dataForCountry, function(d){
      return (+d[MAP_VALUE]) }),
    d3.max(dataForCountry, function(d){
      return (+d[MAP_VALUE]) })]);

  linear.domain([d3.min(dataForCountry, function(d){
      return (+d[MAP_VALUE]) }),
    d3.max(dataForCountry, function(d){
      return (+d[MAP_VALUE]) })]);





  // var color = d3.scale.threshold()
  //               .domain([10, 200, 1000, 2000, 5000, 10000, 20000, 40000, 50000])
  //               .range(["#fff7ec","#fee8c8","#fdd49e","#fdbb84","#fc8d59","#ef6548","#d7301f","#b30000","#7f0000"]);


  // valueHash.forEach(function(d) {
  //   console.log(d);
  // });
  // console.log("Value hash:",valueHash);
  // for (var key in valueHash) {
  //   if (valueHash.hasOwnProperty(key)) {
  //
  //   }
  // }


  // color.domain(d3.extent(data, function(d){
  //     return d[showValue];}));
  // linear.domain(d3.extent(data, function(d){
  //     return d[showValue];




  d3.json("https://s3-us-west-2.amazonaws.com/vida-public/geo/world-topo-min.json", function(error, world) {
    var countries = topojson.feature(world, world.objects.countries).features;

    ginitial.append("path")
       .datum(graticule)
       .attr("class", "choropleth")
       .attr("d", path);

    var g = svg.append("g");

    g.append("path")
     .datum({type: "LineString", coordinates: [[-180, 0], [-90, 0], [0, 0], [90, 0], [180, 0]]})
     .attr("class", "equator")
     .attr("d", path);

    g.selectAll(".country").data(countries).enter().insert("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("id", function(d,i) { return d.id; })
        .attr("title", function(d) { return d.properties.name; })
        .style("fill", function(d) {
          if (valueHash[d.properties.name]) {
              if(valueHash[d.properties.name] > 0) {
                  return linear(valueHash[d.properties.name]);
              }else{
                return "#ccc";
              }

          }else{
            return "#ccc";
          }

        })
        //   if (valueHash[d.properties.name]) {
        //     var c = quantize((valueHash[d.properties.name]));
        //     console.log("hee");
        //     console.log(c);
        //     console.log(colors[c]);
        //     if (isNaN(c)) {
        //       return "#ccc";
        //     } else {
        //       var color = colors[c].getColors();
        //       return "rgb(" + color.r + "," + color.g +
        //           "," + color.b + ")";
        //     }
        //   } else {
        //     return "#ccc";
        //   }
        // })
        .on("mousemove", function(d) {
            var html = "";

            html += "<div class=\"tooltip_kv\">";
            html += "<span class=\"tooltip_key\">";
            html += d.properties.name;
            html += "</span>";
            html += "<br/><span class=\"tooltip_value\">";
            html += "#repos - ";
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

  var colorLegend = d3.legend.color()
      .labelFormat(d3.format(".0f"))
      .scale(linear)
      .shapePadding(5)
      .shapeWidth(30)
      .shapeHeight(20)
      .labelOffset(5);

    svg.append("g")
    .attr("transform", "translate(-10,10)")
    .call(colorLegend);
    // g.attr("class", "legendLinear")
    // .attr("transform", "translate(-10,10)");
    //
    // var legendLinear = d3.legend.color()
    //         .shapeWidth(30)
    //         .scale(linear);
    //
    // svg.select(".legendLinear")
    //         .call(legendLinear);



    svg.attr("height", config.height * 2.2 / 3);

    svg.select("#background-canvas")
        .on("click", clicked);

  });
  d3.select(self.frameElement).style("height", (height * 2.3 / 3) + "px");
}

//*************************************************************************************************************
//*************************************************************************************************************


function renderMap2(filteredData,dataForCountry) {
//d3.csv("population.csv", function(err, data) {

   // var dataForCountry = d3.nest()
   // .key(function(d) { return d.country ;})
   // .key(function(d) { return d.repository_url;})
   // .entries(filteredData)
   // .map(function(d){
   // var ob = {};
   // ob.country = d.key;
   // ob.no_repos = d.values.length;
   // // ob.no_forks = d.repository_forks;
   // // ob.no_watches = d.repository_watchers;
   // return ob;
   // });

   console.log(dataForCountry);


  var config = {"data0":"country","data1":"no_repos",
              "label0":"label 0","label1":"label 1","color0":"#99ccff","color1":"#0050A1",
              "width":700,"height":500};

  width = config.width;
  height = config.height;

  var MAP_KEY = config.data0;
  var MAP_VALUE = config.data1;

  projection = d3.geo.mercator()
      .scale((width + 1) / 2 / 4 /*Math.PI*/)
      .rotate([0,0])
      .center([0,0])
      .translate([width / 2, height / 2])
      .precision(.1);

  path2 = d3.geo.path()
      .projection(projection);

  var graticule = d3.geo.graticule();
  d3.select("#canvas-svg-2 svg").remove();
  svg = d3.select("#canvas-svg-2").append("svg")
      .attr("width", width)
      .attr("height", height);

      svg.append("rect")
        .attr("id", "background-canvas-2")
        .attr("width", width)
        .attr("height", height);

  ginitial = svg.append("g");
  ginitial.append("path")
      .datum(graticule)
      .attr("class", "graticule")
      .attr("d", path2);

  var valueHash = {};

  dataForCountry.forEach(function(d) {
    valueHash[d[MAP_KEY]] = +d[MAP_VALUE];
  });


  d3.json("https://s3-us-west-2.amazonaws.com/vida-public/geo/world-topo-min.json", function(error, world) {
    var countries = topojson.feature(world, world.objects.countries).features;

    ginitial.append("path")
       .datum(graticule)
       .attr("class", "choropleth")
       .attr("d", path2);

    g2 = svg.append("g");

    g2.append("path")
     .datum({type: "LineString", coordinates: [[-180, 0], [-90, 0], [0, 0], [90, 0], [180, 0]]})
     .attr("class", "equator")
     .attr("d", path2);


    //var country = g.selectAll(".country").data(countries);

    g2.selectAll(".country").data(countries).enter().insert("path")
        .attr("class", "country")
        .attr("d", path2)
        .attr("id", function(d,i) { return d.id; })
        .attr("title", function(d) { return d.properties.name; })
        .style("fill", function(d) {
          return "#ccc";
        });
        // .on("mousemove", function(d) {
        //     var html = "";

        //     html += "<div class=\"tooltip_kv\">";
        //     html += "<span class=\"tooltip_key\">";
        //     html += d.properties.name;
        //     html += "</span>";
        //     html += "</div>";

        //     $("#tooltip-container-2").html(html);
        //     $(this).attr("fill-opacity", "0.8");
        //     $("#tooltip-container-2").show();

        //     var coordinates = d3.mouse(this);

        //     var map_width = $('.choropleth')[0].getBoundingClientRect().width;

        //     if (d3.event.pageX < map_width / 2) {
        //       d3.select("#tooltip-container-2")
        //         .style("top", (d3.event.layerY + 15) + "px")
        //         .style("left", (d3.event.layerX + 15) + "px");
        //     } else {
        //       var tooltip_width = $("#tooltip-container-2").width();
        //       d3.select("#tooltip-container-2")
        //         .style("top", (d3.event.layerY + 15) + "px")
        //         .style("left", (d3.event.layerX - tooltip_width - 30) + "px");
        //     }
        //  })
        //  .on("mouseout", function() {
        //         $(this).attr("fill-opacity", "1.0");
        //         $("#tooltip-container-2").hide();
        //  });
         //.on("click", clicked2);

         //svg.select("#background-canvas-2")
         //    .on("click", clicked2);

    g2.append("path")
        .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
        .attr("class", "boundary")
        .attr("d", path2);

        // add circles to svg



        console.log(location);
        g2.selectAll("circle").remove();
        g2.selectAll("circle")
        .data(location).enter()
        .append("circle")
        .attr("cx", function (d) { var temp = [d[0], d[1]]; return projection(temp)[0]; })
        .attr("cy", function (d) { var temp = [d[0], d[1]]; return projection(d)[1]; })
        .attr("r", "0.5px")
        .attr("fill", "red")
        .on("mousemove", function(d) {
            var html = "";
            html += "<div class=\"tooltip_kv\">";
            html += "<span class=\"tooltip_key\">";
            html += "City : "+d[2];
            html += "</span>";
            html += "<div>";
            html += "<span class=\"tooltip_key\">";
            html += "User : "+d[3];
            html += "</span>";
            html += "<div>";
            html += "<span class=\"tooltip_key\">";
            html += "Org : "+d[4];
            html += "</span>";
            html += "<div>";
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
         });



   /****/

    svg.attr("height", config.height * 2.2 / 3);
  });

  d3.select(self.frameElement).style("height", (height * 2.3 / 3) + "px");
}


function clicked2(d) {
  var x, y, k;

  if (d && centered !== d) {
    var centroid = path2.centroid(d);
    x = centroid[0];
    y = centroid[1];
    k = 2;
    centered = d;
  } else {
    x = width / 2;
    y = height / 2;
    k = 1;
    centered = null;
  }

  g2.selectAll("path")
      .classed("active", centered && function(d) { return d === centered; });

  if (d === centered) {
    g2.selectAll("circle").remove();
    g2.selectAll("circle")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
    .data(location).enter()
    .append("circle")
    .attr("cx", function (d) { console.log(projection(d)); return projection(d)[0]; })
    .attr("cy", function (d) { return projection(d)[1]; })
    .attr("r", "0.5px")
    .attr("fill", "red")
    .on("mousemove", function(d) {
        var html = "";
        html += "<div class=\"tooltip_kv\">";
        html += "<span class=\"tooltip_key\">";
        html += "City : "+d[2];
        html += "</span>";
        html += "<div>";
        html += "<span class=\"tooltip_key\">";
        html += "User : "+d[3];
        html += "</span>";
        html += "<div>";
        html += "<span class=\"tooltip_key\">";
        html += "Org : "+d[4];
        html += "</span>";
        html += "<div>";
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
     });
}

  g2.transition()
      .duration(750)
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
      .style("stroke-width", 1.5 / k + "px");

}


/********************************************************** BAR CHART *********************************************/
function prepareBar(country) {

var countryFilter = {
  'country': [country] 
};
d3.csv("archive.csv", function(err, filteredData) {
      filteredData = filteredData.filter(function(row) {
          // run through all the filters, returning a boolean
          return ['country'].reduce(function(pass, column) {
              return pass && (
                  // pass if no filter is setp[-]
                  !countryFilter[column] ||
                      // pass if the row's value is equal to the filter
                      // (i.e. the filter is set to a string)
                      row[column] === countryFilter[column] ||
                      // pass if the row's value is in an array of filter values
                      countryFilter[column].indexOf(row[column]) >= 0
                  );
          }, true);
      });
      renderBar(filteredData);
      document.querySelector('#countryName').innerHTML = country;
      prepareLine(filteredData);
  });
  


}


function renderBar(filteredData) {
  d3.select("#canvas-svg-bar svg").remove()
  //document.querySelector('#countryName').innerHTML = country;
  if (filteredData == null || filteredData.length == 0) {
     document.querySelector('#line-log p').innerHTML = 'No Repos Found';
     document.querySelector('.bar-p p').innerHTML = '';
     return;
    }
     document.querySelector('.bar-p p').innerHTML = 'Repos vs #Users';
    document.querySelector('#line-log p').innerHTML = '';
  var usersForRepos = d3.nest()
  .key(function(d) { return d.repository_name ;})
  //.key(function(d) { return d.repository_url;}) //v.length; })
  .rollup(function(v) { return v.length; })
  .entries(filteredData);
  console.log(usersForRepos);
   // var width = 600,
   //     height = 400; 
  /****construct bar ****/
      //var svgElement = '<svg width="1000" height=500 class="svgElement1"></svg>';
       
      // var svg = d3.select("#canvas-svg-bar").append("svg")
      // .attr("width", width)
      // .attr("height", height);

    /***********************************************************/

    // var div = d3.select("#canvas-svg-bar").append("div").attr("class", "toolTip");

    var axisMargin = 20,
            margin = 40,
            valueMargin = 4,
            width = 560,
            height = 390,
            barHeight = 20,
            barPadding = 8,
            data, bar, svg, scale, xAxis, labelWidth = 0;

    max = d3.max(usersForRepos, function(d) { return d.values; });

    svg = d3.select('#canvas-svg-bar')
            .append("svg")
            .attr("width", width)
            .attr("height", height);


    bar = svg.selectAll("g")
            .data(usersForRepos)
            .enter()
            .append("g");

    bar.attr("class", "bar")
            .attr("cx",0)
            .attr("transform", function(d, i) {
                return "translate(" + margin + "," + ((i+1) * (barHeight + barPadding) + 2*barPadding) + ")";
            });

    bar.append("text")
            .attr("class", "label")
            .attr("y", barHeight / 2)
            .attr("dy", ".35em") //vertical align middle
            .text(function(d){
                return d.key;
            }).each(function() {
        labelWidth = Math.ceil(Math.max(labelWidth, this.getBBox().width));
    });

    scale = d3.scale.linear()
            .domain([0, max])
            .range([0, width - margin*2 - labelWidth]);

    xAxis = d3.svg.axis()
            .scale(scale)
            .tickSize(-height + 2*margin + axisMargin)
            .orient("bottom");

    bar.append("rect")
            .attr("transform", "translate("+labelWidth+", 0)")
            .attr("height", barHeight)
            .attr("width", function(d){
                return scale(d.values);
            });

    bar.append("text")
            .attr("class", "value")
            .attr("y", barHeight / 2)
            .attr("dx", -valueMargin + labelWidth) //margin right
            .attr("dy", ".35em") //vertical align middle
            .attr("text-anchor", "end")
            .text(function(d){
                return (d.values);
            })
            .attr("x", function(d){
                var width = this.getBBox().width;
                return Math.max(width + valueMargin, scale(d.values));
            });

    //bar
            // .on("mousemove", function(d){
            //     div.style("left", d3.event.pageX+10+"px");
            //     div.style("top", d3.event.pageY-25+"px");
            //     div.style("display", "inline-block");
            //     div.html((d.key)+"<br>"+(d.values));
            // });
    //bar
            // .on("mouseout", function(d){
            //     div.style("display", "none");
            // });
    svg.append("text").attr(
          "transform",
          "translate(" + (margin.bottom)
              + ")").style("text-anchor", "middle").text("Year");

    svg.insert("g",":first-child")
            .attr("class", "axisHorizontal")
            .attr("transform", "translate(" + (margin + labelWidth) + ","+ (height - axisMargin - margin)+")")
            .call(xAxis);


    /****************************************************************/


}


  function prepareLine(filteredData) {

     $(".lineChart").empty();
    if (filteredData == null || filteredData.length == 0) {
     document.querySelector('#line-log p').innerHTML = 'No Repos Found';
     return;
    }
    document.querySelector('#line-log p').innerHTML = '';
    var yearsForRepos = d3.nest()
      .key(function(d) { return d.repository_created_at ;})
      //.key(function(d) { return d.repository_url;}) //v.length; })
      .rollup(function(v) { return v.length; })
      .entries(filteredData);

      console.log(yearsForRepos);

      var tooltip = d3.select("body").append("div").attr("class", "tooltip")
        .style("opacity", 0);

        //chart
        var margin = {
            top : 30,
            right : 20,
            bottom : 50,
            left : 100
          }, width = 500 - margin.left - margin.right, height =190
              - margin.top - margin.bottom;

          var parseDate = d3.time.format("%d-%m-%Y").parse;
          // Set the ranges
          var x = d3.time.scale().range([ 0, width ]);
          var y = d3.scale.linear().range([ height, 0 ]);

          // Define the axes
          var xAxis = d3.svg.axis().scale(x).orient("bottom")
              .ticks(5);

          var yAxis = d3.svg.axis().scale(y).orient("left").ticks(5);

          // Define the line
          var valueline = d3.svg.line().x(function(d) {
            return x(d.key);
          }).y(function(d) {
            return y(d.values);
          });
          // var valueline1 = d3.svg.line().x(function(d) {
          //   return x(d.Year);
          // }).y(function(d) {
          //   return y(d.Average);
          // });

          // Adds the svg canvas
          var svg = d3.select(".lineChart").append("svg").attr(
              "width", width + margin.left + margin.right).attr(
              "height", height + margin.top + margin.bottom)
              .append("g").attr(
                  "transform",
                  "translate(" + margin.left + ","
                      + margin.top + ")");


          // Get the data

          yearsForRepos.forEach(function(d) {
            // console.log(d);
             d.YearLabel=d.key;
            d.key = parseDate("01-01-" + d.key);
            d.values = +d.values;
            // d.Average=+d.Average;
          });

          // Scale the range of the data
          x.domain(d3.extent(yearsForRepos, function(d) {
            console.log(d.key);
            return d.key;
          }));
          y.domain([ 0, d3.max(yearsForRepos, function(d) {
            return Math.max(d.values,d.values);
          }) ]);

          // Add the valueline path.
          var path=svg.append("path").attr("class", "line").attr("d",
              valueline(yearsForRepos)).style("stroke","blue");
          // var path1=svg.append("path").attr("class", "line").attr("d",
          //     valueline1(filteredData)).style("stroke","blue");

          //add scatterplot
          svg.selectAll("dot").data(yearsForRepos).enter().append("circle")
          .attr("r", 3.5).attr("cx", function(d) {
            return x(d.key);
          }).attr("cy", function(d) {
            return y(d.values);
          }).style("fill", "red").on(
              "mouseover",
              function(d) {
                tooltip.transition().duration(200).style(
                    "opacity", .9);
                tooltip.html(
                    "<strong>#Users: </strong>" + d.values + " <br/><br/><strong>Year: </strong>"
                        + d.YearLabel).style("left",
                    (d3.event.pageX + 5) + "px").style(
                    "top", (d3.event.pageY - 28) + "px");
              }).on("mouseout", function(d) {
            tooltip.transition().duration(500).style("opacity", 0);


          });


          // Add the X Axis
          svg.append("g").attr("class", "x axis").attr("transform",
              "translate(0," + height + ")").call(xAxis);

          // Add the Y Axis
          svg.append("g").attr("class", "y axis").call(yAxis);
          var totalLength = path.node().getTotalLength();
          d3.select(path.node())
              .attr("stroke-dasharray", totalLength  )
              .attr("stroke-dashoffset", totalLength)
              .transition()
              .duration(1000)
              .ease("linear")
              .attr("stroke-dashoffset", 0);

              
        svg.append("text").attr(
          "transform",
          "translate(" + (width / 2) + " ," + (height + margin.bottom)
              + ")").style("text-anchor", "middle").text("Year");

      svg.append("text").attr("transform", "rotate(-90)").attr("y",
        0 - margin.left+30).attr("x", 0 - (height / 2)).attr("dy", "0.3em")
        .style("text-anchor", "middle").text("No. of Users");

        // var legendNames=["","",""];




      //  var color=[{"name":"Max in Years","value":" blue"},{"name":curPlayerName,"value":"red"}];

      // var legend = svg.selectAll(".legend")
      //     .data(color)
      //     .enter().append("g")
      //     .attr("class", "legend")
      //     .attr("transform", function(d, i) {var val=(i*10)-30; return "translate(500," + val + ")"; });

      // legend.append("rect")
      //     .attr("x", -150)
      //     .attr("width", 10)
      //     .attr("height", 10).style("font-size", "13px")
      //     .style("fill", function(d){
      //     console.log(d.value); return d.value;
      //     });

      // legend.append("text")
      //     .attr("x", -155)
      //     .attr("y", 6)
      //     .attr("dy", ".35em")
      //     .style("text-anchor", "end")
      //     .text(function(d) { return d.name; });


  }

});

