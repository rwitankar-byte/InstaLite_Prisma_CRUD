const likesService = require("../services/likes.service");
const { validId, error500 } = require("./users.controller");

async function like(req, res) {
  const postId = validId(req.params.id);
  const { userId } = req.body ?? {};

  if (userId === undefined || userId === null) {
    return res.status(400).json({ error: "userId is required" });
  }

  if (postId === null) {
    return res.status(404).json({ error: "Post not found" });
  }

  if (!Number.isSafeInteger(userId) || userId < 1) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    const result = await likesService.likePost(userId, postId);

    if (result.notFound === "post") {
      return res.status(404).json({ error: "Post not found" });
    }

    if (result.notFound === "user") {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(201).json(result.like);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Already liked" });
    }
    return error500(res, error);
  }
}

async function unlike(req, res) {
  const postId = validId(req.params.id);
  const userId = validId(req.params.userId);

  if (postId === null || userId === null) {
    return res.status(404).json({ error: "Like not found" });
  }

  try {
    await likesService.unlikePost(userId, postId);
    return res.status(204).end();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Like not found" });
    }
    return error500(res, error);
  }
}

module.exports = {
  like,
  unlike,
};
