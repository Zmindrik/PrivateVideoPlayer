const sql = require('mssql');
const fs = require('fs')
const { poolPromise } = require('./db'); // Ensure this path is correct

async function insertVideoIntoDatabase(title, videoFile, tags) {
  const pool = await poolPromise;
  const transaction = new sql.Transaction(pool);

  try { 
    await transaction.begin();

    const videoData = fs.readFileSync(videoFile.path);

    // Insert the video
    let videoInsertQuery = `INSERT INTO videos (title, video_data) VALUES (@title, @videoData); SELECT SCOPE_IDENTITY() AS id;`;
    let videoResult = await transaction.request()
      .input('title', sql.VarChar, title)
      .input('videoData', sql.VarBinary(sql.MAX), videoData) // Insert binary data
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

module.exports = { insertVideoIntoDatabase };
