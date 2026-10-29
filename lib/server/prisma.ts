
import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const globalForPrisma = globalThis as unknown as {
  localPrisma?: PrismaClient;
};

function getLocalClient(): PrismaClient {
  return (
    globalForPrisma.localPrisma ??
    (globalForPrisma.localPrisma = new PrismaClient())
  );
}

async function getClient(): Promise<PrismaClient> {
  if (process.env.NODE_ENV !== "production") {
    return getLocalClient();
  }

  const { env } = await getCloudflareContext({ async: true });

  return new PrismaClient({
    adapter: new PrismaD1(env.campus_radar_db),
  });
}

function createProxy(path: PropertyKey[] = []): object {
  const target = function () {};

  return new Proxy(target, {
    get(_target, property) {
      if (property === "then") return undefined;
      return createProxy([...path, property]);
    },

    apply(_target, _thisArg, args) {
      return getClient().then((client) => {
        let current: unknown = client;

        for (const property of path) {
          current = Reflect.get(current as object, property);
        }

        if (typeof current !== "function") {
          throw new Error(`Invalid Prisma operation: ${path.join(".")}`);
        }

        let parent: unknown = client;

        for (const property of path.slice(0, -1)) {
          parent = Reflect.get(parent as object, property);
        }

        return current.apply(parent, args);
      });
    },
  });
}

export const prisma = createProxy() as unknown as PrismaClient;
