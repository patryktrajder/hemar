## Table of contents

- [General info](#general-info)
- [Technologies](#technologies)
- [Setup](#setup)

## General info

A static website for Youtuber's portfolio.

Development on this repository has been discontinued and project has been moved to private repository because it contains backend code now. Website is available at [patryktrajder.com](https://patryktrajder.com).

## Technologies

The website is written in the following languages:

- Nunjucks,
- Sass,
- TypeScript.

The following tools are used for compilation:

- eleventy (version: 0.11.0),
- gulp (version: 4.0.2),
- webpack (version: 4.42.1),
- rimraf (version 3.0.2) - installed globally.

## Setup

To run this project, run thw following commands from your command line:

```
# Clone this repository
$ git clone https://github.com/jakubjanowski/patryktrajder.com

# Go into the repository
$ cd patryktrajder.com

# Install dependencies
$ npm i

# Compile the files
$ npm run dev

# Start the server
$ npm start
```

The website files will be generated in `patryktrajder.com/dist/` directory and the server will host the website at `localhost:8080`.
