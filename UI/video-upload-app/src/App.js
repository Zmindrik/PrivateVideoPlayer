import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import VideoUpload from './VideoUpload';
import VideoList from './VideoList'; // Make sure you have this component
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <nav>
          <ul>
            <li>
              <Link to="/">Upload Video</Link>
            </li>
            <li>
              <Link to="/list">Video List</Link>
            </li>
          </ul>
        </nav>

        <Routes> {/* Use 'Routes' instead of 'Switch' */}
          <Route path="/list" element={<VideoList />} />
          <Route path="/" element={<VideoUpload />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
