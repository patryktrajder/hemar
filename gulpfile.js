const { spawn, spawnSync } = require("child_process");
const gulp = require("gulp");
const merge = require("merge-stream");
const readlineSync = require("readline-sync");
// const rename = require("gulp-rename");
const replace = require("gulp-replace");
const sass = require("gulp-sass");
const webpack = require("webpack-stream");

const distDir = "dist";
const deployBranch = "gh-pages";

function cname() {
  return gulp.src("CNAME").pipe(gulp.dest(distDir));
}

function cnameAcc() {
  // No acceptance domain is currently configured
  // return gulp
  //   .src("CNAME-acceptance")
  //   .pipe(rename("CNAME"))
  //   .pipe(gulp.dest(distDir));
}

function cursors() {
  return gulp
    .src("assets/cursors/**/*")
    .pipe(gulp.dest(distDir + "/assets/cursors/"));
}

function favicon() {
  return gulp.src("favicon.ico").pipe(gulp.dest(distDir));
}

function googleYTAuth() {
  return gulp.src("googleea67cce430aa48a1.html").pipe(gulp.dest(distDir));
}

function html() {
  return spawn("eleventy", [], { shell: true, stdio: "inherit" });
}

function icons() {
  return gulp
    .src("assets/icons/**/*")
    .pipe(gulp.dest(distDir + "/assets/icons/"));
}

function images() {
  return gulp
    .src("assets/images/**/*")
    .pipe(gulp.dest(distDir + "/assets/images/"));
}

function manifests() {
  var paths = ["manifest_pl.json", "manifest_en-gb.json"];
  var tasks = paths.map(function (path) {
    return gulp.src(path).pipe(gulp.dest(distDir));
  });

  return merge(tasks);
}

function notFoundPage() {
  return gulp.src("src/404.html").pipe(gulp.dest(distDir));
}

function notFoundStyles() {
  return gulp
    .src("src/styles/404.scss")
    .pipe(sass())
    .pipe(gulp.dest(distDir + "/src/"));
}

function packagesReminder(done) {
  let process = spawnSync("npm outdated", [], {
    shell: true
  });
  if (process.stdout.byteLength > 0) {
    spawnSync("npm outdated", [], {
      shell: true,
      stdio: "inherit"
    });
    if (
      !readlineSync.keyInYN(
        "There are outdated packages, do you want to continue?"
      )
    ) {
      console.log("Ok, aborting deployment.");
      process.exit(2);
    }
  }
  done();
}

function privacyPolicy() {
  return gulp.src("privacy-policy.pdf").pipe(gulp.dest(distDir));
}

function terms() {
  return gulp.src(["terms-of-service.pdf", "terms-of-service-en.pdf", "impressum-de.pdf", "terms-of-service-de.pdf", "privacy-policy-de.pdf", "privacy-policy-en.pdf"]).pipe(gulp.dest(distDir));
}

function replaceSpace() {
  return gulp
    .src(distDir + "/**/*.html")
    .pipe(replace("&#32;", " "))
    .pipe(gulp.dest(distDir));
}

function robots() {
  return gulp.src("robots.txt").pipe(gulp.dest(distDir));
}

function scripts() {
  return gulp
    .src("src/scripts/**/*.ts")
    .pipe(webpack(require("./webpack.config.js")))
    .pipe(gulp.dest(distDir + "/src/"));
}

function scriptsDev() {
  let config = require("./webpack.config.js");

  config.mode = "development";
  config.devtool = "inline-source-map";
  config.optimization = {
    minimize: false
  };

  return gulp
    .src("src/scripts/**/*.ts")
    .pipe(webpack(config))
    .pipe(gulp.dest(distDir + "/src/"));
}

function sitemap() {
  return gulp.src("sitemap.xml").pipe(gulp.dest(distDir));
}

function sitemapReminder(done) {
  if (readlineSync.keyInYN("Did you update the sitemap?")) {
    return done();
  }
  console.log("Ok, aborting deployment.");
  process.exit(1);
}

function styles() {
  return gulp
    .src("src/styles/main.scss")
    .pipe(sass())
    .pipe(gulp.dest(distDir + "/src/"));
}

function videos() {
  return gulp
    .src("assets/videos/**/*")
    .pipe(gulp.dest(distDir + "/assets/videos/"));
}

gulp.task("assets", gulp.parallel(cursors, favicon, icons, images, manifests, videos));

gulp.task("clean", function () {
  return spawn("rimraf " + distDir, [], {
    shell: true,
    stdio: "inherit"
  });
});

gulp.task("deploy-acc", function () {
  return spawn(
    "cd " +
    distDir +
    " && git init" +
    " && git add ." +
    ' && git commit -m "deploy"' +
    " && git remote add origin https://github.com/JakubJanowski/acceptance.git" +
    " && git push --force origin main:" +
    deployBranch +
    " && rimraf .git" +
    " && cd ..",
    [],
    { shell: true, stdio: "inherit" }
  );
});

gulp.task("deploy", function () {
  return spawn(
    "cd " +
    distDir +
    " && git init" +
    " && git add ." +
    ' && git commit -m "deploy"' +
    " && git remote add origin https://github.com/JakubJanowski/patryktrajder.com.git" +
    " && git push --force origin main:" +
    deployBranch +
    " && rimraf .git" +
    " && cd ..",
    [],
    { shell: true, stdio: "inherit" }
  );
});

gulp.task(
  "rootfiles",
  gulp.parallel(cname, googleYTAuth, privacyPolicy, terms, robots, sitemap)
);

gulp.task(
  "src",
  gulp.parallel(
    gulp.series(html, replaceSpace),
    notFoundPage,
    notFoundStyles,
    scripts,
    styles
  )
);

gulp.task(
  "srcDev",
  gulp.parallel(
    gulp.series(html, replaceSpace),
    notFoundPage,
    notFoundStyles,
    scriptsDev,
    styles
  )
);

gulp.task(
  "dev",
  gulp.series("clean", gulp.parallel("assets", privacyPolicy, terms, "srcDev"))
);

gulp.task(
  "acc",
  gulp.series(
    "clean",
    gulp.parallel("assets", cnameAcc, privacyPolicy, terms, "src"),
    "deploy-acc"
  )
);

gulp.task(
  "dist",
  gulp.series(
    sitemapReminder,
    packagesReminder,
    "clean",
    gulp.parallel("assets", "rootfiles", "src"),
    "deploy"
  )
);
