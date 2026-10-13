import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

const jobs = [
  { id: 1, name: 'Research Agent', status: 'working', progress: 72 },
  { id: 2, name: 'Script Agent', status: 'queued', progress: 20 },
  { id: 3, name: 'Video Agent', status: 'idle', progress: 0 },
];

function App() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>AI Agency</h1>
        <ul>
          {jobs.map((job) => (
            <li key={job.id} className={`job ${job.status}`}>
              <span>{job.name}</span>
              <div className="progress-bar"><div style={{ width: `${job.progress}%` }} /></div>
            </li>
          ))}
        </ul>
      </aside>

      <main className="panel">
        <div className="hero">
          <div className="orb orb-a" />
          <div className="orb orb-b" />
          <div className="orb orb-c" />
        </div>

        <section className="card">
          <h2>Pipeline status</h2>
          <p>Local-first production flow active. Messages routed through the orchestrator to desktop rendering tasks.</p>
        </section>
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
