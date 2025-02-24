import * as d3 from 'd3';

type DataType = {
    name: string;
    value: number;
    color: string;
};

type GanttData = {
    task: string;
    start: Date;
    end: Date;
    color: string;
};

export type ChartGraphData = GanttData[];

type GanttChartConfig = {
    margin?: { top: number; right: number; bottom: number; left: number; };
    width?: number;
    height?: number;
};

export const BarGraph = function (grossWidth: number, grossHeight: number) {
    let margin = { top: 20, right: 20, bottom: 30, left: 40 };
    // TODO - sacar esto a argumentos
    let width = grossWidth - margin.left - margin.right;
    let height = grossHeight - margin.top - margin.bottom;

    let svg: d3.Selection<SVGGElement, unknown, null, undefined>;
    // let x: d3.ScaleBand<string>;
    // let y: d3.ScaleLinear<number, number>;
    let x: d3.ScaleTime<number, number>;
    let y: d3.ScaleBand<string>;

    const setupGraph = (
        selector: HTMLDivElement,
        chartData: ChartGraphData,
        config?: GanttChartConfig
    ) => {
        if (config) {
            margin = config.margin || margin;
            width = config.width || width;
            height = config.height || height;
        }

        // Clear previous contents
        d3.select(selector).selectAll('*').remove();

        // Create SVG container
        // root svg
        svg = d3
            .select(selector)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Determine the time domain for the x-axis
        const minStart = d3.min(chartData, d => d.start) as Date;
        const maxEnd = d3.max(chartData, d => d.end) as Date;

        // x axis: time scale
        x = d3.scaleTime()
            .domain([minStart, maxEnd])
            .range([0, width]);

        // x axis
        // x = d3
        //     .scaleBand()
        //     .range([0, width])
        //     .padding(0.1)
        //     .domain(graphData.map((d) => d.name));

        // y axis: tasks
        y = d3.scaleBand()
            .domain(chartData.map(d => d.task))
            .range([0, height])
            .padding(0.1);

        // y axis
        // y = d3
        //     .scaleLinear()
        //     .range([height, 0])
        //     .domain([0, d3.max(graphData, (d) => d.value + 10) || 0]);

        // Draw x-axis at the bottom
        svg
            .append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x));
        // .style('stroke-width', 2);

        // Draw y-axis on the left
        svg
            .append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(y));
        // .style('stroke-width', 2);

        // Draw Gantt bars for each task
        svg.selectAll('.gantt-bar')
            .data(chartData)
            .enter()
            .append('rect')
            .attr('class', 'gantt-bar')
            .attr('x', d => x(d.start))
            .attr('y', d => y(d.task) as number)
            .attr('width', d => x(d.end) - x(d.start))
            .attr('height', y.bandwidth())
            .attr('fill', d => d.color)
            .attr('stroke', 'white');
    };

    const updateChart = (newData: ChartGraphData) => {
        // Update x domain based on new data
        const minStart = d3.min(newData, d => d.start) as Date;
        const maxEnd = d3.max(newData, d => d.end) as Date;
        x.domain([minStart, maxEnd]);
        y.domain(newData.map(d => d.task));

        // Update axes
        svg.select<SVGGElement>('.x-axis')
            .transition()
            .duration(750)
            .call(d3.axisBottom(x));
        svg.select<SVGGElement>('.y-axis')
            .transition()
            .duration(750)
            .call(d3.axisLeft(y));

        // Bind new data to bars
        const bars = svg.selectAll<SVGRectElement, GanttData>('.gantt-bar')
            .data(newData);

        // Remove old bars
        bars.exit()
            .transition()
            .duration(750)
            .attr('width', 0)
            .remove();

        // Add new bars if necessary
        bars.enter()
            .append('rect')
            .attr('class', 'gantt-bar')
            .attr('x', d => x(d.start))
            .attr('y', d => y(d.task) as number)
            .attr('height', y.bandwidth())
            .attr('fill', d => d.color)
            .attr('stroke', 'white')
            .attr('width', 0)
            .merge(bars)
            .transition()
            .duration(750)
            .attr('x', d => x(d.start))
            .attr('y', d => y(d.task) as number)
            .attr('width', d => x(d.end) - x(d.start))
            .attr('height', y.bandwidth())
            .attr('fill', d => d.color);
    };


    return { setupGraph, updateChart };
};
