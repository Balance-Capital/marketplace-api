# Marketplace API  
One of the 3 parts of the marketplace application. 
The software is responsible for the backend of the marketplace-frontend application and browser extensions.

[demo](https://clevrpay.com)

## Docker mongo - How to?
Go to docker/mongodb folder and type in console: `docker-compose up`

### Create mondoDB user
Go to docker mongodb console and type:

`mongo -u "root" -p "example"`

after login

`use your_db_name`

and now create user for your_db_name

```
db.createUser({ user: "typeYourUserName", pwd: "typeYourPassword", roles: [ { role: "readWrite", db: "your_db_name" }] })
```

## How to start project?

```
cp env.example .env
yarn
yarn start
```
