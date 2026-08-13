// routes/publicRoutes.js
const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');
const path = require('node:path');
const fs = require('node:fs');

router.post('/track', publicController.trackRegistration);

// --- TAMBAHAN BARU: Endpoint download aman di bawah scope /api ---
router.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    // Mengarah tepat ke folder public/results di root backend
    const filepath = path.join(__dirname, '..', 'public', 'results', filename);

    if (fs.existsSync(filepath)) {
        res.download(filepath, filename);
    } else {
        res.status(404).json({ success: false, message: 'File dokumen tidak ditemukan di server' });
    }
});

module.exports = router;