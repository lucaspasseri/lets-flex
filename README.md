# LETS FLEX

I am improving my skills as a web developer, learning Fullstack Javascript with [TOP](https://www.theodinproject.com/lessons/node-path-nodejs-deployment)

## Deploy

You can [see my fitness app](https://lets-flex.onrender.com/) on Render.

## Configuration

Copy `.env.sample` to `.env` for local development and set:

- `DATABASE_URL` to the PostgreSQL connection string.
- `DATABASE_SSL=true` when the server requires verified TLS.
- `SESSION_SECRET` to a long, random value. The application will not start without it.

The component playground is available outside production only.

## Tests

Run the complete suite with `npm test`. HTTP integration tests require a disposable
PostgreSQL database whose name contains `test`:

```sh
TEST_DATABASE_URL=postgresql://localhost/lets_flex_test npm run test:http
```

The integration suite resets that database before every scenario and skips when a
safe `TEST_DATABASE_URL` is not configured. It never uses `DATABASE_URL` directly.

## Me

**Lucas Passeri**
