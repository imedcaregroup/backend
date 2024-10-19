<div align="center">
<h1> IMED BACKEND </h1>  
</div>

# Documentation

[FIGMA DESIGN](<https://www.figma.com/design/8rUddxTGlNsPhJRBbFsfQJ/iMed-(Copy)?node-id=515-34735&node-type=canvas&t=4UzkJ15PnWnxiSO2-0>)

## Tech Stack

**Server:** Node, Express

**Database:** Postgres

## Run Locally

Run local postgres container

```bash
docker run -d --name some-postgres  -p 5432:5432  -e POSTGRES_USER=‘postgres’ -e POSTGRES_PASSWORD=‘posgress’ -v /volumes/imed-data:/var/lib/postgresql/data postgres

```

## Node Version

**20.11.1**

## Yarn Version

**1.22.22**

## Clone the project

```bash
  git clone https://github.com/mudassir089/iMed-backend.git
```

### Go to the project directory

```bash
  cd iMed-backend
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

## Generate Migration And Apply To DB:

```
npx prisma migrate dev --name MINGRATION_NAME
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
