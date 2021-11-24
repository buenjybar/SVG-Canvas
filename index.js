"use strict";
const margin = {top: 30, right: 10, bottom: 0, left: 10}; // px
const leadHeight = 60; // px
const period = 60; // ms

const DISPLAY_SECONDS = 10; // s
const MV_UNIT = 0.001; // mv
const FREQ = 250; // HZ

let y, x, width, height;
let paths, gX, xAxis, gPath, canvases;

function entryPoint(ref, leadNames) {
    width = 800; // px
    height = leadNames.length * (leadHeight + 1) + margin.top + margin.bottom;

    const main = d3.select(ref);

    x = d3.scaleLinear().domain([0, DISPLAY_SECONDS]).range([0, width]);

    y = d3
        .scaleLinear()
        .domain([2 / MV_UNIT, -2 / MV_UNIT])
        .range([0, leadHeight]);

    const svg = main
        .append("svg")
        .style("position", "relative")
        .style("font", "10px sans-serif")
        .attr("width", width)
        .attr("height", height);

    gPath = svg.append("g").attr("transform", `translate(0,${margin.top})`);

    canvases = [];
    const parent = svg.node().parentElement;
    let offset = margin.top;

    for (const leadName of leadNames) {
        const c = document.createElement("canvas");
        parent.appendChild(c);
        const elem = d3
            .select(c)
            .attr("width", width)
            .attr("height", leadHeight)
            .style("pointer-events", "none")
            .style("position", "absolute")
            .style("image-rendering", "pixelated")
            .style("top", `${offset}px`)
            .property("context", function () {
                return this.getContext("2d");
            });
        canvases.push(elem);
        offset += leadHeight;
    }

    paths = gPath.selectAll("path");

    gX = svg.append("g");

    // display line index to the left
    svg
        .append("g")
        .selectAll("text")
        .data(leadNames)
        .join("text")
        .attr("x", 4)
        .attr("y", (d, i) => (i + 0.5) * (leadHeight + 1) + margin.top)
        .attr("dy", "0.35em")
        .text((d) => d);

    const axis = d3
        .axisTop(x)
        .ticks(width / 80)
        .tickSizeOuter(0);

    xAxis = (g) =>
        g
            .attr("transform", `translate(0, ${margin.top})`)
            .call(axis)
            .call((g) =>
                g
                    .selectAll(".tick")
                    .filter((d) => x(d) < margin.left || x(d) >= width - margin.right)
                    .remove()
            )
            .call((g) => g.select(".domain").remove());

    const rule = svg
        .append("line")
        .attr("stroke", "#000")
        .attr("y1", margin.top - 6)
        .attr("y2", height - margin.bottom - 1)
        .attr("x1", 400)
        .attr("x2", 400);

    svg.on("mousemove", (event) => {
        const pointer = d3.pointer(event, svg.node());
        const x = pointer[0] + 0.5;

        // update the cursor coordinates
        rule.attr("x1", x).attr("x2", x);
    });
}

function render(data) {
    const line = d3
        .line()
        .x((_, i) => x(i / FREQ))
        .y((d) => y(d));

    // render points in path
    performance.mark("start-render");
    paths.remove();

    paths = gPath
        .selectAll("path")
        .data(data)
        .enter()
        .append("path")
        .attr("fill", "transparent")
        .attr("stroke", "black")
        .attr("transform", (_, i) => `translate(0, ${i * leadHeight + margin.top})`)

        .attr("d", line);

    performance.mark("end-render");
    performance.measure("render", "start-render", "end-render");

    // update the top scale
    gX.call(xAxis);
}

function renderCanvas(data) {
    // render points in canvas
    performance.mark("start-renderCanvas");
    for (let i = 0; i < data.length; i++) {
        const datElement = data[i];
        const elem = canvases[i];
        drawLine(elem.node(), datElement);
    }
    performance.mark("end-renderCanvas");

    performance.measure("renderCanvas", "start-renderCanvas", "end-renderCanvas");

    // update the top scale
    gX.call(xAxis);
}

function drawLine(canvas, d) {
    const context = canvas.getContext("2d");
    const {length: k} = d;
    // clear canvas
    context.clearRect(0, 0, width, height);

    context.save();
    context.strokeStyle = "#000";
    context.lineWidth = 1;
    context.beginPath();

    context.moveTo(x(0), y(d[0]));
    for (let i = 1; i < k; i++) {
        context.lineTo(x(i / FREQ), y(d[i]));
    }

    context.stroke();
    context.restore();
}

function renderCanvasOptimized(data, step) {
    // render points in canvas
    for (let i = 0; i < data.length; i++) {
        const datElement = data[i];
        const elem = canvases[i];
        drawSubLine(elem.node(), datElement, step);
    }
}

function drawSubLine(canvas, d, step) {
    const context = canvas.getContext("2d");
    const {length: k} = d;
    const idx = k - step - 2;
    const offsetX = x(step / FREQ);

    if (offsetX < width) {
        // copy previous canvas with the offset
        const img = context.getImageData(offsetX, 0, width - offsetX, leadHeight);
        context.clearRect(0, 0, width, leadHeight);
        context.putImageData(img, 0, 0);
    }

    // Important for line
    context.lineCap = "square";

    context.save();
    context.strokeStyle = "#000";
    context.beginPath();
    context.moveTo(x(idx / FREQ), y(d[idx]));

    for (let i = idx; i <= k; i++) {
        context.lineTo(x(i / FREQ), y(d[i]));
    }

    context.stroke();
    context.restore();
}

function drawSubRect(d) {
    const {context} = this;
    const {length: k} = d;

    const idx = k - step;
    const offsetX = x(step);

    if (offsetX < width) {
        // copy previous canvas with the offset
        context.drawImage(
            this,
            offsetX,
            0,
            width - offsetX,
            leadHeight,
            0,
            0,
            width - offsetX,
            leadHeight
        );
    }

    // clear the new
    context.clearRect(width - offsetX, 0, offsetX, leadHeight);

    context.save();
    context.strokeStyle = random_rgba();
    context.fillStyle = random_rgba();

    context.fillRect(width - offsetX, 0, offsetX, leadHeight);
    // context.beginPath();

    // context.moveTo(x(idx), y(d[idx]));
    // for (let i = idx; i < k; i++) {
    //     context.lineTo(x(i), y(d[i]));
    // }

    // context.stroke();
    context.restore();
}

function computeAvg() {
    const marks1 = performance.getEntriesByName("render");
    const avg1 = average(marks1);

    const marks2 = performance.getEntriesByName("renderCanvas");
    const avg2 = average(marks2);

    console.log(
        "avg, render: ",
        marks1.length,
        " entries - ",
        (avg1 || 0).toFixed(2),
        "ms",
        (1000 / (avg1 || 10000)).toFixed(2),
        "fps"
    );

    console.log(
        "avg, renderCanvas:",
        marks2.length,
        " entries - ",
        (avg2 || 0).toFixed(2),
        "ms",
        (1000 / (avg2 || 10000)).toFixed(2),
        "fps"
    );
}

const average = (array) =>
    array.reduce((a, b) => a + b.duration, 0) / array.length;
