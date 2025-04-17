const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');

const dotenv = require('dotenv');
dotenv.config();

const PORT = process.env.PORT || 3000;
const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:5173', 'https://tad-app-fronend.vercel.app'];


//Auth Router
const authRouter = require('./resources/auth/auth.router');

//General Routers
const generalRouter = require('./resources/general/general.route');

//Platform Routers
const bim360Router = require('./resources/bim360/bim360.router');
const accRouter = require('./resources/acc/acc.router');

//Datamanagement
const datamanagementRouter = require('./resources/datamanagement/datamanagement.router');

//OpenAI Routers
const accusersOpenAiRouter = require('./openai/acc/acc.users.openai');
const accissuesOpenAiRouter = require('./openai/acc/acc.issues.openai');
const accprojectOpenAiRouter = require('./openai/acc/acc.project.openai');
const accrfisOpneAiRouter = require('./openai/acc/acc.rfi.openai');
const accsubmittalsOpenAiRouter = require('./openai/acc/acc.submittals.openai');

const bim360projectOpenAiRouter = require('./openai/bim360/bim360.project.openai');
const bim360issuesOpenAiRouter = require('./openai/bim360/bim360.issues.openai')
const bim360rfisOpenAiRouter = require('./openai/bim360/bim360.rfi.openai')
const bim360usersOpenAiRouter = require('./openai/bim360/bim360.users.openai')

const app = express();

app.use(morgan('dev'));
app.use(express.json({limit: '150mb'}));
app.use(express.urlencoded({limit: '150mb', extended: true}));

app.use (cors({
    origin:(origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback (null, true);
        }
        else {
            callback (new Error ('Not allowed by CORS'));
        }
    },
    credentials:true,
}));

app.use(helmet());

app.use(helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://trusted.cdn.com'],
      imgSrc: ["'self'", 'data:', 'https://images.autodesk.com'],
      connectSrc: ["'self'", 'https://developer.api.autodesk.com'],
    },
  }));

app.use(cookieParser());

app.get('/', (req, res) => {
    res.send('Hello World!');
})

app.use('/auth', authRouter);
app.use('/general', generalRouter);
app.use('/bim360', bim360Router);
app.use('/acc', accRouter);
app.use('/datamanagement', datamanagementRouter);

// app.use('/openai/acc/users', accusersOpenAiRouter);
// app.use('/openai/acc/issues', accissuesOpenAiRouter);       
// app.use('/openai/acc/project', accprojectOpenAiRouter);
// app.use('/openai/acc/rfi', accrfisOpneAiRouter);
// app.use('/openai/acc/submittals', accsubmittalsOpenAiRouter);

// app.use('/openai/bim360/project', bim360projectOpenAiRouter);
// app.use('/openai/bim360/issues', bim360issuesOpenAiRouter);
// app.use('/openai/bim360/rfi', bim360rfisOpenAiRouter);
// app.use('/openai/bim360/users', bim360usersOpenAiRouter);

 
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  }

  module.exports = app;


