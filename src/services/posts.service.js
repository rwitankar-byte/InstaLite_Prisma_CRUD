const prisma = require("../db");
const { USER_SUMMARY, POST_DETAILS } = require("./users.service");

async function createPost(data) {
  return prisma.post.create({ data });
}

async function listPosts({ skip, take, orderBy, where }) {
  return prisma.$transaction([
    prisma.post.findMany({
      where,
      skip,
      take,
      orderBy,
      include: POST_DETAILS,
    }),
    prisma.post.count({ where }),
  ]);
}

async function getPostById(id) {
  return prisma.post.findUnique({
    where: { id },
    include: POST_DETAILS,
  });
}

async function updatePost(id, data) {
  return prisma.post.update({
    where: { id },
    data,
  });
}

async function deletePost(id) {
  return prisma.post.delete({
    where: { id },
  });
}

async function getPostLikes(postId) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });

  if (!post) return null;

  const likes = await prisma.like.findMany({
    where: { postId },
    orderBy: { user: { username: "asc" } },
    select: { user: { select: USER_SUMMARY } },
  });

  return likes.map((like) => like.user);
}

module.exports = {
  createPost,
  listPosts,
  getPostById,
  updatePost,
  deletePost,
  getPostLikes,
};
