var width = window.innerWidth-300;
var height = window.innerHeight-80;
var color = d3.scaleOrdinal(d3.schemeCategory10);

d3.json("graph.json").then(function(graph) {

var linksToCategory = graph.links.filter(function(link) { return link.target > 99; });

graph.links = graph.links.filter(function(link) { return link.target > 99; });

var label = {
    'nodes': [],
    'links': []
};

graph.nodes.forEach(function(d, i) {
    label.nodes.push({node: d});
    label.nodes.push({node: d});
    label.links.push({
        source: i * 2,
        target: i * 2 + 1
    });
});

d3.select("#myInput").on("keyup", function(d) { 
    
  var filter_name = d3.select("#myInput").node().value.toUpperCase();
  var list_items = d3.select("#ul_patterns").node().getElementsByTagName('li');
  // Loop through all list items, and hide those who don't match the search query
  for (i = 0; i < list_items.length; i++) {
    var txtValue = list_items[i].textContent || list_items[i].innerText;
    if (txtValue.toUpperCase().indexOf(filter_name) > -1) {
      list_items[i].style.display = "";
    } else {
      list_items[i].style.display = "none";
    }
  }

  //if only one pattern match the input value, then highlight the pattern
  var results = graph.nodes.filter(node => node.name.toUpperCase().startsWith(filter_name));
  if(results.length == 1) {
    show_node_via_object(results[0]);
  }
  else {
    show_all();
  }
})



var labelLayout = d3.forceSimulation(label.nodes)
    .force("charge", d3.forceManyBody().strength(-50))
    .force("link", d3.forceLink(label.links).distance(0).strength(2));

var graphLayout = d3.forceSimulation(graph.nodes)
    .force("charge", d3.forceManyBody().strength(-3000))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("x", d3.forceX(width / 2).strength(0.3))
    .force("y", d3.forceY(height / 2).strength(0.7))
    .force("link", d3.forceLink(graph.links).id(function(d) {return d.id; }).distance(200).strength(1))
    .on("tick", ticked);

var adjlist = [];

graph.links.forEach(function(d) {
    adjlist[d.source.index + "-" + d.target.index] = true;
    adjlist[d.target.index + "-" + d.source.index] = true;
});



var svg = d3.select("#viz").attr("width", width).attr("height", height);
var container = svg.append("g");


var groups = container.append("g").attr('class', 'groups');
var groupIds = d3.set(graph.nodes.map(function(n) { return +n.group; }))
    .values()
    .map( function(groupId) {
      return { 
        groupId : groupId,
        count : graph.nodes.filter(function(n) { return +n.group == groupId; }).length
      };
    })
    .filter( function(group) { return group.count > 2;})
    .map( function(group) { return group.groupId; });




var ul = d3.select('#pattern-list')
           .append('ul')
           .attr('id', 'ul_patterns');
ul.selectAll('li')
    .data(graph.groups)
    .enter()
    .append('li')
      .text(function(d, i) { return  d.name; })
      .on("mouseenter", show_group_of_node).on("mouseout", show_all)
      .append("ul")
        .attr("style","list-style: none;")
	      .selectAll("li")
	      .data(function (d, i) {return graph.nodes.filter(node => node.group== d.id);})
        .enter()
        .append("li")
          .attr("style","margin-left: -2.5rem;")
          .on("mouseover", show_node_via_object).on("mouseout", show_all)
          .on("click",click_checkbox)
          .append("input")
            .attr("type", "checkbox")
            .attr("class", "cb_pattern")
            .on("change",show_selected)
            .attr("id", function (d, i) {return d.index;})
          .select(function() { return this.parentNode; })
          .append("span")
            .text(function (d, i) {return d.name;});

var paths = groups.selectAll('.path_placeholder')
                  .data(groupIds, function(d) { return +d; })
                  .enter()
                  .append('g')
                  .attr('class', 'path_placeholder')
                  .append('path')
                  .attr('stroke', function(d) { return color(d); })
                  .attr('fill', function(d) { return color(d); })
                  .attr('opacity', 0);

paths.transition()
     .duration(2000)
     .attr('opacity', 0.2);

groups.selectAll('.path_placeholder')
      .call(d3.drag()
      .on('start', group_dragstarted)
      .on('drag', group_dragged)
      .on('end', group_dragended));

svg.call(
    d3.zoom()
        .scaleExtent([.1, 4])
        .on("zoom", function() { container.attr("transform", d3.event.transform); })
);

svg.append("svg:defs").selectAll("marker")
    .data(["end"])      // Different link/path types can be defined here
    .enter().append("svg:marker")    // This section adds in the arrows
    .attr("id", String)
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 15)
    .attr("refY", -1.5)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5");


var link = container.append("g").attr("class", "links")
    .selectAll("line")
    .data(graph.links)
    .enter()
    .append("line")
    .attr("id", function(d,i) {return d.id;})
    .attr("stroke", "#7f7f7f")
    .attr("stroke-width", "1px")
    .attr("marker-end", "url(#end)");

var node = container.append("g").attr("class", "nodes")
    .selectAll("g")
    .data(graph.nodes)
    .enter()
    .append("circle")
    .attr("r", 5)
    .attr("fill", function(d) { return color(d.group); })
    .on("click", onclickNode);


node.on("mouseover", show_node_via_object).on("mouseout", show_all);

node.call(
    d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
);

function onclickNode(d) {
  console.log("click node: " + d.id);
  //TODO
}

var labelNode = container.append("g").attr("class", "labelNodes")
    .selectAll("text")
    .data(label.nodes)
    .enter()
    .append("text")
    .text(function(d, i) { return i % 2 == 0 ? "" : d.node.name; })
    .style("fill", "#555")
    .style("font-family", "Arial")
    .style("font-size", 12)
    .style("pointer-events", "none");


function ticked() {
    node.call(updateNode);
    link.call(updateLink);
    labelLayout.alphaTarget(0.1).restart();
    labelNode.each(function(d, i) {
        if(i % 2 == 0) {
            d.x = d.node.x;
            d.y = d.node.y;
        }
    });
    labelNode.call(updateNode);
    updateGroups();
}

var  valueline = d3.line()
                   .x(function(d) { return d[0]; })
                   .y(function(d) { return d[1]; })
                   .curve(d3.curveCatmullRomClosed),
                   scaleFactor = 1.1;
                   
var polygonGenerator = function(groupId) {  
  return d3.polygonHull(node.filter(function(d) { return d.group == groupId; })
                            .data()
                            .map(function(d) { return [d.x, d.y]; }));
  };

function updateGroups() {
  groupIds.forEach(function(groupId) {
    var path = paths.filter(function(d) { return d == groupId;})
      .attr('transform', 'scale(1) translate(0,0)')
      .attr('d', function(d) {
        polygon = polygonGenerator(d);          
        centroid = d3.polygonCentroid(polygon);
        return valueline(
          polygon.map(function(point) {
            return [  point[0] - centroid[0], point[1] - centroid[1] ];
          })
        );
      });

    d3.select(path.node().parentNode).attr('transform', 'translate('  + centroid[0] + ',' + (centroid[1]) + ') scale(' + scaleFactor + ')');
  });
}

function fixna(x) {
    if (isFinite(x)) return x;
    return 0;
}

function updateLink(link) {
    link.attr("x1", function(d) { return fixna(d.source.x); })
        .attr("y1", function(d) { return fixna(d.source.y); })
        .attr("x2", function(d) { return fixna(d.target.x); })
        .attr("y2", function(d) { return fixna(d.target.y); });
}

function updateNode(node) {
    node.attr("transform", function(d) {
        return "translate(" + fixna(d.x) + "," + fixna(d.y) + ")";
    });
}


//------------------------------------------------------
//#           DRAG FUNCTIONS                           #
//------------------------------------------------------


function dragstarted(d) {
    d3.event.sourceEvent.stopPropagation();
    if (!d3.event.active) graphLayout.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragended(d) {
    if (!d3.event.active) graphLayout.alphaTarget(0);
    d.fx = null;
    d.fy = null;
}

// drag groups
function group_dragstarted(groupId) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d3.select(this).select('path').style('stroke-width', 3);
}

function group_dragged(groupId) {
  node
    .filter(function(d) { return d.group == groupId; })
    .each(function(d) {
      d.x += d3.event.dx;
      d.y += d3.event.dy;
    })
}

function group_dragended(groupId) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d3.select(this).select('path').style('stroke-width', 1);
}


//------------------------------------------------------
//#           SHOW FUNCTIONS                           #
//------------------------------------------------------

function show_all() {
  if(cb_is_not_checked()==true)
  {
   console.log("show all");
   labelNode.attr("display", "block");
   node.style("opacity", 1);
   link.style("opacity", 1);
   groups.selectAll('.path_placeholder').style("opacity", 1);
}}

function hide_all() {
  console.log("hide all");
   labelNode.attr("display", "none");
   node.style("opacity", 0.1);
   link.style("opacity", 0.1);
   groups.selectAll('.path_placeholder').style("opacity", 0.1);
}

function show_node_via_object(node) {
  if(cb_is_not_checked())
  {
    hide_all();
    show_node_with_links(node);
  }
}

function show_node_with_links(node) {
  show_node(node.index);
  show_linked_nodes_of_node(node.index);
}

function show_node(selected_node) {
  console.log("show node: " + selected_node);
  node.filter(n => n.index == selected_node).style("opacity" ,1);
  labelNode.filter(n => n.node.index == selected_node).attr("display", "block");
}

function show_linked_nodes_of_node(selected_node) {
  console.log("show related linkes of nodes");  
    graph.links.filter(l => l.source.index == selected_node || l.target.index == selected_node).forEach(function(d) 
  {
      if(d.source.index == selected_node) {
        show_node(d.target.index);
      }      
      else if(d.target.index == selected_node) {
        show_node(d.source.index);
      }
    });

    link.filter(o => o.source.index == selected_node || o.target.index == selected_node).style("opacity", "1");   
}

function show_group_of_node(selected_node) {
  if(cb_is_not_checked()){
    hide_all();
    var group_id =graph.nodes.filter(n => n.index == selected_node.id)[0].group;
    groups.selectAll('.path_placeholder').filter(g => g == group_id).style("opacity", "1");
    graph.nodes.filter(n => n.group == group_id).forEach(function(d) 
    {
      show_node(d.index);
    });
  }

}

function show_selected() {
  hide_all();
  d3.selectAll(".cb_pattern").each(function(d){
          cb = d3.select(this);
          if(cb.property("checked")){
            show_node(cb.attr("id"));
            show_linked_nodes_of_node(cb.attr("id"));
          }
        });
}

function click_checkbox(label){
    var check=document.getElementsByTagName('input');
    for(var i=0;i<check.length;i++)
    {
     if(check[i].type=='checkbox' && check[i].id==label.index)
     {
      check[i].checked=!check[i].checked;
     }
    }
    show_selected();
}

function cb_is_not_checked(){
  var counter = 0;
  d3.selectAll(".cb_pattern").each(function(d){
          cb = d3.select(this);
          if(cb.property("checked")){
            counter++;
          }
        });
 return counter==0 ? true : false;
}

});