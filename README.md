# 🎓 AI-Powered Learning Management System (LMS) – Backend API
A **production-grade, AI-integrated Learning Management System backend** built with **Node.js, Express, and MongoDB**, architected to power **real-world EdTech platforms**.  
This system delivers a complete LMS experience — from **role-based course creation and enrollment** to **secure Razorpay payments** and **advanced AI-driven learning assistance**, including:
* 🧠 **AI-generated** lesson summaries
* 📝 **AI-powered** intelligent assessments (MCQs)
* 💬 **AI-assisted** lesson-context question answering
* 💳 **Robust online payments** with **idempotent verification**
* 📊 Student progress tracking & learning analytics

## API Base URL  
```
https://lms-backend-rmh5.onrender.com
```

## Why This Project?
This LMS backend was built to **demonstrate real-world backend engineering at production scale**, not just CRUD APIs or tutorial patterns.  
The primary goal of this project is to showcase my ability to **design, implement, and secure complex backend systems** that mirror how modern **EdTech platforms** operate in the real world.  
Key engineering challenges addressed in this project include:  
- 🧠 **AI system integration** with strict access control, cost limits, and deterministic output
- 💳 **Payment workflow design** with Razorpay, including idempotent verification and failure handling
- 🔐 **Role-based access control (RBAC)** across Admin, Instructor, and Student workflows
- 🗂️ **Complex relational data modeling** using MongoDB for courses, lessons, enrollments, payments, and progress
- ⚙️ **Scalable, maintainable architecture** with clean separation of routes, controllers, services, and utilities
- 🛡️ **Production-ready security practices**, including token-based authentication and protected resources

## 🚀 Key Highlights
* **AI-powered learning engine** (lesson summaries, intelligent MCQs, lesson-bound Q&A)
* **Secure role-based system** (Admin, Instructor, Student)
* **Production-grade payment workflow with Razorpay** (EJS checkout + API verification)
* **Idempotent and failure-safe payment verification**
* **Paid course lifecycle management** (`pending → active → completed / cancelled`)
* **Instructor, student & admin dashboards with analytics**
* **Text + video lesson support with smart AI handling**
* **Cloudinary-based media uploads** (avatars, thumbnails, lesson assets)
* **Centralized error handling with consistent API responses**
* **MongoDB transactions for critical operations**
* **Scalable, modular architecture following industry best practices**

## 🧩 Platform Capabilities Overview

This LMS backend is designed as a **real-world, monetizable learning platform**, not a demo project.

**Core platform capabilities include:**

* 🤖 **AI-assisted learning intelligence** embedded directly into lessons
* 💳 **End-to-end paid course workflow** with Razorpay (checkout → verification → enrollment)
* 🎓 **Role-driven system design** for Admins, Instructors, and Students
* 📊 **Progress tracking & analytics** at lesson and course level
* 🧠 **Content-aware AI features** that respect lesson boundaries
* 🔐 **Secure authentication & authorization** using JWT (access + refresh)
* 🗂️ **Scalable modular architecture** built for growth
* 🧾 **Production-grade data integrity** using transactions and idempotency
* ☁️ **Cloud-native media handling** via Cloudinary

This architecture reflects **how modern EdTech platforms are built and operated in production**.

## 🤖 AI-Powered Learning Intelligence (Production-Ready)

* **Environment-Controlled AI** – Fully toggleable via `.env` (`ENABLE_AI`) to prevent accidental usage or overspending.  
* **Admin-Only Access** – Only admins can trigger AI workflows, ensuring security and cost control.  
* **Cost-Aware Execution** – AI prompts are **rate-limited** and **token-capped** to control usage and avoid unexpected charges.  
* **Text & Video Lesson Support** –  
  * Text lessons: full AI capabilities (summary, MCQs, Q&A)  
  * Video lessons: generates summaries from video metadata or transcript; MCQs/Q&A restricted without transcript  
* **Stateless & Scalable** – AI runs in a stateless manner for **high concurrency and fault tolerance**.  
* **Structured & JSON-Ready Outputs** – Perfect for frontend dashboards or analytics pipelines.  
* **Factual & Lesson-Bound** – Ensures AI output strictly uses **lesson content**, no external knowledge or hallucinations.  
* **Enhances Learning Analytics** – Automated MCQs and Q&A improve learner assessment and instructor insights.  
* **Adaptive & Intelligent** – Reduces manual workload for instructors while delivering personalized learning assistance.  

---

### 📘 Lesson Summary Generation
* Generates a **concise, structured summary** of lesson content.  
* Supports both text and video lessons (video lessons display video info or transcript placeholder).  
* Improves learner comprehension and retention.

**Endpoint:** `POST /api/ai/lesson/:lessonId/summary`  
**Access:** Admin-only  

---

### 📝 Intelligent MCQ Generation
* Automatically generates **multiple-choice questions** from lesson content.  
* Ensures all questions are **directly answerable from the lesson**.  
* Supports only **text lessons** to maintain accuracy and relevance.  
* Enhances **self-assessment and practice** for learners.  

**Endpoint:** `POST /api/ai/lesson/:lessonId/mcqs`  
**Access:** Admin-only  

---

### 💬 Lesson-Bound Question & Answering
* Provides **instant, accurate Q&A** based strictly on lesson content.  
* For video lessons, requires transcript to ensure precision.  
* Helps learners clarify doubts **without instructor intervention**.  
* Useful for **dynamic assessments and intelligent tutoring systems**.  

**Endpoint:** `POST /api/ai/lesson/:lessonId/qna`  
**Access:** Admin-only  

### ⚡ Why This AI Integration is Production-Ready
* Fully **secure** (Admin-only, environment-controlled)  
* **Cost-aware** (token limits, rate-limited prompts)  
* **Supports multiple lesson types** (text + video)  
* **Failsafe & stateless**, avoiding system-level failures  
* Outputs **structured JSON** for direct consumption in dashboards and frontend apps  
* **Enhances learning analytics** via automated assessments and summaries  

> 💡 This AI-powered engine transforms a standard LMS into an **intelligent learning platform**, delivering **real-time insights, automated assessments, and adaptive learning capabilities** to improve both teaching efficiency and learner experience.

## 💳 Payment Module (Razorpay Integration – EJS + API)

#### 🔐 Secure & Flexible Payment Architecture
This LMS supports **two payment flows**:
1. **Server-Rendered Checkout (EJS)** – used for demo & backend-only validation
2. **API-Based Checkout** – preserved for future frontend integration (React / Mobile)

Both flows share the **same verification logic and database guarantees**.

#### 🧭 Payment Checkout Flow (EJS – Server Rendered)
1. Student login (`https://lms-backend-rmh5.onrender.com/api/auth/login`) in Postman and get **accessToken** 
2. Student enrolls in a paid course `https://lms-backend-rmh5.onrender.com/api/enrollments`
3. Server creates / reuses a Razorpay order
4. Student open Checkout page in browser `GET /payments/ejs/checkout/:enrollmentId?token=<accessToken>`
   * checkout_url example:
   ```
   https://lms-backend-rmh5.onrender.com/payments/ejs/checkout/695bf4a91c49853b851d6665/?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTRiZjZiZThmODY5NWY3NTk2YTMxY2MiLCJyb2xlIjoic3R1ZGVudCIsImlhdCI6MTc2NzYzNTgwNSwiZXhwIjoxNzY3NjM2NzA1fQ.sxOW79venrTFhYlSM9AWupt0nNjexPQg75wEUg13Qy8
   ```
5. Razorpay Checkout modal opens
6. Razorpay redirects payment details to backend
7. Backend verifies:
  * Signature (HMAC SHA256)
  * Order ↔ Payment integrity
  * Idempotency (prevents double payment)
8. Enrollment activated using MongoDB transaction
9. User is redirected to result page:
  * ✅ success
  * ❌ failure
  * ⚠️ cancelled
  * ℹ️ already paid
⚠️ All critical state changes happen **only on the server**

#### 🖥️ EJS Checkout Routes
| Method | Endpoint                             | Description                         |
| ------ | ------------------------------------ | ----------------------------------- |
| GET    | /payments/ejs/checkout/:enrollmentId | Render Razorpay checkout page (EJS) |
| POST   | /payments/ejs/verify                 | Verify payment & update DB          |

Authentication for EJS checkout is handled via **access token in query params** (for backend-only demo use).

#### 🔁 Payment APIs (Preserved for Frontend Use)
| Method | Endpoint                   | Description                       | Access  |
| ------ | -------------------------- | --------------------------------- | ------- |
| POST   | /api/payments/create-order | Create Razorpay order via API     | Student |
| POST   | /api/payments/verify       | Verify Razorpay payment signature | Student |

#### 🛡️ Payment Safety & Consistency
* ✔ Razorpay signature verification (HMAC SHA256)
* ✔ Idempotent verification (safe retry support)
* ✔ MongoDB transactions (Payment + Enrollment)
* ✔ Prevents:
   * Double payments
   * Order reuse abuse
   * Partial DB updates
* ✔ Clear handling for:
   * Already paid enrollment
   * Expired / invalid session
   * Cancelled payments

#### 🧪 Razorpay Test Card Details
##### ✅ Successful Payment
| Card Number         | Expiry     | CVV |
| ------------------- | ---------- | --- |
| 5267 3181 8797 5449 | Any future | 123 |
##### ❌ Failed Payment
* Use any invalid OTP or cancel payment in Razorpay modal

International cards are not supported in Razorpay test mode (India).


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

## 🧩 Backend Architecture Overview
```text
src/
├── config/
│   ├── db.js                         # MongoDB connection
│   ├── cloudinary.js                 # Cloudinary configuration
│   └── razorpay.js                   # Razorpay SDK instance
│
├── controllers/
│   ├── authController.js
│   ├── courseController.js
│   ├── sectionController.js
│   ├── lessonController.js
│   ├── enrollmentController.js
│   ├── progressController.js
│   ├── paymentController.js
│   ├── aiController.js               # AI controller
│   ├── adminDashboardController.js   # Admin dashboards
│   ├── dashboardController.js        # Student dashboards
│   ├── instructorDashboardController.js
│   └── payment/
│       └── checkout.controller.js    # Handle EJS checkout flow
│
├── routes/
│   ├── authRoutes.js
│   ├── courseRoutes.js
│   ├── sectionRoutes.js
│   ├── lessonRoutes.js
│   ├── adminLessonRoutes.js          # Admin lesson access routes
│   ├── enrollmentRoutes.js
│   ├── progressRoutes.js
│   ├── paymentRoutes.js              # API-based Razorpay flow
│   ├── payment.ejs.routes.js         # EJS checkout pages
│   ├── aiRoutes.js                   # Admin-only AI APIs
│   ├── adminDashboardRoutes.js       # Admin dashboard routes
│   ├── dashboardRoutes.js            # Student dashboard routes
│   └── instructorDashboardRoutes.js  # Instructor dashboard routes
│
├── models/
│   ├── User.js
│   ├── Course.js
│   ├── Section.js
│   ├── Lesson.js
│   ├── Enrollment.js
│   ├── Progress.js
│   └── Payment.js
│
├── services/
│   └── ai.service.js                 # Gemini integration (stateless, secure)
│
├── middlewares/
│   ├── auth.js
│   ├── authFromQuery.js              # Auth via query token for EJS checkout
│   ├── authOptional.js
│   ├── requireAdmin.js
│   ├── requireInstructor.js
│   ├── multer.js
│   └── errorHandler.js
│
├── views/                            # Server-rendered payment UI
│   ├── checkout.ejs
│   ├── success.ejs
│   ├── failure.ejs
│   ├── cancel.ejs
│   ├── alreadyPaid.ejs
│   └── unauthorized.ejs              # Token expired during checkout
│
├── public/
│   └── css/
│       └── payments/
│           ├── base.css
│           └── checkout.css
│
├── utils/
│   ├── ApiError.js
│   ├── AsyncHandler.js
│   ├── jwt.js
│   ├── cloudinaryDelete.js
│   ├── cloudinaryUpload.js
│   └── processThumbnail.js           # Thumbnail size handling
│
├── app.js                            # Express app setup
└── server.js                         # Server bootstrap
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

* **Node.js** — Server-side JavaScript runtime for scalable backend systems
* **Express.js** — RESTful API framework with middleware-based architecture
* **MongoDB + Mongoose** — NoSQL database with schema validation and transactional workflows
* **JWT Authentication** — Secure access & refresh token–based authentication
* **Role-Based Access Control (RBAC)** — Admin, Instructor, and Student authorization layers
* **Razorpay Payment Gateway** — Secure online payments with verification and idempotency
* **EJS (Server-Side Rendering)** — Checkout and payment status pages
* **Multer + Cloudinary** — Media uploads with transformation and storage optimization
* **AI Integration (Google Gemini API)** — Lesson summaries, MCQs, and Q&A generation
* **Environment-Based Configuration** — Feature toggles, secrets, and AI cost control via `.env`
* **Centralized Error Handling** — Consistent API error responses and logging
* **REST API Architecture** — Modular, scalable, and production-ready design


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


