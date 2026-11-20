import { ensureSeed } from "../src/lib/seed";

async function main() {
  await ensureSeed();
  console.log("Quvanta seed complete: admin, demo player, 232 games, fixtures, settings.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
