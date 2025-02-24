import * as d3 from 'd3';

type DataType = {
    name: string;
    value: number;
    color: string;
};

type GanttData = {
    id: number;
    task: string;
    start: Date;
    end: Date;
    color: string;
    dependencies?: number[];
};

type DependencyLine = {
    sourceTask: GanttData;
    targetTask: GanttData;
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

        // Create SVG container, root svg
        svg = d3
            .select(selector)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Define a clip path for the zoomable chart area (for the bars only)
        svg
            .append('defs')
            .append('clipPath')
            .attr('id', 'chart-clip')
            .append('rect')
            .attr('width', width)
            .attr('height', height);

        // Compute scales first
        const minStart = d3.min(chartData, d => d.start) as Date;
        const maxEnd = d3.max(chartData, d => d.end) as Date;

        // x axis: time scale
        x = d3.scaleTime()
            .domain([minStart, maxEnd])
            .range([0, width]);

        // y axis: tasks
        y = d3.scaleBand()
            .domain(chartData.map(d => d.task))
            .range([0, height])
            .padding(0.1);

        // Create a tooltip element (hidden by default)
        const tooltip = d3
            .select('body')
            .append('div')
            .attr('class', 'tooltip')
            .style('position', 'absolute')
            .style('background', '#fff')
            .style('padding', '5px')
            .style('border', '1px solid #ccc')
            .style('border-radius', '4px')
            .style('pointer-events', 'none')
            .style('opacity', 0);

        // Create a group for zoomable content (bars and x-axis)
        // This group will be clipped to the chart area.
        const chartGroup = svg.append('g')
            .attr('class', 'chart-group')
            .attr('clip-path', 'url(#chart-clip)');

        // Draw the bars in the zoomable group using the defined scales
        chartGroup
            .selectAll('.gantt-bar')
            .data(chartData)
            .enter()
            .append('rect')
            .attr('class', 'gantt-bar')
            .attr('x', d => x(d.start))
            .attr('y', d => y(d.task) as number)
            .attr('width', d => x(d.end) - x(d.start))
            .attr('height', y.bandwidth())
            .attr('fill', d => d.color)
            .attr('stroke', 'white')
            .on('mouseover', (_event, d) => {
                tooltip
                    .style('opacity', 1)
                    .html(`
                        <strong>${d.task}</strong><br>
                        Start: ${d.start.toLocaleDateString()}<br>
                        End: ${d.end.toLocaleDateString()}
                    `);
            })
            .on('mousemove', (event, _d) => {
                tooltip
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY + 10) + 'px');
            })
            .on('mouseout', (_event, _d) => {
                tooltip.style('opacity', 0);
            });

        // Create a group for dependency lines (placed behind the bars)
        const dependencyGroup = chartGroup.append('g')
            .attr('class', 'dependency-lines');

        // Prepare dependency data: for each task that has dependencies,
        // find the corresponding source task in chartData.
        const dependencyData: DependencyLine[] = [];

        chartData.forEach(task => {
            if (task.dependencies) {
                task.dependencies.forEach(depTaskId => {
                    const sourceTask = chartData.find(t => t.id === depTaskId);
                    if (sourceTask) {
                        dependencyData.push({
                            sourceTask,
                            targetTask: task
                        });
                    }
                });
            }
        });

        // Draw dependency lines
        dependencyGroup.selectAll('.dependency-line')
            .data(dependencyData)
            .enter()
            .append('path')
            .attr('class', 'dependency-line')
            .attr('fill', 'none')
            .attr('stroke', 'black')
            .attr('stroke-width', 1)
            .attr('marker-end', 'url(#arrow)')
            .attr('d', d => {
                const sourceX = x(d.sourceTask.end);
                const sourceY = (y(d.sourceTask.task) as number) + y.bandwidth() / 2;
                const targetX = x(d.targetTask.start);
                const targetY = (y(d.targetTask.task) as number) + y.bandwidth() / 2;
                const midX = sourceX + (targetX - sourceX) / 2;
                return `M ${sourceX} ${sourceY} L ${midX} ${sourceY} L ${midX} ${targetY} L ${targetX} ${targetY}`;
            });

        // Create the x-axis in its own group (outside of the clipped group)
        const xAxisGroup = svg.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0, ${height})`)
            .call(d3.axisBottom(x).tickSize(-height));
        // .call(d3.axisBottom(x));

        // Style the vertical grid lines as light gray dotted lines
        xAxisGroup.selectAll('line')
            .attr('stroke', 'lightgray')
            .attr('stroke-dasharray', '4,2');

        // Create the y-axis in its own group so it remains fixed
        svg
            .append('g')
            .attr('class', 'y-axis')
            .call(d3.axisLeft(y));

        const zoom = d3.zoom<SVGGElement, unknown>()
            .scaleExtent([0.5, 5])
            .on("zoom", (event) => {
                // Get the transformed x scale
                const newXScale = event.transform.rescaleX(x);

                // Update the x-axis in its separate group (so tick labels are not clipped)
                // xAxisGroup.call(d3.axisBottom(newXScale));
                xAxisGroup.call(d3.axisBottom(newXScale).tickSize(-height));
                xAxisGroup.selectAll('line')
                    .attr('stroke', 'lightgray')
                    .attr('stroke-dasharray', '4,2');

                // Update the bars in the chartGroup
                chartGroup.selectAll<SVGRectElement, GanttData>('.gantt-bar')
                    .attr('x', d => newXScale(d.start))
                    .attr('width', d => newXScale(d.end) - newXScale(d.start));

                // Update dependency lines (only the x coordinates change)
                // dependencyGroup.selectAll<SVGLineElement, DependencyLine>('.dependency-line')
                //     .attr('x1', d => newXScale(d.sourceTask.end))
                //     .attr('x2', d => newXScale(d.targetTask.start));

                dependencyGroup.selectAll<SVGPathElement, DependencyLine>('.dependency-line')
                    .attr('d', d => {
                        const sourceX = newXScale(d.sourceTask.end);
                        const sourceY = (y(d.sourceTask.task) as number) + y.bandwidth() / 2;
                        const targetX = newXScale(d.targetTask.start);
                        const targetY = (y(d.targetTask.task) as number) + y.bandwidth() / 2;
                        const midX = sourceX + (targetX - sourceX) / 2;
                        return `M ${sourceX} ${sourceY} L ${midX} ${sourceY} L ${midX} ${targetY} L ${targetX} ${targetY}`;
                    });
            });

        // Apply the zoom behavior to the SVG container
        svg.call(zoom);
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
