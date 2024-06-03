import { uploadStore } from "../src/lib/storage";

const relativePath = "./test/.data/";
uploadStore({
  storageEndpoint: "....",
  globPattern: [
    // Source Codes
    `${relativePath}/**/*.js`,
    `${relativePath}/**/*.ts`,
    `${relativePath}/**/*.c`,
    `${relativePath}/**/*.cpp`,
    `${relativePath}/**/*.cxx`,
    `${relativePath}/**/*.h`,
    `${relativePath}/**/*.hpp`,
    `${relativePath}/**/*.hxx`,
    // Readable Content
    `${relativePath}/**/*.json`,
    `${relativePath}/**/*.yaml`,
    `${relativePath}/**/*.yml`,
    `${relativePath}/**/*.md`,
  ],
  globIgnorePattern: [
    "**/.*",
    "**/build/**",
    "**/node_modules/**",
    "**/dist/**",
    "**/universal_modules/**",
    "**/CMakeFiles/**",
    "**/thirdParty/**",
  ],
});
