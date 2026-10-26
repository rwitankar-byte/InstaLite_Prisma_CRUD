const express = require("express");
const postsController = require("../controllers/posts.controller");
const likesController = require("../controllers/likes.controller");

const router = express.Router();

router.post("/", postsController.create);
router.get("/", postsController.list);
router.get("/:id", postsController.getOne);
router.patch("/:id", postsController.update);
router.delete("/:id", postsController.remove);
router.get("/:id/likes", postsController.getLikes);
router.post("/:id/likes", likesController.like);
router.delete("/:id/likes/:userId", likesController.unlike);

module.exports = router;
