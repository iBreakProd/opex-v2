import { enginePuller, enginePusher } from "@repo/redis/queue";
import { mongodbClient } from "./dbClient";
import { Engine } from "./engineClass";

const engine = new Engine(enginePuller, enginePusher, mongodbClient);

engine.run();
