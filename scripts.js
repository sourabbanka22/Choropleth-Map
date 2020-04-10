
const main = d3.select("#main")
.append("h1")
.attr("id", "title")
.text("Visualizing Data with Choropleth Map")
.append("h6")
.attr("id", "description")
.text("% OF RESIDENTS OVER AGE 25 WITH BACHELOR'S DEGREE OR HIGHER");

const screenTip = main
.append("div")
.attr("id", "tooltip");

screenTip
.append("div")
.attr("class", "area");

screenTip
.append("div")
.attr("class", "education");

const boxSize = {
legendMargin: 30,
top: 20,
right: 20,
bottom: 20,
left: 20
}

const width = 800 - boxSize.left - boxSize.right;
const height = 400 - boxSize.top - boxSize.bottom;

const svg = main.append("svg")
     .attr("viewBox", `0 0 ${width + boxSize.left + boxSize.right} ${height + boxSize.top + boxSize.bottom}`);

const svgArea = svg.append("g")
          .attr("transform", `translate(${boxSize.left}, ${boxSize.top})`);


const legendValues = {
percentage: [0, 12.5, 25, 37.5, 50, 62.5, 75, 87.5],
//percentage: [3, 12, 21, 30, 39, 48, 57, 66],
color: ["#e3e8fc", "#b4cdfc", "#91b8ff", "#78a6fd", "#5590fd", "#2d76fd", "#1264fd", "#0033ff"],
height: 15,
width: 40
}

const legend = svgArea.append("g")
    .attr("id", "legend")
    .attr("transform", `translate(${width - legendValues.percentage.length * legendValues.width - boxSize.legendMargin}, 0)`);

legend.selectAll("rect")
.data(legendValues.percentage)
.enter()
.append("rect")
.attr("width", legendValues.width - 5)
.attr("height", legendValues.height)
.attr("x", (d, i) => i*legendValues.width)
.attr("y", 0)
.attr("fill", (d, i) => legendValues.color[i])
.select("text")
.data(legendValues.percentage)
.enter()
.append("text")
.attr("x", (d,i) => i*legendValues.width + 5)
.attr("y", legendValues.height*2)
.style("font-size", "0.6rem")
.text((d) => `${d}%`);

const colorScale= d3.scaleQuantize()
.range(legendValues.color);


const educationUrl = "https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json";
const countriesUrl = "https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json";

const request = new XMLHttpRequest();
request.open("GET", educationUrl, true);
request.send();

request.onload = function() {
let json = JSON.parse(request.responseText);
mergeData(json);

function mergeData(data) {

fetch(countriesUrl)
.then((response) => response.json())
.then((json) => {

for(let i = 0; i < data.length; i++) {

let fips = data[i].fips;
let geometries = json.objects.counties.geometries;

for(let j = 0; j < geometries.length; j++) {
let id = geometries[j].id;
if(fips === id) {
geometries[j] = Object.assign({}, geometries[j], data[i]);
break;
}
}
}
return json;
})
.then((json) => drawMap(json));
}

function drawMap(data) {

colorScale.domain([0, d3.max(data.objects.counties.geometries, (d) => d.bachelorsOrHigher)]);

let feature = topojson.feature(data, data.objects.counties);
const path = d3.geoPath();  

svgArea
.selectAll("path")
.data(feature.features)
.enter()
.append("path")
.on("mouseenter", (d,i) => {
screenTip.style("opacity", 1)
.attr("data-fips", data.objects.counties.geometries[i].fips)
.attr("data-education", data.objects.counties.geometries[i].bachelorsOrHigher)
.style("left", `${d3.event.layerX + 5}px`)
.style("top", `${d3.event.layerY + 5}px`);
screenTip.select("div.area")
.text(() => `${data.objects.counties.geometries[i].area_name}, ${data.objects.counties.geometries[i].state}`);
screenTip.select("div.education")
.text(() => `${data.objects.counties.geometries[i].bachelorsOrHigher}%`);
})
.on("mouseout", () => screenTip.style("opacity", 0))
.attr("d", path)
.attr("transform", `scale(0.82, 0.62)`)
.attr("class", "county")
.attr("data-fips", (d, i) => data.objects.counties.geometries[i].fips)
.attr("data-state", (d, i) => data.objects.counties.geometries[i].state)
.attr("data-area", (d, i) => data.objects.counties.geometries[i].area_name)
.attr("data-education", (d, i) => data.objects.counties.geometries[i].bachelorsOrHigher)
.attr("fill", (d, i) => colorScale(data.objects.counties.geometries[i].bachelorsOrHigher));
}
}