import { mergeAssetsMaster } from "../../data/assetsMaster.js";
import { readLocalData, writeLocalData } from "../../data/storage.js";
import { clone, readSafely, writeSafely } from "./localRepositoryUtils.js";

export const localCoreDataRepository = {
  async load() {
    return readSafely(() => readLocalData());
  },

  async replace({ operations, assetsMaster, quotes }) {
    return writeSafely(() => {
      const mergedAssets = mergeAssetsMaster(assetsMaster, operations, quotes);
      writeLocalData({ operations, assetsMaster: mergedAssets, quotes });
      return clone({ operations, assetsMaster: mergedAssets, quotes });
    });
  },
};

