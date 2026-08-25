# LETS FLEX

I am improving my skills as a web developer, learning Fullstack Javascript with [TOP](https://www.theodinproject.com/lessons/node-path-nodejs-deployment)

## Deploy

You can [see my fitness app](https://lets-flex.onrender.com/) on Render.

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
