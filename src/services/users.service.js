const prisma = require("../db");

const USER_SUMMARY = {
  id: true,
  username: true,
  fullname: true,
};

const POST_DETAILS = {
  author: { select: USER_SUMMARY },
  _count: { select: { likes: true } },
};

async function createUser(data) {
  return prisma.user.create({ data });
}

async function listUsers({ skip, take, orderBy, where }) {
  return prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        _count: { select: { posts: true, likes: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);
}

async function getUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      _count: { select: { posts: true, likes: true } },
    },
  });
}

async function updateUser(id, data) {
  return prisma.user.update({
    where: { id },
    data,
  });
}

async function deleteUser(id) {
  return prisma.user.delete({
    where: { id },
  });
}

async function getUserPosts(id, { skip, take }) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!user) return null;

  const where = { authorId: id };

  const [data, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { likes: true } } },
    }),
    prisma.post.count({ where }),
  ]);

  return { data, total };
}

async function getUserLikedPosts(id, { skip, take }) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!user) return null;

  const where = { likes: { some: { userId: id } } };

  const [data, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: POST_DETAILS,
    }),
    prisma.post.count({ where }),
  ]);

  return { data, total };
}

module.exports = {
  createUser,
  listUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserPosts,
  getUserLikedPosts,
  USER_SUMMARY,
  POST_DETAILS,
};
