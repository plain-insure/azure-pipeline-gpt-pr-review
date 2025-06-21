/**
 * Global review manager for tracking usage and configuration
 */

import { IReviewManager, ReviewUsage } from "../types";

export const ReviewManager: IReviewManager = {
  getTotalUsage: function () {
    return ReviewManager.info.usages.reduce((acc, cur) => {
      if (cur.usages) {
        return acc + cur.usages.totalTokens;
      }
      return acc;
    }, 0);
  },
  info: {
    usages: [] as ReviewUsage[],
  },
  reviewOptions: {
    git: {},
    aoi: {},
  },
};
