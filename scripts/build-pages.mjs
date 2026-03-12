process.env.BASE_PATH ||= "/the-catholic-experiment";
process.env.OUTPUT_DIR ||= "docs";
process.env.PUBLIC_SITE_ONLY ||= "1";

const { buildSite } = await import("./build-site.mjs");

buildSite().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
