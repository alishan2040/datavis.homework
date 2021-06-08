
const width = 1000;
const barWidth = 500;
const height = 500;
const margin = 30;

const yearLable = d3.select('#year');
const countryName = d3.select('#country-name');

const barChart = d3.select('#bar-chart')
            .attr('width', barWidth)
            .attr('height', height);

const scatterPlot  = d3.select('#scatter-plot')
            .attr('width', width)
            .attr('height', height);

const lineChart = d3.select('#line-chart')
            .attr('width', width)
            .attr('height', height);

let xParam = 'fertility-rate';
let yParam = 'child-mortality';
let rParam = 'gdp';
let year = '2000';
let param = 'child-mortality';
let lineParam = 'gdp';
let highlighted = '';
let selected;
const regionArray = ['asia', 'europe', 'africa', 'americas'];
var regionColor = {
	americas: 'rgb(127, 235, 0)',
	europe: 'rgb(255, 231, 0)',
	africa: 'rgb(0, 213, 233)',
	asia: 'rgb(255, 88, 114)'
};

// -1- Create a tooltip div that is hidden by default:
const tooltip = d3.select("#scatter-plot")
tooltip
.append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "black")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .style("color", "white")


// -2- Create 3 functions to show / update (when mouse move but stay on same circle) / hide the tooltip
var showTooltip = function(d) {
    tooltip
    .transition()
    .duration(200)

    tooltip
    .style("opacity", 1)
    .html("Country: " + d.country)
    .style("left", (d3.mouse(this)[0]+30) + "px")
    .style("top", (d3.mouse(this)[1]+30) + "px")
}
var moveTooltip = function(d) {
    tooltip
    .style("left", (d3.mouse(this)[0]+30) + "px")
    .style("top", (d3.mouse(this)[1]+30) + "px")
}
var hideTooltip = function(d) {
    tooltip
    .transition()
    .duration(200)
    .style("opacity", 0)
}

const x = d3.scaleLinear().range([margin*2, width-margin]);
const y = d3.scaleLinear().range([height-margin, margin]);
const xLine = d3.scaleTime().range([margin * 2, width - margin]);
const yLine = d3.scaleLinear().range([height - margin, margin]);

const xBar = d3.scaleBand().range([margin*2, barWidth-margin]).padding(0.1);
const yBar = d3.scaleLinear().range([height-margin, margin])

const xAxis = scatterPlot.append('g').attr('transform', `translate(0, ${height-margin})`);
const yAxis = scatterPlot.append('g').attr('transform', `translate(${margin*2}, 0)`);

const xLineAxis = lineChart.append('g').attr('transform', `translate(0, ${height-margin})`);
const yLineAxis = lineChart.append('g').attr('transform', `translate(${margin*2}, 0)`);

const xBarAxis = barChart.append('g').attr('transform', `translate(0, ${height-margin})`);
const yBarAxis = barChart.append('g').attr('transform', `translate(${margin*2}, 0)`);

const colorScale = d3.scaleOrdinal().range(['#DD4949', '#39CDA1', '#FD710C', '#A14BE5']);
const radiusScale = d3.scaleSqrt().range([10, 30]);

loadData().then(data => {

    colorScale.domain(d3.set(data.map(d=>d.region)).values());

    d3.select('#range').on('change', function(){ 
        year = d3.select(this).property('value');
        yearLable.html(year);
        updateScatterPlot();
        updateBar();
    });

    d3.select('#radius').on('change', function(){ 
        rParam = d3.select(this).property('value');
        updateScatterPlot();
    });

    d3.select('#x').on('change', function(){ 
        xParam = d3.select(this).property('value');
        updateScatterPlot();
    });

    d3.select('#y').on('change', function(){ 
        yParam = d3.select(this).property('value');
        updateScatterPlot();
    });

    d3.select('#param').on('change', function(){ 
        param = d3.select(this).property('value');
        updateBar();
    });

    d3.select('#p').on('change', function () {
        lineParam = d3.select(this).property('value');
        drawLineChart();
    });
    barChart.on('click', onClickAction);

    function toFloat(value){

        return parseFloat(value)
    }


    function updateBar() {
        // which key to use
        var reg = 'region'
        var average = d3.nest().key(data => data[reg])
            .rollup(val => d3.mean(val, data => 
            toFloat(data[param][year]) || 0)).entries(data);
        var xVal = xBar.domain(regionArray);
        var yVal = yBar.domain([0, d3.max(average.map(data => data.value))]);
        xBarAxis.call(d3.axisBottom(xVal));
        yBarAxis.call(d3.axisLeft(yVal));
        barHelper(barChart.selectAll(".bar")
            .data(average).enter().append("rect").on('click', onClickAction), xVal, yVal);
        barHelper(barChart.selectAll(".bar")
            .data(average).transition(), xVal, yVal);
    }

    function updateScatterPlot() {
        // we will update scatter plot
        // according to parameters

        var xVal = x.domain(d3.extent(
            data.map(data => toFloat(data[xParam][year]) || 0)));
        var yVal = y.domain(d3.extent(
            data.map(data => toFloat(data[yParam][year]) || 0)));
        var rVal = radiusScale.domain(
            d3.extent(data.map(data => toFloat(data[rParam][year]) || 0)));
        xAxis.call(d3.axisBottom(xVal));
        yAxis.call(d3.axisLeft(yVal));

        refScatter(scatterPlot.selectAll('circle').data(data).enter().append('circle').on('click', onCircleSelected), xVal, yVal, rVal);
        refScatter(scatterPlot.selectAll('circle').data(data).transition(), xVal, yVal, rVal);
    }

    function onClickAction(cData, i) {
        // First check
        // if clicked data is undefined OR
        // equals to highlighted
        // This method is used by UpdateBar PLot
        if (typeof cData === "undefined" || highlighted === cData.key){
            // Update highlighted first
            highlighted = '';
            // bar chart
            barChart.selectAll('.bar').transition().style('opacity', 1.1);
            //scatter plot
            scatterPlot.selectAll('circle').transition().style('opacity', 0.75);
            
        }
        else{
            highlighted = cData.key;
            barChart.selectAll('.bar').transition()
                .style('opacity', data => data.key === highlighted ? 1.5 : 0.5);

            scatterPlot.selectAll('circle').transition()
                .style('opacity', data => data.region === highlighted ? 0.6 : 0);
        }
        d3.event.stopPropagation();
    }

    // Update Line chart .......
    function drawLineChart() {
        // DRAW A LINE CHART for 5th part

        if(data.findIndex(element => element.country === selected) < 0){
            return;
        } 

        // find index of the selected country from data
        const ind = data.findIndex(element => element.country === selected);
        const item = data[ind][lineParam];
        var data_entries = Object.entries(item).slice(0, -5)
        var xVal = xLine.domain(d3.extent(data_entries.map(dentry => new Date(dentry[0]))));
        var yVal = yLine.domain(d3.extent(data_entries.map(dentry => parseFloat(dentry[1]) || 0)));
        
        // Set params for line chart
        lineChart.selectAll('path').remove();

        // Set country name which is currently selected...
        countryName.html(selected);

        // update
        xLineAxis.call(d3.axisBottom(xVal));
        yLineAxis.call(d3.axisLeft(yVal));
        
        // draw
        lineChart.append('path').datum(data_entries).attr("fill", "none")
            .attr("stroke", "blue").attr("stroke-width", 2.5)
            .attr("d", d3.line().x(data => xVal(new Date(data[0]))).y(data => yVal(parseFloat(data[1]) || 0)))
    }

    // Helper for bar plot
    function barHelper(plot, xVal, yVal) {
        // Set attributes of the selected elements.
        plot.attr("class", "bar").attr("x", data => xVal(data.key))
            .attr("y", data => yVal(data.value)).attr("width", xVal.bandwidth())
            .attr("height", data => height - margin - yVal(data.value))
            .attr('fill', data => colorScale(data.key));
    }

    function refScatter(plot, xVal, yVal, rVal) {

        // set attributes and plot
        plot.attr('r', data => rVal(toFloat(data[rParam][year]) || 0))
            .attr('cx', data => xVal(toFloat(data[xParam][year]) || 0))
            .attr('cy', data => yVal(toFloat(data[yParam][year]) || 0))
            .attr('fill', data => colorScale(data['region']));
            // .attr('fill', data => regionColor(data['region'])); // NOT WORKING
            
    }

    // Helper for scatter plot
    function onCircleSelected(cData, i) {
        // get country from clicked data
        selected = cData.country

        //draw circle
        scatterPlot.selectAll('circle').transition().attr('stroke-width', data => data.country === selected ? 4 : 2);

        d3.select(this).raise();
        
        // Update line chart.......
        drawLineChart();

        
    }

    updateBar();
    updateScatterPlot();
});

// Reading data in asynchronous manner....
async function loadData() {
    const data = { 
        'population': await d3.csv('data/population.csv'),
        'gdp': await d3.csv('data/gdp.csv'),
        'child-mortality': await d3.csv('data/cmu5.csv'),
        'life-expectancy': await d3.csv('data/life_expectancy.csv'),
        'fertility-rate': await d3.csv('data/fertility-rate.csv')
    };
    
    return data.population.map(d=>{
        const index = data.gdp.findIndex(item => item.geo == d.geo);
        return  {
            country: d.country,
            geo: d.geo,
            region: d.region,
            population: d,
            'gdp': data['gdp'][index],
            'child-mortality': data['child-mortality'][index],
            'life-expectancy': data['life-expectancy'][index],
            'fertility-rate': data['fertility-rate'][index]
        }
    })
}