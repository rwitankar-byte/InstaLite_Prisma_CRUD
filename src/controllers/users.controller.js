const usersService = require("../services/users.service");
const { pagination, meta } = require("../utils/pagination");

function validId(value) {
  if (!/^[1-9]\d*$/.test(String(value))) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

function error500(res, error) {
  console.error(error);
  return res.status(500).json({ error: "Internal server error" });
}

async function create(req, res) {
  const { username, email, fullname, bio } = req.body ?? {};

  if (!username || !email || !fullname) {
    return res.status(400).json({
      error: "username, email and fullname are required",
    });
  }

  try {
    const user = await usersService.createUser({
      username,
      email,
      fullname,
      ...(bio !== undefined ? { bio } : {}),
    });

    return res.status(201).json(user);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({
        error: "username or email already taken",
      });
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

  if (!["createdAt", "username", "fullname"].includes(sortBy)) {
    return res.status(400).json({
      error: "sortBy must be one of: createdAt, username, fullname",
    });
  }

  if (!["asc", "desc"].includes(order)) {
    return res.status(400).json({ error: "order must be asc or desc" });
  }

  const where = {};

  if (req.query.isPrivate !== undefined) {
    if (!["true", "false"].includes(req.query.isPrivate)) {
      return res.status(400).json({
        error: "isPrivate must be true or false",
      });
    }
    where.isPrivate = req.query.isPrivate === "true";
  }

  if (req.query.hasPosts !== undefined) {
    if (!["true", "false"].includes(req.query.hasPosts)) {
      return res.status(400).json({
        error: "hasPosts must be true or false",
      });
    }

    where.posts = req.query.hasPosts === "true"
      ? { some: {} }
      : { none: {} };
  }

  if (req.query.search) {
    where.OR = [
      { username: { contains: req.query.search, mode: "insensitive" } },
      { fullname: { contains: req.query.search, mode: "insensitive" } },
    ];
  }

  try {
    const [data, total] = await usersService.listUsers({
      skip,
      take: limit,
      orderBy: { [sortBy]: order },
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
  if (id === null) return res.status(404).json({ error: "User not found" });

  try {
    const user = await usersService.getUserById(id);
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.status(200).json(user);
  } catch (error) {
    return error500(res, error);
  }
}

async function update(req, res) {
  const id = validId(req.params.id);
  if (id === null) return res.status(404).json({ error: "User not found" });

  const body = req.body ?? {};
  const data = {};

  for (const field of ["fullname", "bio", "isPrivate"]) {
    if (Object.hasOwn(body, field)) data[field] = body[field];
  }

  if (
    Object.hasOwn(data, "isPrivate") &&
    typeof data.isPrivate !== "boolean"
  ) {
    return res.status(400).json({
      error: "isPrivate must be true or false",
    });
  }

  try {
    const user = await usersService.updateUser(id, data);
    return res.status(200).json(user);
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    return error500(res, error);
  }
}

async function remove(req, res) {
  const id = validId(req.params.id);
  if (id === null) return res.status(404).json({ error: "User not found" });

  try {
    await usersService.deleteUser(id);
    return res.status(204).end();
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    return error500(res, error);
  }
}

async function getPosts(req, res) {
  const id = validId(req.params.id);
  if (id === null) return res.status(404).json({ error: "User not found" });

  const p = pagination(req.query);
  if (p.error) return res.status(400).json({ error: p.error });

  try {
    const result = await usersService.getUserPosts(id, {
      skip: p.skip,
      take: p.limit,
    });

    if (!result) return res.status(404).json({ error: "User not found" });

    return res.status(200).json({
      data: result.data,
      meta: meta(p.page, p.limit, result.total),
    });
  } catch (error) {
    return error500(res, error);
  }
}

async function getLikedPosts(req, res) {
  const id = validId(req.params.id);
  if (id === null) return res.status(404).json({ error: "User not found" });

  const p = pagination(req.query);
  if (p.error) return res.status(400).json({ error: p.error });

  try {
    const result = await usersService.getUserLikedPosts(id, {
      skip: p.skip,
      take: p.limit,
    });

    if (!result) return res.status(404).json({ error: "User not found" });

    return res.status(200).json({
      data: result.data,
      meta: meta(p.page, p.limit, result.total),
    });
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
  getPosts,
  getLikedPosts,
  validId,
  error500,
};
