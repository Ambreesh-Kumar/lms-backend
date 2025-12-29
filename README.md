# 🎓 Learning Management System (LMS) – Backend API
A scalable, production-ready LMS backend built with Node.js, Express, MongoDB, designed to support role-based learning, paid courses, secure payments, and progress tracking.
This backend powers an end-to-end LMS flow including course creation, content management, student enrollment, payment processing, and learning progress analytics.

## 🚀 Key Highlights
* Role-based system (Admin, Instructor, Student)
* Paid course workflow with Razorpay
* Robust enrollment lifecycle (pending → active → completed / cancelled)
* Instructor & student dashboards
* Video + text lessons support
* Cloudinary-based media uploads
* Transactional payment verification
* Production-grade error handling & data consistency

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
#### Key APIs
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/profile
```

### Course Management
* Instructor-only course creation
* Draft & publish workflow
* Course pricing (free / paid)
* Thumbnail upload via Cloudinary
#### Key APIs
```
POST   /api/courses
PUT    /api/courses/:id
GET    /api/courses
GET    /api/courses/:id
```

### Sections & Lessons
* Course → Sections → Lessons hierarchy
* Ordered sections & lessons
* Supports:
   * 🎥 Video lessons
   * 📝 Text-based lessons
#### Key APIs
```
POST   /api/sections
GET    /api/sections/:courseId

POST   /api/lessons
GET    /api/lessons/:sectionId
```

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
* Clean separation between enrollment and payment
#### Key APIs
```
POST   /api/enrollments
GET    /api/enrollments/my
```

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

#### Key APIs
```
POST   /api/payments/create-order
POST   /api/payments/verify
```

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

#### Key APIs
```
GET   /api/dashboard/instructor
GET   /api/dashboard/student
```

## 🗂️ Media Upload System
* **Multer** for handling multipart uploads
* **Cloudinary** for secure cloud storage
* Used for:
  * Course thumbnails
  * Instructor/student/admin profile images

## 🧾 Database Design (MongoDB)
#### Key Collections
* User
* Course
* Section
* Lesson
* Enrollment
* Progress
* Payment
#### Design Principles
* Clear entity separation
* Referential integrity via ObjectIds
* Indexed fields for performance
* Enum-based state control (enrollment & payments)
