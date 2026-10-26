const postsService = require("../services/posts.service");
const { pagination, meta } = require("../utils/pagination");
const { validId, error500 } = require("./users.controller");

function isValidDate(value) {
  if (!value || typeof value !== "string") return false;
  return !Number.isNaN(Date.parse(value));
}

async function create(req, res) {
  const { imageUrl, authorId, caption, location } = req.body ?? {};

  if (
    imageUrl === undefined ||
    imageUrl === null ||
    imageUrl === "" ||
    authorId === undefined ||
    authorId === null
  ) {
    return res.status(400).json({
      error: "imageUrl and authorId are required",
    });
  }

  if (!Number.isSafeInteger(authorId) || authorId < 1) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    const post = await postsService.createPost({
      imageUrl,
      authorId,
      ...(caption !== undefined ? { caption } : {}),
      ...(location !== undefined ? { location } : {}),
    });

    return res.status(201).json(post);
  } catch (error) {
    if (error.code === "P2003") {
      return res.status(404).json({ error: "User not found" });
    }
    return error500(res, error);
  }
}

async function list(req, res) {
  const p = pagination(req.query);
  if (p.error) return res.status(400).json({ error: p.error });

  const { page, limit, skip } = p;
  const sortBy = req.query.sortBy ?? "createdAt";
  const order = req.query.order ?? "desc";

  if (!["createdAt", "updatedAt", "likes"].includes(sortBy)) {
    return res.status(400).json({
      error: "sortBy must be one of: createdAt, updatedAt, likes",
    });
  }

  if (!["asc", "desc"].includes(order)) {
    return res.status(400).json({ error: "order must be asc or desc" });
  }

  const where = {};

  if (req.query.location !== undefined) {
    where.location = {
      equals: req.query.location,
      mode: "insensitive",
    };
  }

  if (req.query.search) {
    where.caption = {
      contains: req.query.search,
      mode: "insensitive",
    };
  }

  if (req.query.from !== undefined || req.query.to !== undefined) {
    if (
      (req.query.from !== undefined && !isValidDate(req.query.from)) ||
      (req.query.to !== undefined && !isValidDate(req.query.to))
    ) {
      return res.status(400).json({
        error: "from and to must be valid dates",
      });
    }

    where.createdAt = {};

    if (req.query.from !== undefined) {
      where.createdAt.gte = new Date(req.query.from);
    }

    if (req.query.to !== undefined) {
      where.createdAt.lt = new Date(req.query.to);
    }
  }

  const orderBy = sortBy === "likes"
    ? [{ likes: { _count: order } }, { createdAt: "desc" }]
    : { [sortBy]: order };

  try {
    const [data, total] = await postsService.listPosts({
      skip,
      take: limit,
      orderBy,
      where,
    });

    return res.status(200).json({
      data,
      meta: meta(page, limit, total),
    });
  } catch (error) {
    return error500(res, error);
  }
}

async function getOne(req, res) {
  const id = validId(req.params.id);
  if (id === null) return res.status(404).json({ error: "Post not found" });

  try {
    const post = await postsService.getPostById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    return res.status(200).json(post);
  } catch (error) {
    return error500(res, error);
  }
}

async function update(req, res) {
  const id = validId(req.params.id);
  if (id === null) return res.status(404).json({ error: "Post not found" });

  const body = req.body ?? {};
  const data = {};

  for (const field of ["caption", "location"]) {
    if (Object.hasOwn(body, field)) data[field] = body[field];
  }

  try {
    const post = await postsService.updatePost(id, data);
    return res.status(200).json(post);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Post not found" });
    }
    return error500(res, error);
  }
}

async function remove(req, res) {
  const id = validId(req.params.id);
  if (id === null) return res.status(404).json({ error: "Post not found" });

  try {
    await postsService.deletePost(id);
    return res.status(204).end();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Post not found" });
    }
    return error500(res, error);
  }
}

async function getLikes(req, res) {
  const postId = validId(req.params.id);
  if (postId === null) {
    return res.status(404).json({ error: "Post not found" });
  }

  try {
    const users = await postsService.getPostLikes(postId);
    if (!users) return res.status(404).json({ error: "Post not found" });
    return res.status(200).json(users);
  } catch (error) {
    return error500(res, error);
  }
}

module.exports = {
  create,
  list,
  getOne,
  update,
  remove,
  getLikes,
};
