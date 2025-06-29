const request = require('supertest');
const express = require('express');
const photosRouter = require('../routes/photos');
const Photo = require('../models/Photo');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/photos', photosRouter);

// Mock auth middleware
jest.mock('../middleware/auth', () => {
  return (req, res, next) => {
    req.user = {
      uid: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
    };
    next();
  };
});

describe('Photos API', () => {
  beforeEach(async () => {
    // Clear photos collection
    await Photo.deleteMany({});
  });

  describe('GET /api/photos', () => {
    it('should return empty array when no photos exist', async () => {
      const response = await request(app)
        .get('/api/photos')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.files).toEqual([]);
    });

    it('should return user photos', async () => {
      // Create test photo
      await Photo.create({
        filename: 'test-photo.jpg',
        uploadedBy: 'test-user-id',
        favoriteBy: [],
        trashBy: [],
        sharedWith: [],
      });

      const response = await request(app)
        .get('/api/photos')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.files).toHaveLength(1);
      expect(response.body.files[0].name).toBe('test-photo.jpg');
    });
  });

  describe('POST /api/photos/upload', () => {
    it('should return 400 when no file uploaded', async () => {
      const response = await request(app)
        .post('/api/photos/upload')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(400);
      expect(response.body.msg).toBe('No file uploaded');
    });
  });

  describe('GET /api/photos/trash', () => {
    it('should return empty array when no trashed photos exist', async () => {
      const response = await request(app)
        .get('/api/photos/trash')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.files).toEqual([]);
    });

    it('should return trashed photos', async () => {
      // Create test photo in trash
      await Photo.create({
        filename: 'trashed-photo.jpg',
        uploadedBy: 'test-user-id',
        favoriteBy: [],
        trashBy: ['test-user-id'],
        sharedWith: [],
      });

      const response = await request(app)
        .get('/api/photos/trash')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.files).toHaveLength(1);
      expect(response.body.files[0].trashName).toBe('trashed-photo.jpg');
    });
  });
}); 