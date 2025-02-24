import './style.css';
import './gantt.css';
// import typescriptLogo from './typescript.svg';
// import viteLogo from '/vite.svg';
import { setupCounter } from './counter.ts';
import { BarGraph, ChartGraphData } from './gantt/HorizontalChart.ts';

const data2: ChartGraphData = [
  { task: 'Task A', start: new Date(2025, 1, 1), end: new Date(2025, 1, 3), color: '#ff6b6b' },
  { task: 'Task B', start: new Date(2025, 1, 3), end: new Date(2025, 1, 5), color: '#4ecdc4' },
  { task: 'Task C', start: new Date(2025, 1, 1), end: new Date(2025, 1, 10), color: '#45b7d1' },
  { task: 'Task D', start: new Date(2025, 2, 1), end: new Date(2025, 2, 4), color: '#ff0' },
  { task: 'Task E', start: new Date(2025, 1, 11), end: new Date(2025, 1, 21), color: '#ffeead' }
];

const divSelector = document.querySelector<HTMLDivElement>('#gantt')!;

const { setupGraph, updateChart } = BarGraph(1500, 400);

setupGraph(divSelector, data2);
// updateChart(data2);

// ==================================
// ==================================

// document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
//   <div>
//     <a href="https://vite.dev" target="_blank">
//       <img src="${viteLogo}" class="logo" alt="Vite logo" />
//     </a>
//     <a href="https://www.typescriptlang.org/" target="_blank">
//       <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
//     </a>
//     <h1>Vite + TypeScript</h1>
//     <div class="card">
//       <button id="counter" type="button"></button>
//     </div>
//     <p class="read-the-docs">
//       Click on the Vite and TypeScript logos to learn more
//     </p>
//   </div>
// `;

// setupCounter(document.querySelector<HTMLButtonElement>('#counter')!);
