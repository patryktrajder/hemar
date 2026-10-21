const htmlmin = require("html-minifier");

module.exports = function (eleventyConfig) {
  eleventyConfig.addTransform("htmlmin", function (content, outputPath) {
    if (outputPath.endsWith(".html")) {
      let minified = htmlmin.minify(content, {
        collapseBooleanAttributes: true,
        collapseInlineTagWhitespace: true,
        collapseWhitespace: true,
        removeComments: true,
        removeEmptyAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        sortAttributes: true,
        sortClassName: true,
        useShortDoctype: true
      });
      return minified;
    }

    return content;
  });

  return {
    dir: {
      includes: "_includes",
      input: "src/views",
      output: "dist"
    },
    templateFormats: ["njk"]
  };
};
