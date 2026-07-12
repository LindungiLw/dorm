<div align="center">

# ✨ JIUnity

<img src="https://readme-typing-svg.demolab.com?font=Poppins&weight=600&size=20&pause=1200&color=3F74F0&center=true&vCenter=true&width=620&height=45&lines=Your+campus+%26+dormitory+companion;One+login%2C+one+app;Cafeteria+%C2%B7+Permission+%C2%B7+Marketplace" alt="JIUnity" />

![Status](https://img.shields.io/badge/Status-MVP-2FA070?style=for-the-badge)
![Program](https://img.shields.io/badge/JIU_x_POEM-Career_Camp-ECB63C?style=for-the-badge)
![Built with AI](https://img.shields.io/badge/Built_with-AI-7D45B8?style=for-the-badge)

</div>

> **Vision:** make campus and dormitory life easier, safer, and better for every student.

JIUnity brings the everyday services of campus and dormitory life into a single place:
cafeteria meals, exit permissions, borrowing, and a student marketplace. Built for Jakarta
International University during the JIU x POEM Career Camp.

## 🧩 Features

### 🍽️ Cafeteria
- Daily menu students can check before heading to eat
- Fast meal check in during admin set hours, with a redeemed meal coupon and a recorded time
- Food allergen list where students mark each dish Safe or Avoid, saved to their account
- Feedback and food complaints sent straight to the cafeteria admin

### 🚪 Permission (dorm students)
- Digital leave pass: destination, expected return, and a required GPS location
- A student stays marked "out" until security (satpam) or dorm staff record the return; a student can never close their own pass
- Live "who is out" board for security and dorm staff
- Catalog of borrowable rooms and equipment, maintained by the dorm admin

### 🛒 Marketplace
- Students apply to become sellers; a market admin approves or revokes access
- Approved sellers list products with photos
- Buyers browse, add to a cart, and pay the seller directly by QRIS

### 👥 Roles and access
- Student, Staff and Lecturer, and Security (a single purpose gate kiosk)
- Module admins for Cafeteria, Dormitory, Marketplace, and Academics
- A Root super admin who grants and revokes admin roles

## 🔐 Why it is safe and reliable
- **One central rule for access.** Every screen and action checks a single policy that combines
  a person's role with what they own or manage, and denies by default.
- **Campus sign in only.** Login is Google and limited to campus domains; accounts are created
  on first sign in.
- **Locked identity.** Each member confirms and locks their real ID before using the app.
- **Access can be revoked instantly.** Roles and status are checked on every request, so
  suspending someone or changing a role takes effect right away.
- **Actions cannot be double applied.** A meal coupon is used once and an exit pass is closed
  once, even under repeated taps.
- **Everything important is logged.** Sensitive actions are kept in an audit trail.

## 🛠️ Tech stack
- Next.js and React
- TypeScript
- Prisma with PostgreSQL
- Google sign in
- Deployed on Vercel

## 🗺️ Roadmap
- **Verified identity.** Confirm each ID against the campus directory or student information system.
- **Full borrowing loop.** Add a request, approval, and return flow on top of the catalog.
- **Richer marketplace.** In app orders and payment on top of the current direct QRIS model.
- **More campuses.** Grow from one campus to many.

## 🎓 Credits
Built by students during the **JIU x POEM Career Camp: Empowering Your Future Path**, at Jakarta
International University.
