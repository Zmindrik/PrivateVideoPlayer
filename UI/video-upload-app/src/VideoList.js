import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './VideoList.css';

function VideoList() {
  const [videos, setVideos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/videos?search=${searchTerm}`);
      setVideos(response.data);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchVideos();
  };

  const handleTitleClick = async (id) => {
    try {
      const response = await axios.get(`http://localhost:3000/video/${id}`, { responseType: 'blob' });
      const videoBlob = new Blob([response.data], { type: 'video/mp4' });
      const videoUrl = URL.createObjectURL(videoBlob);
      setCurrentVideoUrl(videoUrl);
    } catch (error) {
      console.error('Error fetching video:', error);
    }
  };

  return (
    <div className="video-list-container">
      <div className="search-bar">
        <form onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder="Search videos"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <button type="submit">Search</button>
        </form>
      </div>

      <div className="video-grid">
        {videos.map(video => (
          <div key={video.id} className="video-item">
            {video.thumbnailData && (
              <img src={`data:image/png;base64,${video.thumbnailData}`} alt={video.title} />
            )}
            <h3 onClick={() => handleTitleClick(video.id)}>{video.title}</h3>
            <p>Tags: {video.tags}</p>
          </div>
        ))}
      </div>

      {currentVideoUrl && (
        <div className="video-player">
          <video controls src={currentVideoUrl} onContextMenu={(e) => e.preventDefault()} />
        </div>
      )}
    </div>
  );
}

export default VideoList;
