import { ChangeEvent, useEffect, useRef, useState } from 'react';
import './MainPage.css';
import * as d3 from 'd3';
import { Edge, Node } from '../common/common';

export function MainPage() {

    const graphContainerRef = useRef<SVGSVGElement>(null)
    const simulationRef = useRef<any>(null);
    const [edges, setEdges] = useState('')

    const handleEdgesChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        setEdges(event.target.value)
    }

    useEffect(() => {
        if (!graphContainerRef.current) return;

        const width = graphContainerRef.current.clientWidth, height = graphContainerRef.current.clientHeight, margin = 20;
        const nodeRadius = 20;

        const svg = d3.select(graphContainerRef.current)
            .attr('width', width)
            .attr('height', height);

        let edgesGroup: any = svg.select('.edges');
        if (edgesGroup.empty()) {
            edgesGroup = svg.append('g').attr('class', 'edges');
        }

        let nodesGroup: any = svg.select('.nodes');
        if (nodesGroup.empty()) {
            nodesGroup = svg.append('g').attr('class', 'nodes');
        }

        let nodeSet = new Set<Node>();
        let edgeSet = new Set<Edge>();

        edges.split('\n').forEach(edge => {
            const numOfInputs = edge.split(' ').length;
            if (numOfInputs !== 2 && numOfInputs !== 3) return;

            const [from, to, weight] = edge.split(' ');

            if (from) nodeSet.add(from);
            if (to) nodeSet.add(to);
            edgeSet.add({ from, to, weight });
        });

        let nodesArray = Array.from(nodeSet).map((node) => ({
            id: node,
        }));

        let edgesArray = Array.from(edgeSet).map(edge => ({
            source: edge.from,
            target: edge.to,
            weight: edge?.weight
        }));

        const validEdgesArray = edgesArray.filter(edge => nodeSet.has(edge.source) && nodeSet.has(edge.target));

        if (!simulationRef.current) {
            simulationRef.current = d3.forceSimulation(nodesArray as any)
                .force('charge', d3.forceManyBody().strength(-50))
                .force('center', d3.forceCenter(width / 2, height / 2))
                .force('link', d3.forceLink(validEdgesArray).distance(100).id((d: any) => d.id))
                .on('tick', ticked);
        } else {
            const simulation = simulationRef.current;
            simulation.nodes(nodesArray as any);
            simulation.force('link').links(validEdgesArray);
            simulation.alpha(1).restart();
        }

        const lines = edgesGroup.selectAll('line')
            .data(validEdgesArray);

        lines.exit().remove();

        lines.enter()
            .append('line')
            .attr('class', 'edge')
            .attr('stroke', 'black')
            .attr('stroke-width', 2)
            .merge(lines as any);

        const node = nodesGroup.selectAll('.node')
            .data(nodesArray, (d: any) => d.id);

        node.exit().remove();

        const nodeEnter = node.enter()
            .append('g')
            .attr('class', 'node')
            .call(d3.drag<any, any>()
                .on('start', dragStarted)
                .on('drag', dragged)
                .on('end', dragEnded)
            );

        nodeEnter.append('circle')
            .attr('r', nodeRadius)
            .attr('fill', 'white')
            .attr('stroke', 'black')
            .attr('stroke-width', 3);

        nodeEnter.append('text')
            .text((d: any) => d.id)
            .attr('text-anchor', 'middle')
            .attr('dy', '.35em')
            .style('pointer-events', 'none');

        nodeEnter.merge(node as any);

        function ticked() {
            svg.selectAll('.node')
                .attr('transform', (d: any) => `translate(${d.x},${d.y})`);

            svg.selectAll('line')
                .attr('x1', (d: any) => d.source.x)
                .attr('y1', (d: any) => d.source.y)
                .attr('x2', (d: any) => d.target.x)
                .attr('y2', (d: any) => d.target.y);
        }

        function dragStarted(event: any, d: any) {
            if (!event.active) simulationRef.current.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event: any, d: any) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragEnded(event: any, d: any) {
            if (!event.active) simulationRef.current.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

    }, [edges])

    return (
        <div className="main-page">
            <svg ref={graphContainerRef} className="graph-container"></svg>
            <div className="text-box">
                <textarea className="text-input" placeholder="Enter graph edges" value={edges} onChange={handleEdgesChange} ></textarea>
            </div>
            <div className="controls"></div>
        </div>
    );
}

export default MainPage;