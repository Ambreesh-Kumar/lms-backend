# 🎓 Learning Management System (LMS) – Backend API
A **scalable, production-ready LMS backend** built with **Node.js, Express, MongoDB**, designed to support **role-based learning, paid courses, secure payments**, and **progress tracking**.
This backend powers an end-to-end LMS flow including **course creation, content management, student enrollment, payment processing**, and **learning progress analytics**.

## API Base URL  
```
https://lms-backend-rmh5.onrender.com
```

## Why This Project?
This LMS backend was built to demonstrate real-world backend engineering skills:
- Designing complex relational data models
- Handling payment flows with retries and verification
- Implementing role-based access control
- Writing scalable, production-ready APIs

## 🚀 Key Highlights
* **Role-based system** (Admin, Instructor, Student)
* **Paid course workflow with Razorpay**
* **Robust enrollment lifecycle** (`pending → active → completed / cancelled`)
* **Instructor & student dashboards**
* **Video + text lessons support**
* **Cloudinary-based media uploads**
* **Transactional payment verification**
* **Production-grade error handling & data consistency**

## 🧠 System Roles & Capabilities
### 👨‍🏫 Instructor
* Create & manage courses
* Upload course thumbnails
* Organize content into sections & lessons
* Publish/unpublish courses
* View instructor dashboard (courses, enrollments, completions)

### 👨‍🎓 Student
* Browse published courses
* Enroll in free or paid courses
* Complete payments securely
* Access active enrollments
* Track learning progress

### 🛠️ Admin
* System-level access (future extensibility)
* Platform oversight (users, courses, payments)

## 🏗️ Core Modules Overview
### Authentication & Authorization
* JWT-based authentication
* Role-based access control (RBAC)
* Protected routes for instructors & students
#### Auth APIs

| Method | Endpoint                | Description                   | Auth Required |
|--------|------------------------|-------------------------------|---------------|
| POST   | /api/auth/register     | Register a new user           | No            |
| POST   | /api/auth/login        | Login user and get tokens     | No            |
| GET    | /api/auth/refresh_token | Refresh access token          | No            |
| POST   | /api/auth/logout       | Logout user                   | Yes           |


### Course Management
* Instructor-only course creation
* Draft & publish workflow
* Course pricing (free / paid)
* Thumbnail upload via Cloudinary
#### Courses APIs

##### Public APIs
| Method | Endpoint                     | Description                          | Auth |
|------|------------------------------|--------------------------------------|------|
| GET  | /api/v1/courses/published    | List all published courses           | No   |
| GET  | /api/v1/courses/:courseId    | Get single course details             | Optional |

##### Instructor APIs (Auth Required)
| Method | Endpoint                          | Description                          | Role |
|------|-----------------------------------|--------------------------------------|------|
| GET  | /api/v1/courses/instructor        | List instructor’s courses            | Instructor |
| POST | /api/v1/courses                  | Create a new course                  | Instructor |
| PUT  | /api/v1/courses/:courseId        | Update course details                | Instructor |
| PATCH| /api/v1/courses/:courseId/status | Update course publish status         | Instructor |
| DELETE | /api/v1/courses/:courseId      | Delete a course                      | Instructor |


### Sections & Lessons
* Course → Sections → Lessons hierarchy
* Ordered sections & lessons
* Supports:
   * 🎥 Video lessons
   * 📝 Text-based lessons
#### Sections APIs

##### Public / Optional Auth APIs
| Method | Endpoint                         | Description                          | Auth |
|------|----------------------------------|--------------------------------------|------|
| GET  | /api/sections/course/:courseId   | List sections of a course            | Optional |

##### Instructor APIs (Auth Required)
| Method | Endpoint                 | Description                          | Role |
|------|--------------------------|--------------------------------------|------|
| POST | /api/sections            | Create a new section                 | Instructor |
| PUT  | /api/sections/:sectionId | Update section details               | Instructor |
| DELETE | /api/sections/:sectionId | Delete a section                   | Instructor |

### Lessons APIs

#### Authenticated APIs
| Method | Endpoint                           | Description                          | Access |
|------|------------------------------------|--------------------------------------|--------|
| POST | /api/lessons                       | Create a new lesson                  | Instructor |
| GET  | /api/lessons/section/:sectionId    | List lessons in a section            | Instructor / Enrolled Student |
| PUT  | /api/lessons/:lessonId             | Update lesson details                | Instructor |
| DELETE | /api/lessons/:lessonId           | Delete a lesson                      | Instructor |


### Enrollment System (State-Driven)
A **carefully designed enrollment lifecycle:**
```
pending    → payment initiated
active     → payment verified
completed  → course finished
cancelled  → enrollment revoked / expired
```
* Prevents duplicate enrollments
* Supports payment retries
* Clean separation between **enrollment** and **payment**
#### Enrollment APIs

##### Student APIs
| Method | Endpoint                    | Description                           | Access |
|------|-----------------------------|---------------------------------------|--------|
| POST | /api/enrollments            | Enroll in a course                    | Student |
| GET  | /api/enrollments/me         | Get my enrolled courses               | Student |

##### Instructor APIs
| Method | Endpoint                                 | Description                           | Access |
|------|------------------------------------------|---------------------------------------|--------|
| GET  | /api/enrollments/course/:courseId        | List enrollments for a course         | Instructor |
| PATCH | /api/enrollments/:enrollmentId/status   | Update enrollment status              | Instructor |

### Progress Module Overview
- Tracks student learning progress at **lesson level**
- Automatically calculates **course completion percentage**
- Prevents duplicate lesson completion entries
- Used by:
  - Student Dashboard
  - Course Progress UI
  - Completion tracking logic
#### Notes
- Authentication required for all progress APIs
- Only enrolled students can update or view progress
- Progress is stored per `student + course + lesson`

#### Progress APIs (Student Learning Progress)

| Method | Endpoint                                  | Description                                   | Access  |
|------|--------------------------------------------|-----------------------------------------------|---------|
| POST | /api/progress/complete                     | Mark a lesson as completed                    | Student |
| GET  | /api/progress/course/:courseId             | Get overall course progress (%)               | Student |
| GET  | /api/progress/course/:courseId/lessons     | Get lesson-wise completion status map         | Student |


### Payment Module (Razorpay Integration)
#### 🔐 Secure Payment Flow
1. Create Razorpay order
2. Redirect to payment gateway
3. Verify payment signature
4. Activate enrollment atomically

#### ⚙️ Features
* Razorpay Orders API
* Signature verification using HMAC SHA256
* MongoDB transactions for consistency
* Retry handling (old pending payments auto-failed)

##### Payment APIs (Razorpay)

| Method | Endpoint                     | Description                               | Access |
|------|------------------------------|-------------------------------------------|--------|
| POST | /api/payments/create-order   | Create Razorpay order for course purchase | Student |
| POST | /api/payments/verify         | Verify Razorpay payment signature         | Student |


### Dashboards & Analytics
#### 📊 Instructor Dashboard
* Total courses
* Published vs draft courses
* Total enrollments
* Active students
* Course-wise completion stats

#### 📈 Student Dashboard
* Active enrollments
* Completed courses
* Learning progress

#### 🛡️ Admin Dashboard 
- Total users (students & instructors)
- Total courses (published / draft)
- Total enrollments
- Revenue overview from paid courses

##### Instructor Dashboard APIs

| Method | Endpoint                     | Description                                   | Access     |
|------|------------------------------|-----------------------------------------------|------------|
| GET  | /api/instructor/dashboard     | Get instructor dashboard overview & stats    | Instructor |

##### Student Dashboard APIs

| Method | Endpoint                 | Description                                 | Access  |
|------|--------------------------|---------------------------------------------|---------|
| GET  | /api/dashboard/student    | Get student dashboard overview & progress   | Student |

##### Admin Dashboard APIs

| Method | Endpoint              | Description                               | Access |
|------|-----------------------|-------------------------------------------|--------|
| GET  | /api/admin/dashboard  | Get platform-wide admin dashboard metrics | Admin  |

## 🗂️ Media Upload System
* **Multer** for handling multipart uploads
* **Cloudinary** for secure cloud storage
* Used for:
  * Course thumbnails
  * Instructor/student/admin profile images

## 🧾 Database Design (MongoDB)
#### Key Collections
* **User**
* **Course**
* **Section**
* **Lesson**
* **Enrollment**
* **Progress**
* **Payment**
#### Design Principles
* Clear entity separation
* Referential integrity via ObjectIds
* Indexed fields for performance
* Enum-based state control (enrollment & payments)

## 🔒 Security & Best Practices
* JWT authentication
* Role-based access checks
* Input validation & sanitization
* Centralized error handling
* Idempotent payment verification
* MongoDB transactions for critical flows

## 🧩 Architecture Overview
```
Client (Frontend / Postman)
        ↓
Express API (Controllers)
        ↓
Service Logic + Validation
        ↓
MongoDB (Mongoose ODM)
        ↓
Cloudinary / Razorpay
```

## 🧪 Testing & Validation
* All critical flows tested via **Postman**
* Covered scenarios:
  * Duplicate enrollment prevention
  * Payment retries
  * Invalid payment signature
  * Pending → active enrollment transitions
  * Dashboard accuracy
 
## 🛠️ Tech Stack
* **Node.js**
* **Express.js**
* **MongoDB + Mongoose**
* **JWT Authentication**
* **Razorpay Payment Gateway**
* **Multer + Cloudinary**
* **REST API Architecture**

## 📌 Project Status
* Backend development **completed**
* Payment flow **fully implemented & tested**
* Ready for frontend integration
* Designed for future production scaling

## 👤 Developer
**Ambreesh Kumar**  
Backend Developer | **Node.js** | **Express.js** | **MongoDB** | **REST APIs**  
Focused on building **scalable, real-world backend systems**  

- **GitHub**: https://github.com/Ambreesh-Kumar 
- **LinkedIn**: [https://www.linkedin.com/in/ambreesh-kumar](https://www.linkedin.com/in/ambreesh-kumar?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app)
- **Email**: kumarambreesh70@gmail.com

## License & Usage
© 2025 Ambreesh Kumar. All rights reserved.


