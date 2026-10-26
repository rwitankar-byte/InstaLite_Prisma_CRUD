const prisma = require("../src/db");
const { users, posts, likes } = require("./seed-data");

function extractPostKey(imageUrl) {
  return imageUrl.split("/")[4];
}

async function main() {
  await prisma.like.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  const createdUsers = await prisma.user.createManyAndReturn({
    data: users,
  });

  const userMap = new Map();
  for (const user of createdUsers) {
    userMap.set(user.username, user.id);
  }

  const postData = posts.map(({ author, ...rest }) => ({
    ...rest,
    authorId: userMap.get(author),
  }));

  const createdPosts = await prisma.post.createManyAndReturn({
    data: postData,
  });

  const postMap = new Map();
  for (const post of createdPosts) {
    const key = extractPostKey(post.imageUrl);
    postMap.set(key, post.id);
  }

  const likeData = likes.map((like) => ({
    userId: userMap.get(like.user),
    postId: postMap.get(like.post),
  }));

  const createdLikes = await prisma.like.createMany({
    data: likeData,
  });

  console.log(
    `🌱 Seeded ${createdUsers.length} users, ${createdPosts.length} posts and ${createdLikes.count} likes`
  );
}

main()
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
