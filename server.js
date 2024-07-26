const express = require('express');
const path = require('path');
const collegeData = require('./collegeData');  
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');

const app = express();
const HTTP_PORT = process.env.PORT || 8080;

// Middleware to parse urlencoded bodies
app.use(express.urlencoded({ extended: true }));

// Middleware to set activeRoute for navigation
app.use(function(req, res, next) {
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    next();
});

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Configure express-handlebars
app.engine('.hbs', exphbs.engine({
    extname: '.hbs',
    defaultLayout: 'main',
    helpers: {
        navLink: function(url, options) {
            return '<li' +
                ((url == app.locals.activeRoute) ? ' class="nav-item active" ' : ' class="nav-item" ') +
                '><a class="nav-link" href="' + url + '">' + options.fn(this) + '</a></li>';
        },
        equal: function(lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        }
    }
}));
app.set('view engine', '.hbs');

// Route to render home view
app.get('/', (req, res) => {
    res.render('home');
});

// Route to render about view
app.get('/about', (req, res) => {
    res.render('about');
});

// Route to render htmlDemo view
app.get('/htmlDemo', (req, res) => {
    res.render('htmlDemo');
});

// Route to render addStudent view
app.get('/students/add', (req, res) => {
    res.render('addStudent');
});

// Route to get all students or students by course
app.get('/students', (req, res) => {
    if (req.query.course) {
        collegeData.getStudentsByCourse(req.query.course)
            .then(data => res.render('students', { students: data }))
            .catch(err => res.render('students', { message: "no results" }));
    } else {
        collegeData.getAllStudents()
            .then(data => res.render('students', { students: data }))
            .catch(err => res.render('students', { message: "no results" }));
    }
});

// Route to get all courses
app.get('/courses', (req, res) => {
    collegeData.getCourses()
        .then(data => res.render('courses', { courses: data }))
        .catch(err => res.render('courses', { message: "no results" }));
});

// Route to get student by using studentNum
app.get('/student/:num', (req, res) => {
    collegeData.getStudentByNum(req.params.num)
        .then(data => res.json(data))
        .catch(err => res.status(404).json({ message: "no results" }));
});

// Route to add a new student (POST method)
app.post('/students/add', (req, res) => {
    const newStudent = req.body;
    collegeData.addStudent(newStudent)
        .then(() => {
            res.redirect('/students');
        })
        .catch(err => {
            console.error(`Failed to add student: ${err}`);
            res.status(500).send("Failed to add student");
        });
});

// Route to get course by courseId
app.get('/course/:id', (req, res) => {
    collegeData.getCourseById(req.params.id)
        .then(data => res.render('course', { course: data }))
        .catch(err => res.status(404).render('course', { message: "no results" }));
});


// Route to get student by using studentNum
app.get('/student/:num', (req, res) => {
    collegeData.getStudentByNum(req.params.num)
        .then(data => res.render('student', { student: data }))
        .catch(err => res.status(404).render('student', { message: "no results" }));
});

// Route to update student details (POST method)
app.post('/student/update', (req, res) => {
    collegeData.updateStudent(req.body)
        .then(() => {
            res.redirect('/students');
        })
        .catch(err => {
            console.error(`Failed to update student: ${err}`);
            res.status(500).send("Failed to update student");
        });
});

app.get('/student/:num', (req, res) => {
    let viewData = {};

    collegeData.getStudentByNum(req.params.num)
        .then(data => {
            if (data) {
                viewData.student = data;
            } else {
                viewData.student = null;
            }
        }).catch(() => {
            viewData.student = null;
        }).then(collegeData.getCourses)
        .then((data) => {
            viewData.courses = data;
            for (let i = 0; i < viewData.courses.length; i++) {
                if (viewData.courses[i].courseId == viewData.student.course) {
                    viewData.courses[i].selected = true;
                }
            }
        }).catch(() => {
            viewData.courses = [];
        }).then(() => {
            if (viewData.student == null) {
                res.status(404).send("Student Not Found");
            } else {
                res.render("student", { viewData: viewData });
            }
        });
});

app.post("/student/update", (req, res) => {
    collegeData.updateStudent(req.body)
        .then(() => {
            res.redirect("/students");
        })
        .catch(err => {
            console.error(`Failed to update student: ${err}`);
            res.status(500).send("Failed to update student");
        });
});

// Handle 404 - Keep this as the last route
app.use((req, res) => {
    res.status(404).send("404 - Page Not Found");
});

// Initialize collegeData and start server
collegeData.initialize()
    .then(() => {
        app.listen(HTTP_PORT, () => {
            console.log(`Server listening on port ${HTTP_PORT}`);
        });
    })
    .catch(err => {
        console.error(`Unable to initialize collegeData: ${err}`);
    });
