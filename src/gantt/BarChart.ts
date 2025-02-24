import * as d3 from 'd3';
// import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const date = new Date(); // current date
const unixTimestampInMilliseconds = date.getTime(); // milliseconds
const unixTimestampInSeconds = Math.floor(date.getTime() / 1000); // seconds
console.log(unixTimestampInSeconds);

const x = new Date();
const numberOfDatys = 2;
x.setDate(x.getDate() + numberOfDatys);

type DataType = {
    name: string;
    value: number;
    color: string;
};

export type BarGraphData = DataType[];

type BarGraphConfig = {
    margin?: { top: number; right: number; bottom: number; left: number; };
    width?: number;
    height?: number;
};





class TaskBar {
    private margin = { top: 20, right: 20, bottom: 30, left: 40 };
    private width = 600 - this.margin.left - this.margin.right;
    private height = 400 - this.margin.top - this.margin.bottom;

    private svg: d3.Selection<SVGGElement, unknown, null, undefined>;
    private x: d3.ScaleBand<string>;
    private y: d3.ScaleLinear<number, number>;

    constructor(
        selector: HTMLDivElement,
        graphData: BarGraphData,
        config?: BarGraphConfig
    ) {
        // root svg
        this.svg = d3
            .select(selector)
            .append('svg')
            .attr('width', this.width + this.margin.left + this.margin.right)
            .attr('height', this.height + this.margin.top + this.margin.bottom)
            .append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        // x axis
        this.x = d3
            .scaleBand()
            .range([0, this.width])
            .padding(0.1)
            .domain(graphData.map((d) => d.name));

        // y axis
        this.y = d3
            .scaleLinear()
            .range([this.height, 0])
            .domain([0, d3.max(graphData, (d) => d.value + 10) || 0]);

        // draw x axis
        this.svg
            .append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${this.height})`)
            .call(d3.axisBottom(this.x))
            .style('stroke-width', 2);

        // draw y axis
        this.svg
            .append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(this.y))
            .style('stroke-width', 2);

        // colors
        const defs = this.svg.append('defs');
        graphData.forEach(({ color }, i) => {
            const pattern = defs
                .append('pattern')
                .attr('id', `line-pattern-${i}`)
                .attr('patternUnits', 'userSpaceOnUse')
                .attr('width', 10)
                .attr('height', 10)
                .attr('patternTransform', 'rotate(45)');

            // Add the line to the pattern
            pattern
                .append('line')
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', 0)
                .attr('y2', 10)
                .attr('stroke', color)
                .attr('stroke-width', 5);
        });

        // bars
        this.svg
            .selectAll('.bar')
            .data(graphData)
            .enter()
            .append('path')
            .attr('d', (d) => {
                const xPos = this.x(d.name) || 0;
                const yPos = this.y(d.value);
                const width = this.x.bandwidth();
                const subHeight = this.height - this.y(d.value);
                const radius = 5; // radius for top corners

                return `
            M ${xPos + radius} ${yPos}
            Q ${xPos} ${yPos} ${xPos} ${yPos + radius}
            L ${xPos} ${yPos + subHeight}
            L ${xPos + width} ${yPos + subHeight}
            L ${xPos + width} ${yPos + radius}
            Q ${xPos + width} ${yPos} ${xPos + width - radius} ${yPos}
            L ${xPos + radius} ${yPos}
            Z
        `;
            })
            .attr('class', 'bar')
            .style('fill', (d, i) => {
                return `url(#line-pattern-${i})`;
            })
            .style('stroke', 'white')
            .style('stroke-width', 2);


        //DRAW ARROWS

        // 1. Define an arrow marker in your defs
        this.svg.select("defs")
            .append("marker")
            .attr("id", "arrow")
            .attr("viewBox", "0 0 10 10")
            .attr("refX", 5)
            .attr("refY", 5)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,0 L10,5 L0,10 L4,5 Z") // arrow shape
            .attr("fill", "#000");

        // 2. Compute coordinates for the first two bars (for example)
        // Assume graphData[0] and graphData[1] exist and “start” means the top-left corner of the bar.
        const bar0 = graphData[0];
        const bar1 = graphData[1];

        const x0 = (this.x(bar0.name) || 0); // x position of first bar
        const x1 = (this.x(bar1.name) || 0); // x position of second bar

        const y0 = this.y(bar0.value); // top of first bar
        const y1 = this.y(bar1.value); // top of second bar

        // Optionally, adjust the x coordinate if you need to account for a left margin within the bar,
        // e.g. add a constant offset if your "start" should be further inside the bar.
        const offset = 5; // example offset
        const startX0 = x0 + offset;
        const startX1 = x1 + offset;

        // 3. Append a line connecting these points and attach the arrow marker at the end
        this.svg.append("line")
            .attr("x1", startX0)
            .attr("y1", y0)
            .attr("x2", startX1)
            .attr("y2", y1)
            .attr("stroke", "black")
            .attr("stroke-width", 2)
            .attr("marker-end", "url(#arrow)");


    }

}




// ======================

export const BarGraph = function () {
    let margin = { top: 20, right: 20, bottom: 30, left: 40 };
    let width = 600 - margin.left - margin.right;
    let height = 400 - margin.top - margin.bottom;

    let svg: d3.Selection<SVGGElement, unknown, null, undefined>;
    let x: d3.ScaleBand<string>;
    let y: d3.ScaleLinear<number, number>;

    const setupGraph = (
        selector: HTMLDivElement,
        graphData: BarGraphData,
        config?: BarGraphConfig
    ) => {
        if (config) {
            margin = config.margin || margin;
            width = config.width || width;
            height = config.height || height;
        }

        d3.select(selector).selectAll('*').remove();

        // root svg
        svg = d3
            .select(selector)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // x axis
        x = d3
            .scaleBand()
            .range([0, width])
            .padding(0.1)
            .domain(graphData.map((d) => d.name));

        // y axis
        y = d3
            .scaleLinear()
            .range([height, 0])
            .domain([0, d3.max(graphData, (d) => d.value + 10) || 0]);

        // draw x axis
        svg
            .append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .style('stroke-width', 2);

        // draw y axis
        svg.append('g').attr('class', 'y-axis').call(d3.axisLeft(y)).style('stroke-width', 2);

        // colors
        const defs = svg.append('defs');
        graphData.forEach(({ color }, i) => {
            const pattern = defs
                .append('pattern')
                .attr('id', `line-pattern-${i}`)
                .attr('patternUnits', 'userSpaceOnUse')
                .attr('width', 10)
                .attr('height', 10)
                .attr('patternTransform', 'rotate(45)');

            // Add the line to the pattern
            pattern
                .append('line')
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', 0)
                .attr('y2', 10)
                .attr('stroke', color)
                .attr('stroke-width', 5);
        });

        // bars
        svg
            .selectAll('.bar')
            .data(graphData)
            .enter()
            .append('path')
            .attr('d', (d) => {
                const xPos = x(d.name) || 0;
                const yPos = y(d.value);
                const width = x.bandwidth();
                const subHeight = height - y(d.value);
                const radius = 5; // radius for top corners

                return `
            M ${xPos + radius} ${yPos}
            Q ${xPos} ${yPos} ${xPos} ${yPos + radius}
            L ${xPos} ${yPos + subHeight}
            L ${xPos + width} ${yPos + subHeight}
            L ${xPos + width} ${yPos + radius}
            Q ${xPos + width} ${yPos} ${xPos + width - radius} ${yPos}
            L ${xPos + radius} ${yPos}
            Z
        `;
            })
            .attr('class', 'bar')
            .style('fill', (d, i) => {
                return `url(#line-pattern-${i})`;
            })
            .style('stroke', 'white')
            .style('stroke-width', 2);
    };

    const updateGraph = (newData: BarGraphData) => {
        // update domains
        x.domain(newData.map((d) => d.name));
        y.domain([0, d3.max(newData, (d) => d.value + 10) || 0]);

        // update axes
        svg.select<SVGGElement>('.x-axis').transition().duration(750).call(d3.axisBottom(x));
        svg.select<SVGGElement>('.y-axis').transition().duration(750).call(d3.axisLeft(y));

        // remove old bars
        const bars = svg.selectAll<SVGPathElement, DataType>('.bar').data(newData);
        bars.exit().transition().duration(750).attr('height', 0).attr('y', height).remove();

        // add new bars
        const newBars = bars.enter().append('path').attr('class', 'bar');

        // update the bars
        bars
            .merge(newBars)
            .transition()
            .duration(750)
            .attr('d', (d) => {
                const xPos = x(d.name) || 0;
                const yPos = y(d.value);
                const width = x.bandwidth();
                const subHeight = height - y(d.value);
                const radius = 5; // radius for top corners

                return `
            M ${xPos + radius} ${yPos}
            Q ${xPos} ${yPos} ${xPos} ${yPos + radius}
            L ${xPos} ${yPos + subHeight}
            L ${xPos + width} ${yPos + subHeight}
            L ${xPos + width} ${yPos + radius}
            Q ${xPos + width} ${yPos} ${xPos + width - radius} ${yPos}
            L ${xPos + radius} ${yPos}
            Z
        `;
            })
            .attr('class', 'bar')
            .style('fill', (d, i) => {
                return `url(#line-pattern-${i})`;
            })
            .style('stroke', 'white')
            .style('stroke-width', 2);
    };

    return {
        setupGraph,
        updateGraph
    };
};
