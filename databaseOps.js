const sql = require('mssql');
const fs = require('fs')
const { poolPromise } = require('./db'); // Ensure this path is correct

async function fetchVideoDataById(id) {
    const pool = await poolPromise;
  
    try {
      const query = `SELECT video_data FROM videos WHERE id = @id`;
      const result = await pool.request()
        .input('id', sql.Int, id)
        .query(query);
  
      if (result.recordset.length > 0) {
        return result.recordset[0].video_data;
      } else {
        return null;  // No video found for the given ID
      }
    } catch (err) {
      console.error('Error fetching video data from database:', err);
      throw err;
    }
  }

  async function insertVideoIntoDatabase(title, videoFile, thumbnailFilePath, tags) {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  try { 
    await transaction.begin();

    const videoData = fs.readFileSync(videoFile.path);
    const thumbnailData = fs.readFileSync(thumbnailFilePath); // Read the thumbnail file data

    // Insert the video along with the thumbnail data
    let videoInsertQuery = `INSERT INTO videos (title, video_data, thumbnail_data) VALUES (@title, @videoData, @thumbnailData); SELECT SCOPE_IDENTITY() AS id;`;
    let videoResult = await transaction.request()
      .input('title', sql.VarChar, title)
      .input('videoData', sql.VarBinary(sql.MAX), videoData) // Insert video binary data
      .input('thumbnailData', sql.VarBinary(sql.MAX), thumbnailData) // Insert thumbnail binary data
      .query(videoInsertQuery);

    let videoId = videoResult.recordset[0].id;

    // Insert tags and get their IDs
    let tagIds = [];
    for (const tag of tags) {
      let tagSelectQuery = `SELECT id FROM tags WHERE tag_name = @tagName`;
      let tagResult = await transaction.request()
        .input('tagName', sql.VarChar, tag)
        .query(tagSelectQuery);

      let tagId;
      if (tagResult.recordset.length === 0) {
        // Tag doesn't exist, insert it
        let tagInsertQuery = `INSERT INTO tags (tag_name) VALUES (@tagName); SELECT SCOPE_IDENTITY() AS id;`;
        let insertedTagResult = await transaction.request()
          .input('tagName', sql.VarChar, tag)
          .query(tagInsertQuery);
        tagId = insertedTagResult.recordset[0].id;
      } else {
        // Tag exists
        tagId = tagResult.recordset[0].id;
      }

      tagIds.push(tagId);
    }

    // Associate tags with the video
    for (const tagId of tagIds) {
      let associationInsertQuery = `INSERT INTO video_tags (video_id, tag_id) VALUES (@videoId, @tagId);`;
      await transaction.request()
        .input('videoId', sql.Int, videoId)
        .input('tagId', sql.Int, tagId)
        .query(associationInsertQuery);
    }

    await transaction.commit();
    console.log('Video and tags inserted successfully');
  } catch (err) {
    console.error('Failed to insert video and tags:', err);
    await transaction.rollback();
  }
}

async function fetchVideosFromDatabase(search) {
    const pool = await poolPromise;
  
    try {
      let query;
      if (search) {
        // Query to search in both video titles and tags.
        // This is a basic example and might need adjustments based on your schema and requirements
        query = `
          SELECT DISTINCT v.id, v.title, v.thumbnail_data, STRING_AGG(t.tag_name, ', ') AS tags
          FROM videos v
          LEFT JOIN video_tags vt ON v.id = vt.video_id
          LEFT JOIN tags t ON vt.tag_id = t.id
          WHERE v.title LIKE @search OR t.tag_name LIKE @search
          GROUP BY v.id, v.title, v.thumbnail_data;
        `;
      } else {
        // Query to get all videos if no search term is provided
        query = `
          SELECT v.id, v.title, v.thumbnail_data, STRING_AGG(t.tag_name, ', ') AS tags
          FROM videos v
          LEFT JOIN video_tags vt ON v.id = vt.video_id
          LEFT JOIN tags t ON vt.tag_id = t.id
          GROUP BY v.id, v.title, v.thumbnail_data;
        `;
      }
  
      const videos = await pool.request()
            .input('search', sql.VarChar, `%${search}%`)
            .query(query);

        // Convert thumbnail data to Base64 string
        const formattedVideos = videos.recordset.map(video => ({
            ...video,
            thumbnailData: video.thumbnail_data ? Buffer.from(video.thumbnail_data).toString('base64') : null
        }));

        return formattedVideos;
    } catch (err) {
        console.error('Error fetching videos from database:', err);
        throw err;
    }
}
  
  module.exports = { fetchVideoDataById, insertVideoIntoDatabase, fetchVideosFromDatabase };


