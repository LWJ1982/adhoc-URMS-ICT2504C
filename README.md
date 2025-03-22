# SIT-URMS
# Instructions on how to run the application locally
## Setup the .env in the client folder (BackEnd)

```bash
APP_PORT = 3001
CLIENT_URL = "http://localhost:3000"
DB_HOST = "localhost"
DB_PORT = 3306
DB_USER = "A suitable username for user table"
DB_PWD = "yr SQL PW"
DB_NAME = "A suitable Schema name"
JWT_SECRET = "your_JWT_app_secret"
TOKEN_EXPIRES_IN = "Security preference 1d, for this project 30d"
EMAIL_SERVICE = 'yr prefered email provider, recommend gmail'
EMAIL_USER = 'a usable free email'
EMAIL_PASSWORD = 'App Pass'
```
## Dependancy for the server (BackEnd)
```bash
npm init -y
npm i express
npm i nodemon --save-dev
npm i cors
npm i dotenv
npm i sequelize mysql2
npm i yup
npm i multer
npm i nodemailer uuid 
npm i bcrypt 
npm i jsonwebtoken  
npm i google-auth-library 
npm i jsonwebtoken mongoose
```

## To start the server (BackEnd)
cd into the server folder
```bash
npm start
```



## Dependancy for the client (FrontEnd)
```bash
npm create vite .
npm i react-router-dom
npm i axios
npm i @mui/material@5 @emotion/react@11 @emotion/styled@11
npm i @mui/icons-material@5
npm install @mui/icons-material
npm i formik yup
npm i react-toastify
npm i --force @react-oauth/google 
npm i --force google-auth-library
```

## To start the client (FrontEnd)
cd into the client folder
```bash
npm start
```
