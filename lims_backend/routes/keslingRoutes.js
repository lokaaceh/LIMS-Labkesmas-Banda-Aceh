// routes/keslingRoutes.js
const express = require("express");
const router = express.Router();
const KeslingController = require("../controllers/keslingController");
const { authenticate } = require("../middleware/authMiddleware");

// Endpoint spesifik ditaruh di ATAS sebelum parameter dinamis /:id
router.get(
  "/next-sample-seq",
  authenticate,
  KeslingController.getNextSampleSeq,
);

router.post("/", authenticate, KeslingController.createKeslingRegistration);
router.get("/", authenticate, KeslingController.getAllKeslingRegistrations);
router.get("/:id", authenticate, KeslingController.getKeslingRegistrationById);
router.delete(
  "/:id",
  authenticate,
  KeslingController.deleteKeslingRegistration,
);

module.exports = router;
