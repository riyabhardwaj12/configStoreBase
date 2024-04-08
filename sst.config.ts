import { SSTConfig } from "sst";

export default {
  config(_input) {
    return {
      name: "configStore",
      region: "eu-west-1"
    };
  },
  stacks() {
  },
} satisfies SSTConfig;
