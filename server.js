// Import express into your file
const express = require('express');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { poolPromise } = require('./db');
const { insertVideoIntoDatabase } = require('./databaseOps');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
require('dotenv').config({ path: './database.env' });

// Create an instance of express
const app = express();
app.use(express.json()); 

const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/api', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Define a port number
const port = 3000;

app.get('/', async (req, res) => {
    try {
      const pool = await poolPromise;
      const result = await pool.request()
        .query('SELECT DB_NAME() AS dbName'); // Query to get the database name
      res.send(`Connected to database: ${result.recordset[0].dbName}`);
    } catch (err) {
      res.status(500);
      res.send(err.message);
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
  
