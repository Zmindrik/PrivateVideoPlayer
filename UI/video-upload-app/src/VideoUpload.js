import React, { useState } from 'react';
import axios from 'axios';
import './VideoUpload.css'; // Make sure this path is correct

function VideoUpload() {
  const [video, setVideo] = useState(null);
  const [tags, setTags] = useState('');

  const handleVideoChange = (event) => {
    setVideo(event.target.files[0]);
  };

  const handleTagsChange = (event) => {
    setTags(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append('video', video);
    formData.append('tags', tags);  // Assuming tags are a comma-separated string

    try {
      const response = await axios.post('http://localhost:3000/upload-video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log(response.data);
      alert('Video uploaded successfully!');
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Error uploading video.');
    }
  };

  return (
    <div className="upload-container">
      <h2>Upload a Video</h2>
      <form onSubmit={handleSubmit} className="upload-form">
        <input type="file" accept="video/*" onChange={handleVideoChange} />
        <input type="text" placeholder="Enter tags (comma-separated)" onChange={handleTagsChange} />
        <button type="submit">Upload Video</button>
      </form>
    </div>
  );
}

export default VideoUpload;
