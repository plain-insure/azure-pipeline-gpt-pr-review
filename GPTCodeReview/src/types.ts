/**
 * Shared type definitions for the GPT Code Review extension
 */

import { Agent } from "https";
import { SimpleGit } from "simple-git";

/**
 * Supported language codes (ISO 639-1)
 */
export type SupportedLanguage =
  | "aa" | "ab" | "ae" | "af" | "ak" | "am" | "an" | "ar" | "as" | "av"
  | "ay" | "az" | "ba" | "be" | "bg" | "bh" | "bi" | "bm" | "bn" | "bo"
  | "br" | "bs" | "ca" | "ce" | "ch" | "co" | "cr" | "cs" | "cu" | "cv"
  | "cy" | "da" | "de" | "dv" | "dz" | "ee" | "el" | "en" | "eo" | "es"
  | "et" | "eu" | "fa" | "ff" | "fi" | "fj" | "fo" | "fr" | "fy" | "ga"
  | "gd" | "gl" | "gn" | "gu" | "gv" | "ha" | "he" | "hi" | "ho" | "hr"
  | "ht" | "hu" | "hy" | "hz" | "ia" | "id" | "ie" | "ig" | "ii" | "ik"
  | "io" | "is" | "it" | "iu" | "ja" | "jv" | "ka" | "kg" | "ki" | "kj"
  | "kk" | "kl" | "km" | "kn" | "ko" | "kr" | "ks" | "ku" | "kv" | "kw"
  | "ky" | "la" | "lb" | "lg" | "li" | "ln" | "lo" | "lt" | "lu" | "lv"
  | "mg" | "mh" | "mi" | "mk" | "ml" | "mn" | "mr" | "ms" | "mt" | "my"
  | "na" | "nb" | "nd" | "ne" | "ng" | "nl" | "nn" | "no" | "nr" | "nv"
  | "ny" | "oc" | "oj" | "om" | "or" | "os" | "pa" | "pi" | "pl" | "ps"
  | "pt" | "qu" | "rm" | "rn" | "ro" | "ru" | "rw" | "sa" | "sc" | "sd"
  | "se" | "sg" | "si" | "sk" | "sl" | "sm" | "sn" | "so" | "sq" | "sr"
  | "ss" | "st" | "su" | "sv" | "sw" | "ta" | "te" | "tg" | "th" | "ti"
  | "tk" | "tl" | "tn" | "to" | "tr" | "ts" | "tt" | "tw" | "ty" | "ug"
  | "uk" | "ur" | "uz" | "ve" | "vi" | "vo" | "wa" | "wo" | "xh" | "yi"
  | "yo" | "za" | "zh" | "zu";

/**
 * Azure AI Search extension configuration
 */
export interface AzureAISearchExtension {
  endpoint: string;
  indexName: string;
  apiKey: string;
}

/**
 * Azure OpenAI configuration options
 */
export interface AzureOpenAIOptions {
  apiKey?: string;
  aoiEndpoint: string;
  aoiModelResourceId: string;
  aoiModelName?: string;
  aoiUseManagedIdentity?: boolean;
  azureSubscription?: string;
  commentLanguage?: SupportedLanguage;
  customInstruction?: string;
  aiSearchExtension?: AzureAISearchExtension;
}

/**
 * Input parameters for file review
 */
export interface ReviewFileInput {
  targetBranch: string;
  fileName: string;
  httpsAgent: Agent;
  aoi: AzureOpenAIOptions;
  inputGit?: SimpleGit;
}

/**
 * Review usage tracking information
 */
export interface ReviewUsage {
  filename: string;
  usages?: {
    completionTokens: number;
    promptTokens: number;
    totalTokens: number;
  };
}

/**
 * Review manager configuration options
 */
export interface ReviewOptions {
  git: {
    patchLimit?: number;
  };
  aoi: {
    tokenLimit?: number;
  };
}

/**
 * Review manager interface
 */
export interface IReviewManager {
  getTotalUsage: () => number;
  info: {
    usages: ReviewUsage[];
  };
  reviewOptions: ReviewOptions;
}