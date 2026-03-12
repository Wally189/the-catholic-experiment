import { buildSite } from "../../scripts/build-site.mjs";

let lastBuild = {
  status: "idle",
  generatedAt: null,
  error: ""
};

let building = false;
let activeBuild = Promise.resolve();

export function getBuildState() {
  return {
    building,
    ...lastBuild
  };
}

export function queueBuild() {
  activeBuild = activeBuild
    .catch(() => undefined)
    .then(async () => {
      building = true;
      lastBuild = {
        ...lastBuild,
        status: "running",
        error: ""
      };

      try {
        const result = await buildSite();
        lastBuild = {
          status: "success",
          generatedAt: result.generatedAt,
          error: ""
        };
        return lastBuild;
      } catch (error) {
        lastBuild = {
          status: "error",
          generatedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : "Build failed."
        };
        throw error;
      } finally {
        building = false;
      }
    });

  return activeBuild;
}
