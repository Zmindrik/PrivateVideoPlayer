// Import express into your file
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const upload = multer({ dest: 'uploads/' });
const { poolPromise } = require('./db');
const { fetchVideoDataById, insertVideoIntoDatabase, fetchVideosFromDatabase } = require('./databaseOps');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
require('dotenv').config({ path: './database.env' });

// Create an instance of express
const app = express();
app.use(express.json()); 

const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/api', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(cors());  // Enable CORS for all routes

// Define a port number
const port = 3000;

app.get('/videos', async (req, res) => {
    try {
      const { search } = req.query;
      const videos = await fetchVideosFromDatabase(search);
      res.json(videos);
    } catch (err) {
      res.status(500).send('Error fetching videos');
    }
  });
  
  app.get('/video/:id', async (req, res) => {
    try {
      const { id } = req.params;
      // Fetch the video data from the database based on the ID
      const videoData = await fetchVideoDataById(id);
      if (videoData) {
        res.writeHead(200, {
          'Content-Type': 'video/mp4', // Adjust based on your video format
          'Content-Length': videoData.length
        });
        res.end(videoData);
      } else {
        res.status(404).send('Video not found');
      }
    } catch (err) {
      res.status(500).send(err.message);
    }
  });

  app.post('/upload-video', upload.single('video'), async (req, res) => {
    try {
      const videoFile = req.file;
      const tagsString = req.body.tags; 
      const tags = tagsString ? tagsString.split(',') : [];

      if (!videoFile) {
        return res.status(400).send('No video file uploaded.');
      }
  
      const videoTitle = extractTitleFromVideo(videoFile);
  
      // Insert into your database (you need to implement this function)
      await insertVideoIntoDatabase(videoTitle, videoFile, tags);
  
      res.status(200).send('Video uploaded successfully.');
    } catch (err) {
      res.status(500).send('Error uploading video: ' + err.message);
    }
  });

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  function extractTitleFromVideo(videoFile) {
    return videoFile.originalname.split('.')[0];
  }
  
