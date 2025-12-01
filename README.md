<div align="center">
<h1> IMED BACKEND </h1>  
</div>

# Documentation

[FIGMA DESIGN](<https://www.figma.com/design/NhgzPIIHFFaOOjZUtIylpc/iMed-(Copy)?node-id=1702-4351&node-type=canvas&t=r87AF33V8Ozqv0AO-0>)

## Tech Stack

**Server:** Node, Express

**Database:** Postgres

## Run Locally

Run local postgres container

```bash
docker run -d --name some-postgres  -p 5432:5432  -e POSTGRES_USER=‘postgres’ -e POSTGRES_PASSWORD=‘posgress’ -v /volumes/imed-data:/var/lib/postgresql/data postgres

```

## Node Version

**22.20.0**

## npm Version

**10.9.3**

## Clone the project

```bash
  git clone https://github.com/imedcaregroup/backend.git
```

### Go to the project directory

```bash
  cd backend
```

Install dependencies

```bash
npm install
```

## Run development server

```bash
npm run dev
```

## Create production build

```bash
npm run build
```

## Prettify code

```bash
npm run lint:fix
```

## Generating Types For Prisma Client:

```
 npx prisma generate
```

## Generate Migration And Apply To DB:

```
npx prisma migrate dev --name MINGRATION_NAME
```

## During Development To Create And Apply New Migrations:

```
npx prisma migrate dev
```

## During Production To Apply Existing Migrations Without Modifying The Schema Or Introducing New Migrations:

```
npx prisma migrate deploy
```

## Run Docker Container:

```
npm run start:container
```

## Check Logs For Docker Container:

```
docker-compose logs -f imed-backend
```

## License

[MIT](https://choosealicense.com/licenses/mit/)
