# Leafy Bank UI

Leafy Bank UI is the graphical user interface for our demo banking application, showcasing the integration of MongoDB's powerful features tailored for Financial Services. This responsive and intuitive UI allows users to explore and interact with banking functionalities, highlighting real-time data processing, secure transactions, and seamless user experiences. Perfect for demonstrating the capabilities of modern financial applications built on MongoDB.

## Where MongoDB Shines?

[Small explanation of which MongoDB features are present]

## High Level Architecture

[High level architecture diagram here use [google slides](https://docs.google.com/presentation/d/1vo8Y8mBrocJtzvZc_tkVHZTsVW_jGueyUl-BExmVUtI/edit#slide=id.g30c066974c7_0_3536)]

## Tech Stack

[List your tech stackexample below]

- Next.js [App Router](https://nextjs.org/docs/app) for the framework
- [MongoDB Atlas](https://www.mongodb.com/atlas/database) for the database
- [CSS Modules](https://github.com/css-modules/css-modules) for styling

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js 14 or higher
- Poetry (install via [Poetry's official documentation](https://python-poetry.org/docs/#installation))

[Add more if needed]

## Run it Locally

### Frontend

1. Navigate to the `src` folder.
2. Install dependencies by running:
```bash
npm install
```
3. Start the frontend development server with:
````bash
npm run dev
````
4. The frontend will now be accessible at http://localhost:3000 by default, providing a user interface.

## Run with Docker

Make sure to run this on the root directory.

1. To run with Docker use the following command:
```
make build
```
2. To delete the container and image run:
```
make clean
```

## Common errors

### Frontend

- Check that you've created an `.env.local` file that contains your valid (and working) API keys, environment and index variables.