const prisma = require("../db");

async function likePost(userId, postId) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });

  if (!post) {
    return { notFound: "post" };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    return { notFound: "user" };
  }

  const like = await prisma.like.create({
    data: { userId, postId },
  });

  return { like };
}

async function unlikePost(userId, postId) {
  return prisma.like.delete({
    where: {
      userId_postId: { userId, postId },
    },
  });
}

module.exports = {
  likePost,
  unlikePost,
};
