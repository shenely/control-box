angular.module('controlBox.services', [])
  .factory("mission",function () {
    var data = [
      {
        "name": "Aqua",
        "color": d3.rgb("#0ff"),
        "lead": true,
        "reference": null,
        "path": 0,
        "offset": 0.0,
        "bound": 10.0,
        "phase": 0.0
      },
      {
        "name": "Aura",
        "color": d3.rgb("#f70"),
        "lead": false,
        "reference": 0,
        "path": 0,
        "offset": 18.0,
        "bound": 10.0,
        "phase": 487.5
      },
      {
        "name": "CALIPSO",
        "color": d3.rgb("#f0f"),
        "lead": false,
        "reference": 0,
        "path": -1,
        "offset": 43.0,
        "bound": 10.0,
        "phase": 73.0
      },
      {
        "name": "CloudSat",
        "color": d3.rgb("#00f"),
        "lead": false,
        "reference": 0,
        "path": -1,
        "offset": 45.3,
        "bound": 10.0,
        "phase": 176.0
      },
      {
        "name": "GCOM-W1",
        "color": d3.rgb("#f00"),
        "lead": false,
        "reference": 0,
        "path": 0,
        "offset": 0.0,
        "bound": 20.0,
        "phase": -259.5
      }
    ];
    
    return data
  })
  .factory("spacecraft",["mission",function (mission) {
    var data = [
      {
        "name": "PM-1",
        "mission": mission[0],
        "epoch": new Date("2013-07-17T22:35:14.879Z"),
        "longitude": 45.124778999
                      
      },
      {
        "name": "CH-1",
        "mission": mission[1],
        "epoch": new Date("2013-07-17T22:43:23.125Z"),
        "longitude": 45.275464783
      },
      {
        "name": "CAL",
        "mission": mission[2],
        "epoch": new Date("2013-07-17T22:36:36.984Z"),
        "longitude": 47.021420378
      },
      {
        "name": "CS",
        "mission": mission[3],
        "epoch": new Date("2013-07-17T22:38:21.260Z"),
        "longitude": 47.026319128
      },
      {
        "name": "W1",
        "mission": mission[4],
        "epoch": new Date("2013-07-17T22:31:57.121Z"),
        "longitude": 44.869681575
      }
    ];
    
    return data;
  }])
  .factory("size", function () {
    var size = function () {
    };
    size.margin = {top: 40, right: 80, bottom: 40, left: 60};
    size.width = 800 - size.margin.left - size.margin.right;
    size.height = 600 - size.margin.top - size.margin.bottom;
    
    return size;
  })
  .factory("convert", function () {
    const RADIUS = 6378.1;
    const SECOND = 1.0;
    const MINUTE = 60 * SECOND;
    const HOUR = 60 * MINUTE;
    const DAY = 24 * HOUR;
  
    var convert = {
      longitude: (function () {
        var longitude = function (longitude) {
          return (longitude + 180) % 360 - 180;
        };
        
        longitude.path = function (longitude) {
          var path = 1 - 233 * (longitude + 64.6) / 360;
        
          path = (path + 233) % 233;
          
          return path;
        };
        
        longitude.offset = function (longitude) {
          var offset = (2 * Math.PI * RADIUS) * longitude / 360;
          
          return offset;
        };
        
        longitude.hour = function (longitude) {
          var hour = 24 * longitude / 360;
          
          return hour;
        };
        
        return longitude;
      }) (),
      path: (function () {
        var path = function (path) {
          return path - Math.round(path);
        };
        
        path.offset = function (path) {
          var offset = - (2 * Math.PI * RADIUS) * path / 233;
        
          return offset;
        };
        
        return path;
      }) (),
      offset: (function () {
        var offset = function (offset) {
          return offset;
        };
        
        offset.phase = function (offset) {
          var phase = - DAY * offset / (2 * Math.PI * RADIUS);
          
          return phase;
        };
        
        return offset;
      }) (),
      hour: (function () {
        var hour = function (hour) {
          return hour;
        };
        
        hour.longitude = function (hour) {
          var hour = convert.longitude(360 * hour / 24);
          
          return hour;
        };
        
        return hour;
      }) (),
      epoch: (function () {
        var epoch = function (epoch) {
          return epoch;
        };
        
        epoch.phase = function (epoch) {
          var phase = epoch.getTime() / 1000;
          
          return phase;
        };
        
        return epoch;
      }) (),
      phase: (function () {
        var phase = function (phase) {
          return phase;
        };
        
        return phase;
      }) ()
    };
    
    return convert;
  })
  .factory("scale",[
    "spacecraft",
    "convert",
    "size",
    function (spacecraft,convert,size) {
      var lead = spacecraft.reduce(function (prev,curr) {
        return (curr.mission.lead == true) ? curr : prev;
      });
      
      var scale = {
        longitude: d3.scale.linear(),
        epoch: d3.time.scale.utc(),
        path: d3.scale.linear(),
        offset: d3.scale.linear(),
        phase: d3.scale.linear(),
      };
    
      (function () {
        var d = [
                d3.min(spacecraft,function (d) { return d.mission.phase + convert.offset.phase(d.mission.bound); }),
                d3.max(spacecraft,function (d) { return d.mission.phase - convert.offset.phase(d.mission.bound); })
            ].map(function (d) { return new Date(lead.epoch.getTime() + 1000 * d); }),
            r = [size.height,0];
              
        d[0] = d3.time.minute.utc.floor(d[0]);
        d[1] = d3.time.minute.utc.ceil(d[1]);
        
        scale.epoch.domain(d).range(r);
        scale.phase.range(r);
        
        convert.epoch.pixel = function (longitude) {
          var d = scale.epoch.domain(),
              r = scale.epoch.range();
              
          var pixel = (r[1] - r[0]) * longitude.getTime() / (d[1].getTime() - d[0].getTime());
          
          return pixel;
        };
      }) ();
      
      (function () {
        var d = d3.extent(spacecraft,function (d) { return d.longitude; }),
            r = [0,size.width];
          
        d[0] = Math.floor(d[0]);
        d[1] = Math.ceil(d[1]);
        
        scale.longitude.domain(d).range(r);
        scale.path.domain(d.map(convert.longitude.path)).range(r);
        scale.offset.range(r);
        
        convert.longitude.pixel = function (longitude) {
          var d = scale.longitude.domain(),
              r = scale.longitude.range();
              
          var pixel = (r[1] - r[0]) * longitude / (d[1] - d[0]);
          
          return pixel;
        };
      }) ();
      
      (function () {
        var epoch = lead.epoch,
            longitude = convert.longitude(lead.longitude),
            path = convert.longitude.path(longitude) - lead.mission.path,
            offset = convert.path.offset(convert.path(path)) - lead.mission.offset,
            phase = convert.offset.phase(offset);
        
        scale.offset.domain(scale.longitude.domain().map(function (d) { return convert.longitude.offset(d - longitude) + offset; }));
        scale.phase.domain(scale.epoch.domain().map(function (d) { return convert.epoch.phase(d) - convert.epoch.phase(epoch) + phase }));
        
        convert.offset.pixel = function (offset) {
          var d = scale.offset.domain(),
              r = scale.offset.range();
              
          var pixel = (r[1] - r[0]) * offset / (d[1] - d[0]);
          
          return pixel;
        };
        
        convert.phase.pixel = function (phase) {
          var d = scale.phase.domain(),
              r = scale.phase.range();
              
          var pixel = (r[1] - r[0]) * phase / (d[1] - d[0]);
          
          return pixel;
        };
      }) ();
        
      return scale;
    }
  ])
  .factory("axis",[
    "scale",
    "size",
    function (scale,size) {
      var axis = {
        longitude: d3.svg.axis()
          .scale(scale.longitude)
          .orient("bottom"),
        epoch: d3.svg.axis()
          .scale(scale.epoch)
          .orient("left")
          .tickFormat(d3.time.format.utc("%H:%M")),
        path: d3.svg.axis()
          .scale(scale.path)
          .orient("top")
          .ticks(2),
        offset: d3.svg.axis()
          .scale(scale.offset)
          .orient("top"),
        phase: d3.svg.axis()
          .scale(scale.phase)
          .orient("right")
      };
      
      return function(selection) {
        selection.append("g")
            .classed("x axis",true)
            .attr("transform","translate(0," + size.height + ")")
            .call(axis.longitude)
          .append("text")
            .attr("x",size.width / 2)
            .attr("y",35)
            .style("text-anchor", "middle")
            .text("Longitude at Descending Node (deg)");

        selection.append("g")
            .classed("y axis",true)
            .call(axis.epoch)
          .append("text")
            .attr("transform","rotate(-90)")
            .attr("x",- size.height / 2)
            .attr("y",-55)
            .attr("dy","1em")
            .style("text-anchor","middle")
            .text("Epoch at Descending Node (UTC)");
            
        selection.append("g")
            .classed("x axis",true)
            .attr("transform","translate(0," + size.height + ")")
            .call(axis.path)
          .append("text")
            .attr("x",size.width / 2)
            .attr("y",-35)
            .style("text-anchor", "middle")
            .text("WRS-2 Path Number");
            
        selection.append("g")
            .classed("x axis",true)
            .call(axis.offset)
          .append("text")
            .attr("x",size.width / 2)
            .attr("y",-35)
            .attr("dy","1em")
            .style("text-anchor", "middle")
            .text("Constellation Offset (km)");

        selection.append("g")
            .classed("y axis",true)
            .attr("transform","translate(" + size.width + ",0)")
            .call(axis.phase)
          .append("text")
            .attr("transform","rotate(-90)")
            .attr("x",- size.height / 2)
            .attr("y",45)
            .style("text-anchor","middle")
            .text("Constellation Phase (s)");
      };
    }
  ])
  .factory("cb",[
    "mission",
    "scale",
    "convert",
    function (mission,scale,convert) {
      return function (selection) {
        var cb = selection.selectAll(".control-box")
            .data(mission)
          .enter().append("g")
            .classed("control-box",true);
        
        var line = d3.svg.line()
          .x(function(d) { return scale.offset(d[0]); })
          .y(function(d) { return scale.phase(d[1]); });
          
        cb.append("rect")
          .attr("x",function (d) { return scale.offset(d.offset + convert.path.offset(d.path) - d.bound); })
          .attr("y",function (d) { return scale.phase(d.phase - convert.offset.phase(d.bound)); })
          .attr("width",function (d) { return convert.offset.pixel(2 * d.bound); })
          .attr("height",function (d) { return convert.phase.pixel(2 * convert.offset.phase(d.bound)); })
          .style("fill", function (d) { return d.color; });
          
        cb.append("text")
          .attr("transform", function(d) {  return "translate(" + scale.offset(d.offset + convert.path.offset(d.path) + d.bound) +
                                                            "," + scale.phase(d.phase - convert.offset.phase(d.bound)) + ")"; })
          .style("text-anchor","start")
          .text(function(d) { return d.name; });
      };
    }
  ])
  .factory("sc",[
    "spacecraft",
    "scale",
    function (spacecraft,scale) {
    
      return function (selection) {
        var sc = selection.selectAll(".spacecraft")
            .data(spacecraft)
          .enter().append("g")
        
        sc.append("circle")
          .attr("r",5)
          .attr("cx",function (d) { return scale.longitude(d.longitude); })
          .attr("cy",function (d) { return scale.epoch(d.epoch); })
          .style("fill", function (d) { return d.mission.color.darker(); });
          
        sc.append("text")
          .attr("transform", function(d) {  return "translate(" + scale.longitude(d.longitude) +
                                                            "," + scale.epoch(d.epoch) + ")"; })
          .attr("x", 7)
          .attr("y", 7)
          .style("text-anchor","start")
          .text(function(d) { return d.name; });
      };
    }
  ])
  .factory("mlt", [
    "scale",
    "convert",
    "size",
    function (scale,convert,size) {
      var ratio = 3 / 4;
      
      var longitude = scale.longitude.domain(),
          epoch = scale.epoch.domain();
      
      var format = d3.time.format.utc("%H:%M");
          
      var mlt = d3.time.minutes(
        new Date(epoch[0].getTime() + 3600 * 1000 * convert.longitude.hour(longitude[0])),
        new Date(epoch[1].getTime() + 3600 * 1000 * convert.longitude.hour(longitude[1])),
        2
      ).map(function (mlt) {
        var point = [
          {
            "x": null,
            "y": null
          },
          {
            "x": null,
            "y": null
          }
        ],
            x,y;
        
        x = scale.longitude(convert.hour.longitude((mlt.getTime() - epoch[0].getTime()) / (3600 * 1000)));
        y = scale.epoch(new Date(mlt.getTime() - 3600 * 1000 * convert.longitude.hour(longitude[1])));
        if (x <= size.width) {
          point[0].x = x;
          point[0].y = scale.epoch(epoch[0]);
        } else {
          point[0].x = scale.longitude(longitude[1]);
          point[0].y = y;
        }
        
        x = scale.longitude(convert.hour.longitude((mlt.getTime() - epoch[1].getTime()) / (3600 * 1000)));
        y = scale.epoch(new Date(mlt.getTime() - 3600 * 1000 * convert.longitude.hour(longitude[0])));
        if (x >= 0) {
          point[1].x = x;
          point[1].y = scale.epoch(epoch[1]);
        } else {
          point[1].x = scale.longitude(longitude[0]);
          point[1].y = y;
        }
        
        return {
          "mlt": mlt,
          "point": point
        };
      });
      
      return function (selection) {
        var group = selection.selectAll(".mlt")
            .data(mlt)
          .enter().append("g")
            .classed("mlt",true);
       
       group.append("line")
            .attr("x1",function (d) { return d.point[0].x; })
            .attr("y1",function (d) { return d.point[0].y; })
            .attr("x2",function (d) { return d.point[1].x; })
            .attr("y2",function (d) { return d.point[1].y; });
        
        group.append("text")
          .attr("transform", function(d) {  return "translate(" + ((1 - ratio) * d.point[0].x + ratio * d.point[1].x) +
                                                            "," + ((1 - ratio) * d.point[0].y + ratio * d.point[1].y) + ")"; })
          .attr("dx","0.5em")
          .text(function(d) { return format(d.mlt); });
      };
    }
  ])
  .factory("mouse",[
    "size",
    "scale",
    "convert",
    function (size,scale,convert) {
      return function (selection) {
        var group = selection.append("g")
          .classed("mouse",true);
        
        var blah = group.append("g")
          
        blah.append("rect")
          .attr("width",50)
          .attr("height",50)
          .style("fill","#fff");
       
       var text = blah.selectAll("text")
            .data([
              "","","","","",""
            ])
          .enter().append("text")
              .style("fill","#000")
              .attr("dx","1em")
              .text(function (d) { return d; });
          
        var overlay = group.append("rect")
          .attr("x",0)
          .attr("y",0)
          .attr("width",size.width)
          .attr("height",size.height)
          .style("fill","#fff")
          .style("fill-opacity","0%");
        
        overlay.on("mousemove",function () {
          var mouse = d3.mouse(this);
          
          text.data([
            "Epoch (hh:mm:ss): " + d3.time.format.utc("%H:%M:%S")(scale.epoch.invert(mouse[1])),
            "Longitude (deg): " + d3.format(".2f")(scale.longitude.invert(mouse[0])),
            "Path: " + d3.format(".0f")(scale.path.invert(mouse[0])),
            "Offset (km): " + d3.format(".2f")(scale.offset.invert(mouse[0])),
            "Phase (s): " + d3.format(".2f")(scale.phase.invert(mouse[1])),
            "MLTDN (hh:mm:ss): " + d3.time.format.utc("%H:%M:%S")(new Date(scale.epoch.invert(mouse[1]).getTime() + 3600 * 1000 * convert.longitude.hour(scale.longitude.invert(mouse[0]))))
          ]).text(function (d) { return d; })
            .attr("dy",function (d,i) { return i + "em"; });
          
          blah.attr("transform", function() { return "translate(" + mouse[0] + "," + mouse[1] + ")"; });
        });
      };
    }
  ])
  .factory("controlBox",[
    "size",
    "axis",
    "mouse",
    "cb",
    "sc",
    "mlt",
    function (size,axis,mouse,cb,sc,mlt) {
      return function (scope,element) {
        var svg = d3.select(element[0]).append("svg")
            .attr("width",size.width + size.margin.left + size.margin.right)
            .attr("height",size.height + size.margin.top + size.margin.bottom)
          .append("g")
            .attr("transform","translate(" + size.margin.left + "," + size.margin.top + ")");
        
        axis(svg);
        mlt(svg);
        cb(svg);
        sc(svg);
        mouse(svg);
        
        
      };
  }]);
